<?php

namespace App\Http\Controllers;

use App\Models\Materiel;
use App\Models\Signalement;
use Illuminate\Http\Request;
use Carbon\Carbon;

class MaterielController extends Controller
{
    // Admin — liste des matériels
    public function index(Request $request)
    {
        $materiels = Materiel::withCount(['signalements as signalements_en_attente' => fn($q) =>
            $q->where('statut', 'en_attente')
        ])
        ->when($request->categorie, fn($q) => $q->where('categorie', $request->categorie))
        ->when($request->statut,    fn($q) => $q->where('statut',    $request->statut))
        ->latest()
        ->paginate(20);

        $totalSignalements = Signalement::where('statut', 'en_attente')->count();

        return response()->json([
            'materiels'          => $materiels,
            'total_signalements' => $totalSignalements,
        ]);
    }

    // Admin — créer un matériel
    public function store(Request $request)
    {
        $request->validate([
            'nom'             => 'required|string',
            'categorie'       => 'required|in:cardio,musculation,machines_guidees,accessoires,mobilier,vestiaires_sanitaires,electromenager,securite',
            'quantite'        => 'required|integer|min:1',
            'statut'          => 'required|in:disponible,maintenance,hors_service',
            'description'     => 'nullable|string',
            'caracteristiques'=> 'nullable|string',
        ]);

        $materiel = Materiel::create($request->only([
            'nom', 'categorie', 'quantite', 'statut', 'description', 'caracteristiques',
        ]));

        return response()->json($materiel, 201);
    }

    // Admin — modifier un matériel
    public function update(Request $request, Materiel $materiel)
    {
        $request->validate([
            'nom'             => 'sometimes|string',
            'categorie'       => 'sometimes|in:cardio,musculation,machines_guidees,accessoires,mobilier,vestiaires_sanitaires,electromenager,securite',
            'quantite'        => 'sometimes|integer|min:1',
            'statut'          => 'sometimes|in:disponible,maintenance,hors_service',
            'description'     => 'nullable|string',
            'caracteristiques'=> 'nullable|string',
        ]);

        $materiel->update($request->only([
            'nom', 'categorie', 'quantite', 'statut', 'description', 'caracteristiques',
        ]));

        return response()->json($materiel);
    }

    // Admin — supprimer un matériel (suppression douce : l'historique de
    // signalements associé est conservé, la ligne n'est jamais effacée physiquement)
    public function destroy(Materiel $materiel)
    {
        $materiel->delete();
        return response()->json(['message' => 'Matériel supprimé']);
    }

    // Admin — liste des signalements
    public function signalements(Request $request)
    {
        $signalements = Signalement::with(['materiel' => fn($q) => $q->withTrashed(), 'user'])
            ->when($request->statut, fn($q) => $q->where('statut', $request->statut))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return response()->json($signalements);
    }

    // Admin — nombre de signalements en attente, pour le badge du menu (requête légère)
    public function compteSignalementsEnAttente()
    {
        return response()->json([
            'count' => Signalement::where('statut', 'en_attente')->count(),
        ]);
    }

    // Admin — traiter un signalement
    public function traiterSignalement(Request $request, Signalement $signalement)
    {
        $request->validate([
            'statut' => 'required|in:en_cours,resolu',
        ]);

        $signalement->update([
            'statut'    => $request->statut,
            'resolu_at' => $request->statut === 'resolu' ? Carbon::now() : null,
        ]);

        // Statut équipement suit automatiquement — sauf si le matériel a depuis
        // été supprimé (soft delete) : dans ce cas il n'y a plus d'équipement
        // actif à mettre à jour, on se contente de garder la trace du traitement
        // sur le signalement lui-même.
        if ($signalement->materiel) {
            $signalement->materiel->update([
                'statut' => match($request->statut) {
                    'en_cours' => 'maintenance',
                    'resolu'   => 'disponible',
                }
            ]);
        }

        return response()->json(['message' => 'Signalement mis à jour']);
    }

    // Coach — liste des matériels avec dernier signalement du coach
    public function indexCoach(Request $request)
    {
        $userId = $request->user()->id;

        $materiels = Materiel::when($request->categorie, fn($q) => $q->where('categorie', $request->categorie))
            ->latest()
            ->get();

        // Un seul signalement le plus récent par matériel, pour ce coach.
        // Volontairement fait en 2 requêtes simples + regroupement PHP plutôt
        // qu'un eager load contraint par limit() (qui génère une sous-requête
        // SQL à fonction fenêtre ROW_NUMBER() côté MySQL — mesuré ~10-25ms à
        // lui seul même avec une poignée de lignes, contre <1ms ici).
        $mesSignalements = Signalement::where('user_id', $userId)
            ->whereIn('materiel_id', $materiels->pluck('id'))
            ->latest()
            ->get()
            ->groupBy('materiel_id');

        $materiels = $materiels->map(fn($m) => array_merge($m->toArray(), [
            'mon_signalement' => $mesSignalements->get($m->id)?->first(),
        ]));

        return response()->json($materiels);
    }

    // Coach — mes signalements
    public function mesSignalements(Request $request)
    {
        $signalements = Signalement::with(['materiel' => fn($q) => $q->withTrashed()])
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json($signalements);
    }

    // Coach — signaler une panne
    public function signalerPanne(Request $request)
    {
        $request->validate([
            // deleted_at,NULL exclut le matériel supprimé (soft delete) : on ne
            // peut pas signaler une panne sur un équipement qui n'existe plus
            'materiel_id' => 'required|exists:materiels,id,deleted_at,NULL',
            'description' => 'required|string',
        ]);

        // Empêche les signalements en double : si ce coach a déjà un signalement
        // non résolu (en_attente ou en_cours) pour ce même matériel, on refuse —
        // le frontend cache déjà le bouton dans ce cas, mais l'API doit l'imposer
        // elle-même plutôt que de faire confiance uniquement à l'interface.
        $dejaSignale = Signalement::where('materiel_id', $request->materiel_id)
            ->where('user_id', $request->user()->id)
            ->whereIn('statut', ['en_attente', 'en_cours'])
            ->exists();

        if ($dejaSignale) {
            return response()->json([
                'message' => 'Vous avez déjà un signalement en cours pour ce matériel',
            ], 422);
        }

        $signalement = Signalement::create([
            'materiel_id' => $request->materiel_id,
            'user_id'     => $request->user()->id,
            'description' => $request->description,
            'statut'      => 'en_attente',
        ]);

        return response()->json($signalement->load('materiel'), 201);
    }
}

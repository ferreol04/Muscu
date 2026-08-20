<?php

namespace App\Http\Controllers;

use App\Models\Membre;
use App\Models\Abonnement;
use App\Models\SetupToken;
use App\Models\Tarif;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Carbon\Carbon;
use App\Mail\SetupPasswordMail;
use Illuminate\Support\Facades\Mail;

class MembreController extends Controller
{
    public function index(Request $request)
    {
        $query = Membre::with('abonnementActuel');

        if ($request->search) {
            $search = $this->escapeLike($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('nom',    'like', "%{$search}%")
                  ->orWhere('prenom', 'like', "%{$search}%")
                  ->orWhere('email',  'like', "%{$search}%");
            });
        }

        if ($request->statut) {
            $query->where('statut', $request->statut);
        }

        return response()->json($query->latest()->paginate(15));
    }

    public function store(Request $request)
{
    $request->validate([
        'nom'              => 'required|string',
        'prenom'           => 'required|string',
        'email'            => 'required|email|unique:membres,email|unique:users,email',
        'telephone'        => 'required|string',
        'date_naissance'   => 'required|date|before:today|before_or_equal:' . now()->subYears(12)->format('Y-m-d'),
        'sexe'             => 'required|in:homme,femme',
        'objectif'         => 'nullable|string',
        'type_inscription' => 'required|in:abonnement,ponctuel',
        'type_abonnement'  => 'required_if:type_inscription,abonnement|nullable|in:mensuel,trimestriel,semestriel,annuel',
        'date_debut'       => 'nullable|date',
    ]);

    // 1. Crée le compte User
    $user = User::create([
        'name'             => $request->prenom . ' ' . $request->nom,
        'email'            => $request->email,
        'password'         => Hash::make(Str::random(16)),
        'role'             => 'membre',
        'password_changed' => false,
    ]);

    // 2. Crée le membre
    $membre = Membre::create([
        'user_id'          => $user->id,
        'nom'              => $request->nom,
        'prenom'           => $request->prenom,
        'email'            => $request->email,
        'telephone'        => $request->telephone,
        'date_naissance'   => $request->date_naissance,
        'sexe'             => $request->sexe,
        'objectif'         => $request->objectif,
        'statut'           => 'en_attente',
        'type_inscription' => $request->type_inscription,
    ]);

    // 3. Abonnement uniquement si type_inscription = abonnement
    if ($request->type_inscription === 'abonnement') {
        $tarif     = Tarif::where('type', $request->type_abonnement)->firstOrFail();
        $dateDebut = Carbon::today();
        $dateFin   = Abonnement::calculerDateFin($request->type_abonnement, $dateDebut);

        $membre->abonnements()->create([
            'tarif_id'   => $tarif->id,
            'type'       => $request->type_abonnement,
            'date_debut' => $dateDebut,
            'date_fin'   => $dateFin,
            'montant'    => $tarif->montant,
            'statut'     => 'actif',
        ]);

        $membre->unsetRelations(); // ← ajoute cette ligne
        $membre->syncStatut();
    }

    // 4. Token setup mot de passe
    $token = Str::random(64);
    SetupToken::create([
        'user_id'    => $user->id,
        'token'      => $token,
        'expires_at' => Carbon::now()->addHours(config('gympro.setup_token_hours.activation')),
    ]);

    Mail::to($user->email)->send(new SetupPasswordMail(
        setupLink: config('gympro.frontend_url') . "/setup-password?token={$token}",
        memberName: $membre->prenom,
    ));

    return response()->json([
        'membre'  => $membre->load('abonnementActuel'),
        'message' => 'Membre créé. Un email a été envoyé.',
    ], 201);
}

    public function show(Membre $membre)
    {
        return response()->json($membre->load('abonnements', 'abonnementActuel', 'abonnementEnAttente', 'user', 'coach'));
    }

    public function update(Request $request, Membre $membre)
    {
        $request->validate([
            'nom'            => 'sometimes|string',
            'prenom'         => 'sometimes|string',
            'email'          => 'sometimes|email|unique:membres,email,' . $membre->id,
            'telephone'      => 'nullable|string',
            'date_naissance' => 'nullable|date',
            'sexe'           => 'nullable|in:homme,femme',
            'objectif'       => 'nullable|string',
            // "en_attente" est accepté ici uniquement pour permettre de renvoyer le formulaire
            // sans le modifier (le membre n'a pas encore activé son compte) — l'interface admin
            // ne propose jamais de basculer manuellement vers "en_attente", seule l'activation
            // par le membre lui-même (SetupPasswordController::setup) le fait.
            'statut'         => 'sometimes|in:actif,expire,expire_bientot,suspendu,en_attente,sans_abonnement',
        ]);

        $membre->update($request->only([
            'nom', 'prenom', 'email', 'telephone',
            'date_naissance', 'sexe', 'objectif', 'statut',
        ]));

        // Le statut affiché doit toujours refléter l'état réel du membre (abonnement,
        // activation du compte), sauf suspension explicite — que syncStatut() respecte
        // déjà (elle ne touche jamais un statut "suspendu"). Sans cet appel, réactiver
        // un membre depuis le bouton "Réactiver" le faisait passer "actif" à tort même
        // s'il n'a pas d'abonnement en cours (il devrait alors rester "sans_abonnement",
        // ou redevenir "expire"/"expire_bientot" selon son abonnement réel).
        $membre->syncStatut();

        return response()->json($membre->fresh()->load('abonnementActuel'));
    }

    public function destroy(Membre $membre)
    {
        $membre->user?->delete(); // supprime aussi le user lié
        $membre->delete();
        return response()->json(['message' => 'Membre supprimé']);
    }

    public function renouveler(Request $request, Membre $membre)
{
    $request->validate([
        'type' => 'required|in:mensuel,trimestriel,semestriel,annuel',
    ]);

    $tarif             = Tarif::where('type', $request->type)->firstOrFail();
    $dernierAbonnement = $membre->abonnementActuel;
    $today             = Carbon::today();

    $dateDebut = ($dernierAbonnement && Carbon::parse($dernierAbonnement->date_fin)->isFuture())
        ? Carbon::parse($dernierAbonnement->date_fin)
        : $today;

    $dateFin = Abonnement::calculerDateFin($request->type, $dateDebut);

    $membre->abonnements()->create([
        'tarif_id'   => $tarif->id,
        'type'       => $request->type,
        'date_debut' => $dateDebut,
        'date_fin'   => $dateFin,
        'montant'    => $tarif->montant,
        'statut'     => 'actif',
    ]);

    // ↓ LA LIGNE CLÉ : vide le cache des relations chargées en mémoire
    $membre->unsetRelations();

    $membre->syncStatut();

    return response()->json($membre->load('abonnementActuel'));
}

    public function expirantBientot()
    {
        return response()->json(
            Membre::with('abonnementActuel')->where('statut', 'expire_bientot')->get()
        );
    }

    // Annuler un abonnement en attente
public function annulerAbonnement(Membre $membre)
{
    $abonnement = $membre->abonnementEnAttente;

    if (!$abonnement) {
        return response()->json(['message' => 'Aucun abonnement en attente'], 422);
    }

    // Vérifie si moins de 7 jours depuis la création
    if ($abonnement->created_at->diffInDays(now()) >= 7) {
        return response()->json([
            'message' => 'Impossible d\'annuler un abonnement créé il y a plus de 7 jours',
        ], 422);
    }

    // On conserve la ligne (marquée "annule") au lieu de la supprimer, pour garder
    // une trace dans l'historique du membre. Les calculs de revenus et les
    // relations abonnementActuel/abonnementEnAttente excluent ce statut.
    $abonnement->update(['statut' => 'annule']);
    $membre->unsetRelations();
    $membre->syncStatut();

    return response()->json(['message' => 'Abonnement annulé avec succès']);
}

// Modifier un abonnement en cours
public function modifierAbonnement(Request $request, Membre $membre)
{
    $request->validate([
        'type' => 'required|in:mensuel,trimestriel,semestriel,annuel',
    ]);

    $abonnement = $membre->abonnementActuel;

    if (!$abonnement) {
        return response()->json(['message' => 'Aucun abonnement en cours'], 422);
    }

    // Vérifie si moins de 5 jours depuis la création
    if ($abonnement->created_at->diffInDays(now()) >= 5) {
        return response()->json([
            'message' => 'Impossible de modifier un abonnement créé il y a plus de 5 jours',
        ], 422);
    }

    // Récupère le tarif correspondant au nouveau type
    $tarif = \App\Models\Tarif::where('type', $request->type)->first();

    if (!$tarif) {
        return response()->json(['message' => 'Tarif introuvable'], 422);
    }

    // Calcule la nouvelle date de fin
    $nouvelleDateFin = \App\Models\Abonnement::calculerDateFin(
        $request->type,
        Carbon::parse($abonnement->date_debut)
    );

    $abonnement->update([
        'type'      => $request->type,
        'montant'   => $tarif->montant,
        'date_fin'  => $nouvelleDateFin,
        'tarif_id'  => $tarif->id,
    ]);

    $membre->syncStatut();

    return response()->json([
        'message'    => 'Abonnement modifié avec succès',
        'abonnement' => $abonnement->fresh(),
    ]);
}

}
<?php

namespace App\Http\Controllers;

use App\Models\SeancePonctuelle;
use App\Models\TarifPonctuel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class SeancePonctuelleController extends Controller
{
    // Liste toutes les séances ponctuelles (admin)
    public function index(Request $request)
{
    try {
        $seances = SeancePonctuelle::with(['membre.user', 'tarifPonctuel'])
            ->when($request->statut, fn($q) => $q->where('statut', $request->statut))
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString();

        // Comptage par statut indépendant du filtre/de la pagination — sert
        // aux badges des onglets et à la bannière "X en attente", qui doivent
        // toujours refléter le total réel, pas seulement la page affichée.
        $counts = SeancePonctuelle::selectRaw('statut, count(*) as total')
            ->groupBy('statut')
            ->pluck('total', 'statut');

        return response()->json([
            'seances' => $seances,
            'counts'  => $counts,
        ]);

    } catch (\Exception $e) {
        Log::error('Erreur lors du chargement des séances ponctuelles', [
            'message' => $e->getMessage(),
            'exception' => $e,
        ]);

        return response()->json(['message' => 'Erreur lors du chargement des séances ponctuelles.'], 500);
    }
}

    // Nombre de demandes en attente de validation, pour le badge du menu admin
    public function compteEnAttente()
    {
        return response()->json([
            'count' => SeancePonctuelle::where('statut', 'en_attente')->count(),
        ]);
    }

    // Créer une demande (membre)
    public function store(Request $request)
    {
        $request->validate([
            'tarif_ponctuel_id' => 'required|exists:tarifs_ponctuels,id',
            'date'              => 'required|date|after_or_equal:today',
            'heure_debut'       => 'required',
            'notes'             => 'nullable|string',
        ]);

        $membre = $request->user()->membre;

        if ($membre->statut === 'suspendu') {
            return response()->json(['message' => 'Votre compte est suspendu'], 403);
        }

        $tarif = TarifPonctuel::findOrFail($request->tarif_ponctuel_id);

        // Calcule heure_fin automatiquement
        $heureDebut = Carbon::parse($request->heure_debut);
        $heureFin   = $heureDebut->copy()->addMinutes($tarif->duree_minutes);

        $seance = SeancePonctuelle::create([
            'membre_id'         => $membre->id,
            'tarif_ponctuel_id' => $tarif->id,
            'date'              => $request->date,
            'heure_debut'       => $heureDebut->format('H:i'),
            'heure_fin'         => $heureFin->format('H:i'),
            'montant'           => $tarif->montant,
            'statut'            => 'en_attente',
            'notes'             => $request->notes,
        ]);

        return response()->json($seance->load('tarifPonctuel'), 201);
    }

    // Valider une séance (admin)
    public function valider(SeancePonctuelle $seancePonctuelle)
    {
        if ($seancePonctuelle->statut !== 'en_attente') {
            return response()->json(['message' => 'Cette séance ne peut plus être validée'], 422);
        }

        $seancePonctuelle->update([
            'statut'     => 'validee',
            'validee_at' => now(),
        ]);

        return response()->json([
            'message' => 'Séance validée avec succès',
            'seance'  => $seancePonctuelle->load(['membre', 'tarifPonctuel']),
        ]);
    }

    // Annuler une séance (admin)
    public function annuler(SeancePonctuelle $seancePonctuelle)
    {
        if ($seancePonctuelle->statut === 'validee') {
            return response()->json(['message' => 'Impossible d\'annuler une séance déjà validée'], 422);
        }

        $seancePonctuelle->update(['statut' => 'annulee']);

        return response()->json(['message' => 'Séance annulée']);
    }

    // Modifier l'heure (admin — cas de retard)
    public function modifierHeure(Request $request, SeancePonctuelle $seancePonctuelle)
    {
        $request->validate([
            'heure_debut' => 'required',
        ]);

        if ($seancePonctuelle->statut === 'annulee') {
            return response()->json(['message' => 'Impossible de modifier une séance annulée'], 422);
        }

        $heureDebut = Carbon::parse($request->heure_debut);
        $heureFin   = $heureDebut->copy()->addMinutes($seancePonctuelle->tarifPonctuel->duree_minutes);

        $seancePonctuelle->update([
            'heure_debut' => $heureDebut->format('H:i'),
            'heure_fin'   => $heureFin->format('H:i'),
        ]);

        return response()->json([
            'message' => 'Heure modifiée avec succès',
            'seance'  => $seancePonctuelle->load(['membre', 'tarifPonctuel']),
        ]);
    }

    // Mes séances ponctuelles (membre)
    public function mesSeances(Request $request)
    {
        $membre  = $request->user()->membre;
        $seances = SeancePonctuelle::with('tarifPonctuel')
            ->where('membre_id', $membre->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($seances);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Membre;
use App\Models\Coach;
use App\Models\Abonnement;
use App\Models\SeancePonctuelle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function stats()
    {
        // ~20 requêtes (counts, sums, boucle 6 mois) à chaque appel : coûteux à
        // refaire à chaque F5/navigation sans qu'il y ait eu le moindre
        // changement. Le cache est vidé automatiquement dès qu'un membre, coach,
        // abonnement ou séance ponctuelle change (voir booted() sur ces modèles) —
        // les 300s ci-dessous ne sont qu'un filet de sécurité, pas la source de
        // fraîcheur : les chiffres sont à jour immédiatement après toute action.
        return response()->json(
            Cache::remember('dashboard-stats', 300, fn() => $this->computeStats())
        );
    }

    private function computeStats(): array
    {
        // Stats membres
        $totalMembres    = Membre::count();
        $membresActifs   = Membre::where('statut', 'actif')->count();
        $membresExpires  = Membre::where('statut', 'expire')->count();
        $membresSuspen   = Membre::where('statut', 'suspendu')->count();
        $expirantBientot = Membre::with('abonnementActuel')->where('statut', 'expire_bientot')->get()
            ->map(fn($m) => [
                'id'       => $m->id,
                'nom'      => $m->nom,
                'prenom'   => $m->prenom,
                'email'    => $m->email,
                'statut'   => $m->statut,
                'date_fin' => optional($m->abonnementActuel)->date_fin,
            ]);

        // Stats coachs
        $coachsActifs    = Coach::where('statut', 'actif')->count();
        $coachsSuspendus = Coach::where('statut', 'suspendu')->count();

        // Périodes
        $debutMois  = Carbon::now()->startOfMonth();
        $finMois    = Carbon::now()->endOfMonth();
        $debutAnnee = Carbon::now()->startOfYear();
        $finAnnee   = Carbon::now()->endOfYear();

        // Revenus abonnements — un abonnement annulé n'a jamais été réellement encaissé
        $abonnementsMois  = Abonnement::where('statut', '!=', 'annule')->whereBetween('created_at', [$debutMois, $finMois])->sum('montant');
        $abonnementsAnnee = Abonnement::where('statut', '!=', 'annule')->whereBetween('created_at', [$debutAnnee, $finAnnee])->sum('montant');
        $abonnementsTotal = Abonnement::where('statut', '!=', 'annule')->sum('montant');

        // Revenus séances ponctuelles validées
        $ponctuelsMois  = SeancePonctuelle::where('statut', 'validee')
            ->whereBetween('validee_at', [$debutMois, $finMois])
            ->sum('montant');
        $ponctuelsAnnee = SeancePonctuelle::where('statut', 'validee')
            ->whereBetween('validee_at', [$debutAnnee, $finAnnee])
            ->sum('montant');
        $ponctuelsTotal = SeancePonctuelle::where('statut', 'validee')
            ->sum('montant');

        // Graphique revenus 6 derniers mois (abonnements + ponctuels)
        $revenus6mois = [];
        for ($i = 5; $i >= 0; $i--) {
            $mois = Carbon::now()->startOfMonth()->subMonths($i);

            $abonnements = Abonnement::where('statut', '!=', 'annule')
                ->whereYear('created_at', $mois->year)
                ->whereMonth('created_at', $mois->month)
                ->sum('montant');

            $ponctuels = SeancePonctuelle::where('statut', 'validee')
                ->whereYear('validee_at', $mois->year)
                ->whereMonth('validee_at', $mois->month)
                ->sum('montant');

            $revenus6mois[] = [
                'mois'  => $mois->translatedFormat('M Y'),
                'total' => (float) ($abonnements + $ponctuels),
            ];
        }

        return [
            'membres' => [
                'total'            => $totalMembres,
                'actifs'           => $membresActifs,
                'expires'          => $membresExpires,
                'suspendus'        => $membresSuspen,
                'expirant_bientot' => $expirantBientot,
            ],
            'coachs' => [
                'actifs'    => $coachsActifs,
                'suspendus' => $coachsSuspendus,
            ],
            'revenus' => [
                'mois_en_cours'  => (float) ($abonnementsMois  + $ponctuelsMois),
                'annee_en_cours' => (float) ($abonnementsAnnee + $ponctuelsAnnee),
                'total'          => (float) ($abonnementsTotal + $ponctuelsTotal),
                'graphique'      => $revenus6mois,
            ],
        ];
    }
}
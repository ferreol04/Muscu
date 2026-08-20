<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaiementController extends Controller
{
    // Fusionne abonnements et séances ponctuelles validées en une seule requête
    // SQL (UNION ALL) plutôt que de charger toutes les lignes des deux tables
    // en mémoire PHP pour les fusionner/trier/paginer soi-même — la pagination
    // (LIMIT/OFFSET) est ainsi faite par la base de données, et son coût reste
    // constant même si l'historique de paiements grossit avec les années.
    public function index(Request $request)
    {
        $search = $request->search ? $this->escapeLike($request->search) : null;

        $abonnements = DB::table('abonnements')
            ->join('membres', 'membres.id', '=', 'abonnements.membre_id')
            ->where('abonnements.statut', '!=', 'annule')
            ->when($search, fn($q) => $q->where(fn($q2) =>
                $q2->where('membres.nom', 'like', "%{$search}%")
                   ->orWhere('membres.prenom', 'like', "%{$search}%")
            ))
            ->when($request->mois,  fn($q) => $q->whereMonth('abonnements.created_at', $request->mois))
            ->when($request->annee, fn($q) => $q->whereYear('abonnements.created_at',  $request->annee))
            ->selectRaw("CONCAT('abo-', abonnements.id) as id")
            ->selectRaw("'abonnement' as type")
            ->selectRaw("CONCAT(UPPER(LEFT(abonnements.type, 1)), SUBSTRING(abonnements.type, 2)) as label")
            ->selectRaw("CONCAT(membres.prenom, ' ', membres.nom) as membre_nom")
            ->addSelect('abonnements.membre_id')
            ->addSelect('abonnements.montant')
            ->selectRaw('abonnements.created_at as date')
            ->addSelect('abonnements.statut');

        $ponctuelles = DB::table('seances_ponctuelles')
            ->join('membres', 'membres.id', '=', 'seances_ponctuelles.membre_id')
            ->leftJoin('tarifs_ponctuels', 'tarifs_ponctuels.id', '=', 'seances_ponctuelles.tarif_ponctuel_id')
            ->where('seances_ponctuelles.statut', 'validee')
            ->when($search, fn($q) => $q->where(fn($q2) =>
                $q2->where('membres.nom', 'like', "%{$search}%")
                   ->orWhere('membres.prenom', 'like', "%{$search}%")
            ))
            ->when($request->mois,  fn($q) => $q->whereMonth('seances_ponctuelles.validee_at', $request->mois))
            ->when($request->annee, fn($q) => $q->whereYear('seances_ponctuelles.validee_at',  $request->annee))
            ->selectRaw("CONCAT('ponc-', seances_ponctuelles.id) as id")
            ->selectRaw("'ponctuel' as type")
            ->selectRaw("COALESCE(tarifs_ponctuels.libelle, '—') as label")
            ->selectRaw("CONCAT(membres.prenom, ' ', membres.nom) as membre_nom")
            ->addSelect('seances_ponctuelles.membre_id')
            ->addSelect('seances_ponctuelles.montant')
            ->selectRaw('seances_ponctuelles.validee_at as date')
            ->selectRaw("'validee' as statut");

        // Totaux — toujours calculés sur les DEUX types, indépendamment de
        // l'onglet actif : les cartes en haut de page restent globales. Somme
        // faite en SQL (agrégat), pas en PHP sur des lignes déjà chargées.
        $totalAbonnements = (clone $abonnements)->sum('abonnements.montant');
        $totalPonctuels   = (clone $ponctuelles)->sum('seances_ponctuelles.montant');

        // Fusion — ici en revanche on respecte le filtre de type
        // ('abonnement'/'ponctuel'), pour que la liste ET sa pagination
        // correspondent bien à l'onglet sélectionné.
        $union = null;
        if ($request->type !== 'ponctuel') {
            $union = $abonnements;
        }
        if ($request->type !== 'abonnement') {
            $union = $union ? $union->unionAll($ponctuelles) : $ponctuelles;
        }

        $paiements = $union
            ->orderByDesc('date')
            ->paginate(20)
            ->withQueryString()
            ->through(fn($p) => [
                'id'         => $p->id,
                'type'       => $p->type,
                'label'      => $p->label,
                'membre_nom' => $p->membre_nom,
                'membre_id'  => $p->membre_id,
                'montant'    => (float) $p->montant,
                'date'       => $p->date,
                'statut'     => $p->statut,
            ]);

        return response()->json([
            'paiements' => $paiements,
            'totaux'    => [
                'abonnements' => (float) $totalAbonnements,
                'ponctuels'   => (float) $totalPonctuels,
                'global'      => (float) $totalAbonnements + (float) $totalPonctuels,
            ],
        ]);
    }
}

<?php

namespace App\Console\Commands;

use App\Models\Abonnement;
use App\Models\Membre;
use Illuminate\Console\Command;

class RecalculerStatutsMembres extends Command
{
    protected $signature   = 'membres:recalculer-statuts';
    protected $description = "Recalcule le statut des membres (actif/expire/expire_bientot/en_attente) et de leurs abonnements (actif/expire) à partir des dates réelles. Les membres suspendus et les abonnements annulés ne sont jamais touchés (décisions manuelles de l'admin), ni les membres n'ayant jamais eu d'abonnement.";

    public function handle()
    {
        // 1. Statut de chaque abonnement (actif <-> expire), sauf ceux annulés
        $abonnementsTraites  = 0;
        $abonnementsModifies = 0;

        Abonnement::where('statut', '!=', 'annule')
            ->chunkById(200, function ($abonnements) use (&$abonnementsTraites, &$abonnementsModifies) {
                foreach ($abonnements as $abonnement) {
                    $ancienStatut = $abonnement->statut;
                    $abonnement->syncStatut();
                    $abonnementsTraites++;

                    if ($abonnement->statut !== $ancienStatut) {
                        $abonnementsModifies++;
                    }
                }
            });

        // 2. Statut de chaque membre ayant au moins un abonnement, sauf les suspendus.
        //    Un membre "ponctuel" qui n'a jamais souscrit n'a pas de statut basé sur
        //    des dates à recalculer (il reste "en_attente" tant qu'aucun abonnement
        //    n'existe).
        $membresTraites  = 0;
        $membresModifies = 0;

        // "user" est chargé en amont (nécessaire à syncStatut() pour vérifier
        // password_changed) pour éviter une requête par membre traité.
        Membre::whereHas('abonnements')
            ->where('statut', '!=', 'suspendu')
            ->with('user')
            ->chunkById(200, function ($membres) use (&$membresTraites, &$membresModifies) {
                foreach ($membres as $membre) {
                    $ancienStatut = $membre->statut;
                    // Ne vide que les relations d'abonnement (pour forcer leur
                    // relecture fraîche) — "user", déjà chargé ci-dessus, est conservé.
                    $membre->unsetRelation('abonnementActuel');
                    $membre->unsetRelation('abonnementEnAttente');
                    $membre->syncStatut();
                    $membresTraites++;

                    if ($membre->fresh()->statut !== $ancienStatut) {
                        $membresModifies++;
                    }
                }
            });

        $this->info("Abonnements : {$abonnementsTraites} vérifié(s), {$abonnementsModifies} mis à jour.");
        $this->info("Membres : {$membresTraites} vérifié(s), {$membresModifies} mis à jour.");
    }
}

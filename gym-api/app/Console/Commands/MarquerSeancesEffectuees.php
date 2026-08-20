<?php

namespace App\Console\Commands;

use App\Models\Seance;
use Illuminate\Console\Command;

class MarquerSeancesEffectuees extends Command
{
    protected $signature   = 'seances:marquer-effectuees';
    protected $description = "Marque automatiquement comme 'effectuee' les séances planifiées (coach ou libre) dont la date et l'heure de fin sont passées. Les séances récurrentes (créneau hebdomadaire sans date précise) ne sont jamais concernées : elles n'ont pas d'occurrence unique à clôturer.";

    // Filet de sécurité en tâche de fond : la correction "temps réel" se fait
    // désormais à chaque lecture du planning (voir Seance::marquerEffectueesAutomatiquement,
    // appelée directement dans PlanningController). Cette commande couvre les
    // séances qui ne seraient consultées par personne dans l'immédiat.
    public function handle()
    {
        $nb = Seance::marquerEffectueesAutomatiquement();

        $this->info("{$nb} séance(s) marquée(s) comme effectuée(s) automatiquement.");
    }
}

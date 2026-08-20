<?php

namespace App\Console\Commands;

use App\Models\SeancePonctuelle;
use Carbon\Carbon;
use Illuminate\Console\Command;

class AnnulerSeancesExpirees extends Command
{
    protected $signature   = 'seances:annuler-expirees';
    protected $description = 'Annule automatiquement les séances ponctuelles en attente dont l\'heure est passée';

    public function handle()
    {
        $now = Carbon::now();

        $expirees = SeancePonctuelle::where('statut', 'en_attente')
            ->where(function ($q) use ($now) {
                $q->where('date', '<', $now->toDateString())
                  ->orWhere(function ($q2) use ($now) {
                      $q2->where('date', $now->toDateString())
                         ->where('heure_fin', '<', $now->format('H:i'));
                  });
            })
            ->get();

        foreach ($expirees as $seance) {
            $seance->update(['statut' => 'annulee']);
        }

        $this->info("{$expirees->count()} séance(s) annulée(s) automatiquement.");
    }
}

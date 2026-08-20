<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class Abonnement extends Model
{
    protected $fillable = [
        'membre_id', 'tarif_id', 'type', 'date_debut', 'date_fin', 'montant', 'statut',
    ];

    // Voir Membre::booted() — même principe, mais ici seuls "montant" et
    // "statut" influencent les revenus affichés (type/dates n'y entrent pas).
    protected static function booted(): void
    {
        static::saved(function (self $abonnement) {
            if ($abonnement->wasRecentlyCreated || $abonnement->wasChanged(['montant', 'statut'])) {
                Cache::forget('dashboard-stats');
            }
        });
        static::deleted(fn() => Cache::forget('dashboard-stats'));
    }

    protected $casts = [
        'date_debut' => 'date',
        'date_fin'   => 'date',
    ];

    public function membre()
    {
        return $this->belongsTo(Membre::class);
    }

    // Calcule date_fin selon le type
    public static function calculerDateFin(string $type, Carbon $dateDebut): Carbon
    {
        return match($type) {
            'mensuel'      => $dateDebut->copy()->addMonth(),
            'trimestriel'  => $dateDebut->copy()->addMonths(3),
            'semestriel'   => $dateDebut->copy()->addMonths(6),
            'annuel'       => $dateDebut->copy()->addYear(),
        };
    }

    // Met à jour le statut ('actif' ou 'expire') à partir de la date de fin réelle.
    // Un abonnement annulé ('annule') est une décision manuelle définitive : on ne
    // le recalcule jamais automatiquement. Un abonnement "en attente" (date_debut
    // future) reste 'actif' faute de valeur dédiée dans l'enum.
    public function syncStatut(): void
    {
        if ($this->statut === 'annule') {
            return;
        }

        $nouveauStatut = Carbon::parse($this->date_fin)->isPast() ? 'expire' : 'actif';

        if ($nouveauStatut !== $this->statut) {
            $this->update(['statut' => $nouveauStatut]);
        }
    }
}

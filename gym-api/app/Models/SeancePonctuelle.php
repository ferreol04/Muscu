<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class SeancePonctuelle extends Model
{
    protected $fillable = [
        'membre_id', 'tarif_ponctuel_id', 'date',
        'heure_debut', 'heure_fin', 'montant',
        'statut', 'notes', 'validee_at',
    ];

    protected $table = 'seances_ponctuelles';

    // Voir Membre::booted() — même principe, mais ici seuls "montant", "statut"
    // et "validee_at" influencent les revenus affichés (le mois/année du
    // graphique se base sur validee_at).
    protected static function booted(): void
    {
        static::saved(function (self $seance) {
            if ($seance->wasRecentlyCreated || $seance->wasChanged(['montant', 'statut', 'validee_at'])) {
                Cache::forget('dashboard-stats');
            }
        });
        static::deleted(fn() => Cache::forget('dashboard-stats'));
    }
    
    protected $casts = [
        'date'       => 'date',
        'validee_at' => 'datetime',
    ];

    public function membre()
    {
        return $this->belongsTo(Membre::class);
    }

    public function tarifPonctuel()
    {
        return $this->belongsTo(TarifPonctuel::class);
    }
}

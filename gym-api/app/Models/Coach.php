<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Coach extends Model
{

    protected $table = 'coachs'; // ← ajoute cette ligne

    protected $fillable = [
        'user_id', 'coach_id', 'nom', 'prenom', 'email',
        'telephone', 'specialite', 'bio', 'photo', 'statut', 'date_naissance',
    ];

    // Voir Membre::booted() — même principe, mais ici seul "statut" influence
    // les stats du dashboard (compteurs coachs actifs/suspendus). Modifier la
    // bio, la spécialité, le téléphone... ne vide plus le cache pour rien.
    protected static function booted(): void
    {
        static::saved(function (self $coach) {
            if ($coach->wasRecentlyCreated || $coach->wasChanged('statut')) {
                Cache::forget('dashboard-stats');
            }
        });
        static::deleted(fn() => Cache::forget('dashboard-stats'));
    }

    protected $appends = ['nom_complet'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function membres()
    {
        return $this->hasMany(Membre::class);
    }

    public function getNomCompletAttribute(): string
    {
        return $this->prenom . ' ' . $this->nom;
    }

    public function seances()
    {
        return $this->hasMany(Seance::class);
    }

}
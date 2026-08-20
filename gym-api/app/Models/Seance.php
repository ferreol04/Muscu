<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Seance extends Model
{
    protected $fillable = [
        'coach_id', 'membre_id', 'titre', 'type', 'jour',
        'date', 'heure_debut', 'heure_fin', 'recurrente',
        'notes', 'statut', 'vu_par_membre',
    ];

    protected $casts = [
        'recurrente' => 'boolean',
        'date'       => 'date',
    ];

    public function coach()
    {
        return $this->belongsTo(Coach::class);
    }

    public function membre()
    {
        return $this->belongsTo(Membre::class);
    }

    public function exercices()
    {
        return $this->hasMany(SeanceExercice::class)->orderBy('ordre');
    }

    // Bascule "planifiee" -> "effectuee" les séances ponctuelles (non récurrentes)
    // dont l'heure de fin est passée. Appelée en synchrone au tout début de
    // chaque lecture du planning (membre/coach/admin) pour que l'état affiché
    // soit toujours exact au moment de la consultation, sans dépendre du
    // passage de la tâche planifiée (qui reste un filet de sécurité en tâche
    // de fond, mais ne doit jamais être la seule source de vérité affichée).
    // $scope permet de restreindre la mise à jour (ex: un seul membre/coach)
    // pour éviter de balayer toute la table à chaque requête.
    public static function marquerEffectueesAutomatiquement(?\Closure $scope = null): int
    {
        $now = now();

        $query = self::where('statut', 'planifiee')
            ->where('recurrente', false)
            ->whereNotNull('date')
            ->where(function ($q) use ($now) {
                $q->where('date', '<', $now->toDateString())
                  ->orWhere(function ($q2) use ($now) {
                      $q2->where('date', $now->toDateString())
                         ->where('heure_fin', '<', $now->format('H:i'));
                  });
            });

        if ($scope) {
            $scope($query);
        }

        return $query->update(['statut' => 'effectuee']);
    }
}

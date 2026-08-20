<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SeanceExercice extends Model
{
    protected $fillable = [
        'seance_id', 'nom_exercice', 'series',
        'repetitions', 'repos_secondes', 'notes', 'ordre',
    ];
}

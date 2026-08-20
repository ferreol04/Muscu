<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Materiel extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'nom', 'categorie', 'quantite', 'statut', 'description', 'caracteristiques',
    ];

    public function signalements()
    {
        return $this->hasMany(Signalement::class);
    }

    public function signalementsEnAttente()
    {
        return $this->hasMany(Signalement::class)->where('statut', 'en_attente');
    }
}

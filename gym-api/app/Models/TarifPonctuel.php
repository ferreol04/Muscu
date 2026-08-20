<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TarifPonctuel extends Model
{
    protected $fillable = ['libelle', 'duree_minutes', 'montant', 'actif'];

    protected $casts = ['actif' => 'boolean'];

    protected $table = 'tarifs_ponctuels';

    public function seancesPonctuelles()
    {
        return $this->hasMany(SeancePonctuelle::class);
    }
}

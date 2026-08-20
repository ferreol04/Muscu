<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Signalement extends Model
{
    protected $fillable = [
        'materiel_id', 'user_id', 'description', 'statut', 'resolu_at',
    ];

    protected $casts = [
        'resolu_at' => 'datetime',
    ];

    public function materiel()
    {
        return $this->belongsTo(Materiel::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

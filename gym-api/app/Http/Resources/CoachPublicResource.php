<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Représentation d'un coach exposée à un membre (via son propre profil ou son
 * planning). Volontairement restreinte : n'expose pas la date de naissance du
 * coach, qui n'a pas à être visible par les membres qui lui sont assignés.
 */
class CoachPublicResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'nom'         => $this->nom,
            'prenom'      => $this->prenom,
            'nom_complet' => $this->nom_complet,
            'email'       => $this->email,
            'telephone'   => $this->telephone,
            'specialite'  => $this->specialite,
            'bio'         => $this->bio,
            'photo'       => $this->photo,
            'statut'      => $this->statut,
        ];
    }
}

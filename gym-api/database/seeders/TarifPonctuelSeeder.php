<?php

namespace Database\Seeders;

use App\Models\TarifPonctuel;
use Illuminate\Database\Seeder;

class TarifPonctuelSeeder extends Seeder
{
    public function run(): void
    {
        $tarifs = [
            ['libelle' => '3 heures',   'duree_minutes' => 180,  'montant' => 1000],
            ['libelle' => '6 heures',  'duree_minutes' => 360, 'montant' => 2000],
            ['libelle' => '10 heures',   'duree_minutes' => 600, 'montant' => 5000],
        ];

        foreach ($tarifs as $tarif) {
            TarifPonctuel::create($tarif);
        }
    }
}
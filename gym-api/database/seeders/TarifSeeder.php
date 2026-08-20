<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Tarif;

class TarifSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tarifs = [
            ['type' => 'mensuel',     'montant' => 10000],
            ['type' => 'trimestriel', 'montant' => 27000],
            ['type' => 'semestriel',  'montant' => 50000],
            ['type' => 'annuel',      'montant' => 90000],
        ];

        foreach ($tarifs as $tarif) {
            Tarif::updateOrCreate(['type' => $tarif['type']], ['montant' => $tarif['montant']]);
        }
    }
}

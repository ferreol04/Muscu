<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('seances', function (Blueprint $table) {
            // true par défaut : seule une annulation (séance ponctuelle, coach ou
            // admin) repasse ce champ à false, pour déclencher le badge côté membre.
            $table->boolean('vu_par_membre')->default(true)->after('statut');
        });
    }

    public function down(): void
    {
        Schema::table('seances', function (Blueprint $table) {
            $table->dropColumn('vu_par_membre');
        });
    }
};

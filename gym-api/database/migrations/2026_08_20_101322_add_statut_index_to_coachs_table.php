<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Complète 2026_08_16_190532_add_missing_statut_indexes.php, qui couvrait
// toutes les tables filtrées fréquemment par "statut" sauf celle-ci.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('coachs', function (Blueprint $table) {
            $table->index('statut');
        });
    }

    public function down(): void
    {
        Schema::table('coachs', function (Blueprint $table) {
            $table->dropIndex(['statut']);
        });
    }
};

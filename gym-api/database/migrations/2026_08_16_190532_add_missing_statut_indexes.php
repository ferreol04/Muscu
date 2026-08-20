<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Ajoute un index sur les colonnes "statut" filtrées très fréquemment
// (tableau de bord, listes admin) mais qui n'avaient jusqu'ici aucun index
// dédié — seules les clés primaires/étrangères en avaient un automatiquement.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('membres', function (Blueprint $table) {
            $table->index('statut');
        });
        Schema::table('seances', function (Blueprint $table) {
            $table->index('statut');
        });
        Schema::table('abonnements', function (Blueprint $table) {
            $table->index('statut');
        });
        Schema::table('materiels', function (Blueprint $table) {
            $table->index('statut');
        });
        Schema::table('signalements', function (Blueprint $table) {
            $table->index('statut');
        });
        Schema::table('seances_ponctuelles', function (Blueprint $table) {
            $table->index('statut');
        });
    }

    public function down(): void
    {
        Schema::table('membres', fn (Blueprint $table) => $table->dropIndex(['statut']));
        Schema::table('seances', fn (Blueprint $table) => $table->dropIndex(['statut']));
        Schema::table('abonnements', fn (Blueprint $table) => $table->dropIndex(['statut']));
        Schema::table('materiels', fn (Blueprint $table) => $table->dropIndex(['statut']));
        Schema::table('signalements', fn (Blueprint $table) => $table->dropIndex(['statut']));
        Schema::table('seances_ponctuelles', fn (Blueprint $table) => $table->dropIndex(['statut']));
    }
};

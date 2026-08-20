<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Passe le matériel en suppression douce : "supprimer" un équipement ne doit
    // plus effacer physiquement la ligne (et donc, en cascade, tout son historique
    // de signalements). La ligne reste en base avec deleted_at renseigné, et
    // disparaît simplement des listes actives.
    public function up(): void
    {
        Schema::table('materiels', function (Blueprint $table) {
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('materiels', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};

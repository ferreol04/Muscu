<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Table jamais utilisée par aucun contrôleur (le modèle "1 séance = 1 membre",
// stocké directement sur seances.membre_id, a toujours été le modèle réel).
// Voir DOCUMENTATION_APPLICATION.md §4.22.
return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('reservations');
    }

    public function down(): void
    {
        Schema::create('reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('membre_id')->constrained('membres')->onDelete('cascade');
            $table->foreignId('seance_id')->constrained('seances')->onDelete('cascade');
            $table->enum('statut', ['confirmee', 'annulee', 'en_attente'])->default('confirmee');
            $table->timestamps();
        });
    }
};

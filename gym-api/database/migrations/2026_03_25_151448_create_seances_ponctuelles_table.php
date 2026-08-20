<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('seances_ponctuelles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('membre_id')->constrained('membres')->onDelete('cascade');
            $table->foreignId('tarif_ponctuel_id')->constrained('tarifs_ponctuels')->onDelete('cascade');
            $table->date('date');
            $table->time('heure_debut');
            $table->time('heure_fin');
            $table->decimal('montant', 10, 2);
            $table->enum('statut', ['en_attente', 'validee', 'annulee'])->default('en_attente');
            $table->text('notes')->nullable();
            $table->timestamp('validee_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seances_ponctuelles');
    }
};

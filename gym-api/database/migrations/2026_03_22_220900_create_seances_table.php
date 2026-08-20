<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('seances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('coach_id')->constrained('coachs')->onDelete('cascade');
            $table->foreignId('membre_id')->nullable()->constrained('membres')->onDelete('cascade');
            $table->string('titre');
            $table->enum('type', ['coach', 'libre'])->default('coach');
            $table->enum('jour', ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'])->nullable();
            $table->date('date')->nullable();
            $table->time('heure_debut');
            $table->time('heure_fin');
            $table->boolean('recurrente')->default(false);
            $table->text('notes')->nullable();
            $table->enum('statut', ['planifiee', 'effectuee', 'annulee'])->default('planifiee');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seances');
    }
};

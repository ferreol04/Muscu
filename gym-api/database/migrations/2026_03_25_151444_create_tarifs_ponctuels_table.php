<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tarifs_ponctuels', function (Blueprint $table) {
            $table->id();
            $table->string('libelle'); // ex: 1 heure, 2 heures, Journée
            $table->integer('duree_minutes'); // 60, 120, 480
            $table->decimal('montant', 10, 2);
            $table->boolean('actif')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tarifs_ponctuels');
    }
};

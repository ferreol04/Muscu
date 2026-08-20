<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('materiels', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->enum('categorie', [
                'cardio',
                'musculation',
                'machines_guidees',
                'accessoires',
                'mobilier',
                'vestiaires_sanitaires',
                'electromenager',
                'securite',
            ]);
            $table->integer('quantite')->default(1);
            $table->enum('statut', ['disponible', 'maintenance', 'hors_service'])->default('disponible');
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('materiels');
    }
};

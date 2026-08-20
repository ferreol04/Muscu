<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Ajoute "sans_abonnement" : un membre inscrit en mode "ponctuel", qui a
     * activé son compte, mais qui n'a jamais eu le moindre abonnement.
     * Distinct de "expire" (qui implique qu'un abonnement a existé et a pris
     * fin) et de "en_attente" (compte pas encore activé).
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE membres MODIFY COLUMN statut ENUM('actif', 'expire', 'expire_bientot', 'suspendu', 'en_attente', 'sans_abonnement') DEFAULT 'actif'");

        // Bascule les données existantes : un membre déjà marqué "expire",
        // dont le compte est activé, et qui n'a jamais eu d'abonnement,
        // devient "sans_abonnement".
        DB::statement("
            UPDATE membres
            INNER JOIN users ON users.id = membres.user_id
            LEFT JOIN abonnements ON abonnements.membre_id = membres.id
            SET membres.statut = 'sans_abonnement'
            WHERE membres.statut = 'expire'
              AND users.password_changed = 1
              AND abonnements.id IS NULL
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('membres')->where('statut', 'sans_abonnement')->update(['statut' => 'expire']);
        DB::statement("ALTER TABLE membres MODIFY COLUMN statut ENUM('actif', 'expire', 'expire_bientot', 'suspendu', 'en_attente') DEFAULT 'actif'");
    }
};

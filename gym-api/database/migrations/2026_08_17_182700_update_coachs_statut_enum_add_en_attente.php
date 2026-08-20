<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Remplace le statut binaire actif/inactif par trois états explicites :
     * - en_attente : le coach vient d'être créé mais n'a pas encore activé
     *                son compte (défini automatiquement à l'activation) ;
     * - actif      : compte activé, coach opérationnel ;
     * - suspendu   : bloqué manuellement par l'admin (remplace "inactif",
     *                vocabulaire aligné sur celui déjà utilisé pour Membre).
     */
    public function up(): void
    {
        // 1. Élargit temporairement l'enum pour pouvoir migrer les données
        //    sans perdre les valeurs existantes.
        DB::statement("ALTER TABLE coachs MODIFY COLUMN statut ENUM('actif', 'inactif', 'en_attente', 'suspendu') DEFAULT 'actif'");

        // 2. Migre les données existantes vers les nouvelles valeurs.
        //    - un coach marqué "inactif" devient "suspendu"
        //    - un coach marqué "actif" mais dont le compte utilisateur n'a
        //      jamais été activé (password_changed=false) devient "en_attente"
        DB::table('coachs')->where('statut', 'inactif')->update(['statut' => 'suspendu']);

        DB::statement("
            UPDATE coachs
            INNER JOIN users ON users.id = coachs.user_id
            SET coachs.statut = 'en_attente'
            WHERE coachs.statut = 'actif' AND users.password_changed = 0
        ");

        // 3. Restreint l'enum aux trois valeurs définitives.
        DB::statement("ALTER TABLE coachs MODIFY COLUMN statut ENUM('actif', 'en_attente', 'suspendu') DEFAULT 'en_attente'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE coachs MODIFY COLUMN statut ENUM('actif', 'inactif', 'en_attente', 'suspendu') DEFAULT 'actif'");
        DB::table('coachs')->where('statut', 'suspendu')->update(['statut' => 'inactif']);
        DB::table('coachs')->where('statut', 'en_attente')->update(['statut' => 'actif']);
        DB::statement("ALTER TABLE coachs MODIFY COLUMN statut ENUM('actif', 'inactif') DEFAULT 'actif'");
    }
};

<?php

return [

    /*
    |--------------------------------------------------------------------------
    | URL du frontend
    |--------------------------------------------------------------------------
    |
    | Utilisée pour construire les liens envoyés par email (activation de
    | compte, réinitialisation de mot de passe). Ne jamais coder cette URL
    | en dur dans un contrôleur — passer par cette configuration permet de
    | changer d'environnement (dev/prod) via la variable FRONTEND_URL.
    |
    */

    'frontend_url' => rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/'),

    /*
    |--------------------------------------------------------------------------
    | Durées de validité des tokens d'activation / réinitialisation
    |--------------------------------------------------------------------------
    |
    | Centralise les durées (en heures) utilisées par SetupToken selon le
    | contexte dans lequel il est généré, pour éviter les valeurs dupliquées
    | et incohérentes dans plusieurs contrôleurs.
    |
    */

    'setup_token_hours' => [
        // Première activation de compte (membre ou coach créé par un admin)
        'activation' => (int) env('SETUP_TOKEN_HOURS_ACTIVATION', 24),

        // Réinitialisation de mot de passe (mot de passe oublié)
        'reset_password' => (int) env('SETUP_TOKEN_HOURS_RESET', 1),

        // Renvoi d'un lien d'activation expiré
        'resend' => (int) env('SETUP_TOKEN_HOURS_RESEND', 48),
    ],

];

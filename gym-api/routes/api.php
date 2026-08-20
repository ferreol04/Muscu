<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MembreController;
use App\Http\Controllers\TarifController;
use App\Http\Controllers\SetupPasswordController;
use App\Http\Controllers\MembreProfileController;
use App\Http\Controllers\ForgotPasswordController;
use App\Http\Controllers\CoachController;
use App\Http\Controllers\CoachProfileController;
use App\Http\Controllers\PlanningController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\TarifPonctuelController;
use App\Http\Controllers\SeancePonctuelleController;
use App\Http\Controllers\PaiementController;
use App\Http\Controllers\MaterielController;

// Limite dédiée (6 requêtes/minute/IP) sur les endpoints d'authentification —
// le throttle "api" par défaut (60/min) est bien trop permissif pour du
// brute-force de mot de passe ou de token.
Route::middleware('throttle:6,1')->group(function () {
    Route::post('/login', [\App\Http\Controllers\AuthController::class, 'login']);
    Route::get('/setup/verify',     [SetupPasswordController::class, 'verify']);
    Route::post('/setup/password',  [SetupPasswordController::class, 'setup']);
    Route::post('/setup/resend', [SetupPasswordController::class, 'resend']);
    Route::post('/forgot-password', [ForgotPasswordController::class, 'sendResetLink']);
});

Route::get('/tarifs-ponctuels', [TarifPonctuelController::class, 'index']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [\App\Http\Controllers\AuthController::class, 'logout']);
    Route::get('/me', [\App\Http\Controllers\AuthController::class, 'me']);

    // Tarifs — lecture accessible à tout utilisateur connecté (admin, coach, membre)
    Route::get('/tarifs', [TarifController::class, 'index']);

    // Réservé à l'admin
    Route::middleware('role:admin')->group(function () {
        // Membres
        Route::apiResource('membres', MembreController::class);
        Route::post('/membres/{membre}/renouveler', [MembreController::class, 'renouveler']);
        Route::get('/membres-expirant', [MembreController::class, 'expirantBientot']);
        Route::delete('/membres/{membre}/abonnement', [MembreController::class, 'annulerAbonnement']);
        Route::put('/membres/{membre}/abonnement',    [MembreController::class, 'modifierAbonnement']);

        // Coachs
        Route::apiResource('coachs', CoachController::class);
        Route::post('/coachs/{coach}/assigner-membre',     [CoachController::class, 'assignerMembre']);
        Route::post('/coachs/{coach}/retirer-membre',      [CoachController::class, 'retirerMembre']);
        Route::post('/coachs/{coach}/renvoyer-invitation', [CoachController::class, 'renvoyerInvitation']);

        // Tarifs — modification
        Route::put('/tarifs/{tarif}', [TarifController::class, 'update']);
        Route::get('/tarifs-ponctuels/admin', [TarifPonctuelController::class, 'indexAdmin']);
        // Nom de paramètre forcé explicitement : la singularisation automatique de Laravel
        // sur "tarifs-ponctuels" produit "tarifs_ponctuel" (toujours au pluriel sur "tarifs"),
        // ce qui ne correspond pas à $tarifPonctuel dans le contrôleur et empêche la liaison
        // implicite du modèle (le contrôleur recevait une instance vide au lieu de la vraie ligne).
        Route::apiResource('tarifs-ponctuels', TarifPonctuelController::class)
            ->parameters(['tarifs-ponctuels' => 'tarifPonctuel'])
            ->except(['index', 'show', 'destroy']);

        // Planning global
        Route::get('/planning',             [PlanningController::class, 'index']);
        Route::post('/planning',            [PlanningController::class, 'store']);
        Route::put('/planning/{seance}',    [PlanningController::class, 'update']);
        Route::delete('/planning/{seance}', [PlanningController::class, 'destroy']);

        // Dashboard
        Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

        // Séances ponctuelles — traitement admin
        Route::get('/seances-ponctuelles',                              [SeancePonctuelleController::class, 'index']);
        Route::get('/seances-ponctuelles/compte-en-attente',            [SeancePonctuelleController::class, 'compteEnAttente']);
        Route::post('/seances-ponctuelles/{seancePonctuelle}/valider',  [SeancePonctuelleController::class, 'valider']);
        Route::post('/seances-ponctuelles/{seancePonctuelle}/annuler',  [SeancePonctuelleController::class, 'annuler']);
        Route::put('/seances-ponctuelles/{seancePonctuelle}/heure',     [SeancePonctuelleController::class, 'modifierHeure']);

        // Paiements
        Route::get('/paiements', [PaiementController::class, 'index']);

        // Matériel + signalements
        Route::get('/materiels',                          [MaterielController::class, 'index']);
        Route::post('/materiels',                         [MaterielController::class, 'store']);
        Route::put('/materiels/{materiel}',                [MaterielController::class, 'update']);
        Route::delete('/materiels/{materiel}',             [MaterielController::class, 'destroy']);
        Route::get('/signalements',                        [MaterielController::class, 'signalements']);
        Route::get('/signalements/compte-en-attente',      [MaterielController::class, 'compteSignalementsEnAttente']);
        Route::put('/signalements/{signalement}/traiter',  [MaterielController::class, 'traiterSignalement']);
    });

    // Réservé au membre connecté
    Route::middleware('role:membre')->group(function () {
        Route::get('/membre/profil',           [MembreProfileController::class, 'profil']);
        Route::get('/membre/profil-complet',   [MembreProfileController::class, 'profilComplet']);
        Route::get('/membre/historique',       [MembreProfileController::class, 'historique']);
        Route::get('/membre/paiements',        [MembreProfileController::class, 'paiements']);
        Route::post('/membre/update-profil',   [MembreProfileController::class, 'updateProfil']);
        Route::post('/membre/change-password', [MembreProfileController::class, 'changePassword']);
        Route::get('/membre/planning',         [PlanningController::class, 'planningMembre']);
        Route::get('/membre/planning/compte-annulations', [PlanningController::class, 'compteAnnulationsNonVues']);
        Route::post('/membre/reserver',        [PlanningController::class, 'reserver']);
        Route::put('/membre/annuler/{seance}', [PlanningController::class, 'annuler']);
        Route::get('/membre/seances-ponctuelles',  [SeancePonctuelleController::class, 'mesSeances']);
        Route::post('/membre/seances-ponctuelles', [SeancePonctuelleController::class, 'store']);
    });

    // Réservé au coach connecté
    Route::middleware('role:coach')->group(function () {
        Route::get('/coach/profil',            [CoachProfileController::class, 'profil']);
        Route::get('/coach/membres',           [CoachProfileController::class, 'membres']);
        Route::post('/coach/update-profil',    [CoachProfileController::class, 'updateProfil']);
        Route::post('/coach/change-password',  [CoachProfileController::class, 'changePassword']);
        Route::get('/coach/materiels',         [MaterielController::class, 'indexCoach']);
        Route::get('/coach/mes-signalements',  [MaterielController::class, 'mesSignalements']);
        Route::post('/coach/signalements',     [MaterielController::class, 'signalerPanne']);
        Route::get('/coach/planning',            [PlanningController::class, 'planningCoach']);
        Route::post('/coach/planning',           [PlanningController::class, 'store']);
        Route::put('/coach/planning/{seance}',   [PlanningController::class, 'update']);
        Route::delete('/coach/planning/{seance}',[PlanningController::class, 'destroy']);
    });
});

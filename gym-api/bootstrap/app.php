<?php

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
    $middleware->validateCsrfTokens(except: ['api/*']);

    $middleware->alias([
        'role' => \App\Http\Middleware\CheckRole::class,
        ]);
    })
    ->withSchedule(function (Schedule $schedule): void {
        // Annule automatiquement les séances ponctuelles en attente dont l'heure est passée
        $schedule->command('seances:annuler-expirees')->everyFifteenMinutes();

        // Marque automatiquement comme "effectuée" les séances planning passées (non récurrentes)
        $schedule->command('seances:marquer-effectuees')->everyFifteenMinutes();

        // Recalcule le statut des membres et de leurs abonnements à partir des dates réelles
        $schedule->command('membres:recalculer-statuts')->hourly();
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();

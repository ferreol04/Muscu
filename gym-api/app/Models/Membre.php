<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class Membre extends Model
{
    protected $fillable = [
        'user_id', 'coach_id', 'nom', 'prenom', 'email', 'telephone',
        'date_naissance', 'photo', 'sexe', 'objectif', 'statut',
        'date_inscription', 'type_inscription',
    ];

    // Le dashboard admin met ses statistiques en cache (voir DashboardController)
    // pour éviter de tout recalculer à chaque F5 — mais elles doivent rester
    // exactes en permanence. Le cache est vidé dès qu'un membre est créé/supprimé
    // (le total change), ou modifié sur un champ qui influence réellement les
    // stats affichées (statut → compteurs actifs/expirés/suspendus ; nom/prénom/
    // email → widget "expire bientôt"). Un changement de téléphone, objectif...
    // ne vide donc plus le cache pour rien.
    protected static function booted(): void
    {
        static::saved(function (self $membre) {
            if ($membre->wasRecentlyCreated || $membre->wasChanged(['statut', 'nom', 'prenom', 'email'])) {
                Cache::forget('dashboard-stats');
            }
        });
        static::deleted(fn() => Cache::forget('dashboard-stats'));
    }

    // "statut_abonnement" n'est PAS ajouté ici volontairement : le mettre en
    // $appends forçait son recalcul (1-2 requêtes SQL) à chaque sérialisation
    // JSON d'un membre, partout où membre.abonnementActuel/EnAttente n'est
    // pas explicitement pré-chargé (N+1 mesuré : jusqu'à 357 requêtes sur
    // /planning). Le champ n'est de toute façon jamais lu côté frontend —
    // seul membres.statut (persisté, tenu à jour par syncStatut()) l'est.
    // L'accesseur reste utilisable explicitement : $membre->statut_abonnement.
    protected $appends = ['nom_complet'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Relation : un membre a plusieurs abonnements
    public function abonnements()
    {
        return $this->hasMany(Abonnement::class);
    }

    // Abonnement actuel (le plus récent) — un abonnement annulé n'est jamais "actuel"
    public function abonnementActuel()
    {
        return $this->hasOne(Abonnement::class)
            ->where('statut', '!=', 'annule')
            ->where('date_debut', '<=', now())
            ->where('date_fin', '>=', now())
            ->latest();
    }

    // Abonnement en attente (date_debut future) — un abonnement annulé n'est jamais "en attente"
    public function abonnementEnAttente()
    {
        return $this->hasOne(Abonnement::class)
            ->where('statut', '!=', 'annule')
            ->where('date_debut', '>', now())
            ->latest();
    }

    // Accesseur : nom complet
    public function getNomCompletAttribute()
    {
        return $this->prenom . ' ' . $this->nom;
    }

    // Accesseur : calcule le statut automatiquement
    public function getStatutAbonnementAttribute(): string
{
    $abonnement = $this->abonnementActuel;

    if (!$abonnement) {
        // Vérifie s'il y a un abonnement en attente
        $enAttente = $this->abonnementEnAttente;
        if ($enAttente) return 'en_attente';
        return 'expire';
    }

    $today   = Carbon::today();
    $dateFin = Carbon::parse($abonnement->date_fin);

    if ($dateFin->isPast()) return 'expire';
    if ($today->diffInDays($dateFin) <= 7) return 'expire_bientot';
    return 'actif';
}

    // Met à jour le statut en BDD automatiquement à partir des dates d'abonnement.
    // Une suspension est une décision manuelle de l'admin : on ne la recalcule
    // jamais automatiquement, elle ne peut être levée que via une modification
    // explicite du statut (formulaire d'édition membre).
    public function syncStatut()
    {
        if ($this->statut === 'suspendu') {
            return;
        }

        // Le statut réel (actif, expire_bientot...) ne peut être affiché que si
        // le membre a activé son compte — sinon il reste "en_attente" même si
        // son abonnement a déjà commencé (voir SetupPasswordController::setup,
        // qui déclenche le recalcul réel juste après l'activation).
        if (!$this->user || !$this->user->password_changed) {
            if ($this->statut !== 'en_attente') {
                $this->update(['statut' => 'en_attente']);
            }
            return;
        }

        // Compte activé, mais aucun abonnement n'a jamais existé (inscription
        // "ponctuel" pure) : "expire" serait trompeur, ça laisse penser qu'un
        // abonnement a existé puis a pris fin. On distingue ce cas.
        if (!$this->abonnements()->exists()) {
            if ($this->statut !== 'sans_abonnement') {
                $this->update(['statut' => 'sans_abonnement']);
            }
            return;
        }

        $this->update(['statut' => $this->statut_abonnement]);
    }

    public function coach()
    {
        return $this->belongsTo(Coach::class);
    }

    public function seances()
    {
        return $this->hasMany(Seance::class);
    }

    public function seancesPonctuelles()
    {
        return $this->hasMany(SeancePonctuelle::class);
    }


}

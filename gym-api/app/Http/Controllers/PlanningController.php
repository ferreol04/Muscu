<?php

namespace App\Http\Controllers;

use App\Models\Seance;
use App\Models\Membre;
use App\Http\Resources\CoachPublicResource;
use Illuminate\Http\Request;

class PlanningController extends Controller
{
    // Liste toutes les séances (admin)
    public function index(Request $request)
    {
        // Corrige l'état "effectuee" en temps réel, avant de servir la liste —
        // l'admin ne doit jamais voir un statut périmé en attendant la tâche
        // planifiée de fond.
        Seance::marquerEffectueesAutomatiquement();

        // Recherche libre sur le membre ou le coach (nom, prénom, email).
        $seances = Seance::with(['coach', 'membre', 'exercices'])
            ->when($request->search, function ($q) use ($request) {
                $search = $this->escapeLike($request->search);
                $q->where(function ($q2) use ($search) {
                    $q2->whereHas('membre', function ($q3) use ($search) {
                        $q3->where('nom', 'like', "%{$search}%")
                           ->orWhere('prenom', 'like', "%{$search}%")
                           ->orWhere('email', 'like', "%{$search}%");
                    })->orWhereHas('coach', function ($q3) use ($search) {
                        $q3->where('nom', 'like', "%{$search}%")
                           ->orWhere('prenom', 'like', "%{$search}%")
                           ->orWhere('email', 'like', "%{$search}%");
                    });
                });
            })
            ->when($request->statut, fn($q) => $q->where('statut', $request->statut))
            // Filtre par jour de la semaine : comparaison directe du champ "jour"
            // pour une séance récurrente, dérivé de "date" (DAYOFWEEK) pour une
            // séance ponctuelle.
            ->when($request->jour, function ($q) use ($request) {
                $joursMap = ['dimanche' => 1, 'lundi' => 2, 'mardi' => 3, 'mercredi' => 4, 'jeudi' => 5, 'vendredi' => 6, 'samedi' => 7];
                $numero   = $joursMap[$request->jour] ?? 0;
                $q->where(function ($q2) use ($request, $numero) {
                    $q2->where(function ($q3) use ($request) {
                        $q3->where('recurrente', true)->where('jour', $request->jour);
                    })->orWhere(function ($q3) use ($numero) {
                        $q3->where('recurrente', false)->whereRaw('DAYOFWEEK(date) = ?', [$numero]);
                    });
                });
            })
            // Une séance récurrente n'a pas de date précise : elle reste
            // visible quel que soit le filtre de date choisi.
            ->when($request->date, fn($q) => $q->where(fn($q2) =>
                $q2->where('recurrente', true)->orWhereDate('date', $request->date)
            ))
            ->orderBy('date')
            ->orderBy('heure_debut')
            ->paginate(20)
            ->withQueryString();

        return response()->json($seances);
    }

    // Crée une séance (coach)
    public function store(Request $request)
    {
        $request->validate([
            'membre_id'   => 'required|exists:membres,id',
            'titre'       => 'required|string',
            'type'        => 'required|in:coach,libre',
            'jour'        => 'nullable|in:lundi,mardi,mercredi,jeudi,vendredi,samedi,dimanche',
            'date'        => 'nullable|date',
            'heure_debut' => 'required',
            'heure_fin'   => 'required|after:heure_debut',
            'recurrente'  => 'boolean',
            'notes'       => 'nullable|string',
            'coach_id'    => 'sometimes|nullable|exists:coachs,id',
            'exercices'   => 'nullable|array',
            'exercices.*.nom_exercice'  => 'required|string',
            'exercices.*.series'        => 'nullable|integer',
            'exercices.*.repetitions'   => 'nullable|integer',
            'exercices.*.repos_secondes'=> 'nullable|integer',
            'exercices.*.notes'         => 'nullable|string',
        ]);

        $user  = $request->user();
        $coach = $user->role === 'coach' ? $user->coach : null;

        // Un coach ne peut créer une séance que pour un membre qui lui est assigné
        if ($coach) {
            $membre = Membre::find($request->membre_id);
            if (!$membre || $membre->coach_id !== $coach->id) {
                return response()->json([
                    'message' => 'Vous ne pouvez créer une séance que pour un membre qui vous est assigné',
                ], 403);
            }
        }

        $seance = Seance::create([
            'coach_id'   => $coach?->id ?? $request->coach_id,
            'membre_id'  => $request->membre_id,
            'titre'      => $request->titre,
            'type'       => $request->type,
            'jour'       => $request->jour,
            'date'       => $request->date,
            'heure_debut'=> $request->heure_debut,
            'heure_fin'  => $request->heure_fin,
            'recurrente' => $request->recurrente ?? false,
            'notes'      => $request->notes,
        ]);

        // Ajoute les exercices
        if ($request->exercices) {
            foreach ($request->exercices as $index => $ex) {
                $seance->exercices()->create([
                    'nom_exercice'   => $ex['nom_exercice'],
                    'series'         => $ex['series'] ?? null,
                    'repetitions'    => $ex['repetitions'] ?? null,
                    'repos_secondes' => $ex['repos_secondes'] ?? null,
                    'notes'          => $ex['notes'] ?? null,
                    'ordre'          => $index,
                ]);
            }
        }

        return response()->json($seance->load('exercices', 'membre', 'coach'), 201);
    }

    // Détail d'une séance
    public function show(Seance $seance)
    {
        return response()->json($seance->load(['exercices', 'membre', 'coach']));
    }

    // Modifie une séance
    public function update(Request $request, Seance $seance)
    {
        if ($this->nonAutoriseSurCetteSeance($request, $seance)) {
            $message = 'Vous ne pouvez pas modifier une séance qui ne vous appartient pas';
            if ($seance->recurrente) {
                $message = 'Une séance récurrente ne peut être modifiée que par le coach qui l\'a créée';
            } elseif ($seance->statut === 'effectuee') {
                $message = 'Une séance déjà effectuée ne peut plus être modifiée';
            } elseif ($seance->statut === 'annulee') {
                $message = 'Une séance déjà annulée ne peut plus être modifiée';
            }
            return response()->json(['message' => $message], 403);
        }

        $user = $request->user();

        // Une séance ponctuelle, tant qu'elle est encore "planifiee" (le cas
        // effectuee/annulee est déjà bloqué plus haut) :
        // - côté coach : la date, les horaires et les exercices restent
        //   modifiables, ou la séance peut être annulée — rien d'autre (ni
        //   titre, ni notes, ni jour, ni type récurrent).
        // - côté admin : seule l'annulation reste possible.
        if ($user->role === 'coach' && !$seance->recurrente) {
            if ($request->hasAny(['titre', 'jour', 'recurrente', 'notes'])
                || ($request->has('statut') && $request->statut !== 'annulee')) {
                return response()->json([
                    'message' => 'Pour une séance ponctuelle, vous ne pouvez modifier que la date, les horaires, les exercices, ou l\'annuler',
                ], 403);
            }
        }

        if ($user->role === 'admin' && !$seance->recurrente) {
            if ($request->hasAny(['titre', 'jour', 'date', 'heure_debut', 'heure_fin', 'recurrente', 'notes', 'exercices'])
                || ($request->has('statut') && $request->statut !== 'annulee')) {
                return response()->json([
                    'message' => 'Pour une séance ponctuelle, vous ne pouvez que l\'annuler',
                ], 403);
            }
        }

        $request->validate([
            'titre'       => 'sometimes|string',
            'jour'        => 'nullable|in:lundi,mardi,mercredi,jeudi,vendredi,samedi,dimanche',
            'date'        => 'nullable|date',
            'heure_debut' => 'sometimes|date_format:H:i',
            'heure_fin'   => 'sometimes|date_format:H:i',
            'recurrente'  => 'boolean',
            'notes'       => 'nullable|string',
            'statut'      => 'sometimes|in:planifiee,effectuee,annulee',
            'exercices'   => 'nullable|array',
        ]);

        // L'heure de fin doit rester après l'heure de début, en tenant compte des
        // valeurs déjà en base pour les champs non envoyés dans cette requête.
        // La base stocke "H:i:s" alors que la requête envoie "H:i" : on tronque
        // aux 5 premiers caractères pour comparer des formats identiques.
        $heureDebut = substr($request->heure_debut ?? $seance->heure_debut, 0, 5);
        $heureFin   = substr($request->heure_fin ?? $seance->heure_fin, 0, 5);
        if (($request->has('heure_debut') || $request->has('heure_fin')) && $heureFin <= $heureDebut) {
            return response()->json([
                'message' => 'L\'heure de fin doit être après l\'heure de début',
            ], 422);
        }

        $seance->update($request->only([
            'titre', 'jour', 'date', 'heure_debut',
            'heure_fin', 'recurrente', 'notes', 'statut',
        ]));

        // Une séance ponctuelle (non récurrente) qui vient d'être annulée déclenche
        // le badge côté membre — que l'annulation vienne de l'admin ou du coach.
        if ($request->statut === 'annulee' && !$seance->recurrente) {
            $seance->update(['vu_par_membre' => false]);
        }

        // Met à jour les exercices
        if ($request->has('exercices')) {
            $seance->exercices()->delete();
            foreach ($request->exercices as $index => $ex) {
                $seance->exercices()->create([
                    'nom_exercice'   => $ex['nom_exercice'],
                    'series'         => $ex['series'] ?? null,
                    'repetitions'    => $ex['repetitions'] ?? null,
                    'repos_secondes' => $ex['repos_secondes'] ?? null,
                    'notes'          => $ex['notes'] ?? null,
                    'ordre'          => $index,
                ]);
            }
        }

        return response()->json($seance->load('exercices'));
    }

    // Supprime une séance
    public function destroy(Request $request, Seance $seance)
    {
        if ($this->nonAutoriseSurCetteSeance($request, $seance)) {
            return response()->json([
                'message' => $seance->recurrente
                    ? 'Une séance récurrente ne peut être supprimée que par le coach qui l\'a créée'
                    : 'Vous ne pouvez pas supprimer une séance qui ne vous appartient pas',
            ], 403);
        }

        $seance->delete();
        return response()->json(['message' => 'Séance supprimée']);
    }

    // Vrai si l'utilisateur connecté n'a pas le droit de modifier/supprimer cette séance.
    // - Un coach ne peut toucher qu'à ses propres séances, et seulement tant
    //   qu'une séance ponctuelle n'est pas encore "effectuee" ou "annulee" (plus
    //   aucune modification possible une fois l'une de ces deux statuts atteint).
    // - Un admin garde un accès total, SAUF sur une séance récurrente créée par un
    //   coach (seul ce coach peut la modifier ou la supprimer) et SAUF sur une
    //   séance ponctuelle déjà marquée "effectuee" (plus aucune modification
    //   possible une fois la séance passée).
    private function nonAutoriseSurCetteSeance(Request $request, Seance $seance): bool
    {
        $user = $request->user();

        if ($user->role === 'coach') {
            if ($seance->coach_id !== $user->coach?->id) {
                return true;
            }
            if (!$seance->recurrente && in_array($seance->statut, ['effectuee', 'annulee'], true)) {
                return true;
            }
            return false;
        }

        if ($user->role === 'admin') {
            if ($seance->recurrente) {
                return true;
            }
            return $seance->statut === 'effectuee';
        }

        return true;
    }

    // Une séance est visible si elle est planifiée, ou si elle a été annulée ou
    // marquée effectuée (ponctuelle uniquement — les récurrentes n'ont pas
    // d'heure de fin unique) il y a moins de 5h. Passé ce délai, elle disparaît
    // du planning membre/coach (elle reste toujours consultable par l'admin via
    // le planning global).
    private function filtreVisibilite($query)
    {
        return $query->where(function ($q) {
            $q->where('statut', 'planifiee')
              ->orWhere(function ($q2) {
                  $q2->whereIn('statut', ['annulee', 'effectuee'])
                     ->where('recurrente', false)
                     ->whereRaw("TIMESTAMP(date, heure_fin) >= (NOW() - INTERVAL 5 HOUR)");
              });
        });
    }

    // Planning d'un membre (vue membre)
    public function planningMembre(Request $request)
{
    $membre  = $request->user()->membre;

    // Correction "effectuee" en temps réel, limitée aux séances de ce membre.
    Seance::marquerEffectueesAutomatiquement(fn($q) => $q->where('membre_id', $membre->id));

    $seances = $this->filtreVisibilite(
        Seance::with(['coach', 'exercices'])->where('membre_id', $membre->id)
    )
        ->orderByRaw("COALESCE(date, '9999-12-31')")
        ->orderBy('heure_debut')
        ->get();

    // La consultation du planning vaut prise de connaissance des annulations :
    // le badge du menu redescend à 0 juste après cet appel.
    Seance::where('membre_id', $membre->id)
        ->where('statut', 'annulee')
        ->where('vu_par_membre', false)
        ->update(['vu_par_membre' => true]);

    // Le coach n'expose pas sa date de naissance au membre qui consulte son planning
    $seances = $seances->map(function ($seance) {
        $data = $seance->toArray();
        if ($seance->relationLoaded('coach') && $seance->coach) {
            $data['coach'] = (new CoachPublicResource($seance->coach))->resolve();
        }
        return $data;
    });

    return response()->json($seances);
}

    // Nombre d'annulations pas encore consultées par le membre, pour le badge du menu
    public function compteAnnulationsNonVues(Request $request)
    {
        $membre = $request->user()->membre;

        return response()->json([
            'count' => Seance::where('membre_id', $membre->id)
                ->where('statut', 'annulee')
                ->where('vu_par_membre', false)
                ->count(),
        ]);
    }

    // Planning du coach (vue coach)
    public function planningCoach(Request $request)
    {
        $coach = $request->user()->coach;

        // Correction "effectuee" en temps réel, limitée aux séances de ce coach.
        Seance::marquerEffectueesAutomatiquement(fn($q) => $q->where('coach_id', $coach->id));

        $seances = $this->filtreVisibilite(
            Seance::with(['membre', 'exercices'])->where('coach_id', $coach->id)
        )
            ->orderBy('date')
            ->orderBy('jour')
            ->orderBy('heure_debut')
            ->get();

        return response()->json($seances);
    }

    // Réserver une séance libre (membre)
    public function reserver(Request $request)
{
    // Validation des champs
    $request->validate([
        'date'        => 'required|date|after_or_equal:today',
        'heure_debut' => 'required|date_format:H:i',
        'heure_fin'   => 'required|date_format:H:i|after:heure_debut',
        'notes'       => 'nullable|string',
    ]);

    // Récupère le membre connecté
    $membre = $request->user()->membre;

    // Vérifie le statut du membre
    if ($membre->statut === 'expire' || $membre->statut === 'suspendu') {
        return response()->json([
            'message' => 'Votre abonnement est expiré ou votre compte est suspendu'
        ], 403);
    }

    // Détermine le coach : null si aucun assigné
    $coach_id = $membre->coach_id ?? null;

    // Crée la séance libre
    $seance = Seance::create([
        'coach_id'   => $coach_id,       // null si pas de coach
        'membre_id'  => $membre->id,
        'titre'      => 'Séance libre',
        'type'       => 'libre',
        'date'       => $request->date,
        'heure_debut'=> $request->heure_debut,
        'heure_fin'  => $request->heure_fin,
        'recurrente' => false,
        'notes'      => $request->notes,
    ]);

    // Retourne la séance créée
    return response()->json($seance, 201);
}

    // Annuler une réservation (membre)
    public function annuler(Seance $seance, Request $request)
    {
        $membre = $request->user()->membre;

        if ($seance->membre_id !== $membre->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        if ($seance->type !== 'libre') {
            return response()->json(['message' => 'Seules les séances libres peuvent être annulées par le membre'], 403);
        }

        $seance->update(['statut' => 'annulee']);

        return response()->json(['message' => 'Séance annulée']);
    }
}

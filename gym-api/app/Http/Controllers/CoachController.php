<?php

namespace App\Http\Controllers;

use App\Models\Coach;
use App\Models\Membre;
use App\Models\User;
use App\Models\SetupToken;
use App\Mail\SetupPasswordMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Carbon\Carbon;
use App\Models\Seance;

class CoachController extends Controller
{
    // Liste tous les coachs
    public function index(Request $request)
    {
        $query = Coach::with('user')->withCount('membres');

        if ($request->search) {
            $search = $this->escapeLike($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('nom',    'like', "%{$search}%")
                  ->orWhere('prenom', 'like', "%{$search}%")
                  ->orWhere('email',  'like', "%{$search}%");
            });
        }

        if ($request->statut) {
            $query->where('statut', $request->statut);
        }

        return response()->json($query->latest()->paginate(15));
    }

    // Crée un coach
    public function store(Request $request)
    {
        $request->validate([
            'nom'        => 'required|string',
            'prenom'     => 'required|string',
            'email'      => 'required|email|unique:coachs,email|unique:users,email',
            'telephone'  => 'nullable|string',
            'specialite' => 'nullable|string',
            'bio'        => 'nullable|string',
            'date_naissance' => 'required|date',
        ]);

        

        
        return \DB::transaction(function () use ($request) {

        // 1. Crée le compte User

        $user = User::create([
            'name'             => $request->prenom . ' ' . $request->nom,
            'email'            => $request->email,
            'password'         => Hash::make(Str::random(16)),
            'role'             => 'coach',
            'password_changed' => false,
        ]);

        // Crée le coach
        $coach = Coach::create([
            'user_id'    => $user->id,
            'nom'        => $request->nom,
            'prenom'     => $request->prenom,
            'email'      => $request->email,
            'telephone'  => $request->telephone,
            'specialite' => $request->specialite,
            'bio'        => $request->bio,
            'date_naissance'=> $request->date_naissance,
            'statut'     => 'en_attente', // passe à "actif" automatiquement lorsqu'il active son compte
        ]);

        // Génère le token de setup
        $token = Str::random(64);
        SetupToken::create([
            'user_id'    => $user->id,
            'token'      => $token,
            'expires_at' => Carbon::now()->addHours(config('gympro.setup_token_hours.activation')),
        ]);

        // Envoie l'email
        Mail::to($user->email)->send(new SetupPasswordMail(
            setupLink: config('gympro.frontend_url') . "/setup-password?token={$token}",
            memberName: $coach->prenom,
        ));

        return response()->json([
            'coach'   => $coach->load('user'),
            'message' => 'Coach créé. Un email a été envoyé.',
        ], 201);
        });
    }

    // Détail d'un coach
    public function show(Coach $coach)
    {
        return response()->json(
            $coach->load(['user', 'membres.abonnementActuel'])
        );
    }

    // Modifie un coach
    public function update(Request $request, Coach $coach)
    {
        $request->validate([
            'nom'        => 'sometimes|string',
            'prenom'     => 'sometimes|string',
            'telephone'  => 'nullable|string',
            'specialite' => 'nullable|string',
            'bio'        => 'nullable|string',
            // "en_attente" est accepté ici uniquement pour permettre de renvoyer le formulaire
            // sans le modifier (le coach n'a pas encore activé son compte) — l'interface admin
            // ne propose jamais de basculer manuellement vers "en_attente", seule l'activation
            // par le coach lui-même (SetupPasswordController::setup) le fait.
            'statut'     => 'sometimes|in:actif,suspendu,en_attente',
            'date_naissance' => 'nullable|date',
        ]);

        $coach->update($request->only([
            'nom', 'prenom', 'telephone', 'specialite', 'bio', 'statut', 'date_naissance',
        ]));

        return response()->json($coach->load('user'));
    }

    // Supprime un coach
    public function destroy(Coach $coach)
    {
        $coach->user?->delete();;
        $coach->delete();
        return response()->json(['message' => 'Coach supprimé']);
    }

    // Assigne un membre à un coach
    public function assignerMembre(Request $request, Coach $coach)
    {
        $request->validate([
            'membre_id' => 'required|exists:membres,id',
        ]);

        if ($coach->statut === 'en_attente') {
            return response()->json(['message' => 'Ce coach n\'a pas encore activé son compte.'], 422);
        }

        if ($coach->statut === 'suspendu') {
            return response()->json(['message' => 'Ce coach est suspendu.'], 422);
        }

        $membre = Membre::findOrFail($request->membre_id);

        if ($membre->statut === 'en_attente') {
            return response()->json(['message' => 'Ce membre n\'a pas encore activé son compte.'], 422);
        }

        if ($membre->statut === 'suspendu') {
            return response()->json(['message' => 'Ce membre est suspendu.'], 422);
        }

        $membre->update(['coach_id' => $coach->id]);

        return response()->json([
            'message' => 'Membre assigné au coach avec succès',
            'membre'  => $membre->load('coach'),
        ]);
    }

    // Renvoie un nouveau lien d'activation à un coach qui n'a pas encore défini son mot de passe
    public function renvoyerInvitation(Coach $coach)
    {
        if (!$coach->user) {
            return response()->json(['message' => 'Aucun compte utilisateur associé à ce coach'], 422);
        }

        if ($coach->user->password_changed) {
            return response()->json(['message' => 'Ce coach a déjà activé son compte'], 422);
        }

        // Supprime l'ancien token s'il existe
        SetupToken::where('user_id', $coach->user_id)->delete();

        $token = Str::random(64);
        SetupToken::create([
            'user_id'    => $coach->user_id,
            'token'      => $token,
            'expires_at' => Carbon::now()->addHours(config('gympro.setup_token_hours.resend')),
        ]);

        Mail::to($coach->email)->send(new SetupPasswordMail(
            setupLink: config('gympro.frontend_url') . "/setup-password?token={$token}",
            memberName: $coach->prenom,
        ));

        return response()->json(['message' => 'Lien d\'activation renvoyé avec succès']);
    }

    // Retire un membre d'un coach
    public function retirerMembre(Request $request, Coach $coach)
{
    $request->validate([
        'membre_id' => 'required|exists:membres,id',
    ]);

    $membre = Membre::findOrFail($request->membre_id);

    if ($membre->coach_id !== $coach->id) {
        return response()->json(['message' => 'Ce membre n\'est pas assigné à ce coach'], 422);
    }

    // Supprime toutes les séances entre ce coach et ce membre
    Seance::where('coach_id', $coach->id)
          ->where('membre_id', $membre->id)
          ->delete();

    // Retire le membre du coach
    $membre->update(['coach_id' => null]);

    return response()->json(['message' => 'Membre retiré du coach et séances supprimées']);
}
}

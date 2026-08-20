<?php

namespace App\Http\Controllers;

use App\Models\SetupToken;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Carbon\Carbon;
use App\Mail\SetupPasswordMail;
use Illuminate\Support\Facades\Mail;

class SetupPasswordController extends Controller
{
    // Vérifie que le token est valide
    public function verify(Request $request)
    {
        $setupToken = SetupToken::with('user')
            ->where('token', $request->token)
            ->first();

        if (!$setupToken || $setupToken->isExpired()) {
            return response()->json(['message' => 'Lien invalide ou expiré'], 404);
        }

        return response()->json([
            'valid' => true,
            'email' => $setupToken->user->email,
            'nom'   => $setupToken->user->name,
        ]);
    }

    // Le membre choisit son mot de passe
    public function setup(Request $request)
    {
        $request->validate([
            'token'    => 'required|string',
            'password' => 'required|min:8|confirmed',
        ]);

        $setupToken = SetupToken::with('user')
            ->where('token', $request->token)
            ->first();

        if (!$setupToken || $setupToken->isExpired()) {
            return response()->json(['message' => 'Lien invalide ou expiré'], 404);
        }

        $user = $setupToken->user;

        // Met à jour le mot de passe
        $user->update([
            'password'         => Hash::make($request->password),
            'password_changed' => true,
        ]);

        // Un coach qui active son compte passe automatiquement de "en_attente" à "actif".
        // On ne touche pas à un coach déjà "suspendu" (cas rare : suspendu avant activation).
        if ($user->role === 'coach' && $user->coach && $user->coach->statut === 'en_attente') {
            $user->coach->update(['statut' => 'actif']);
        }

        // Un membre qui active son compte voit son statut recalculé immédiatement
        // (actif, expire_bientot...) plutôt que d'attendre la prochaine exécution
        // de la tâche planifiée membres:recalculer-statuts.
        if ($user->role === 'membre' && $user->membre) {
            $user->membre->syncStatut();
        }

        // Supprime le token utilisé
        $setupToken->delete();

        // Connecte automatiquement le membre
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Mot de passe créé avec succès',
            'user'    => $user,
            'token'   => $token,
        ]);
    }

    // Renvoie un nouveau lien si l'ancien a expiré — même logique pour un membre ou un coach
    // qui n'a pas encore activé son compte : aucune raison de traiter les deux différemment,
    // la vérification d'appartenance au bon compte se fait par email + password_changed.
    public function resend(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $request->email)
            ->whereIn('role', ['membre', 'coach'])
            ->where('password_changed', false)
            ->first();

        // On ne révèle pas si un compte en attente existe pour cet email —
        // même principe que ForgotPasswordController::sendResetLink().
        if (!$user) {
            return response()->json([
                'message' => 'Si un compte en attente existe pour cet email, un nouveau lien a été envoyé.',
            ]);
        }

        // Supprime l'ancien token s'il existe
        SetupToken::where('user_id', $user->id)->delete();

        // Génère un nouveau token
        $token = Str::random(64);
        SetupToken::create([
            'user_id'    => $user->id,
            'token'      => $token,
            'expires_at' => Carbon::now()->addHours(config('gympro.setup_token_hours.resend')),
        ]);

        Mail::to($user->email)->send(new SetupPasswordMail(
            setupLink: config('gympro.frontend_url') . "/setup-password?token={$token}",
            memberName: $user->name,
        ));

        return response()->json([
            'message' => 'Si un compte en attente existe pour cet email, un nouveau lien a été envoyé.',
        ]);
    }
}
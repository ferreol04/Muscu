<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\SetupToken;
use App\Mail\SetupPasswordMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Carbon\Carbon;

class ForgotPasswordController extends Controller
{
    public function sendResetLink(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $request->email)->first();

        // On ne révèle pas si l'email existe ou pas (sécurité)
        if (!$user) {
            return response()->json([
                'message' => 'Si cet email existe, un lien de réinitialisation a été envoyé.',
            ]);
        }

        // Supprime les anciens tokens
        SetupToken::where('user_id', $user->id)->delete();

        // Génère un nouveau token
        $token = Str::random(64);
        SetupToken::create([
            'user_id'    => $user->id,
            'token'      => $token,
            'expires_at' => Carbon::now()->addHours(config('gympro.setup_token_hours.reset_password')),
        ]);

        // Envoie l'email
        Mail::to($user->email)->send(new SetupPasswordMail(
            setupLink: config('gympro.frontend_url') . "/reset-password?token={$token}",
            memberName: $user->name,
        ));

        return response()->json([
            'message' => 'Si cet email existe, un lien de réinitialisation a été envoyé.',
        ]);
    }
}
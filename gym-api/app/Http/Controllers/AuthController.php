<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;


class AuthController extends Controller
{
    // Pas d'inscription libre : les comptes membre/coach sont exclusivement
    // créés par un admin (MembreController::store / CoachController::store),
    // avec activation par lien email.

    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'message' => 'Identifiants incorrects',
            ], 401);
        }

        $user  = Auth::user();

        // Vérifie si le membre est suspendu
        if ($user->role === 'membre') {
            $membre = $user->membre;
            if ($membre && $membre->statut === 'suspendu') {
                Auth::logout();
                return response()->json([
                    'message' => 'Votre compte a été suspendu. Contactez la réception pour plus d\'informations.',
                ], 403);
            }
        }

        // Vérifie si le coach est suspendu
        if ($user->role === 'coach') {
            $coach = $user->coach;
            if ($coach && $coach->statut === 'suspendu') {
                Auth::logout();
                return response()->json([
                    'message' => 'Votre compte a été suspendu. Contactez l\'administration pour plus d\'informations.',
                ], 403);
            }
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user'  => $user,
            'token' => $token,
            'role' => $user->role,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Déconnecté']);
    }

    public function me(Request $request)
    {
        return response()->json($request->user());
    }
}

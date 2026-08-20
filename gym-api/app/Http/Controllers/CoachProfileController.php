<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class CoachProfileController extends Controller
{
    public function profil(Request $request)
    {
        $user  = $request->user();
        $coach = $user->coach()->with(['membres.abonnementActuel'])->first();

        return response()->json([
            'user'  => $user,
            'coach' => $coach,
        ]);
    }

    public function membres(Request $request)
    {
        $coach   = $request->user()->coach;
        $membres = $coach->membres()->with('abonnementActuel')->get();

        return response()->json($membres);
    }


public function updateProfil(Request $request)
{
    $request->validate([
        'telephone' => 'nullable|string',
        'bio'       => 'nullable|string',
        'specialite'=> 'nullable|string',
    ]);

    $coach = $request->user()->coach;
    $coach->update($request->only(['telephone', 'bio', 'specialite']));

    return response()->json(['message' => 'Profil mis à jour', 'coach' => $coach]);
}

public function changePassword(Request $request)
{
    $request->validate([
        'current_password'      => 'required',
        'password'              => 'required|min:8|confirmed',
        'password_confirmation' => 'required',
    ]);

    $user = $request->user();

    if (!Hash::check($request->current_password, $user->password)) {
        return response()->json(['message' => 'Mot de passe actuel incorrect'], 422);
    }

    $user->update(['password' => Hash::make($request->password)]);

    return response()->json(['message' => 'Mot de passe modifié avec succès']);
}

}

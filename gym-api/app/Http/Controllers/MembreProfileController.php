<?php

namespace App\Http\Controllers;

use App\Http\Resources\CoachPublicResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class MembreProfileController extends Controller
{
    // Profil du membre connecté
    public function profil(Request $request)
    {
        $user   = $request->user();
        $membre = $user->membre()->with('abonnementActuel', 'coach')->first();

        return response()->json([
            'user'   => $user,
            'membre' => $this->membreAvecCoachPublic($membre),
        ]);
    }

    // Historique des abonnements / paiements
    public function historique(Request $request)
    {
        $membre = $request->user()->membre;

        return response()->json(
            $membre->abonnements()->latest()->take(3)->get()
        );
    }

    public function profilComplet(Request $request)
{
    $user   = $request->user();
    $membre = $user->membre()->with(['abonnements', 'abonnementActuel', 'coach'])->first();

    $dateInscription  = $membre->created_at;
    $moisDepuis       = (int) $dateInscription->diffInMonths(now());
    $nbRenouvellements = $membre->abonnements()->count() - 1;

    return response()->json([
        'user'              => $user,
        'membre'            => $this->membreAvecCoachPublic($membre),
        'mois_depuis'       => $moisDepuis,
        'nb_renouvellements' => max(0, $nbRenouvellements),
    ]);
}

    // Remplace, dans la sérialisation d'un membre, le coach chargé par sa version
    // publique (sans date de naissance) — le membre n'a pas à voir cette
    // information sur le coach qui lui est assigné.
    private function membreAvecCoachPublic($membre): array
    {
        $data = $membre->toArray();

        if ($membre->relationLoaded('coach') && $membre->coach) {
            $data['coach'] = (new CoachPublicResource($membre->coach))->resolve();
        }

        return $data;
    }

public function paiements(Request $request)
{
    $membre      = $request->user()->membre;
    $abonnements = $membre->abonnements()->latest()->get();
    $seancesPonctuelles = $membre->seancesPonctuelles()
        ->with('tarifPonctuel')
        ->where('statut', 'validee')
        ->latest('validee_at')
        ->get();

    // Un abonnement annulé reste visible dans l'historique mais ne compte pas
    // dans le total dépensé (il n'a jamais été réellement facturé).
    $totalAbonnements = $abonnements->where('statut', '!=', 'annule')->sum('montant');
    $totalPonctuels   = $seancesPonctuelles->sum('montant');

    return response()->json([
        'abonnements'           => $abonnements,
        'seances_ponctuelles'   => $seancesPonctuelles,
        'total_depense'         => $totalAbonnements + $totalPonctuels,
        'abonnement_actuel'     => $membre->abonnementActuel,
        'abonnement_en_attente' => $membre->abonnementEnAttente,
    ]);
}

    // Modifier téléphone + photo
    public function updateProfil(Request $request)
{
    $request->validate([
        'telephone'      => 'nullable|string|max:20',
        'photo'          => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        'supprimer_photo' => 'nullable',
    ]);

    $membre = $request->user()->membre;
    $data   = [];

    if ($request->has('telephone')) {
        $data['telephone'] = $request->telephone;
    }

    // Supprime la photo
    if ($request->supprimer_photo) {
        if ($membre->photo) {
            Storage::disk('public')->delete('photos/' . $membre->photo);
        }
        $data['photo'] = null;
    }

    // Nouvelle photo
    if ($request->hasFile('photo')) {
        if ($membre->photo) {
            Storage::disk('public')->delete('photos/' . $membre->photo);
        }
        $file          = $request->file('photo');
        $filename      = \Illuminate\Support\Str::uuid() . '.' . $file->getClientOriginalExtension();
        $file->storeAs('photos', $filename, 'public');
        $data['photo'] = $filename;
    }

    $membre->update($data);

    return response()->json([
        'message' => 'Profil mis à jour avec succès',
        'membre'  => $membre->fresh(),
    ]);
}

    // Changer mot de passe
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password'      => 'required|string',
            'password'              => 'required|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'Mot de passe actuel incorrect',
            ], 422);
        }

        $user->update([
            'password'         => Hash::make($request->password),
            'password_changed' => true,
        ]);

        return response()->json(['message' => 'Mot de passe modifié avec succès']);
    }

}


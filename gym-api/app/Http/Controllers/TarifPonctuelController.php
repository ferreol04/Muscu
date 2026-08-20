<?php

namespace App\Http\Controllers;

use App\Models\TarifPonctuel;
use Illuminate\Http\Request;

class TarifPonctuelController extends Controller
{
    // Liste publique — utilisée par le formulaire de demande d'un membre.
    // Ne renvoie que les tarifs actifs : un tarif désactivé ne doit plus
    // pouvoir être choisi pour une nouvelle demande, mais reste utilisé tel
    // quel par les séances déjà créées avec (montant dupliqué sur la séance).
    public function index()
    {
        return response()->json(
            TarifPonctuel::where('actif', true)->orderBy('duree_minutes')->get()
        );
    }

    // Liste complète (actifs + inactifs) — réservée à l'admin, pour la gestion
    public function indexAdmin()
    {
        return response()->json(TarifPonctuel::orderBy('duree_minutes')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'libelle'        => 'required|string',
            'duree_minutes'  => 'required|integer|min:1',
            'montant'        => 'required|numeric|min:0',
        ]);

        $tarif = TarifPonctuel::create($request->only(['libelle', 'duree_minutes', 'montant']));

        return response()->json($tarif->fresh(), 201);
    }

    public function update(Request $request, TarifPonctuel $tarifPonctuel)
    {
        $request->validate([
            'libelle'       => 'sometimes|string',
            'duree_minutes' => 'sometimes|integer|min:1',
            'montant'       => 'sometimes|numeric|min:0',
            'actif'         => 'sometimes|boolean',
        ]);

        $tarifPonctuel->update($request->only(['libelle', 'duree_minutes', 'montant', 'actif']));

        return response()->json($tarifPonctuel);
    }

    // Volontairement pas de destroy() : un tarif ponctuel ne se supprime jamais
    // (il peut être référencé par des séances déjà validées/payées). On le
    // désactive via update([actif => false]) pour qu'il ne soit plus proposé
    // aux membres, sans jamais toucher à l'historique existant.
}

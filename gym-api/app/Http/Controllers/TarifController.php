<?php

namespace App\Http\Controllers;

use App\Models\Tarif;
use Illuminate\Http\Request;

class TarifController extends Controller
{
    // Liste tous les tarifs (accessible à tous les connectés)
    public function index()
    {
        return response()->json(Tarif::all());
    }

    // Modifie un tarif (admin seulement — on gérera le rôle plus tard)
    public function update(Request $request, Tarif $tarif)
    {
        $request->validate([
            'montant' => 'required|numeric|min:0',
        ]);

        $tarif->update(['montant' => $request->montant]);

        return response()->json($tarif);
    }
}

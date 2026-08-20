<?php

namespace App\Http\Controllers;

abstract class Controller
{
    // "%" et "_" sont des jokers LIKE en SQL : on les échappe pour qu'une
    // recherche utilisateur contenant ces caractères soit traitée littéralement
    // plutôt que de matcher n'importe quoi (ou rien) de façon imprévisible.
    protected function escapeLike(string $value): string
    {
        return str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $value);
    }
}

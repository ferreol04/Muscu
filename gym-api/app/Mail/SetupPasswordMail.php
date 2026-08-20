<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

// L'envoi passe désormais par la file d'attente (worker déjà présent dans
// `composer run dev` via queue:listen) : créer un membre/coach, ou demander
// une réinitialisation de mot de passe, ne bloque plus la réponse HTTP le
// temps que l'email parte réellement (surtout utile avec un serveur SMTP
// distant/lent). Mail::send() détecte ShouldQueue et met en file
// automatiquement, aucun changement nécessaire côté contrôleurs.
class SetupPasswordMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $setupLink,
        public string $memberName,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Bienvenue sur GymPro — Activez votre compte',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.setup-password',
        );
    }
}

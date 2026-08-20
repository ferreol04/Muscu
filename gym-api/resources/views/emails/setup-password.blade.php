<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Activez votre compte GymPro</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; }
        .header { background: #1a1a2a; padding: 32px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .header span { color: #e05c3a; }
        .body { padding: 40px 32px; }
        .body h2 { color: #1a1a2a; font-size: 20px; margin-bottom: 8px; }
        .body p { color: #555; line-height: 1.7; margin-bottom: 16px; }
        .btn { display: inline-block; background: #e05c3a; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px; margin: 16px 0; }
        .link-box { background: #f4f4f4; border-radius: 8px; padding: 12px 16px; word-break: break-all; font-size: 12px; color: #666; margin-top: 16px; }
        .footer { background: #f9f9f9; padding: 24px 32px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; }
        .warning { background: #fff8e1; border-left: 4px solid #ba7517; padding: 12px 16px; border-radius: 4px; font-size: 13px; color: #6d4c00; margin-top: 24px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Gym<span>Pro</span></h1>
        </div>
        <div class="body">
            <h2>Bienvenue, {{ $memberName }} ! 👋</h2>
            <p>
                Votre compte a été créé sur <strong>GymPro</strong>.
                Pour finaliser votre inscription, choisissez votre mot de passe
                en cliquant sur le bouton ci-dessous.
            </p>

            <div style="text-align: center; margin: 32px 0;">
                <a href="{{ $setupLink }}" class="btn">
                    Activer mon compte →
                </a>
            </div>

            <p>Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :</p>
            <div class="link-box">{{ $setupLink }}</div>

            <div class="warning">
                ⚠ Ce lien est valable pendant <strong>24 heures</strong>.
                Après ce délai, contactez votre salle de sport pour obtenir un nouveau lien.
            </div>
        </div>
        <div class="footer">
            <p>© {{ date('Y') }} GymPro — Tous droits réservés</p>
            <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
        </div>
    </div>
</body>
</html>
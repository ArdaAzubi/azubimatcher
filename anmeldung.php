<?php ob_start(); ?>
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Serverseitige Anmeldung für AzubiMatch. Melde dich mit deinen Zugangsdaten an, um dein Profil im Portal zu öffnen.">
    <title>AzubiMatch – Anmeldung</title>
    <link rel="stylesheet" href="style.css">
</head>
<body class="auth-page startseite-page auth-landing-page">
    <div class="bg-grid" aria-hidden="true"></div>
    <div class="bg-orb orb-one" aria-hidden="true"></div>
    <div class="bg-orb orb-two" aria-hidden="true"></div>
    <div class="start-wrapper index-layout auth-layout">
        <header class="index-topbar auth-topbar">
            <a href="index.html" class="index-brand">AzubiMatch</a>
            <nav class="index-nav" aria-label="Seitennavigation">
                <a href="index.html">Startseite</a>
                <a href="home.html">Mehr erfahren</a>
                <a href="lehrberufe.html">Berufe</a>
                <a href="#" data-open-privacy-settings>Privatsphäre & Cookies</a>
            </nav>
            <a href="index.html" class="btn ghost index-login-btn">Zurück</a>
        </header>

        <main class="auth-main">
            <section class="auth-panel-surface">
                <div class="auth-panel-copy">
                    <span class="index-kicker">Server-Login</span>
                    <h1 class="auth-panel-title">Anmelden und das Profil direkt öffnen</h1>
                    <p class="auth-panel-text">Diese Anmeldung nutzt den serverseitigen Zugriff. Sie eignet sich für klassische Login-Szenarien mit Datenbankprüfung und führt bei erfolgreicher Anmeldung direkt ins Profil.</p>
                    <ul class="auth-panel-points">
                        <li>klare Eingabe von E-Mail-Adresse und Passwort</li>
                        <li>serverseitige Prüfung gegen die Datenbank</li>
                        <li>direkter Einstieg ins Profil nach erfolgreicher Anmeldung</li>
                    </ul>
                </div>

                <div class="login-container auth-login-card">
        <div class="auth-login-head">
            <p class="auth-login-kicker">PHP-Login</p>
            <h2>Anmeldung</h2>
            <p>Gib deine Zugangsdaten ein, um den serverseitigen Login zu nutzen.</p>
        </div>
        <?php
        require_once __DIR__ . '/php_auth_bootstrap.php';
        $error = '';
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $email = trim((string) ($_POST['email'] ?? ''));
            $password = (string) ($_POST['password'] ?? '');
            $db = azubimatch_load_db(__DIR__, $error);

            if ($db instanceof PDO) {
                $stmt = $db->prepare('SELECT * FROM users WHERE email = ? LIMIT 1');
                $stmt->execute([$email]);
                $row = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($row && password_verify($password, $row['password'])) {
                    azubimatch_render_login_bridge($row, azubimatch_resolve_user_role($row));
                }
                $error = 'Falsche Zugangsdaten!';
            }
        }
        ?>
        <form method="post" action="" class="auth-login-form">
            <label for="email">E-Mail</label>
            <input class="input" type="email" id="email" name="email" required>
            <label for="password">Passwort</label>
            <input class="input" type="password" id="password" name="password" required>
            <button type="submit" class="btn primary auth-submit-btn">Anmelden</button>
            <?php if ($error): ?>
                <div class="auth-login-error is-visible"><?php echo htmlspecialchars($error, ENT_QUOTES, 'UTF-8'); ?></div>
            <?php endif; ?>
        </form>
        <div class="auth-login-links">
            <a href="bewerber.html?forgot=1">Passwort für Bewerbende zurücksetzen</a>
            <a href="firma.html?forgot=1">Passwort für Firmen zurücksetzen</a>
        </div>
                </div>
            </section>
        </main>

        <footer class="start-footer auth-footer">
            <span>© 2026 AzubiMatch</span>
            <div class="index-footer-links">
                 <a href="datenschutzerklaerung.html">Datenschutz</a>
                <a href="#" data-open-privacy-settings>Privatsphäre & Cookies</a>
                 <a href="impressum.html">Impressum</a>
            </div>
        </footer>
    </div>
    <script src="privacy-settings.js"></script>
</body>
</html>

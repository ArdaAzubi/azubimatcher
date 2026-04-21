<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registrierung</title>
    <link rel="stylesheet" href="style.css">
    <style>
        .login-container {
            max-width: 400px;
            margin: 60px auto;
            padding: 32px 24px;
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 2px 16px rgba(0,0,0,0.08);
        }
        .login-container h2 {
            text-align: center;
            margin-bottom: 24px;
        }
        .login-container label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
        }
        .login-container input {
            width: 100%;
            padding: 10px;
            margin-bottom: 18px;
            border: 1px solid #ccc;
            border-radius: 6px;
        }
        .login-container button {
            width: 100%;
            padding: 12px;
            background: #0078d4;
            color: #fff;
            border: none;
            border-radius: 6px;
            font-size: 1rem;
            cursor: pointer;
            transition: background 0.2s;
        }
        .login-container button:hover {
            background: #005fa3;
        }
        .error-message {
            color: #d32f2f;
            font-size: 0.98rem;
            margin-top: 8px;
            text-align: center;
        }
        .success-message {
            color: #388e3c;
            font-size: 0.98rem;
            margin-top: 8px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <h2>Registrierung</h2>
        <?php
        require_once __DIR__ . '/php_auth_bootstrap.php';
        $success = '';
        $error = '';
        $db = null;
        $dbReady = false;

        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $email = trim((string) ($_POST['email'] ?? ''));
            $password = (string) ($_POST['password'] ?? '');
            $agb = isset($_POST['agb']) ? $_POST['agb'] : '';
            $role = azubimatch_normalize_role($_POST['role'] ?? 'student');
            $db = azubimatch_load_db(__DIR__, $error);
            $dbReady = $db instanceof PDO;
            if (strlen($email) < 5 || strlen($password) < 5) {
                $error = 'Bitte gültige Daten eingeben!';
            } elseif (!$agb) {
                $error = 'Bitte bestätigen Sie Nutzungsbedingungen und Datenschutzerklärung!';
            } elseif ($dbReady) {
                try {
                    azubimatch_insert_user($db, $email, password_hash($password, PASSWORD_DEFAULT), $role);
                    $success = 'Registrierung erfolgreich! <a href="anmeldung.php">Jetzt anmelden</a>';
                } catch (PDOException $e) {
                    if ((string) $e->getCode() === '23000') {
                        $error = 'E-Mail bereits registriert!';
                    } else {
                        $error = 'Die Registrierung konnte nicht gespeichert werden.';
                    }
                }
            }
        }
        ?>
        <form method="post" action="">
            <label for="email">E-Mail</label>
            <input type="email" id="email" name="email" required>
            <label for="password">Passwort</label>
            <input type="password" id="password" name="password" required>
            <label for="role">Kontotyp</label>
            <select id="role" name="role" required>
                <option value="student">Bewerbende</option>
                <option value="firm">Unternehmen</option>
            </select>
            <div style="margin-bottom:16px;">
                <input type="checkbox" id="agb" name="agb" value="1" required>
                <label for="agb" style="display:inline;font-weight:400;">
                    Ich akzeptiere die <a href="nutzungsbedingungen.html" target="_blank">Nutzungsbedingungen</a> und habe die <a href="datenschutzerklaerung.html" target="_blank">Datenschutzerklärung</a> gelesen
                </label>
            </div>
            <button type="submit">Registrieren</button>
            <?php if ($error): ?>
                <div class="error-message"><?php echo htmlspecialchars($error, ENT_QUOTES, 'UTF-8'); ?></div>
            <?php endif; ?>
            <?php if ($success): ?>
                <div class="success-message"><?php echo $success; ?></div>
            <?php endif; ?>
        </form>
    </div>
    <script src="privacy-settings.js"></script>
</body>
</html>

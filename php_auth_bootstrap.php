<?php

function azubimatch_find_init_db_path($startDir) {
    $current = $startDir;
    for ($level = 0; $level < 6; $level++) {
        $candidate = $current . DIRECTORY_SEPARATOR . 'init_db.php';
        if (is_file($candidate)) {
            return $candidate;
        }

        $parent = dirname($current);
        if ($parent === $current) {
            break;
        }
        $current = $parent;
    }

    return null;
}

function azubimatch_load_db($startDir, &$errorMessage = '') {
    $bootstrapPath = azubimatch_find_init_db_path($startDir);
    if (!$bootstrapPath) {
        $errorMessage = 'Die Datenbank-Konfiguration fehlt. Bitte init_db.php anlegen.';
        return null;
    }

    $db = null;
    try {
        require $bootstrapPath;
    } catch (Throwable $exception) {
        $errorMessage = 'Die Datenbank-Verbindung konnte nicht initialisiert werden.';
        return null;
    }

    if (!isset($db) || !($db instanceof PDO)) {
        $errorMessage = 'Die Datenbank-Verbindung konnte nicht initialisiert werden.';
        return null;
    }

    return $db;
}

function azubimatch_detect_db_driver(PDO $db) {
    try {
        $driver = $db->getAttribute(PDO::ATTR_DRIVER_NAME);
        return is_string($driver) ? strtolower($driver) : 'mysql';
    } catch (Throwable $exception) {
        return 'mysql';
    }
}

function azubimatch_users_table_has_column(PDO $db, $columnName) {
    try {
        $driver = azubimatch_detect_db_driver($db);
        if ($driver === 'pgsql') {
            $statement = $db->prepare("SELECT column_name FROM information_schema.columns WHERE table_catalog = current_database() AND table_schema = current_schema() AND table_name = 'users' AND column_name = ? LIMIT 1");
        } else {
            $statement = $db->prepare("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = ? LIMIT 1");
        }
        $statement->execute([$columnName]);
        return (bool) $statement->fetch(PDO::FETCH_ASSOC);
    } catch (Throwable $exception) {
        return false;
    }
}

function azubimatch_detect_role_column(PDO $db) {
    $candidates = ['role', 'user_role', 'account_type', 'user_type', 'portal_role'];
    foreach ($candidates as $candidate) {
        if (azubimatch_users_table_has_column($db, $candidate)) {
            return $candidate;
        }
    }
    return null;
}

function azubimatch_detect_firm_flag_column(PDO $db) {
    $candidates = ['is_firm', 'is_company', 'company_account'];
    foreach ($candidates as $candidate) {
        if (azubimatch_users_table_has_column($db, $candidate)) {
            return $candidate;
        }
    }
    return null;
}

function azubimatch_normalize_role($value) {
    $normalized = strtolower(trim((string) $value));
    if ($normalized === '') {
        return 'student';
    }

    $firmRoles = ['firm', 'firma', 'company', 'unternehmen', 'betrieb', 'employer'];
    if (in_array($normalized, $firmRoles, true)) {
        return 'firm';
    }

    return 'student';
}

function azubimatch_resolve_user_role(array $userRow) {
    foreach (['role', 'user_role', 'account_type', 'user_type', 'portal_role'] as $column) {
        if (array_key_exists($column, $userRow) && trim((string) $userRow[$column]) !== '') {
            return azubimatch_normalize_role($userRow[$column]);
        }
    }

    foreach (['is_firm', 'is_company', 'company_account'] as $column) {
        if (!empty($userRow[$column])) {
            return 'firm';
        }
    }

    return 'student';
}

function azubimatch_profile_redirect_for_role($role) {
    return azubimatch_normalize_role($role) === 'firm' ? 'firma_profil.html' : 'bewerber_profil.html';
}

function azubimatch_user_display_name(array $userRow) {
    foreach (['name', 'full_name', 'display_name', 'username', 'first_name'] as $column) {
        if (array_key_exists($column, $userRow) && trim((string) $userRow[$column]) !== '') {
            return trim((string) $userRow[$column]);
        }
    }

    $email = trim((string) ($userRow['email'] ?? ''));
    if ($email !== '' && strpos($email, '@') !== false) {
        return strstr($email, '@', true);
    }

    return 'AzubiMatch';
}

function azubimatch_build_frontend_auth_payload(array $userRow, $role) {
    $userId = trim((string) ($userRow['id'] ?? ''));
    $email = trim((string) ($userRow['email'] ?? ''));
    $name = azubimatch_user_display_name($userRow);

    return [
        'id' => $userId !== '' ? $userId : $email,
        'name' => $name,
        'email' => $email,
        'role' => azubimatch_normalize_role($role),
        'loggedInAt' => gmdate('c'),
    ];
}

function azubimatch_render_login_bridge(array $userRow, $role) {
    $normalizedRole = azubimatch_normalize_role($role);
    $authPayload = azubimatch_build_frontend_auth_payload($userRow, $normalizedRole);
    $redirectTarget = azubimatch_profile_redirect_for_role($normalizedRole);
    $jsonFlags = JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT;
    $authJson = json_encode($authPayload, $jsonFlags);
    $redirectJson = json_encode($redirectTarget, $jsonFlags);
    $roleJson = json_encode($normalizedRole, $jsonFlags);

    if (!is_string($authJson) || !is_string($redirectJson) || !is_string($roleJson)) {
        header('Location: ' . $redirectTarget);
        exit();
    }

    echo '<!DOCTYPE html>';
    echo '<html lang="de"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">';
    echo '<title>AzubiMatch – Anmeldung wird abgeschlossen</title>';
    echo '<meta http-equiv="refresh" content="3;url=' . htmlspecialchars($redirectTarget, ENT_QUOTES, 'UTF-8') . '">';
    echo '<link rel="stylesheet" href="style.css">';
    echo '<script src="privacy-settings.js"></script>';
    echo '</head><body class="auth-page startseite-page auth-landing-page">';
    echo '<main class="auth-main"><section class="auth-panel-surface"><div class="auth-panel-copy">';
    echo '<span class="index-kicker">Login erfolgreich</span>';
    echo '<h1 class="auth-panel-title">Profil wird vorbereitet</h1>';
    echo '<p class="auth-panel-text">Deine Browser-Session wird mit dem Portal synchronisiert. Du wirst direkt weitergeleitet.</p>';
    echo '</div></section></main>';
    echo '<script>';
    echo '(function(){';
    echo 'const auth=' . $authJson . ';';
    echo 'const redirectTarget=' . $redirectJson . ';';
    echo 'const role=' . $roleJson . ';';
    echo 'const studentAuthKey="azubimatch_student_auth";';
    echo 'const firmAuthKey="azubimatch_firm_auth";';
    echo 'const activeStudentKey="azubimatch_active_student_id";';
    echo 'const studentsKey="azubimatch_students";';
    echo 'const offersKey="azubimatch_offers";';
    echo 'const ttlMs=1000*60*60*24*7;';
    echo 'function safeParse(raw,fallback){try{return raw?JSON.parse(raw):fallback;}catch(e){return fallback;}}';
    echo 'function readAuth(key){if(window.AzubiMatchPrivacy&&typeof window.AzubiMatchPrivacy.readAuthSession==="function"){return window.AzubiMatchPrivacy.readAuthSession(key);} return safeParse(localStorage.getItem(key),null);}';
    echo 'function writeAuth(key,value){if(window.AzubiMatchPrivacy&&typeof window.AzubiMatchPrivacy.writeAuthSession==="function"){window.AzubiMatchPrivacy.writeAuthSession(key,value);return;} localStorage.setItem(key,JSON.stringify(value));}';
    echo 'function buildSession(record){const loggedInAt=record&&record.loggedInAt?new Date(record.loggedInAt).getTime():Date.now();const start=Number.isFinite(loggedInAt)&&loggedInAt>0?loggedInAt:Date.now();return Object.assign({},record,{loggedInAt:new Date(start).toISOString(),sessionExpiresAt:new Date(start+ttlMs).toISOString()});}';
    echo 'function readList(key){return safeParse(localStorage.getItem(key),[]);}';
    echo 'function writeList(key,value){localStorage.setItem(key,JSON.stringify(value));}';
    echo 'function ensureStudentProfile(){const students=readList(studentsKey);const existing=students.find(function(entry){return (entry&&entry.userId&&String(entry.userId)===String(auth.id))||(entry&&entry.userEmail&&String(entry.userEmail).toLowerCase()===String(auth.email||"").toLowerCase());}); if(existing){if(existing.id){localStorage.setItem(activeStudentKey,String(existing.id));} return;} const generatedId="php-student-"+String(auth.id||auth.email||Date.now()); const profile={id:generatedId,profilCode:generatedId,name:auth.name||auth.email||"Profil",userId:auth.id||generatedId,userEmail:auth.email||"",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),registrierungAbgeschlossen:false,verified:false}; students.push(profile); writeList(studentsKey,students); localStorage.setItem(activeStudentKey,generatedId);}';
    echo 'function ensureFirmProfile(){const offers=readList(offersKey);const existing=offers.find(function(entry){return (entry&&entry.userId&&String(entry.userId)===String(auth.id))||(entry&&entry.userEmail&&String(entry.userEmail).toLowerCase()===String(auth.email||"").toLowerCase())||(entry&&entry.email&&String(entry.email).toLowerCase()===String(auth.email||"").toLowerCase());}); if(existing){return;} const generatedId="php-firm-"+String(auth.id||auth.email||Date.now()); offers.push({id:generatedId,firma:auth.name||auth.email||"Firma",userId:auth.id||generatedId,userEmail:auth.email||"",email:auth.email||"",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),verified:false}); writeList(offersKey,offers);}';
    echo 'const session=buildSession(auth);';
    echo 'if(role==="firm"){writeAuth(firmAuthKey,session); ensureFirmProfile();}else{writeAuth(studentAuthKey,session); ensureStudentProfile();}';
    echo 'window.location.replace(redirectTarget);';
    echo '})();';
    echo '</script>';
    echo '<noscript><p style="padding:1rem;text-align:center;">JavaScript wird für die Portalsitzung benötigt. <a href="' . htmlspecialchars($redirectTarget, ENT_QUOTES, 'UTF-8') . '">Weiter zum Profil</a></p></noscript>';
    echo '</body></html>';
    exit();
}

function azubimatch_insert_user(PDO $db, $email, $passwordHash, $role) {
    $roleColumn = azubimatch_detect_role_column($db);
    if ($roleColumn) {
        $statement = $db->prepare(sprintf('INSERT INTO users (email, password, %s) VALUES (?, ?, ?)', $roleColumn));
        return $statement->execute([$email, $passwordHash, azubimatch_normalize_role($role)]);
    }

    $firmFlagColumn = azubimatch_detect_firm_flag_column($db);
    if ($firmFlagColumn) {
        $statement = $db->prepare(sprintf('INSERT INTO users (email, password, %s) VALUES (?, ?, ?)', $firmFlagColumn));
        return $statement->execute([$email, $passwordHash, azubimatch_normalize_role($role) === 'firm' ? 1 : 0]);
    }

    $statement = $db->prepare('INSERT INTO users (email, password) VALUES (?, ?)');
    return $statement->execute([$email, $passwordHash]);
}
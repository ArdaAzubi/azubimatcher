<?php

$dbDriver = strtolower(trim((string) (getenv('AZUBIMATCH_DB_DRIVER') ?: 'mysql')));
$dbHost = getenv('AZUBIMATCH_DB_HOST') ?: '127.0.0.1';
$dbPort = getenv('AZUBIMATCH_DB_PORT') ?: ($dbDriver === 'pgsql' ? '5432' : '3306');
$dbName = getenv('AZUBIMATCH_DB_NAME') ?: 'azubimatch';
$dbUser = getenv('AZUBIMATCH_DB_USER') ?: 'root';
$dbPassword = getenv('AZUBIMATCH_DB_PASSWORD');
$dbSchema = trim((string) (getenv('AZUBIMATCH_DB_SCHEMA') ?: ''));

if ($dbPassword === false) {
    $dbPassword = '';
}

if (!in_array($dbDriver, ['mysql', 'pgsql'], true)) {
    throw new RuntimeException('AZUBIMATCH_DB_DRIVER muss mysql oder pgsql sein.');
}

if ($dbDriver === 'pgsql') {
    $dsn = sprintf('pgsql:host=%s;port=%s;dbname=%s', $dbHost, $dbPort, $dbName);
} else {
    $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $dbHost, $dbPort, $dbName);
}

$dbOptions = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
];

if ($dbDriver === 'mysql') {
    $dbOptions[PDO::ATTR_EMULATE_PREPARES] = false;
}

$db = new PDO($dsn, $dbUser, $dbPassword, $dbOptions);

if ($dbDriver === 'pgsql' && $dbSchema !== '') {
    if (!preg_match('/^[A-Za-z_][A-Za-z0-9_]*$/', $dbSchema)) {
        throw new RuntimeException('AZUBIMATCH_DB_SCHEMA enthaelt ungueltige Zeichen.');
    }

    $db->exec('SET search_path TO "' . str_replace('"', '""', $dbSchema) . '"');
}
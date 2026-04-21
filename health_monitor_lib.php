<?php
declare(strict_types=1);

function azubimatch_health_json_response(int $statusCode, array $payload): void {
  http_response_code($statusCode);
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
  header('Pragma: no-cache');
  header('X-Content-Type-Options: nosniff');
  echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
  exit;
}

function azubimatch_health_header(string $name): string {
  $serverKey = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
  return trim((string) ($_SERVER[$serverKey] ?? ''));
}

function azubimatch_health_encode_header(string $value): string {
  $sanitized = trim(preg_replace('/[\r\n]+/', ' ', $value));
  if ($sanitized === '') {
    return '';
  }

  return '=?UTF-8?B?' . base64_encode($sanitized) . '?=';
}

function azubimatch_health_default_targets(): array {
  return [
    [
      'key' => 'index',
      'label' => 'Startseite',
      'path' => 'index.html',
      'mustContain' => ['AzubiMatch', '<body']
    ],
    [
      'key' => 'home',
      'label' => 'Mehr erfahren',
      'path' => 'home.html',
      'mustContain' => ['AzubiMatch', '<body']
    ],
    [
      'key' => 'bewerber',
      'label' => 'Bewerber-Portal',
      'path' => 'bewerber.html',
      'mustContain' => ['id="studentAuthPanel"', 'id="studentLoginBtn"', '<body']
    ],
    [
      'key' => 'firma',
      'label' => 'Firmen-Portal',
      'path' => 'firma.html',
      'mustContain' => ['id="firmAuthPanel"', 'id="firmLoginBtn"', '<body']
    ],
    [
      'key' => 'admin',
      'label' => 'Admin-Portal',
      'path' => 'admin.html',
      'mustContain' => ['id="adminLoginPanel"', 'Admin Portal', '<body']
    ]
  ];
}

function azubimatch_health_normalize_targets($targets): array {
  $source = is_array($targets) && $targets ? $targets : azubimatch_health_default_targets();
  $normalized = [];

  foreach ($source as $target) {
    if (!is_array($target)) {
      continue;
    }

    $path = trim((string) ($target['path'] ?? $target['url'] ?? ''));
    if ($path === '') {
      continue;
    }

    $needles = [];
    $rawNeedles = $target['mustContain'] ?? [];
    if (is_string($rawNeedles) && $rawNeedles !== '') {
      $rawNeedles = [$rawNeedles];
    }
    if (is_array($rawNeedles)) {
      foreach ($rawNeedles as $needle) {
        $value = trim((string) $needle);
        if ($value !== '') {
          $needles[] = $value;
        }
      }
    }

    $normalized[] = [
      'key' => trim((string) ($target['key'] ?? $path)) ?: $path,
      'label' => trim((string) ($target['label'] ?? $path)) ?: $path,
      'path' => $path,
      'mustContain' => $needles
    ];
  }

  return $normalized ?: azubimatch_health_default_targets();
}

function azubimatch_health_load_config(): array {
  $config = [
    'apiKey' => '',
    'baseUrl' => '',
    'alertEmail' => '',
    'alertName' => 'AzubiMatch Admin',
    'fromEmail' => 'info@azubimatcher.com',
    'fromName' => 'AzubiMatch Monitor',
    'requestTimeoutSeconds' => 15,
    'alertThreshold' => 2,
    'notifyCooldownSeconds' => 6 * 60 * 60,
    'stateFile' => __DIR__ . '/test-results/health-monitor-state.json',
    'lastReportFile' => __DIR__ . '/test-results/health-monitor-last-run.json',
    'targets' => azubimatch_health_default_targets()
  ];

  $configPath = __DIR__ . '/health_monitor_config.php';
  if (is_file($configPath)) {
    $loaded = require $configPath;
    if (is_array($loaded)) {
      $config = array_merge($config, $loaded);
    }
  }

  $environmentMap = [
    'apiKey' => 'AZUBIMATCH_HEALTH_MONITOR_API_KEY',
    'baseUrl' => 'AZUBIMATCH_MONITOR_BASE_URL',
    'alertEmail' => 'AZUBIMATCH_HEALTH_MONITOR_ALERT_EMAIL',
    'alertName' => 'AZUBIMATCH_HEALTH_MONITOR_ALERT_NAME',
    'fromEmail' => 'AZUBIMATCH_MAIL_FROM_EMAIL',
    'fromName' => 'AZUBIMATCH_MAIL_FROM_NAME',
    'requestTimeoutSeconds' => 'AZUBIMATCH_HEALTH_MONITOR_TIMEOUT',
    'alertThreshold' => 'AZUBIMATCH_HEALTH_MONITOR_ALERT_THRESHOLD',
    'notifyCooldownSeconds' => 'AZUBIMATCH_HEALTH_MONITOR_NOTIFY_COOLDOWN'
  ];

  foreach ($environmentMap as $key => $envName) {
    $value = getenv($envName);
    if ($value !== false && $value !== '') {
      $config[$key] = $value;
    }
  }

  $config['baseUrl'] = rtrim(trim((string) ($config['baseUrl'] ?? '')), '/');
  $config['alertEmail'] = trim((string) ($config['alertEmail'] ?? ''));
  $config['alertName'] = trim((string) ($config['alertName'] ?? 'AzubiMatch Admin')) ?: 'AzubiMatch Admin';
  $config['fromEmail'] = trim((string) ($config['fromEmail'] ?? 'info@azubimatcher.com')) ?: 'info@azubimatcher.com';
  $config['fromName'] = trim((string) ($config['fromName'] ?? 'AzubiMatch Monitor')) ?: 'AzubiMatch Monitor';
  $config['requestTimeoutSeconds'] = max(3, (int) ($config['requestTimeoutSeconds'] ?? 15));
  $config['alertThreshold'] = max(1, (int) ($config['alertThreshold'] ?? 2));
  $config['notifyCooldownSeconds'] = max(300, (int) ($config['notifyCooldownSeconds'] ?? 21600));
  $config['stateFile'] = trim((string) ($config['stateFile'] ?? '')) ?: (__DIR__ . '/test-results/health-monitor-state.json');
  $config['lastReportFile'] = trim((string) ($config['lastReportFile'] ?? '')) ?: (__DIR__ . '/test-results/health-monitor-last-run.json');
  $config['targets'] = azubimatch_health_normalize_targets($config['targets'] ?? []);

  return $config;
}

function azubimatch_health_detect_base_url(array $config): string {
  $explicit = trim((string) ($config['baseUrl'] ?? ''));
  if ($explicit !== '') {
    return rtrim($explicit, '/');
  }

  $host = trim((string) ($_SERVER['HTTP_HOST'] ?? ''));
  if ($host === '') {
    return '';
  }

  $https = strtolower((string) ($_SERVER['HTTPS'] ?? ''));
  $scheme = ($https === 'on' || $https === '1') ? 'https' : 'http';
  return $scheme . '://' . $host;
}

function azubimatch_health_build_target_url(string $baseUrl, string $path): string {
  if (preg_match('/^https?:\/\//i', $path)) {
    return $path;
  }

  if ($baseUrl === '') {
    return $path;
  }

  return rtrim($baseUrl, '/') . '/' . ltrim($path, '/');
}

function azubimatch_health_fetch_url(string $url, int $timeoutSeconds): array {
  if (function_exists('curl_init')) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_FOLLOWLOCATION => true,
      CURLOPT_MAXREDIRS => 3,
      CURLOPT_CONNECTTIMEOUT => $timeoutSeconds,
      CURLOPT_TIMEOUT => $timeoutSeconds,
      CURLOPT_USERAGENT => 'AzubiMatchHealthMonitor/1.0',
      CURLOPT_HTTPHEADER => ['Accept: text/html,application/json;q=0.9,*/*;q=0.8']
    ]);
    $body = curl_exec($ch);
    $statusCode = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    return [
      'ok' => $body !== false && $error === '',
      'statusCode' => $statusCode,
      'body' => is_string($body) ? $body : '',
      'error' => $error !== '' ? $error : null
    ];
  }

  $context = stream_context_create([
    'http' => [
      'method' => 'GET',
      'timeout' => $timeoutSeconds,
      'ignore_errors' => true,
      'header' => "Accept: text/html,application/json;q=0.9,*/*;q=0.8\r\nUser-Agent: AzubiMatchHealthMonitor/1.0\r\n"
    ]
  ]);
  $body = @file_get_contents($url, false, $context);
  $headers = $http_response_header ?? [];
  $statusCode = 0;
  if ($headers) {
    $first = (string) ($headers[0] ?? '');
    if (preg_match('/\s(\d{3})\s/', $first, $matches)) {
      $statusCode = (int) $matches[1];
    }
  }

  return [
    'ok' => $body !== false,
    'statusCode' => $statusCode,
    'body' => is_string($body) ? $body : '',
    'error' => $body === false ? 'Abruf fehlgeschlagen.' : null
  ];
}

function azubimatch_health_try_local_file_fallback(string $path): ?array {
  if (PHP_SAPI !== 'cli-server') {
    return null;
  }

  if (preg_match('/^https?:\/\//i', $path)) {
    return null;
  }

  $normalizedPath = ltrim($path, '/');
  if ($normalizedPath === '' || str_contains($normalizedPath, '..')) {
    return null;
  }

  $filePath = __DIR__ . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $normalizedPath);
  if (!is_file($filePath)) {
    return null;
  }

  $body = @file_get_contents($filePath);
  if ($body === false) {
    return null;
  }

  return [
    'ok' => true,
    'statusCode' => 200,
    'body' => $body,
    'error' => null
  ];
}

function azubimatch_health_body_contains_any(string $body, array $needles): bool {
  if (!$needles) {
    return true;
  }

  foreach ($needles as $needle) {
    if ($needle !== '' && stripos($body, $needle) !== false) {
      return true;
    }
  }

  return false;
}

function azubimatch_health_run_checks(array $config): array {
  $baseUrl = azubimatch_health_detect_base_url($config);
  $targets = [];
  $failures = [];

  if ($baseUrl === '' && PHP_SAPI === 'cli') {
    $failures[] = [
      'key' => 'base-url',
      'label' => 'Basis-URL',
      'url' => '',
      'kind' => 'config',
      'message' => 'Fuer CLI-Ausfuehrungen fehlt AZUBIMATCH_MONITOR_BASE_URL oder health_monitor_config.php::baseUrl.'
    ];
  }

  foreach ($config['targets'] as $target) {
    $url = azubimatch_health_build_target_url($baseUrl, (string) $target['path']);
    $response = azubimatch_health_try_local_file_fallback((string) $target['path'])
      ?? azubimatch_health_fetch_url($url, (int) $config['requestTimeoutSeconds']);
    $entry = [
      'key' => (string) $target['key'],
      'label' => (string) $target['label'],
      'url' => $url,
      'status' => 'ok',
      'statusCode' => (int) ($response['statusCode'] ?? 0),
      'message' => 'OK'
    ];

    if (!$response['ok']) {
      $entry['status'] = 'error';
      $entry['message'] = (string) ($response['error'] ?? 'Abruf fehlgeschlagen.');
      $failures[] = [
        'key' => $entry['key'],
        'label' => $entry['label'],
        'url' => $url,
        'kind' => 'network',
        'message' => $entry['message']
      ];
    } elseif ($entry['statusCode'] < 200 || $entry['statusCode'] >= 400) {
      $entry['status'] = 'error';
      $entry['message'] = 'HTTP ' . $entry['statusCode'];
      $failures[] = [
        'key' => $entry['key'],
        'label' => $entry['label'],
        'url' => $url,
        'kind' => 'http',
        'message' => $entry['message']
      ];
    } elseif (strlen((string) ($response['body'] ?? '')) < 120) {
      $entry['status'] = 'error';
      $entry['message'] = 'Antwort war leer oder unvollstaendig.';
      $failures[] = [
        'key' => $entry['key'],
        'label' => $entry['label'],
        'url' => $url,
        'kind' => 'content-length',
        'message' => $entry['message']
      ];
    } elseif (!azubimatch_health_body_contains_any((string) ($response['body'] ?? ''), (array) ($target['mustContain'] ?? []))) {
      $entry['status'] = 'error';
      $entry['message'] = 'Erwarteter Seiteninhalt fehlt.';
      $failures[] = [
        'key' => $entry['key'],
        'label' => $entry['label'],
        'url' => $url,
        'kind' => 'content-check',
        'message' => $entry['message']
      ];
    }

    $targets[] = $entry;
  }

  return [
    'ok' => !$failures,
    'checkedAt' => gmdate('c'),
    'baseUrl' => $baseUrl,
    'summary' => [
      'total' => count($targets),
      'failed' => count($failures),
      'passed' => max(0, count($targets) - count($failures))
    ],
    'targets' => $targets,
    'failures' => $failures
  ];
}

function azubimatch_health_load_state(array $config): array {
  $default = [
    'lastRunAt' => '',
    'lastOkAt' => '',
    'lastFailureAt' => '',
    'lastFailureSignature' => '',
    'consecutiveFailureCount' => 0,
    'lastNotifiedAt' => '',
    'lastNotifiedSignature' => ''
  ];

  $stateFile = (string) ($config['stateFile'] ?? '');
  if ($stateFile === '' || !is_file($stateFile)) {
    return $default;
  }

  $decoded = json_decode((string) file_get_contents($stateFile), true);
  return is_array($decoded) ? array_merge($default, $decoded) : $default;
}

function azubimatch_health_save_json_file(string $path, array $payload): void {
  $directory = dirname($path);
  if (!is_dir($directory)) {
    @mkdir($directory, 0775, true);
  }
  @file_put_contents($path, json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT));
}

function azubimatch_health_failure_signature(array $failures): string {
  $parts = [];
  foreach ($failures as $failure) {
    $parts[] = implode(':', [
      (string) ($failure['key'] ?? ''),
      (string) ($failure['kind'] ?? ''),
      (string) ($failure['message'] ?? '')
    ]);
  }
  return implode('|', $parts);
}

function azubimatch_health_send_mail(array $config, string $subject, string $text): bool {
  $to = trim((string) ($config['alertEmail'] ?? ''));
  if ($to === '') {
    return false;
  }

  $fromEmail = trim((string) ($config['fromEmail'] ?? ''));
  $fromName = trim((string) ($config['fromName'] ?? 'AzubiMatch Monitor')) ?: 'AzubiMatch Monitor';
  $fromHeader = $fromEmail;
  if ($fromEmail !== '' && $fromName !== '') {
    $fromHeader = azubimatch_health_encode_header($fromName) . ' <' . $fromEmail . '>';
  }

  if ($fromEmail !== '') {
    @ini_set('sendmail_from', $fromEmail);
  }

  $headers = ['Content-Type: text/plain; charset=UTF-8'];
  if ($fromHeader !== '') {
    $headers[] = 'From: ' . $fromHeader;
    $headers[] = 'Reply-To: ' . $fromHeader;
  }

  return @mail(
    $to,
    azubimatch_health_encode_header($subject),
    $text,
    implode("\r\n", $headers)
  );
}

function azubimatch_health_build_alert_text(array $config, array $result, array $state): string {
  $lines = [
    'Der serverseitige AzubiMatch-Health-Check hat wiederholt Probleme erkannt.',
    '',
    'Basis-URL: ' . ((string) ($result['baseUrl'] ?? 'unbekannt')),
    'Zeitpunkt: ' . ((string) ($result['checkedAt'] ?? gmdate('c'))),
    'Wiederholungen: ' . (string) ((int) ($state['consecutiveFailureCount'] ?? 0)),
    ''
  ];

  foreach ((array) ($result['failures'] ?? []) as $failure) {
    $lines[] = '- ' . (string) ($failure['label'] ?? $failure['key'] ?? 'Bereich') . ': ' . (string) ($failure['message'] ?? 'Fehler');
    $lines[] = '  URL: ' . (string) ($failure['url'] ?? '-');
  }

  $baseUrl = trim((string) ($result['baseUrl'] ?? ''));
  if ($baseUrl !== '') {
    $lines[] = '';
    $lines[] = 'Oeffentlicher Uptime-Endpunkt: ' . rtrim($baseUrl, '/') . '/healthz.php';
    $lines[] = 'Tiefer Server-Check: ' . rtrim($baseUrl, '/') . '/health_monitor.php';
  }

  return implode("\n", $lines);
}

function azubimatch_health_build_resolved_text(array $result): string {
  $baseUrl = trim((string) ($result['baseUrl'] ?? ''));
  $lines = [
    'Der serverseitige AzubiMatch-Health-Check meldet die Website wieder als stabil.',
    '',
    'Basis-URL: ' . ($baseUrl !== '' ? $baseUrl : 'unbekannt'),
    'Zeitpunkt: ' . ((string) ($result['checkedAt'] ?? gmdate('c'))),
    'Gepruefte Ziele: ' . (string) ((int) (($result['summary']['total'] ?? 0))),
    'Fehler: 0'
  ];

  if ($baseUrl !== '') {
    $lines[] = '';
    $lines[] = 'Uptime-Endpunkt: ' . rtrim($baseUrl, '/') . '/healthz.php';
  }

  return implode("\n", $lines);
}

function azubimatch_health_process_run(array $config, array $result): array {
  $state = azubimatch_health_load_state($config);
  $now = gmdate('c');
  $alertTriggered = false;
  $resolvedTriggered = false;
  $signature = $result['ok'] ? 'ok' : azubimatch_health_failure_signature((array) ($result['failures'] ?? []));

  if ($result['ok']) {
    $hadNotifiedFailure = !empty($state['lastNotifiedSignature']) && !empty($state['lastFailureSignature'])
      && $state['lastNotifiedSignature'] === $state['lastFailureSignature'];
    if ($hadNotifiedFailure) {
      $resolvedTriggered = azubimatch_health_send_mail(
        $config,
        'AzubiMatch Monitoring: Website wieder stabil',
        azubimatch_health_build_resolved_text($result)
      );
    }

    $state['lastOkAt'] = $now;
    $state['lastFailureSignature'] = '';
    $state['consecutiveFailureCount'] = 0;
    $state['lastNotifiedSignature'] = '';
  } else {
    $state['consecutiveFailureCount'] = $state['lastFailureSignature'] === $signature
      ? ((int) ($state['consecutiveFailureCount'] ?? 0) + 1)
      : 1;
    $state['lastFailureSignature'] = $signature;
    $state['lastFailureAt'] = $now;

    $lastNotifiedAt = !empty($state['lastNotifiedAt']) ? strtotime((string) $state['lastNotifiedAt']) : 0;
    $canNotify = ((int) ($state['consecutiveFailureCount'] ?? 0) >= (int) $config['alertThreshold'])
      && ($lastNotifiedAt === 0
        || (time() - $lastNotifiedAt) >= (int) $config['notifyCooldownSeconds']
        || (string) ($state['lastNotifiedSignature'] ?? '') !== $signature);

    if ($canNotify) {
      $alertTriggered = azubimatch_health_send_mail(
        $config,
        'AzubiMatch Monitoring: Wiederholter Serverfehler',
        azubimatch_health_build_alert_text($config, $result, $state)
      );
      if ($alertTriggered) {
        $state['lastNotifiedAt'] = $now;
        $state['lastNotifiedSignature'] = $signature;
      }
    }
  }

  $state['lastRunAt'] = $now;
  $state['lastResultOk'] = (bool) $result['ok'];

  azubimatch_health_save_json_file((string) $config['stateFile'], $state);
  azubimatch_health_save_json_file((string) $config['lastReportFile'], [
    'result' => $result,
    'state' => $state,
    'alertTriggered' => $alertTriggered,
    'resolvedTriggered' => $resolvedTriggered
  ]);

  return [
    'result' => $result,
    'state' => $state,
    'alertTriggered' => $alertTriggered,
    'resolvedTriggered' => $resolvedTriggered
  ];
}

function azubimatch_health_is_authorized(array $config): bool {
  if (PHP_SAPI === 'cli') {
    return true;
  }

  $expectedApiKey = trim((string) ($config['apiKey'] ?? ''));
  if ($expectedApiKey === '') {
    return true;
  }

  $providedApiKey = azubimatch_health_header('X-API-Key');
  if ($providedApiKey === '' && isset($_GET['key'])) {
    $providedApiKey = trim((string) $_GET['key']);
  }

  return $providedApiKey !== '' && hash_equals($expectedApiKey, $providedApiKey);
}
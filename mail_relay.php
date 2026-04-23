<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('X-Content-Type-Options: nosniff');

function azubimatch_mail_relay_json_response(int $statusCode, array $payload): void {
  http_response_code($statusCode);
  echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

function azubimatch_mail_relay_header(string $name): string {
  $serverKey = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
  return trim((string) ($_SERVER[$serverKey] ?? ''));
}

function azubimatch_mail_relay_encode_header(string $value): string {
  $sanitized = trim(preg_replace('/[\r\n]+/', ' ', $value));
  if ($sanitized === '') {
    return '';
  }

  return '=?UTF-8?B?' . base64_encode($sanitized) . '?=';
}

function azubimatch_mail_relay_load_config(): array {
  $config = [
    'apiKey' => '',
    'fromEmail' => 'info@azubimatcher.com',
    'fromName' => 'AzubiMatch'
  ];

  $configPath = __DIR__ . '/mail_relay_config.php';
  if (is_file($configPath)) {
    $loaded = require $configPath;
    if (is_array($loaded)) {
      $config = array_merge($config, $loaded);
    }
  }

  $environmentMap = [
    'apiKey' => 'AZUBIMATCH_MAIL_RELAY_API_KEY',
    'fromEmail' => 'AZUBIMATCH_MAIL_FROM_EMAIL',
    'fromName' => 'AZUBIMATCH_MAIL_FROM_NAME'
  ];

  foreach ($environmentMap as $key => $envName) {
    $value = getenv($envName);
    if ($value !== false && $value !== '') {
      $config[$key] = $value;
    }
  }

  return $config;
}

function azubimatch_mail_relay_is_same_origin_request(): bool {
  if (azubimatch_mail_relay_header('X-Requested-With') !== 'AzubiMatchMailRelay') {
    return false;
  }

  $expectedHost = strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''));
  if ($expectedHost === '') {
    return false;
  }

  foreach (['Origin', 'Referer'] as $headerName) {
    $value = azubimatch_mail_relay_header($headerName);
    if ($value === '') {
      continue;
    }

    $candidateHost = strtolower((string) parse_url($value, PHP_URL_HOST));
    $candidatePort = (string) parse_url($value, PHP_URL_PORT);
    $expectedHostOnly = strtolower((string) parse_url('http://' . $expectedHost, PHP_URL_HOST));
    $expectedPort = (string) parse_url('http://' . $expectedHost, PHP_URL_PORT);

    if ($candidateHost !== '' && $candidateHost === $expectedHostOnly) {
      if ($candidatePort === '' || $expectedPort === '' || $candidatePort === $expectedPort) {
        return true;
      }
    }
  }

  return false;
}

function azubimatch_mail_relay_has_valid_api_key(string $expectedApiKey): bool {
  if ($expectedApiKey === '') {
    return false;
  }

  $providedApiKey = azubimatch_mail_relay_header('X-API-Key');
  if ($providedApiKey === '') {
    return false;
  }

  return hash_equals($expectedApiKey, $providedApiKey);
}

function azubimatch_mail_relay_normalize_payload(array $data): array {
  $recipient = filter_var((string) ($data['to'] ?? ''), FILTER_VALIDATE_EMAIL);
  $subject = trim((string) ($data['subject'] ?? ''));
  $text = trim((string) ($data['text'] ?? ''));
  $html = trim((string) ($data['html'] ?? ''));
  $attachments = [];
  $totalAttachmentBytes = 0;

  if (!$recipient) {
    throw new InvalidArgumentException('Empfängeradresse fehlt.');
  }
  if ($subject === '') {
    throw new InvalidArgumentException('Betreff fehlt.');
  }
  if ($text === '' && $html === '') {
    throw new InvalidArgumentException('Mailinhalt fehlt.');
  }

  $rawAttachments = is_array($data['attachments'] ?? null) ? $data['attachments'] : [];
  foreach ($rawAttachments as $attachment) {
    if (!is_array($attachment)) {
      continue;
    }

    $filename = trim((string) ($attachment['filename'] ?? 'Dokument'));
    $contentType = trim((string) ($attachment['contentType'] ?? 'application/octet-stream'));
    $contentBase64 = preg_replace('/\s+/', '', (string) ($attachment['contentBase64'] ?? ''));
    if ($contentBase64 === '') {
      continue;
    }

    $binary = base64_decode($contentBase64, true);
    if ($binary === false) {
      throw new InvalidArgumentException('Ein Anhang ist nicht gültig base64-kodiert.');
    }

    $totalAttachmentBytes += strlen($binary);
    if ($totalAttachmentBytes > 15 * 1024 * 1024) {
      throw new InvalidArgumentException('Die Gesamtgröße der Anhänge überschreitet 15 MB.');
    }

    $attachments[] = [
      'filename' => $filename !== '' ? $filename : 'Dokument',
      'contentType' => $contentType !== '' ? $contentType : 'application/octet-stream',
      'contentBase64' => $contentBase64
    ];
  }

  return [
    'to' => $recipient,
    'subject' => $subject,
    'text' => $text !== '' ? $text : strip_tags(str_replace(['<br>', '<br/>', '<br />'], "\n", $html)),
    'html' => $html !== '' ? $html : nl2br(htmlspecialchars($text, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')),
    'attachments' => $attachments
  ];
}

function azubimatch_mail_relay_build_message(array $payload): array {
  $lineBreak = "\r\n";
  $mixedBoundary = 'azubimatch-mixed-' . bin2hex(random_bytes(12));
  $alternativeBoundary = 'azubimatch-alt-' . bin2hex(random_bytes(12));

  $body = '--' . $mixedBoundary . $lineBreak;
  $body .= 'Content-Type: multipart/alternative; boundary="' . $alternativeBoundary . '"' . $lineBreak . $lineBreak;

  $body .= '--' . $alternativeBoundary . $lineBreak;
  $body .= 'Content-Type: text/plain; charset=UTF-8' . $lineBreak;
  $body .= 'Content-Transfer-Encoding: base64' . $lineBreak . $lineBreak;
  $body .= chunk_split(base64_encode((string) $payload['text'])) . $lineBreak;

  $body .= '--' . $alternativeBoundary . $lineBreak;
  $body .= 'Content-Type: text/html; charset=UTF-8' . $lineBreak;
  $body .= 'Content-Transfer-Encoding: base64' . $lineBreak . $lineBreak;
  $body .= chunk_split(base64_encode((string) $payload['html'])) . $lineBreak;
  $body .= '--' . $alternativeBoundary . '--' . $lineBreak;

  foreach ($payload['attachments'] as $attachment) {
    $body .= '--' . $mixedBoundary . $lineBreak;
    $body .= 'Content-Type: ' . $attachment['contentType'] . '; name="' . addcslashes($attachment['filename'], '"\\') . '"' . $lineBreak;
    $body .= 'Content-Transfer-Encoding: base64' . $lineBreak;
    $body .= 'Content-Disposition: attachment; filename="' . addcslashes($attachment['filename'], '"\\') . '"' . $lineBreak . $lineBreak;
    $body .= chunk_split($attachment['contentBase64']) . $lineBreak;
  }

  $body .= '--' . $mixedBoundary . '--' . $lineBreak;

  return [
    'boundary' => $mixedBoundary,
    'body' => $body
  ];
}

function azubimatch_mail_relay_send(array $config, array $payload): bool {
  $message = azubimatch_mail_relay_build_message($payload);
  $fromEmail = trim((string) ($config['fromEmail'] ?? ''));
  $fromName = trim((string) ($config['fromName'] ?? 'AzubiMatch'));
  $fromHeader = $fromEmail;

  if ($fromEmail !== '' && $fromName !== '') {
    $fromHeader = azubimatch_mail_relay_encode_header($fromName) . ' <' . $fromEmail . '>';
  }

  if ($fromEmail !== '') {
    @ini_set('sendmail_from', $fromEmail);
  }

  $headers = [
    'MIME-Version: 1.0',
    'Content-Type: multipart/mixed; boundary="' . $message['boundary'] . '"'
  ];
  if ($fromHeader !== '') {
    $headers[] = 'From: ' . $fromHeader;
    $headers[] = 'Reply-To: ' . $fromHeader;
  }
  if ($fromEmail !== '') {
    $headers[] = 'Return-Path: ' . $fromEmail;
  }
  $headers[] = 'X-Mailer: AzubiMatch Mail Relay';

  return @mail(
    (string) $payload['to'],
    azubimatch_mail_relay_encode_header((string) $payload['subject']),
    $message['body'],
    implode("\r\n", $headers)
  );
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
  azubimatch_mail_relay_json_response(405, ['error' => 'Nur POST ist erlaubt.']);
}

$config = azubimatch_mail_relay_load_config();
$expectedApiKey = trim((string) ($config['apiKey'] ?? ''));
$validApiKey = azubimatch_mail_relay_has_valid_api_key($expectedApiKey);

if (!$validApiKey && !azubimatch_mail_relay_is_same_origin_request()) {
  azubimatch_mail_relay_json_response(403, ['error' => 'Same-Origin-Prüfung für den Mail-Relay fehlgeschlagen.']);
}

if ($expectedApiKey !== '') {
  if (!$validApiKey) {
    azubimatch_mail_relay_json_response(403, ['error' => 'Ungültiger API-Schlüssel für den Mail-Relay.']);
  }
}

$rawInput = file_get_contents('php://input');
$decoded = json_decode((string) $rawInput, true);
if (!is_array($decoded)) {
  azubimatch_mail_relay_json_response(400, ['error' => 'Ungültiger JSON-Body.']);
}

try {
  $payload = azubimatch_mail_relay_normalize_payload($decoded);
} catch (InvalidArgumentException $exception) {
  azubimatch_mail_relay_json_response(400, ['error' => $exception->getMessage()]);
}

if (!azubimatch_mail_relay_send($config, $payload)) {
  azubimatch_mail_relay_json_response(502, ['error' => 'Der Servermailer konnte die Nachricht nicht versenden. Prüfen Sie die Mail-Konfiguration des Servers.']);
}

azubimatch_mail_relay_json_response(200, ['success' => true]);
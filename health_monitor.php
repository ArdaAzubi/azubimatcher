<?php
declare(strict_types=1);

require __DIR__ . '/health_monitor_lib.php';

$config = azubimatch_health_load_config();
if (!azubimatch_health_is_authorized($config)) {
  azubimatch_health_json_response(403, ['error' => 'Ungueltiger API-Schluessel fuer den Health-Monitor.']);
}

$result = azubimatch_health_run_checks($config);
$processed = azubimatch_health_process_run($config, $result);

azubimatch_health_json_response($result['ok'] ? 200 : 503, $processed);
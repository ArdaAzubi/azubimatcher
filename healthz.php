<?php
declare(strict_types=1);

require __DIR__ . '/health_monitor_lib.php';

$config = azubimatch_health_load_config();
$result = azubimatch_health_run_checks($config);

azubimatch_health_json_response($result['ok'] ? 200 : 503, $result);
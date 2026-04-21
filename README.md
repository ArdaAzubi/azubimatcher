# AzubiMatch

Statisches Frontend-Projekt fuer AzubiMatch mit HTML-, PHP- und Browser-Storage-basierten Portalablaeufen.

## Standard-Check

Der dokumentierte Standard-Check fuer funktionale Regressionen ist die Browser-Smoke-Suite unter `.tmp_authflows`.

Sie sollte mindestens nach Aenderungen an diesen Bereichen laufen:

- Registrierung und Login
- Passwort-Reset
- Passwort- und Logout-Logik
- Admin-Zugang und Admin-Matching
- Loeschpfade fuer Bewerbende und Firmen
- Privatsphaere-, Cookie- und Session-Verhalten

## Smoke-Suite ausfuehren

1. Lokalen Testserver starten.

```powershell
Set-Location c:\Users\ardao\Desktop\azubi-match
node .tmp_authflows\static_server.mjs
```

2. In einem zweiten Terminal die Smoke-Suite ausfuehren.

```powershell
Set-Location c:\Users\ardao\Desktop\azubi-match\.tmp_authflows
npm install
npm run smoke
```

3. Optional nur die Loeschtests ausfuehren.

```powershell
Set-Location c:\Users\ardao\Desktop\azubi-match\.tmp_authflows
npm run smoke:delete
```

4. Optional den Responsive-/Viewport-Check ausfuehren.

```powershell
Set-Location c:\Users\ardao\Desktop\azubi-match\.tmp_authflows
npm run smoke:viewport
```

Der Viewport-Check prueft oeffentliche Navigation, Admin-Dashboard-Kacheln, Admin-Matching sowie Kurzprofil-/Aktionsflaechen auch bei extremen Seitenverhaeltnissen auf horizontalen Overflow, Umbruch und lesbare Bediengroessen.

5. Optional gezielt die Umkreissuche fuer Bewerber- und Firmenprofil pruefen.

```powershell
Set-Location c:\Users\ardao\Desktop\azubi-match\.tmp_authflows
node radius_search_smoke.mjs
```

Der Umkreis-Smoke validiert die neue Radiusfilterung in beiden Profilen einschliesslich gespeicherter Umkreis-Aenderungen sowie lokaler Geodaten-Distanzen.

## Erwartetes Ergebnis

Ein erfolgreicher Gesamtlauf endet mit:

```text
PASS: Registrierung, Passwort-Reset-, Passwort-/Logout-Flows, Bewerber-Inklusionsangaben, Admin-Matching und Loeschpfade wurden erfolgreich im Browser geprueft.
```

## Hinweise

- Der Standard-Port des lokalen Testservers ist `127.0.0.1:4176`.
- Die Suite verwendet standardmaessig `AUTH_FLOW_BASE=http://127.0.0.1:4176`.
- Falls Chromium lokal noch nicht installiert ist, in `.tmp_authflows` einmalig `npx playwright install chromium` ausfuehren.
- Fuer einen abweichenden Port muessen Testserver und Runner zusammen umgestellt werden.
- Falls PowerShell `npm.ps1` lokal blockiert, die Runner direkt mit `node auth_flows_smoke.mjs`, `node deletion_flows_smoke.mjs`, `node viewport_responsive_smoke.mjs` oder `node radius_search_smoke.mjs` starten.

Beispiel:

```powershell
Set-Location c:\Users\ardao\Desktop\azubi-match
$env:PORT = "4177"
node .tmp_authflows\static_server.mjs
```

```powershell
Set-Location c:\Users\ardao\Desktop\azubi-match\.tmp_authflows
$env:AUTH_FLOW_BASE = "http://127.0.0.1:4177"
npm run smoke
```

## Projektstand

Eine kurze Uebergabe zum aktuellen Datenschutz-, Privatsphaere- und Admin-Stand liegt in `UEBERGABEPROTOKOLL.md`.

## PHP-Setup

Die serverseitigen Dateien `anmeldung.php` und `registrierung.php` erwarten eine lokale Datei `init_db.php`.

Die PDO-Anbindung unterstuetzt jetzt sowohl MySQL/MariaDB als auch PostgreSQL.

Vorgehen:

1. `init_db.php.example` nach `init_db.php` kopieren.
2. `AZUBIMATCH_DB_DRIVER` auf `mysql` oder `pgsql` setzen und die Zugangsdaten eintragen.
3. Fuer PostgreSQL kann das Beispiel-Schema aus [database/postgresql/users.sql](database/postgresql/users.sql) importiert werden.
4. Falls Firmen und Bewerbende serverseitig unterschiedlich weitergeleitet werden sollen, eine Rollen-Spalte im `users`-Schema verwenden.

Wichtige Umgebungsvariablen:

- `AZUBIMATCH_DB_DRIVER` (`mysql` oder `pgsql`)
- `AZUBIMATCH_DB_HOST`
- `AZUBIMATCH_DB_PORT`
- `AZUBIMATCH_DB_NAME`
- `AZUBIMATCH_DB_USER`
- `AZUBIMATCH_DB_PASSWORD`
- `AZUBIMATCH_DB_SCHEMA` (optional fuer PostgreSQL, z. B. `public`)

Die PHP-Loginlogik erkennt derzeit diese Spalten automatisch:

- `role`
- `user_role`
- `account_type`
- `user_type`
- `portal_role`

Alternativ werden auch boolesche Firmen-Flags erkannt:

- `is_firm`
- `is_company`
- `company_account`

Ohne solche Rolleninformation wird nach erfolgreichem Login standardmaessig das Bewerberprofil geoeffnet.

## Lokale PHP- und MariaDB-Testumgebung

Die serverseitigen Tests in diesem Projekt wurden lokal mit PHP und MariaDB auf Windows validiert.

- PHP 8.3: `C:\Users\ardao\AppData\Local\Microsoft\WinGet\Packages\PHP.PHP.8.3_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe`
- MariaDB 12.2: `C:\Program Files\MariaDB 12.2`
- Projektlokale Datenbankdateien: `.mariadb-data`
- Testdatenbank: `azubimatch`
- Lokaler Testserver: `http://127.0.0.1:8091`

Fuer die lokale Datenbankanbindung wird eine `init_db.php` mit passenden Zugangsdaten benoetigt. Das lokale Test-Setup wurde mit dem Passwort aus der Umgebungsvariable `AZUBIMATCH_DB_PASSWORD` gegen MariaDB gestartet.

Beispiel fuer den lokalen PHP-Server:

```powershell
Set-Location c:\Users\ardao\Desktop\azubi-match
$env:AZUBIMATCH_DB_PASSWORD = "root"
& "C:\Users\ardao\AppData\Local\Microsoft\WinGet\Packages\PHP.PHP.8.3_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe" -S 127.0.0.1:8091
```

Beispiel fuer Syntax-Checks aller PHP-Dateien:

```powershell
Set-Location c:\Users\ardao\Desktop\azubi-match
Get-ChildItem -Recurse -Filter *.php | ForEach-Object {
	& "C:\Users\ardao\AppData\Local\Microsoft\WinGet\Packages\PHP.PHP.8.3_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe" -l $_.FullName
}
```

Der PHP-Login schreibt nach erfolgreicher Anmeldung jetzt denselben Browser-Session-Zustand wie das Frontend-Portal. Dadurch bleiben auch serverseitig angemeldete Bewerbende und Firmen auf ihren Profilseiten, statt durch die lokale Storage-Logik direkt wieder ins Portal zurueckzufallen.

### PostgreSQL lokal verwenden

Beispiel fuer ein lokales PostgreSQL-Setup mit Standardport:

```powershell
Set-Location c:\Users\ardao\Desktop\azubi-match
$env:AZUBIMATCH_DB_DRIVER = "pgsql"
$env:AZUBIMATCH_DB_HOST = "127.0.0.1"
$env:AZUBIMATCH_DB_PORT = "5432"
$env:AZUBIMATCH_DB_NAME = "azubimatch"
$env:AZUBIMATCH_DB_USER = "postgres"
$env:AZUBIMATCH_DB_PASSWORD = "change-me"
$env:AZUBIMATCH_DB_SCHEMA = "public"
& "C:\Users\ardao\AppData\Local\Microsoft\WinGet\Packages\PHP.PHP.8.3_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe" -S 127.0.0.1:8091
```

Das `users`-Schema kann davor mit [database/postgresql/users.sql](database/postgresql/users.sql) angelegt werden.

```powershell
psql -h 127.0.0.1 -U postgres -d azubimatch -f .\database\postgresql\users.sql
```

## Mail-Relay für echte Anhänge

Für Dokumentenfreigaben kann die Website jetzt optional einen same-origin Mail-Relay nutzen. Dadurch lassen sich freigegebene Unterlagen serverseitig als echte Mail-Anhänge versenden.

### Lokale PHP-Version

- Endpunkt: `mail_relay.php`
- Optionale Konfiguration: `mail_relay_config.php` auf Basis von `mail_relay_config.php.example`

Wichtige Felder in der Konfiguration:

- `fromEmail`: gültige Absenderadresse Ihrer Domain, standardmäßig `info@azubimatcher.com`
- `fromName`: sichtbarer Absendername
- `apiKey`: optionaler Zusatzschutz für nicht-browserbasierte Aufrufe

Alternativ können diese Werte auch per Umgebungsvariablen gesetzt werden:

- `AZUBIMATCH_MAIL_FROM_EMAIL`
- `AZUBIMATCH_MAIL_FROM_NAME`
- `AZUBIMATCH_MAIL_RELAY_API_KEY`

Der Frontend-Code erkennt den lokalen Relay auf HTML-/PHP-Seiten automatisch. Falls der Servermailer nicht versenden kann, fällt die App für Benachrichtigungen automatisch wieder auf EmailJS oder lokale Vorschau zurück.

### WordPress-Version

Im WordPress-Theme ist zusätzlich eine REST-Route eingebaut:

- `/wp-json/azubimatch/v1/mail-relay`

Sie wird dem Frontend automatisch als Runtime-Konfiguration übergeben. Für den WordPress-Betrieb können dieselben Umgebungsvariablen oder Konstanten genutzt werden:

- `AZUBIMATCH_MAIL_FROM_EMAIL`
- `AZUBIMATCH_MAIL_FROM_NAME`
- `AZUBIMATCH_MAIL_RELAY_API_KEY`

Die WordPress-Route nutzt `wp_mail()` und ergänzt Dateianhänge über PHPMailer, sodass vorhandene SMTP-/Mail-Plugins weiter greifen können.

## 24/7-Monitoring

Fuer echte Rund-um-die-Uhr-Ueberwachung gibt es jetzt zusaetzlich serverseitige Endpunkte fuer Uptime-Dienste und einen tieferen Deep-Check-Runner fuer Cronjobs.

### Lokale PHP-Version

- Oeffentlicher Uptime-Endpunkt: `healthz.php`
- Geschuetzter Deep-Check-Runner: `health_monitor.php`
- Optionale Konfiguration: `health_monitor_config.php` auf Basis von `health_monitor_config.php.example`

Wichtige Konfigurationswerte:

- `baseUrl`: Pflicht fuer CLI-Cronjobs, optional fuer HTTP-Aufrufe
- `apiKey`: optionaler Schutz fuer `health_monitor.php`
- `alertEmail`: Empfaenger fuer Eskalationsmails
- `alertThreshold`: Anzahl gleicher Fehlerlaeufe bis zur Eskalation
- `notifyCooldownSeconds`: Cooldown zwischen erneuten Warnmails

Alternativ koennen diese Werte per Umgebungsvariablen gesetzt werden:

- `AZUBIMATCH_MONITOR_BASE_URL`
- `AZUBIMATCH_HEALTH_MONITOR_API_KEY`
- `AZUBIMATCH_HEALTH_MONITOR_ALERT_EMAIL`
- `AZUBIMATCH_HEALTH_MONITOR_ALERT_NAME`
- `AZUBIMATCH_HEALTH_MONITOR_ALERT_THRESHOLD`
- `AZUBIMATCH_HEALTH_MONITOR_NOTIFY_COOLDOWN`
- `AZUBIMATCH_HEALTH_MONITOR_TIMEOUT`

Beispiele:

```powershell
Invoke-WebRequest http://127.0.0.1:8091/healthz.php | Select-Object -ExpandProperty Content
```

```powershell
Invoke-WebRequest "http://127.0.0.1:8091/health_monitor.php?key=MEIN_KEY" | Select-Object -ExpandProperty Content
```

CLI-Cronbeispiel mit PHP:

```powershell
Set-Location c:\Users\ardao\Desktop\azubi-match
$env:AZUBIMATCH_MONITOR_BASE_URL = "https://a-zu-bio.de"
& "C:\Users\ardao\AppData\Local\Microsoft\WinGet\Packages\PHP.PHP.8.3_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe" .\health_monitor.php
```

Der Deep-Check schreibt den letzten Lauf nach `test-results/health-monitor-last-run.json` und den Zustand nach `test-results/health-monitor-state.json`.

### WordPress-Version

Im WordPress-Theme gibt es jetzt zwei REST-Routen:

- Oeffentlicher Uptime-Endpunkt: `/wp-json/azubimatch/v1/health`
- Geschuetzter Deep-Check-Runner: `/wp-json/azubimatch/v1/health-run`

Fuer die WordPress-Variante koennen diese Konstanten oder Umgebungsvariablen gesetzt werden:

- `AZUBIMATCH_HEALTH_MONITOR_API_KEY`
- `AZUBIMATCH_HEALTH_MONITOR_ALERT_EMAIL`
- `AZUBIMATCH_HEALTH_MONITOR_ALERT_NAME`
- `AZUBIMATCH_HEALTH_MONITOR_ALERT_THRESHOLD`
- `AZUBIMATCH_HEALTH_MONITOR_NOTIFY_COOLDOWN`
- `AZUBIMATCH_HEALTH_MONITOR_TIMEOUT`

Wenn ein API-Key gesetzt ist, erwartet `/wp-json/azubimatch/v1/health-run` entweder den Header `X-API-Key` oder den Query-Parameter `?key=...`.

### Empfehlung fuer den Betrieb

1. Einen externen Uptime-Dienst auf `healthz.php` oder `/wp-json/azubimatch/v1/health` pruefen lassen.
2. Zusaetzlich den Deep-Check-Runner in einem Intervall von 1 bis 3 Stunden aufrufen.
3. Fuer produktive Deploys immer `alertEmail` bzw. `AZUBIMATCH_HEALTH_MONITOR_ALERT_EMAIL` setzen.

### Windows-Jobs im lokalen Setup

Fuer die lokale Windows-Umgebung gibt es ein Registrierungs-Skript fuer zwei geplante Tasks:

- `AzubiMatch Public Health 30m`: ruft alle 30 Minuten den oeffentlichen Endpunkt auf.
- `AzubiMatch Deep Check 1-3h`: prueft stuendlich, ob der naechste zufaellige Deep-Check faellig ist, und fuehrt ihn dann im Abstand von 1 bis 3 Stunden aus.

Beispiel mit den lokalen PHP-Endpunkten:

```powershell
Set-Location c:\Users\ardao\Desktop\azubi-match
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\monitoring\register_monitoring_jobs.ps1
```

Optional koennen beim Registrieren andere Ziel-URLs gesetzt werden, zum Beispiel spaeter die WordPress-Routen:

```powershell
Set-Location c:\Users\ardao\Desktop\azubi-match
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\monitoring\register_monitoring_jobs.ps1 `
	-PublicUrl "https://a-zu-bio.de/wp-json/azubimatch/v1/health" `
	-DeepUrl "https://a-zu-bio.de/wp-json/azubimatch/v1/health-run" `
	-DeepApiKey "MEIN_KEY"
```

Die Job-Logs liegen danach unter `test-results/public-health-job.log`, `test-results/deep-health-job.log` und `test-results/deep-health-job-state.json`.

Die Runner akzeptieren dabei nur echte JSON-Health-Antworten. Eine vorgeschaltete Baustellen- oder Maintenance-Seite mit HTTP 200 gilt bewusst nicht als erfolgreicher Check.
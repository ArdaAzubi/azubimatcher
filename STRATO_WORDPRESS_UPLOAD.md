# Strato WordPress Upload

Diese Vorbereitung erzeugt ein uploadfaehiges Theme-Paket aus den aktuellen AzubiMatch-Seiten.

## Export erzeugen

```powershell
Set-Location c:\Users\ardao\Desktop\azubi-match
node .\tools\build_strato_wordpress_theme.mjs
```

Danach liegt der Export unter `dist\strato-wordpress`.

## Inhalt des Exports

- `dist\strato-wordpress\azubimatch-strato\`: WordPress-Theme fuer Strato
- `dist\strato-wordpress\azubimatch-strato.zip`: uploadfaehiges Theme-ZIP mit dem Theme-Ordner als oberster Ebene
- `dist\strato-wordpress\page-manifest.json`: Liste aller vorbereiteten Seiten, Slugs und Quelldateien
- `dist\strato-wordpress\strato-redirects.htaccess`: optionale Weiterleitungen von alten `.html`-URLs auf WordPress-Permalinks
- `dist\strato-wordpress\azubimatch-strato\legacy-php\`: bisherige PHP-Dateien als Legacy-Beigabe

## Upload in Strato WordPress

1. Entweder das ZIP `dist\strato-wordpress\azubimatch-strato.zip` im WordPress-Backend unter `Design > Themes > Theme hochladen` importieren oder den Theme-Ordner `azubimatch-strato` per FTP nach `wp-content/themes/` hochladen.
2. Im Strato-WordPress-Backend das Theme aktivieren.
3. Fehlende Seiten aus `page-manifest.json` werden nach dem Deploy beim ersten Request automatisch als WordPress-Seiten angelegt.
4. Bestehende Seiten muessen weiterhin exakt die Slugs aus dem Manifest verwenden; nur fehlende Seiten werden automatisch erzeugt.
5. Unter `Einstellungen > Lesen` die Startseite statisch auf die Startseite mit dem Key `index` setzen.

## SFTP-Konfiguration fuer Strato

Fuer diesen Deploy den Upload bitte per SFTP durchfuehren, nicht ueber den WordPress-Theme-Upload. Zielpfad auf dem Server ist:

- `/home/www/public/wp-content/themes/azubimatch-strato`

Lokale Upload-Quelle:

- `dist\strato-wordpress\azubimatch-strato\`

Auf diesem Rechner sind `sftp.exe` und `scp.exe` aus OpenSSH verfuegbar. Fuer normale Deploys diesen SFTP-Weg verwenden. Der WordPress-Theme-Datei-Editor ist nur als Notfallweg fuer kleine Live-Hotfixes gedacht, wenn die Strato-Zugangsdaten lokal gerade nicht vorliegen.

### FileZilla

Im Servermanager einen neuen Eintrag mit diesen Werten anlegen:

| Feld | Wert |
| --- | --- |
| Protokoll | `SFTP - SSH File Transfer Protocol` |
| Host | `<DEIN_STRATO_SFTP_HOST>` |
| Port | `<DEIN_STRATO_SFTP_PORT>` |
| Anmeldetyp | `Normal` |
| Benutzer | `<DEIN_STRATO_SFTP_BENUTZER>` |
| Passwort | `<DEIN_STRATO_SFTP_PASSWORT>` |

Danach remote direkt in diesen Ordner wechseln:

- `/home/www/public/wp-content/themes/`

Und den lokalen Ordner `azubimatch-strato` aus `dist\strato-wordpress\` hochladen oder den vorhandenen Ordner auf dem Server damit aktualisieren.

### WinSCP

Neue Sitzung mit diesen Werten anlegen:

| Feld | Wert |
| --- | --- |
| File protocol | `SFTP` |
| Host name | `<DEIN_STRATO_SFTP_HOST>` |
| Port number | `<DEIN_STRATO_SFTP_PORT>` |
| User name | `<DEIN_STRATO_SFTP_BENUTZER>` |
| Password | `<DEIN_STRATO_SFTP_PASSWORT>` |

Optional unter `Advanced > Environment > Directories` direkt setzen:

- Remote directory: `/home/www/public/wp-content/themes/`
- Local directory: `C:\Users\ardao\Desktop\azubi-match\dist\strato-wordpress\`

### Zugangsdaten in Strato finden

Falls Host, Port oder Benutzername fehlen, diese im Strato-Kundenbereich beim Hosting- beziehungsweise SFTP-Zugang nachsehen. Fuer diesen Workspace wurden bislang nur diese verifizierten Punkte festgehalten:

- Shell-Zugriff war deaktiviert.
- SFTP funktionierte.
- Das Theme-Ziel liegt unter `/home/www/public/wp-content/themes/azubimatch-strato`.

### Nach dem Upload sofort pruefen

1. Ordnerrechte auf `755` setzen.
2. Dateirechte auf `644` setzen.
3. Sicherstellen, dass auf dem Server wirklich `wp-content/themes/azubimatch-strato/` aktualisiert wurde und nicht versehentlich ein zusaetzlicher Unterordner entstanden ist.

## Wichtige Hinweise

- Die HTML-Seiten wurden fuer WordPress-Templates vorbereitet und interne Links werden im Theme auf WordPress-Seiten aufgeloest.
- `script.js` wird im Export fuer WordPress-Routen umgeschrieben, damit Weiterleitungen und Seitenwechsel nicht mehr an festen `.html`-Dateien haengen.
- Das ZIP enthaelt den Theme-Ordner `azubimatch-strato` als oberste Ebene und ist damit direkt fuer den Theme-Upload gedacht.
- Die Dateien in `legacy-php` sind nur als Uebergabe fuer bestehende Sonderfaelle enthalten.
- `anmeldung.php` und `registrierung.php` benoetigen weiterhin eine echte Datenbankanbindung (`init_db.php` ist im aktuellen Projekt nicht enthalten) und sind deshalb nicht als vollstaendige WordPress-Formulare umgebaut.
- Fuer Strato kann die Datei `strato-redirects.htaccess` als Vorlage fuer alte URL-Weiterleitungen genutzt werden.

## Empfohlene WordPress-Seiten

- Startseite: Front Page ueber das Theme (`index`)
- `home`
- `lehrberufe`
- `anmeldung`
- `bewerber`
- `bewerber-profil`
- `firma`
- `firma-profil`
- `firma-schnellprofil`
- `trainings`
- `admin`
- `impressum`
- `datenschutzerklaerung`
- `nutzungsbedingungen`

## Gepruefte Seiten-Slug-Matrix

Der Abgleich gegen `dist\strato-wordpress\page-manifest.json` ist fuer den aktuellen Export erfolgt. Diese Slugs muessen in WordPress exakt so angelegt werden:

| Key | WordPress-Slug | Quelle | Hinweis |
| --- | --- | --- | --- |
| `index` | leer / Startseite | `index.html` | als statische Front Page setzen |
| `home` | `home` | `home.html` | normale WordPress-Seite |
| `lehrberufe` | `lehrberufe` | `lehrberufe.html` | normale WordPress-Seite |
| `anmeldung` | `anmeldung` | `anmeldung.html` | normale WordPress-Seite |
| `bewerber` | `bewerber` | `bewerber.html` | normale WordPress-Seite |
| `bewerber_profil` | `bewerber-profil` | `bewerber_profil.html` | normale WordPress-Seite |
| `bewerber_praktikum` | `bewerber-praktikum` | `bewerber_praktikum.html` | normale WordPress-Seite |
| `firma` | `firma` | `firma.html` | normale WordPress-Seite |
| `firma_profil` | `firma-profil` | `firma_profil.html` | normale WordPress-Seite |
| `firma_praktikum` | `firma-praktikum` | `firma_praktikum.html` | normale WordPress-Seite |
| `firma_schnellprofil` | `firma-schnellprofil` | `firma_schnellprofil.html` | normale WordPress-Seite |
| `trainings` | `trainings` | `trainings.html` | normale WordPress-Seite |
| `admin` | `admin` | `admin.html` | normale WordPress-Seite |
| `impressum` | `impressum` | `impressum.html` | normale WordPress-Seite |
| `datenschutzerklaerung` | `datenschutzerklaerung` | `datenschutzerklaerung.html` | normale WordPress-Seite |
| `nutzungsbedingungen` | `nutzungsbedingungen` | `nutzungsbedingungen.html` | normale WordPress-Seite |

Praktische Kontrolle im Backend: Wenn ein vorhandener Slug abweicht, funktionieren die durch das Theme umgeschriebenen internen Routen nicht mehr sauber. Fehlende Seiten legt das Theme seit dem aktuellen Stand beim ersten Request automatisch an.

Hinweis zum Admin-Bereich: Die fruehere separate Nutzerverwaltung wurde in `admin.html` integriert und ist dort jetzt direkt als eigener Admin-Tab verfuegbar.

## Nach dem Upload pruefen

1. Startseite, Home, Lehrberufe und Anmeldung oeffnen.
2. Bewerber- und Firmenpfade inklusive Profilseiten testen.
3. Datenschutz-/Nutzungsseiten pruefen.
4. Responsive Viewport-Check im lokalen Projekt weiter nutzen, bevor neue Theme-Exporte gebaut werden.

## Konkrete Test-URLs fuer a-zu-bio.de

Sobald das WordPress-Theme auf der Ziel-Domain aktiv ist, koennen diese direkten Test-URLs verwendet werden:

- Startseite: `https://a-zu-bio.de/`
- Anmeldung: `https://a-zu-bio.de/anmeldung/`
- Bewerberprofil: `https://a-zu-bio.de/bewerber-profil/`
- Firmenprofil: `https://a-zu-bio.de/firma-profil/`
- Mail-Relay-Route: `https://a-zu-bio.de/wp-json/azubimatch/v1/mail-relay`

Hinweis: Aktuell liefert `https://a-zu-bio.de/` noch eine Baustellenseite. Die Test-URLs sind fuer den Zustand nach dem WordPress-Deploy gedacht.

## Checkliste fuer den Live-Test auf Strato

Nach dem Theme-Deploy und der WordPress-Aktivierung diese Punkte in genau dieser Reihenfolge pruefen:

1. `https://a-zu-bio.de/` aufrufen und sicherstellen, dass nicht mehr die Baustellenseite, sondern die AzubiMatch-Startseite erscheint.
2. `https://a-zu-bio.de/anmeldung/` oeffnen und pruefen, ob CSS, JavaScript und Navigation ohne 403/404 laden.
3. Im Browser DevTools oeffnen und auf einer Portal-Seite kontrollieren, ob `window.AzubiMatchRuntime.mailRelayEndpoint` auf `/wp-json/azubimatch/v1/mail-relay` zeigt.
4. `https://a-zu-bio.de/wp-json/azubimatch/v1/mail-relay` nicht direkt im Browser beurteilen, sondern nur ueber die Website selbst testen; ein direkter Aufruf ohne POST ist kein valider Funktionstest.
5. Einen echten Dokumentenfreigabe-Flow in AzubiMatch ausloesen und pruefen, ob im UI nicht mehr `emailjs-without-attachments`, sondern `smtp-attachments` erreicht wird.
6. Beim Empfaenger kontrollieren, ob die Mail von `info@azubimatcher.com` kommt.
7. Beim Empfaenger kontrollieren, ob die Dokumente wirklich als Anhaenge an der Mail haengen.
8. Falls der Versand fehlschlaegt, zuerst die Server-Mailfunktion bzw. das WordPress-Mail-Plugin pruefen und danach die Relay-Konfiguration fuer `AZUBIMATCH_MAIL_FROM_EMAIL`, `AZUBIMATCH_MAIL_FROM_NAME` und optional `AZUBIMATCH_MAIL_RELAY_API_KEY`.

### Schneller Browser-Check in DevTools

Auf einer geladenen Portal-Seite in der Konsole:

```js
window.AzubiMatchRuntime
```

Erwartet wird mindestens:

```js
{ mailRelayEndpoint: "https://a-zu-bio.de/wp-json/azubimatch/v1/mail-relay" }
```

### Copy-Paste-Test fuer den Relay-POST in DevTools

Diesen Test nur nach dem echten WordPress-Deploy auf `a-zu-bio.de` ausfuehren.

In den DevTools auf einer geladenen Portal-Seite einfuegen:

```js
fetch(window.AzubiMatchRuntime.mailRelayEndpoint, {
	method: "POST",
	headers: {
		"Content-Type": "application/json",
		"Accept": "application/json",
		"X-Requested-With": "AzubiMatchMailRelay"
	},
	body: JSON.stringify({
		to: "deine-testadresse@example.com",
		subject: "AzubiMatch Relay Test",
		text: "Dies ist ein manueller Test des WordPress-Mail-Relay.",
		html: "<p>Dies ist ein manueller Test des <strong>WordPress-Mail-Relay</strong>.</p>",
		attachments: []
	})
})
	.then(async (response) => {
		const text = await response.text();
		console.log({ status: response.status, ok: response.ok, body: text });
	})
	.catch((error) => {
		console.error(error);
	});
```

Erwartetes Ergebnis:

- HTTP-Status `200`
- JSON-Antwort mit `{"success":true}`
- Testmail kommt von `info@azubimatcher.com`

Wenn stattdessen ein Fehler erscheint:

- `403`: Same-Origin-Pruefung oder API-Key-Konfiguration stimmt nicht.
- `400`: JSON-Body oder Pflichtfelder sind unvollstaendig.
- `502`: WordPress erreicht die Mailfunktion oder das SMTP-Plugin nicht.

### Copy-Paste-Test mit kleinem Anhang

Wenn der einfache POST funktioniert, kann danach auch der Anhangspfad geprueft werden:

```js
fetch(window.AzubiMatchRuntime.mailRelayEndpoint, {
	method: "POST",
	headers: {
		"Content-Type": "application/json",
		"Accept": "application/json",
		"X-Requested-With": "AzubiMatchMailRelay"
	},
	body: JSON.stringify({
		to: "deine-testadresse@example.com",
		subject: "AzubiMatch Relay Test mit Anhang",
		text: "Dies ist ein Test des WordPress-Mail-Relay mit einem kleinen Textanhang.",
		html: "<p>Dies ist ein Test des <strong>WordPress-Mail-Relay</strong> mit einem kleinen Textanhang.</p>",
		attachments: [
			{
				filename: "relay-test.txt",
				contentType: "text/plain",
				contentBase64: btoa("AzubiMatch Relay Testanhang")
			}
		]
	})
})
	.then(async (response) => {
		const text = await response.text();
		console.log({ status: response.status, ok: response.ok, body: text });
	})
	.catch((error) => {
		console.error(error);
	});
```

Erwartet wird hier zusätzlich:

- HTTP-Status `200`
- JSON-Antwort mit `{"success":true}`
- Testmail von `info@azubimatcher.com`
- Anhang `relay-test.txt` ist in der Mail vorhanden

## Kurzer Fehlerleitfaden fuer Strato

### HTTP 403

Typische Ursache:

- Same-Origin-Pruefung greift nicht
- optional gesetzter `AZUBIMATCH_MAIL_RELAY_API_KEY` stimmt nicht
- Test wurde nicht von einer echten AzubiMatch-Seite unter `a-zu-bio.de` aus gestartet

Pruefen:

1. DevTools-Test wirklich auf einer geladenen Portal-Seite unter `https://a-zu-bio.de/...` starten.
2. `window.AzubiMatchRuntime.mailRelayEndpoint` kontrollieren.
3. Falls ein API-Key gesetzt wurde, denselben Wert serverseitig und im Request verwenden.

### HTTP 400

Typische Ursache:

- JSON-Body ist ungueltig
- `to`, `subject`, `text` oder `html` fehlen
- ein Anhang ist nicht gueltig base64-kodiert

Pruefen:

1. Erst den einfachen POST ohne Anhang ausfuehren.
2. Danach erst den Test mit `attachments` starten.
3. Bei Anhaengen nur kleine Testdateien verwenden.

### HTTP 502

Typische Ursache:

- WordPress kann `wp_mail()` nicht zustellen
- auf Strato ist keine funktionierende Mailzustellung konfiguriert
- ein SMTP-Plugin ist falsch konfiguriert oder blockiert den Versand

Pruefen:

1. WordPress-Mailfunktion bzw. SMTP-Plugin separat mit einer normalen Testmail pruefen.
2. Absenderadresse `info@azubimatcher.com` als erlaubte Absenderadresse im Mailsystem pruefen.
3. Hosting-Log, WordPress-Debug-Log oder SMTP-Plugin-Log auf konkrete Fehler kontrollieren.

## 24-7 Monitoring auf Strato

Fuer echte Dauerueberwachung sind jetzt zwei WordPress-Endpunkte vorhanden:

- Oeffentlicher Uptime-Endpunkt: `https://a-zu-bio.de/wp-json/azubimatch/v1/health`
- Geschuetzter Deep-Check-Runner: `https://a-zu-bio.de/wp-json/azubimatch/v1/health-run`

Empfohlene Konfiguration:

1. Einen externen Uptime-Dienst wie UptimeRobot, Better Stack oder HetrixTools auf `.../wp-json/azubimatch/v1/health` setzen.
2. Fuer den tieferen Server-Check einen Cronjob oder einen zweiten externen Aufruf auf `.../wp-json/azubimatch/v1/health-run` einrichten.
3. Wenn `AZUBIMATCH_HEALTH_MONITOR_API_KEY` gesetzt ist, den Key als `X-API-Key` oder `?key=...` mitsenden.
4. `AZUBIMATCH_HEALTH_MONITOR_ALERT_EMAIL` auf eine interne Adresse setzen, damit wiederholte Fehler per Mail eskalieren koennen.

Empfohlene Intervalle:

- Uptime-Endpunkt: alle 30 Minuten
- Deep-Check-Runner: alle 1 bis 3 Stunden

Geeignete WordPress-/Server-Konstanten oder Umgebungsvariablen:

- `AZUBIMATCH_HEALTH_MONITOR_API_KEY`
- `AZUBIMATCH_HEALTH_MONITOR_ALERT_EMAIL`
- `AZUBIMATCH_HEALTH_MONITOR_ALERT_NAME`
- `AZUBIMATCH_HEALTH_MONITOR_ALERT_THRESHOLD`
- `AZUBIMATCH_HEALTH_MONITOR_NOTIFY_COOLDOWN`
- `AZUBIMATCH_HEALTH_MONITOR_TIMEOUT`

Beispiel fuer einen manuellen Test im Browser oder per HTTP-Client:

```text
GET https://a-zu-bio.de/wp-json/azubimatch/v1/health
```

```text
GET https://a-zu-bio.de/wp-json/azubimatch/v1/health-run?key=MEIN_KEY
```

Wenn Strato keinen Shell-Cron fuer das Hosting bereitstellt, reicht in der Praxis ein externer Scheduler, der diese URLs regelmaessig aufruft.

Wichtig: Die Monitoring-Jobs im Projekt werten die Antwort nur dann als Erfolg, wenn die WordPress-Route echtes Health-JSON liefert. Eine vorgeschaltete Baustellen- oder Maintenance-Seite mit HTTP 200 wird absichtlich als Fehler behandelt.

Fuer das lokale Windows-Setup im Projekt gibt es zusaetzlich ein Registrierungs-Skript unter `tools/monitoring/register_monitoring_jobs.ps1`, das denselben Rhythmus mit zwei Windows-Aufgaben anlegt.

Beispiel:

```powershell
Set-Location c:\Users\ardao\Desktop\azubi-match
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\monitoring\register_monitoring_jobs.ps1 `
	-PublicUrl "http://127.0.0.1:8091/healthz.php" `
	-DeepUrl "http://127.0.0.1:8091/health_monitor.php"
```
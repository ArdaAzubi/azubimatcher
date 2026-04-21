# Nicht-oeffentlicher Mail-Test-Workflow

Diese Anleitung prueft den Mailversand, ohne die Website oeffentlich live zu schalten.

## Ziel

- Relay-Request und Antwort reproduzierbar pruefen
- Same-Origin- und API-Key-Probleme sauber erkennen
- Anhangspfad getrennt testen
- Maintenance-Modus auf der Domain aktiv lassen

## Variante A: Lokal mit der PHP-Version pruefen

Diese Variante prueft den lokalen Endpunkt `mail_relay.php` direkt im Projekt.

### 1. Optional die lokale Relay-Konfiguration anlegen

Aus [mail_relay_config.php.example](mail_relay_config.php.example) eine lokale `mail_relay_config.php` ableiten, wenn du einen abweichenden Absender testen willst.

Wichtige Werte:

- `fromEmail`
- `fromName`
- optional `apiKey`

### 2. Lokalen PHP-Server starten

Im Projektordner:

```powershell
& "C:\Users\ardao\AppData\Local\Microsoft\WinGet\Packages\PHP.PHP.8.3_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe" -S 127.0.0.1:8080 -t .
```

### 3. Einfachen Relay-Test ohne Anhang ausfuehren

In einem zweiten Terminal:

```powershell
node .\tools\test_mail_relay.mjs --endpoint http://127.0.0.1:8080/mail_relay.php --to deine-testadresse@example.com
```

### 4. Relay-Test mit kleinem Anhang ausfuehren

```powershell
node .\tools\test_mail_relay.mjs --endpoint http://127.0.0.1:8080/mail_relay.php --to deine-testadresse@example.com --attachment
```

### Erwartung

- `PASS`: Relay hat den Versand bestaetigt.
- `403`: Same-Origin oder API-Key stimmt nicht.
- `400`: Request-Body ist ungueltig.
- `502`: Relay wurde erreicht, aber der lokale PHP-Mailer kann nicht zustellen.

Hinweis: Ein lokaler `502` ist fuer Windows ohne Mailserver nicht ungewoehnlich. Dann ist der Request-Pfad korrekt, aber die eigentliche Zustellung lokal nicht konfiguriert.

## Variante B: Privat gegen Strato oder WordPress pruefen

Diese Variante ist fuer spaetere interne Tests gedacht, waehrend die Seite noch nicht oeffentlich freigeschaltet ist.

Voraussetzung:

- das Theme ist hochgeladen
- der Maintenance-Modus darf aktiv bleiben
- es gibt einen internen Weg zur Seite oder zum Relay, der nicht oeffentlich freigegeben wird

### Einfacher Relay-Test

```powershell
node .\tools\test_mail_relay.mjs --endpoint https://a-zu-bio.de/wp-json/azubimatch/v1/mail-relay --to deine-testadresse@example.com --origin https://a-zu-bio.de --referer https://a-zu-bio.de/anmeldung/
```

### Test mit Anhang

```powershell
node .\tools\test_mail_relay.mjs --endpoint https://a-zu-bio.de/wp-json/azubimatch/v1/mail-relay --to deine-testadresse@example.com --origin https://a-zu-bio.de --referer https://a-zu-bio.de/anmeldung/ --attachment
```

### Optional mit API-Key

```powershell
node .\tools\test_mail_relay.mjs --endpoint https://a-zu-bio.de/wp-json/azubimatch/v1/mail-relay --to deine-testadresse@example.com --origin https://a-zu-bio.de --referer https://a-zu-bio.de/anmeldung/ --api-key DEIN_API_KEY
```

Oder per Umgebungsvariable:

```powershell
$env:AZUBIMATCH_MAIL_RELAY_API_KEY = "DEIN_API_KEY"
node .\tools\test_mail_relay.mjs --endpoint https://a-zu-bio.de/wp-json/azubimatch/v1/mail-relay --to deine-testadresse@example.com --origin https://a-zu-bio.de --referer https://a-zu-bio.de/anmeldung/
```

## Schnelle Auswertung der Ergebnisse

### `PASS: Relay hat den Versand bestaetigt.`

- Request ist korrekt angekommen
- Relay hat `success: true` zurueckgegeben
- jetzt den realen Maileingang und bei Bedarf den Anhang pruefen

### `FAIL` mit HTML `Construction`

- der Maintenance-Modus oder eine vorgelagerte Baustellenseite ueberdeckt den Relay-Endpunkt
- in diesem Zustand ist kein valider Live-Relay-Test moeglich

### `FAIL` mit `403`

- Same-Origin-Pruefung oder API-Key ist falsch
- `Origin` und `Referer` muessen zur Ziel-Domain passen

### `FAIL` mit `400`

- Request-Body oder Pflichtfelder stimmen nicht
- zuerst ohne `--attachment` testen, danach mit Anhang

### `FAIL` mit `502`

- Relay antwortet, aber `mail()` oder `wp_mail()` kann nicht zustellen
- dann die eigentliche Mailkonfiguration auf dem Zielsystem pruefen

## Empfehlung fuer den weiteren Ablauf

1. Zuerst lokal pruefen, ob Request und Antwortverhalten plausibel sind.
2. Danach intern gegen Strato oder WordPress testen, ohne den Maintenance-Modus abzuschalten.
3. Erst nach erfolgreichem Privat-Test den echten UI-Flow mit Dokumentfreigabe durchgehen.
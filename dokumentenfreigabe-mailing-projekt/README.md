# Dokumentenfreigabe-Mail an Firmen

Dieses Verzeichnis enthält eine Mailvorlage für den Fall, dass ein Bewerber eine angefragte Dokumentenfreigabe an eine Firma erteilt.

## Enthaltene Dateien

- `emailjs-template-firma.html`
- `emailjs-template-firma.txt`

## Verwendete Felder

- `recipient_name`
- `student_name`
- `matched_profession`
- `document_list`
- `release_note`
- `dashboard_url`
- `support_name`

## Projektstand

Der Freigabe-Flow ist in `script.js` und in `dist/strato-wordpress/azubimatch-strato/assets/script.js` verdrahtet.

Beim Klick auf `Unterlagen freigeben` kann der Bewerber jetzt vorab ein kurzes persönliches Anschreiben verfassen.

Danach passiert technisch Folgendes:

1. Die Freigabe wird im Portal gespeichert.
2. Die Firma erhält eine Portal-Nachricht mit der Freigabe und den Dokumenten.
3. Wenn ein same-origin SMTP-Relay über `SMTP_SETTINGS.endpoint` konfiguriert ist, werden die Dokumente als echte Mail-Anhänge mitgesendet.
4. Wenn nur EmailJS im Browser aktiv ist, wird die Mail ohne Binär-Anhänge versendet und auf das Firmenportal verwiesen.
5. Wenn kein externer Versand möglich ist, wird ein lokaler Preview-Eintrag erzeugt.

Zusätzlich erkennt die Website jetzt automatisch diese serverseitigen Relay-Endpunkte:

- lokal: `mail_relay.php`
- WordPress: `/wp-json/azubimatch/v1/mail-relay`

Wenn der Relay erreichbar ist, versucht AzubiMatch zuerst den serverseitigen Versand mit echten Anhängen. Falls der Relay selbst fehlschlägt, fällt der Versand automatisch auf EmailJS oder die lokale Vorschau zurück.

## Wichtige technische Grenze

Browser-basiertes EmailJS kann in diesem Projekt keine echten Dateianhänge aus dem Frontend zuverlässig an den Provider übertragen. Für tatsächliche Anhänge ist deshalb weiterhin ein serverseitiger Relay-Endpunkt erforderlich.

## Optionaler Konfigurationspunkt

Für eine eigene HTML-Vorlage kann zusätzlich gesetzt werden:

- `EMAIL_SETTINGS.documentReleaseTemplateId`

Ohne eigene ID fällt der Versand auf `EMAIL_SETTINGS.templateId` zurück.
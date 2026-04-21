# Freigabeanfrage-Mail an Bewerbende

Dieses Verzeichnis enthält die Mailvorlage für den Moment, in dem eine Firma eine Freigabe der Bewerbungsunterlagen anfragt.

## Enthaltene Dateien

- `emailjs-template-bewerber.html`
- `emailjs-template-bewerber.txt`

## Zweck

Die angefragte Person wird per Mail benachrichtigt, dass eine Firma Unterlagen anfordern möchte.

Die Mail macht explizit deutlich:

- im Kurzprofil der Firma zuerst prüfen
- danach im Bewerberprofil entscheiden
- dort annehmen oder ablehnen

## Verwendete Felder

- `recipient_name`
- `firm_name`
- `matched_profession`
- `dashboard_url`
- `quickprofile_url`
- `support_name`

## Technischer Stand

Der Versand ist in `script.js` und in `dist/strato-wordpress/azubimatch-strato/assets/script.js` an `notifyStudentAboutFirmRequest(...)` angebunden.

Für einen eigenen EmailJS-Template-Slot kann optional verwendet werden:

- `EMAIL_SETTINGS.studentRequestTemplateId`

Wenn kein eigener EmailJS-Template-Slot gesetzt ist, funktioniert der Versand weiterhin über den serverseitigen Mail-Relay oder fällt auf die bestehende Vorschau-/Fallback-Logik zurück.
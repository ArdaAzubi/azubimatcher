# Willkommensmails mit EmailJS

Dieses Verzeichnis enthält einsatzfähige Willkommensmails für beide Seiten von AzubiMatch:

- für neu registrierte Bewerbende
- für neu registrierte Firmen

Die Vorlagen sind auf den bestehenden Versandpfad in `script.js` abgestimmt und können direkt in EmailJS hinterlegt werden.

## Enthaltene Dateien

- `emailjs-template-bewerber.html`
  - HTML-Willkommensmail für Bewerbende
- `emailjs-template-bewerber.txt`
  - Textversion als Fallback
- `emailjs-template-firma.html`
  - HTML-Willkommensmail für Firmen
- `emailjs-template-firma.txt`
  - Textversion als Fallback

## Verwendete Template-Felder

- `recipient_name`
- `recipient_email`
- `portal_url`
- `login_url`
- `support_name`

## Bereits im Projekt verdrahtet

Die automatische Auslösung ist bereits im Frontend eingebaut:

- `buildStudentWelcomeEmailPayload(...)`
- `buildFirmWelcomeEmailPayload(...)`

Verwendet werden dafür diese Konfigurationsfelder:

- `EMAIL_SETTINGS.studentWelcomeTemplateId`
- `EMAIL_SETTINGS.firmWelcomeTemplateId`

Wenn keine eigenen Welcome-Template-IDs gesetzt sind, fällt der Versand aktuell auf `EMAIL_SETTINGS.otcTemplateId` oder `EMAIL_SETTINGS.templateId` zurück.

## Beispielwerte

### Bewerbende

```json
{
  "recipient_name": "Meryem",
  "recipient_email": "meryem@example.com",
  "portal_url": "https://deine-domain.de/bewerber/",
  "login_url": "https://deine-domain.de/anmeldung/",
  "support_name": "AzubiMatch | Bewerbendenservice"
}
```

### Firmen

```json
{
  "recipient_name": "Autohaus Weber",
  "recipient_email": "ausbildung@weber.de",
  "portal_url": "https://deine-domain.de/firma/",
  "login_url": "https://deine-domain.de/anmeldung/",
  "support_name": "AzubiMatch | Unternehmensservice"
}
```

## Empfohlene Betreffzeilen

- Bewerbende: `AzubiMatch: Willkommen bei AzubiMatch`
- Firmen: `AzubiMatch: Willkommen bei AzubiMatch`

## Vor dem Einsatz anpassen

1. In EmailJS je Zielgruppe die passende HTML- oder TXT-Vorlage hinterlegen.
2. Die Template-ID in `EMAIL_SETTINGS.studentWelcomeTemplateId` beziehungsweise `EMAIL_SETTINGS.firmWelcomeTemplateId` eintragen.
3. Falls gewünscht, Betreff, Signatur oder Tonalität auf euren Versandstil anpassen.
# OTC-Mail für AzubiMatch

Dieses Verzeichnis enthält eine gestaltete EmailJS-Vorlage für OTC- beziehungsweise Einmalcode-Mails in AzubiMatch.

Gedacht ist sie für:

- E-Mail-Bestätigung nach Registrierung
- Passwort-Reset per Einmalcode
- Bewerber- und Firmenzugänge

## Enthaltene Dateien

- `emailjs-template-otc.html`
  - gestaltete HTML-Mail für EmailJS
- `emailjs-template-otc.txt`
  - Text-Fallback für einfache Clients

## Empfohlene Template-Felder

- `recipient_name`
- `otp_code`
- `flow_label`
- `expires_hint`
- `message_line`
- `login_url`
- `support_name`

## Beispielwerte

### Registrierung bestätigen

```json
{
  "recipient_name": "Meryem",
  "otp_code": "482913",
  "flow_label": "die Bestätigung deiner E-Mail-Adresse",
  "expires_hint": "Der Code ist für kurze Zeit gültig.",
  "message_line": "Dein Bestätigungscode lautet: 482913",
  "login_url": "https://deine-domain.de/anmeldung/",
  "support_name": "AzubiMatch | Bewerbendenservice"
}
```

### Passwort zurücksetzen

```json
{
  "recipient_name": "Autohaus Weber",
  "otp_code": "761204",
  "flow_label": "das Zurücksetzen Ihres Passworts",
  "expires_hint": "Der Reset-Code ist nur kurz gültig.",
  "message_line": "Ihr Reset-Code lautet: 761204",
  "login_url": "https://deine-domain.de/anmeldung/",
  "support_name": "AzubiMatch | Unternehmensservice"
}
```

## Aktueller Projektstand

Die Auth-Code-Flows in `script.js` und in `dist/strato-wordpress/azubimatch-strato/assets/script.js` sind jetzt an den zentralen Versandpfad angebunden.

Aktiv genutzt werden dabei:

- `sendVerificationEmail`
- `sendPasswordResetEmail`
- `sendFirmVerificationEmail`
- `sendFirmPasswordResetEmail`

Die OTC-Mails verwenden dafür jetzt den Typ `otc-code` und diese Konfiguration:

- `EMAIL_SETTINGS.otcTemplateId`
- Fallback auf `EMAIL_SETTINGS.templateId`, wenn keine eigene OTC-Template-ID gesetzt ist

Wenn keine EmailJS-Konfiguration vorhanden ist, fällt das System weiterhin kontrolliert auf lokale Preview-Mails mit sichtbarem Code zurück.
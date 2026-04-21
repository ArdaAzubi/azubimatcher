# Match-Benachrichtigungen mit EmailJS

Dieses Verzeichnis enthält einsatzfähige Vorlagen für eine E-Mail-Benachrichtigung, wenn nach einer neuen Registrierung sofort ein sichtbares Match in AzubiMatch entsteht.

Es gibt bewusst zwei Varianten:

- für neu registrierte Bewerbende
- für neu registrierte Firmen
- für eine interne Team-Benachrichtigung

Die Vorlagen orientieren sich an der aktuellen Match-Logik aus `discovery.js` und an den sichtbaren Match-Labels im Portal.

## Enthaltene Dateien

- `emailjs-template-bewerber.html`
  - HTML-Mail für neu registrierte Bewerbende mit mindestens einem sichtbaren Firmen-Match
- `emailjs-template-bewerber.txt`
  - Textversion als Fallback
- `emailjs-template-firma.html`
  - HTML-Mail für neu registrierte Firmen mit mindestens einem sichtbaren Profil-Match
- `emailjs-template-firma.txt`
  - Textversion als Fallback
- `emailjs-template-admin.html`
  - HTML-Mail für interne Sofort-Match-Hinweise an das AzubiMatch-Team
- `emailjs-template-admin.txt`
  - Textversion für die interne Benachrichtigung

## Bereits im Projekt verdrahtet

Die Auslösung ist jetzt in `script.js` und in der WordPress-Kopie `dist/strato-wordpress/azubimatch-strato/assets/script.js` eingebaut.

Automatisch geprüft wird:

- beim ersten vollständigen Speichern eines Bewerberprofils
- beim ersten Speichern eines Firmenangebots

Wenn sichtbare Matches vorhanden sind, wird:

1. die passende Bewerber- oder Firmen-Mail erzeugt
2. optional eine interne Admin-Mail erzeugt
3. bei fehlender EmailJS-Konfiguration automatisch ein lokaler Mail-Preview gespeichert

## Empfohlene Trigger

### 1. Neue Bewerbung / neues Bewerberprofil

Nach erfolgreicher Registrierung oder nach dem ersten vollständigen Speichern des Bewerberprofils:

```js
const matches = window.AzubiMatchDiscovery.getMatchesForStudent(student);
if (matches.length > 0) {
  const firstMatch = matches[0];
  emailjs.send(SERVICE_ID, TEMPLATE_ID_BEWERBER, {
    recipient_name: student.name || "",
    recipient_email: student.email || "",
    match_count: matches.length,
    top_match_name: firstMatch.summary?.name || "Passende Firma",
    top_match_profession: firstMatch.matchedProfession || student.beruf || "Passender Ausbildungsberuf",
    top_match_city: firstMatch.summary?.city || "-",
    top_match_distance: firstMatch.distanceLabel || "Distanz unbekannt",
    top_match_label: firstMatch.matchLabel || "Direktes Match",
    radius_label: firstMatch.studentRadiusLabel || "dein gewählter Umkreis",
    inclusion_hint: firstMatch.isInclusionMatch ? "Bei diesem Match ist eine Inklusionsoption sichtbar." : "",
    dashboard_url: "https://deine-domain.de/bewerber/",
    login_url: "https://deine-domain.de/anmeldung/",
    support_name: "AzubiMatch | Bewerbendenservice"
  });
}
```

### 2. Neue Firmenregistrierung / neues Stellenprofil

Nach erfolgreicher Firmenregistrierung oder nach dem ersten vollständigen Speichern des Ausbildungsangebots:

```js
const matches = window.AzubiMatchDiscovery.matchStudents(offer);
if (matches.length > 0) {
  const firstMatch = matches[0];
  emailjs.send(SERVICE_ID, TEMPLATE_ID_FIRMA, {
    recipient_name: offer.firma || "",
    recipient_email: offer.email || offer.userEmail || "",
    match_count: matches.length,
    top_match_profile_code: firstMatch.student?.profilCode || firstMatch.student?.id || "Profil",
    top_match_profession: firstMatch.matchedProfession || firstMatch.student?.beruf || "Passender Ausbildungsberuf",
    top_match_city: firstMatch.student?.stadt || "-",
    top_match_distance: firstMatch.distanceLabel || "Distanz unbekannt",
    top_match_label: firstMatch.matchLabel || "Direktes Match",
    radius_label: firstMatch.offerRadiusLabel || "Ihr gewählter Umkreis",
    inclusion_hint: firstMatch.isInclusionMatch ? "Darunter befindet sich mindestens ein Inklusions-Match." : "",
    dashboard_url: "https://deine-domain.de/firma/",
    login_url: "https://deine-domain.de/anmeldung/",
    support_name: "AzubiMatch | Unternehmensservice"
  });
}
```

### 3. Interne Team-Benachrichtigung

Wenn ihr intern nachvollziehen möchtet, welche neuen Registrierungen sofort sichtbare Matches erzeugen, kann parallel ein drittes Template genutzt werden:

```js
emailjs.send(SERVICE_ID, TEMPLATE_ID_ADMIN, {
  recipient_name: "AzubiMatch Team",
  recipient_email: "matching@deine-domain.de",
  trigger_type: "Bewerberprofil",
  registrant_name: student.name || "-",
  registrant_email: student.userEmail || student.email || "-",
  match_count: matches.length,
  top_match_reference: firstMatch.summary?.name || "Firma",
  top_match_profession: firstMatch.matchedProfession || student.beruf || "-",
  top_match_city: firstMatch.summary?.city || "-",
  top_match_distance: firstMatch.distanceLabel || "-",
  top_match_label: firstMatch.matchLabel || "Direktes Match",
  dashboard_url: "https://deine-domain.de/admin/",
  login_url: "https://deine-domain.de/anmeldung/",
  support_name: "AzubiMatch System"
});
```

## Verwendete Match-Felder

Die Vorlagen sind auf diese Werte zugeschnitten:

- `matchedProfession`
- `matchLabel`
- `distanceLabel`
- `studentRadiusLabel`
- `offerRadiusLabel`
- `isInclusionMatch`
- bei Bewerbenden zusätzlich `summary.name` und `summary.city`
- bei Firmen zusätzlich `student.profilCode`, `student.id` und `student.stadt`
- intern zusätzlich `trigger_type`, `registrant_name`, `registrant_email` und `top_match_reference`

## Benötigte Konfiguration

In `script.js` stehen dafür jetzt diese Felder bereit:

- `EMAIL_SETTINGS.serviceId`
- `EMAIL_SETTINGS.publicKey`
- `EMAIL_SETTINGS.studentMatchTemplateId`
- `EMAIL_SETTINGS.firmMatchTemplateId`
- `EMAIL_SETTINGS.adminMatchTemplateId`
- `EMAIL_SETTINGS.internalRecipient`
- `EMAIL_SETTINGS.internalRecipientName`

Wenn `window.emailjs` oder diese Werte fehlen, fällt das System automatisch auf lokale Vorschau-Einträge zurück.

## Wichtige Datenschutz-Regel

Für Firmen sollte in der automatischen Match-Mail kein voller Name einer bewerbenden Person stehen, solange im Portal selbst nur das Kurzprofil beziehungsweise die Profilkennung sichtbar ist. Deshalb ist in der Firmenvorlage standardmäßig `top_match_profile_code` vorgesehen.

## Vor dem Einsatz anpassen

1. Öffentliche Live-URLs für `dashboard_url` und `login_url` ergänzen.
2. EmailJS im Frontend laden oder bewusst beim lokalen Preview-Fallback bleiben.
3. In EmailJS die drei Template-IDs und Betreffzeilen hinterlegen.
4. `EMAIL_SETTINGS.internalRecipient` für die interne Mail setzen.
5. Optional Einleitung, Absenderrolle und Signatur an euren Ton anpassen.
6. Wenn ihr mehrere Top-Matches in einer Mail zeigen wollt, die Vorlage um zusätzliche Felder oder eine serverseitig vorbereitete HTML-Liste erweitern.

## Empfohlene Betreffzeilen

- Bewerbende: `AzubiMatch: Es gibt bereits passende Ausbildungs-Matches für dich`
- Firmen: `AzubiMatch: Für Ihr neues Ausbildungsangebot gibt es bereits passende Profile`
- Intern: `AzubiMatch intern: Neues Sofort-Match nach Registrierung`

*** Add File: c:\Users\ardao\Desktop\azubi-match\match-benachrichtigung-projekt\emailjs-template-admin.html
<!DOCTYPE html>
<!-- Empfohlener Betreff: AzubiMatch intern: Neues Sofort-Match nach Registrierung -->
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AzubiMatch interne Match-Benachrichtigung</title>
</head>
<body style="margin:0; padding:0; background:#eef1f6;">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">Eine neue Registrierung hat sofort sichtbare Matches erzeugt.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#eef1f6; margin:0; padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="680" cellspacing="0" cellpadding="0" border="0" style="width:680px; max-width:680px; border-collapse:collapse; background:#ffffff; border:1px solid #d7dde8; border-radius:20px; overflow:hidden; font-family:Georgia, 'Times New Roman', serif; color:#1d2735;">
          <tr>
            <td style="padding:30px 36px; background:linear-gradient(135deg, #1d3557, #0f766e); color:#f8fbff;">
              <div style="display:inline-block; padding:10px 16px; border-radius:14px; background:rgba(255,255,255,0.15); font-size:28px; font-weight:700; margin-bottom:18px;">AzubiMatch</div>
              <div style="font-size:13px; letter-spacing:0.08em; text-transform:uppercase; opacity:0.84; margin-bottom:14px;">Interne Match-Meldung</div>
              <h1 style="margin:0 0 12px; font-size:32px; line-height:1.15; font-weight:700;">Neue Registrierung mit sofort sichtbaren Matches.</h1>
              <p style="margin:0; font-size:18px; line-height:1.6; color:rgba(248,251,255,0.88);">Diese Nachricht ist für das interne Team gedacht und fasst den ersten relevanten Treffer direkt zusammen.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:30px 36px 16px; font-size:18px; line-height:1.7; color:#556173;">
              <p style="margin:0 0 18px;">Hallo {{recipient_name}},</p>
              <p style="margin:0;">eine neue Registrierung hat direkt <strong style="color:#1d2735;">{{match_count}} sichtbare Matches</strong> erzeugt.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 36px 12px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f8fafc; border:1px solid #d7dde8; border-radius:16px;">
                <tr>
                  <td style="padding:22px 24px; font-size:16px; line-height:1.7; color:#1d2735;">
                    <p style="margin:0 0 10px; font-size:13px; letter-spacing:0.08em; text-transform:uppercase; color:#0f766e;">Auslöser</p>
                    <p style="margin:0 0 8px;"><strong>Typ:</strong> {{trigger_type}}</p>
                    <p style="margin:0 0 8px;"><strong>Name:</strong> {{registrant_name}}</p>
                    <p style="margin:0 0 8px;"><strong>E-Mail:</strong> {{registrant_email}}</p>
                    <p style="margin:0;"><strong>Top-Match:</strong> {{top_match_reference}}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 36px 12px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#edf7f6; border:1px solid #cbe6e3; border-radius:16px;">
                <tr>
                  <td style="padding:22px 24px; font-size:16px; line-height:1.7; color:#1d2735;">
                    <p style="margin:0 0 8px;"><strong>Beruf:</strong> {{top_match_profession}}</p>
                    <p style="margin:0 0 8px;"><strong>Ort:</strong> {{top_match_city}}</p>
                    <p style="margin:0 0 8px;"><strong>Distanz:</strong> {{top_match_distance}}</p>
                    <p style="margin:0;"><strong>Match-Typ:</strong> {{top_match_label}}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 36px 18px;">
              <a href="{{dashboard_url}}" style="display:inline-block; padding:15px 24px; background:#1d3557; color:#ffffff; text-decoration:none; font-size:17px; font-weight:700; border-radius:999px;">Dashboard öffnen</a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 36px 24px; font-size:15px; line-height:1.7; color:#556173;">
              Anmeldung: <a href="{{login_url}}" style="color:#0f766e; font-weight:700; text-decoration:none;">{{login_url}}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 36px 28px; font-size:17px; line-height:1.7; color:#556173;">
              Viele Grüße<br>
              <strong style="color:#1d2735;">{{support_name}}</strong>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 36px 30px; border-top:1px solid #e4e9f0; font-size:14px; line-height:1.6; color:#738091;">
              Diese Vorlage ist für EmailJS gedacht. Verwendete Felder: `recipient_name`, `recipient_email`, `trigger_type`, `registrant_name`, `registrant_email`, `match_count`, `top_match_reference`, `top_match_profession`, `top_match_city`, `top_match_distance`, `top_match_label`, `dashboard_url`, `login_url`, `support_name`.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
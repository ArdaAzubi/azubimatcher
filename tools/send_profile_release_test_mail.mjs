#!/usr/bin/env node
/**
 * Sendet eine Testmail fuer die Profilfreigabe ueber den Live-Relay.
 * Aufruf: node tools/send_profile_release_test_mail.mjs [empfaenger@beispiel.de]
 */

const recipient = (process.argv[2] || "oezcan.fatih@gmx.de").trim();

if (!recipient || !recipient.includes("@")) {
  console.error("Fehler: Bitte gueltige Empfaenger-E-Mail angeben.");
  process.exit(1);
}

const RELAY_URL = "https://azubimatcher.com/wp-json/azubimatch/v1/mail-relay";
const SUPPORT_NAME = "AzubiMatch Team";
const DASHBOARD_URL = "https://azubimatcher.com/bewerber_profil/";
const RECIPIENT_NAME = "Fatih";

const html = `<!DOCTYPE html>
<!-- Empfohlener Betreff: Ihr Profil bei AzubiMatch wurde freigegeben -->
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AzubiMatch Profilfreigabe</title>
</head>
<body style="margin:0; padding:0; background:#f4efe7;">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">Ihr Profil wurde erfolgreich geprueft und fuer AzubiMatch freigegeben.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4efe7; margin:0; padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="680" cellspacing="0" cellpadding="0" border="0" style="width:680px; max-width:680px; border-collapse:collapse; background:#fffaf4; border:1px solid #ddd2c5; border-radius:20px; overflow:hidden; font-family:Georgia, 'Times New Roman', serif; color:#1e2430;">
          <tr>
            <td style="padding:32px 36px; background:linear-gradient(135deg, #123b4f, #0d6a58); color:#fffdf8;">
              <div style="display:inline-block; padding:10px 16px; border-radius:14px; background:rgba(255,255,255,0.15); font-size:28px; font-weight:700; margin-bottom:18px;">AzubiMatch</div>
              <div style="font-size:13px; letter-spacing:0.08em; text-transform:uppercase; opacity:0.84; margin-bottom:14px;">Profilfreigabe bestaetigt</div>
              <h1 style="margin:0 0 14px; font-size:34px; line-height:1.1; font-weight:700;">Ihr Profil wurde bei AzubiMatch freigegeben.</h1>
              <p style="margin:0; font-size:18px; line-height:1.6; color:rgba(255,253,248,0.86);">Sie koennen die Plattform jetzt vollstaendig nutzen und sind fuer passende Unternehmen sichtbar.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 36px 16px; font-size:18px; line-height:1.7; color:#5e6778;">
              <p style="margin:0 0 18px;">Hallo ${RECIPIENT_NAME},</p>
              <p style="margin:0 0 18px;">Ihr Profil wurde erfolgreich geprueft und fuer AzubiMatch freigegeben.</p>
              <p style="margin:0;">Ab sofort koennen Sie passende Ausbildungsbetriebe finden, Ihr Profil aktiv nutzen und direkt mit Unternehmen in Kontakt treten.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 36px 12px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#dff4ec; border:1px solid #b7e0d3; border-radius:16px;">
                <tr>
                  <td style="padding:20px 22px;">
                    <h2 style="margin:0 0 10px; font-size:21px; line-height:1.3; color:#0b5d4d;">Was Sie jetzt tun koennen</h2>
                    <ol style="margin:0; padding-left:20px; color:#24594e; font-size:17px; line-height:1.7;">
                      <li>Profil pruefen und vollstaendig halten</li>
                      <li>Passende Firmenvorschlaege ansehen</li>
                      <li>Direkt mit Unternehmen in Kontakt treten</li>
                    </ol>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:6px 36px 12px;">
              <a href="${DASHBOARD_URL}" style="display:inline-block; padding:15px 24px; background:#0d7a64; color:#ffffff; text-decoration:none; font-size:17px; font-weight:700; border-radius:999px;">Zum Bewerberprofil</a>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 36px 28px; font-size:17px; line-height:1.7; color:#5e6778;">
              Viele Gruesse<br>
              <strong style="color:#1e2430;">${SUPPORT_NAME}</strong>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const text = [
  `Hallo ${RECIPIENT_NAME},`,
  "",
  "Ihr Profil wurde erfolgreich geprueft und fuer AzubiMatch freigegeben.",
  "Sie koennen die Plattform nun vollstaendig nutzen und sind fuer passende Unternehmen sichtbar.",
  "",
  `Zum Bewerberprofil: ${DASHBOARD_URL}`,
  "",
  `Viele Gruesse\n${SUPPORT_NAME}`
].join("\n");

const payload = {
  to: recipient,
  recipientName: RECIPIENT_NAME,
  subject: "[TEST] Ihr Profil bei AzubiMatch wurde freigegeben",
  text,
  html,
  name: RECIPIENT_NAME,
  title: "Ihr Profil bei AzubiMatch wurde freigegeben",
  message: text,
  message_line: text,
  app_name: "AzubiMatch"
};

const response = await fetch(RELAY_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "X-Requested-With": "AzubiMatchMailRelay",
    "Origin": "https://azubimatcher.com",
    "Referer": "https://azubimatcher.com/"
  },
  body: JSON.stringify(payload)
});

const body = await response.text();
console.log("Status:", response.status);
console.log("Body:", body);

if (!response.ok) {
  process.exit(1);
}

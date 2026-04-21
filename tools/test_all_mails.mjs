/**
 * AzubiMatch – Mail-Testskript
 * Sendet alle 7 E-Mail-Typen an eine Testadresse über das Strato SMTP-Relay.
 * Aufruf: node tools/test_all_mails.mjs [empfaenger@beispiel.de]
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const RELAY = "https://azubimatcher.com/wp-json/azubimatch/v1/mail-relay";
const RECIPIENT = process.argv[2] || "oezcan.fatih@gmx.de";
const LOGIN_URL = "https://azubimatcher.com/bewerber/";
const PORTAL_URL = "https://azubimatcher.com/firma/";

// ── Helper ───────────────────────────────────────────────────────────────────
function readTemplate(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), "utf8");
}

function render(template, values) {
  return template.replace(/\{\{([a-z_]+)\}\}/g, (_, key) =>
    values[key] !== undefined ? String(values[key]) : `{{${key}}}`
  );
}

async function send({ subject, html, text, label }) {
  const body = JSON.stringify({
    to: RECIPIENT,
    subject,
    text: text || subject,
    html,
    recipientName: "Fatih Özcan (Test)",
    name: "Fatih Özcan (Test)",
    app_name: "AzubiMatch"
  });

  const res = await fetch(RELAY, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "X-Requested-With": "AzubiMatchMailRelay",
      "Origin": "https://azubimatcher.com",
      "Referer": "https://azubimatcher.com/"
    },
    body
  });

  const raw = (await res.text()).trim();
  const status = res.ok ? "✓ OK" : `✗ FEHLER ${res.status}`;
  console.log(`[${label}] ${status} — ${raw.slice(0, 120)}`);
}

// ── E-Mail-Typen ─────────────────────────────────────────────────────────────

const mails = [
  // 1. Willkommen Bewerber
  {
    label: "1/7 Willkommen Bewerbende",
    subject: "[TEST] AzubiMatch: Willkommen – dein Konto ist bereit",
    html: render(readTemplate("willkommensmailing-projekt/emailjs-template-bewerber.html"), {
      recipient_name: "Fatih Özcan (Test)",
      login_url: LOGIN_URL,
      support_name: "AzubiMatch | Bewerbendenservice [TEST]"
    })
  },

  // 2. Willkommen Firma
  {
    label: "2/7 Willkommen Firma",
    subject: "[TEST] AzubiMatch: Willkommen – Ihr Firmenprofil ist eingerichtet",
    html: render(readTemplate("willkommensmailing-projekt/emailjs-template-firma.html"), {
      recipient_name: "Fatih Özcan (Test)",
      portal_url: PORTAL_URL,
      login_url: LOGIN_URL,
      support_name: "AzubiMatch | Unternehmensservice [TEST]"
    })
  },

  // 3. OTC / Sicherheitscode
  {
    label: "3/7 OTC Sicherheitscode",
    subject: "[TEST] AzubiMatch: Dein Sicherheitscode",
    html: render(readTemplate("otc-mailing-projekt/emailjs-template-otc.html"), {
      recipient_name: "Fatih Özcan (Test)",
      recipient_email: RECIPIENT,
      otp_code: "742936",
      flow_label: "deine Anmeldung (TEST)",
      expires_hint: "Dieser Testcode ist nur für diesen Test gültig.",
      message_line: "Dein Sicherheitscode lautet: 742936",
      login_url: LOGIN_URL,
      support_name: "AzubiMatch [TEST]"
    })
  },

  // 4. Freigabeanfrage (Bewerber-Benachrichtigung)
  {
    label: "4/7 Freigabeanfrage an Bewerber",
    subject: "[TEST] AzubiMatch: Neue Anfrage für deine Bewerbungsunterlagen",
    html: render(readTemplate("freigabeanfrage-mailing-projekt/emailjs-template-bewerber.html"), {
      recipient_name: "Fatih Özcan (Test)",
      firm_name: "Musterfirma GmbH (TEST)",
      matched_profession: "Fachinformatiker/in Anwendungsentwicklung",
      dashboard_url: LOGIN_URL,
      quickprofile_url: LOGIN_URL,
      support_name: "AzubiMatch | Bewerbendenservice [TEST]"
    })
  },

  // 5. Dokumentenfreigabe (Firmen-Benachrichtigung)
  {
    label: "5/7 Dokumentenfreigabe an Firma",
    subject: "[TEST] AzubiMatch: Bewerbungsunterlagen wurden für Sie freigegeben",
    html: render(readTemplate("dokumentenfreigabe-mailing-projekt/emailjs-template-firma.html"), {
      recipient_name: "Fatih Özcan (Test)",
      student_name: "Max Mustermann (TEST)",
      matched_profession: "Fachinformatiker/in Anwendungsentwicklung",
      document_list: "Lebenslauf.pdf, Zeugnis_2024.pdf, Anschreiben.pdf",
      release_note: "Ich freue mich über Ihre Anfrage und schicke Ihnen gerne meine Unterlagen. – Max [TEST]",
      dashboard_url: PORTAL_URL,
      support_name: "AzubiMatch | Unternehmensservice [TEST]"
    })
  },

  // 6. Match-Benachrichtigung Bewerber
  {
    label: "6/7 Match-Digest Bewerber",
    subject: "[TEST] AzubiMatch: Es gibt bereits passende Ausbildungs-Matches für dich",
    html: render(readTemplate("match-benachrichtigung-projekt/emailjs-template-bewerber.html"), {
      recipient_name: "Fatih Özcan (Test)",
      recipient_email: RECIPIENT,
      match_count: "3",
      top_match_name: "Musterhandwerk GmbH (TEST)",
      top_match_profession: "Elektroniker/in",
      top_match_city: "Berlin",
      top_match_distance: "12 km",
      top_match_label: "Direktes Match",
      radius_label: "30 km",
      inclusion_hint: "",
      dashboard_url: LOGIN_URL,
      login_url: LOGIN_URL,
      support_name: "AzubiMatch | Bewerbendenservice [TEST]"
    })
  },

  // 7. Match-Benachrichtigung Firma
  {
    label: "7/7 Match-Digest Firma",
    subject: "[TEST] AzubiMatch: Für Ihr Ausbildungsangebot gibt es passende Profile",
    html: render(readTemplate("match-benachrichtigung-projekt/emailjs-template-firma.html"), {
      recipient_name: "Fatih Özcan (Test)",
      recipient_email: RECIPIENT,
      match_count: "5",
      top_match_profile_code: "BW-2025-0042 (TEST)",
      top_match_profession: "Kaufmann/-frau für Büromanagement",
      top_match_city: "Hamburg",
      top_match_distance: "8 km",
      top_match_label: "Direktes Match",
      radius_label: "25 km",
      inclusion_hint: "Darunter befindet sich 1 Inklusions-Match.",
      dashboard_url: PORTAL_URL,
      login_url: LOGIN_URL,
      support_name: "AzubiMatch | Unternehmensservice [TEST]"
    })
  }
];

// ── Senden ───────────────────────────────────────────────────────────────────
console.log(`\nAzubiMatch Mail-Test → ${RECIPIENT}\n${"─".repeat(50)}`);

for (const mail of mails) {
  await send(mail);
}

console.log("\nFertig.");

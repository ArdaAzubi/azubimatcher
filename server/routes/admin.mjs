import { Router } from 'express';
import pool from '../db.mjs';

const router = Router();

const TRAFFIC_TEST_TARGETS = Object.freeze({
  homepage: {
    label: 'Startseite',
    url: 'https://azubimatcher.com/'
  },
  themeCss: {
    label: 'Theme-CSS',
    url: 'https://azubimatcher.com/wp-content/themes/azubimatch-strato/style.css'
  },
  wpLogin: {
    label: 'WordPress-Login',
    url: 'https://azubimatcher.com/wp-login.php'
  }
});

const PROFILE_REMINDER_TYPE = 'profile_completion_day_1';

function toBooleanEnv(value, fallback = false) {
  if (value == null || value === '') return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return fallback;
}

function resolvePortalBaseUrl(req) {
  const configured = String(process.env.AZUBIMATCH_PORTAL_BASE_URL || '').trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }
  const fromRequest = resolveServerOrigin(req);
  if (fromRequest) {
    return fromRequest.replace(/\/$/, '');
  }
  return 'https://azubimatcher.com';
}

function resolveReminderMailConfig() {
  const endpoint = String(process.env.AZUBIMATCH_REMINDER_MAIL_ENDPOINT || '').trim();
  const apiKey = String(process.env.AZUBIMATCH_REMINDER_MAIL_API_KEY || '').trim();
  const enabled = toBooleanEnv(process.env.AZUBIMATCH_PROFILE_REMINDER_ENABLED, true);
  return { endpoint, apiKey, enabled };
}

function escapeReminderMailHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildReminderMailPayload(candidate, portalBaseUrl) {
  const roleLabel = candidate.role === 'firm' ? 'Unternehmensprofil' : 'Bewerberprofil';
  const profileUrl = candidate.role === 'firm'
    ? portalBaseUrl + '/firma_profil.html'
    : portalBaseUrl + '/bewerber_profil.html';
  const subject = 'AzubiMatcher: Bitte Profil vervollständigen';
  const salutationName = String(candidate.profile_name || '').trim();
  const salutation = salutationName ? ('Hallo ' + salutationName + ',') : 'Hallo,';
  const escapedSalutation = escapeReminderMailHtml(salutation);
  const escapedProfileUrl = escapeReminderMailHtml(profileUrl);
  const heroTitle = candidate.role === 'firm'
    ? 'Dein Unternehmensprofil ist fast startklar.'
    : 'Dein Profil ist fast startklar.';
  const benefitCopy = candidate.role === 'firm'
    ? 'Sobald dein Profil vollständig ist, kannst du passende Bewerbende besser einschätzen und schneller mit Interessierten in Kontakt kommen.'
    : 'Sobald dein Profil vollständig ist, kannst du passende Ausbildungsplätze besser einschätzen und schneller mit Unternehmen in Kontakt kommen.';
  const highlightCopy = candidate.role === 'firm'
    ? 'Je vollständiger dein Unternehmensprofil ist, desto besser können Bewerbende und Matching-Funktionen dein Angebot einordnen.'
    : 'Je vollständiger dein Profil ist, desto besser kann AzubiMatcher passende Ausbildungsplätze und Kontakte für dich sichtbar machen.';
  const text = [
    salutation,
    '',
    'dein Zugang zu AzubiMatcher ist bereits angelegt.',
    'Aktuell steht dein Konto aber noch im Status "Nur Konto", weil wichtige Angaben in deinem ' + roleLabel + ' fehlen.',
    '',
    benefitCopy,
    '',
    'Direkt zum Profil: ' + profileUrl,
    '',
    'Deine nächsten Schritte:',
    '1. Profil öffnen',
    '2. Fehlende Angaben ergänzen',
    '3. Matching und Kontakte nutzen',
    '',
    'Viele Grüße',
    'AzubiMatcher Team'
  ].join('\n');
  const html = [
    '<!DOCTYPE html>',
    '<html lang="de">',
    '<head>',
    '  <meta charset="UTF-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
    '  <title>AzubiMatcher Erinnerung</title>',
    '</head>',
    '<body style="margin:0; padding:0; background:#f4efe7; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">',
    '  <div style="display:none; max-height:0; max-width:0; overflow:hidden; opacity:0; mso-hide:all; font-size:1px; line-height:1px; color:transparent; white-space:nowrap;">Dein Profil ist fast startklar. Ergänze nur noch die fehlenden Angaben, damit du Matching und Kontakte nutzen kannst.</div>',
    '  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4efe7; margin:0; padding:0 0 24px; border-collapse:separate; border-spacing:0; mso-table-lspace:0pt; mso-table-rspace:0pt;">',
    '    <tr>',
    '      <td align="center" style="padding:0;">',
    '        <table role="presentation" width="680" cellspacing="0" cellpadding="0" border="0" style="width:680px; max-width:680px; margin:0 auto; border-collapse:separate; border-spacing:0; mso-table-lspace:0pt; mso-table-rspace:0pt; background:#fffaf4; border:1px solid #ddd2c5; border-radius:20px; overflow:hidden; font-family:Georgia, \"Times New Roman\", serif; color:#1e2430;">',
    '          <tr>',
    '            <td style="padding:32px 36px; background:linear-gradient(135deg, #123b4f, #0d6a58); color:#fffdf8;">',
    '              <div style="display:inline-block; padding:10px 16px; border-radius:14px; background:rgba(255,255,255,0.15); font-size:28px; font-weight:700; margin-bottom:18px;">AzubiMatcher</div>',
    '              <div style="font-size:13px; letter-spacing:0.08em; text-transform:uppercase; opacity:0.84; margin-bottom:14px;">Profil vervollständigen</div>',
    '              <h1 style="margin:0 0 14px; font-size:34px; line-height:1.1; font-weight:700;">' + escapeReminderMailHtml(heroTitle) + '</h1>',
    '              <p style="margin:0; font-size:18px; line-height:1.6; color:rgba(255,253,248,0.86);">Ergänze nur noch die fehlenden Angaben, damit du Matching und direkte Kontakte vollständig nutzen kannst.</p>',
    '            </td>',
    '          </tr>',
    '          <tr>',
    '            <td style="padding:32px 36px 18px; font-size:18px; line-height:1.7; color:#5e6778;">',
    '              <p style="margin:0 0 18px;">' + escapedSalutation + '</p>',
    '              <p style="margin:0 0 18px;">dein Zugang zu <strong>AzubiMatcher</strong> ist bereits angelegt. Aktuell steht dein Konto aber noch im Status <strong>"Nur Konto"</strong>, weil wichtige Angaben in deinem <strong>' + escapeReminderMailHtml(roleLabel) + '</strong> fehlen.</p>',
    '              <p style="margin:0;">' + escapeReminderMailHtml(benefitCopy) + '</p>',
    '            </td>',
    '          </tr>',
    '          <tr>',
    '            <td style="padding:0 36px 12px;">',
    '              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">',
    '                <tr>',
    '                  <td style="padding:0 0 16px;">',
    '                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff; border:1px solid #ddd2c5; border-radius:16px;">',
    '                      <tr>',
    '                        <td style="padding:20px 22px;">',
    '                          <h2 style="margin:0 0 10px; font-size:21px; line-height:1.3; color:#1e2430;">Deine nächsten Schritte</h2>',
    '                          <ol style="margin:0; padding-left:20px; color:#5e6778; font-size:17px; line-height:1.7;">',
    '                            <li>Öffne dein Profil direkt über den Button unten</li>',
    '                            <li>Ergänze die fehlenden Angaben und speichere sie ab</li>',
    '                            <li>Nutze danach Matching und direkte Kontakte vollständig</li>',
    '                          </ol>',
    '                        </td>',
    '                      </tr>',
    '                    </table>',
    '                  </td>',
    '                </tr>',
    '                <tr>',
    '                  <td style="padding:0 0 16px;">',
    '                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#dff4ec; border:1px solid #b7e0d3; border-radius:16px;">',
    '                      <tr>',
    '                        <td style="padding:20px 22px;">',
    '                          <h2 style="margin:0 0 10px; font-size:21px; line-height:1.3; color:#0b5d4d;">Warum sich das lohnt</h2>',
    '                          <p style="margin:0; font-size:17px; line-height:1.7; color:#24594e;">' + escapeReminderMailHtml(highlightCopy) + '</p>',
    '                        </td>',
    '                      </tr>',
    '                    </table>',
    '                  </td>',
    '                </tr>',
    '              </table>',
    '            </td>',
    '          </tr>',
    '          <tr>',
    '            <td style="padding:6px 36px 12px;">',
    '              <a href="' + escapedProfileUrl + '" style="display:inline-block; padding:15px 24px; background:#0d7a64; color:#ffffff; text-decoration:none; font-size:17px; font-weight:700; border-radius:999px;">Profil jetzt vervollständigen</a>',
    '            </td>',
    '          </tr>',
    '          <tr>',
    '            <td style="padding:0 36px 12px; font-size:14px; line-height:1.6; color:#7b8596;">',
    '              Falls der Button nicht funktioniert, öffne diesen Link direkt:<br>',
    '              <a href="' + escapedProfileUrl + '" style="color:#0d6a58; text-decoration:underline;">' + escapedProfileUrl + '</a>',
    '            </td>',
    '          </tr>',
    '          <tr>',
    '            <td style="padding:12px 36px 28px; font-size:17px; line-height:1.7; color:#5e6778;">',
    '              Viele Grüße<br>',
    '              <strong style="color:#1e2430;">AzubiMatcher Team</strong>',
    '            </td>',
    '          </tr>',
    '        </table>',
    '      </td>',
    '    </tr>',
    '  </table>',
    '</body>',
    '</html>'
  ].join('');

  return {
    to: candidate.email,
    subject,
    text,
    html
  };
}

async function sendReminderMail(payload, mailConfig) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'AzubiMatchReminderJob/1.0'
  };

  if (mailConfig.apiKey) {
    headers['X-API-Key'] = mailConfig.apiKey;
  }

  const response = await fetch(mailConfig.endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  let responseData = null;
  try {
    responseData = await response.json();
  } catch (_err) {
    responseData = null;
  }

  if (!response.ok) {
    const reason = responseData?.error ? String(responseData.error) : ('HTTP ' + response.status);
    throw new Error(reason);
  }
}

async function ensureReminderSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS profile_completion_reminders (
      id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reminder_type VARCHAR(80) NOT NULL,
      sent_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      metadata JSONB,
      UNIQUE (user_id, reminder_type)
    )
  `);
}

async function loadProfileReminderCandidates() {
  const result = await pool.query(
    `SELECT
      u.id,
      u.email,
      u.role,
      u.created_at,
      COALESCE(NULLIF(TRIM(sp.name), ''), NULLIF(TRIM(fp.firmenname), '')) AS profile_name,
      CASE
        WHEN u.role = 'student' THEN (sp.user_id IS NULL OR COALESCE(sp.registrierung_abgeschlossen, FALSE) = FALSE)
        WHEN u.role = 'firm' THEN (
          fp.user_id IS NULL
          OR NULLIF(TRIM(fp.firmenname), '') IS NULL
          OR NULLIF(TRIM(fp.stadt), '') IS NULL
          OR NULLIF(TRIM(fp.plz), '') IS NULL
          OR NULLIF(TRIM(fp.branche), '') IS NULL
          OR NULLIF(TRIM(fp.ausbildungsberufe), '') IS NULL
        )
        ELSE FALSE
      END AS is_account_only
    FROM users u
    LEFT JOIN student_profiles sp ON sp.user_id = u.id
    LEFT JOIN firm_profiles fp ON fp.user_id = u.id
    WHERE u.created_at <= (CURRENT_TIMESTAMP - INTERVAL '1 day')
      AND NOT EXISTS (
        SELECT 1 FROM profile_completion_reminders r
        WHERE r.user_id = u.id AND r.reminder_type = $1
      )
    ORDER BY u.created_at ASC
    LIMIT 500`,
    [PROFILE_REMINDER_TYPE]
  );

  return result.rows.filter((row) => {
    if (!row?.is_account_only) return false;
    const email = String(row.email || '').trim();
    return email !== '';
  });
}

async function runProfileCompletionReminderJob({ origin = 'manual', portalBaseUrl = '' } = {}) {
  const mailConfig = resolveReminderMailConfig();
  if (!mailConfig.enabled) {
    return {
      ok: true,
      skipped: true,
      reason: 'disabled',
      sent: 0,
      failed: 0,
      candidates: 0,
      origin
    };
  }
  if (!mailConfig.endpoint) {
    return {
      ok: false,
      skipped: true,
      reason: 'missing_mail_endpoint',
      sent: 0,
      failed: 0,
      candidates: 0,
      origin
    };
  }

  await ensureReminderSchema();
  const candidates = await loadProfileReminderCandidates();
  let sent = 0;
  const failures = [];

  for (const candidate of candidates) {
    try {
      const payload = buildReminderMailPayload(candidate, portalBaseUrl || 'https://azubimatcher.com');
      await sendReminderMail(payload, mailConfig);
      await pool.query(
        `INSERT INTO profile_completion_reminders (user_id, reminder_type, metadata)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, reminder_type) DO NOTHING`,
        [candidate.id, PROFILE_REMINDER_TYPE, JSON.stringify({ role: candidate.role, origin })]
      );
      sent += 1;
    } catch (err) {
      failures.push({
        userId: candidate.id,
        email: candidate.email,
        error: err?.message || 'unknown_error'
      });
    }
  }

  return {
    ok: failures.length === 0,
    skipped: false,
    origin,
    sent,
    failed: failures.length,
    candidates: candidates.length,
    failures
  };
}

function clampNumber(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function percentileFromSorted(sortedValues, percentile) {
  if (!Array.isArray(sortedValues) || sortedValues.length === 0) return 0;
  const index = Math.max(0, Math.min(sortedValues.length - 1, Math.ceil((percentile / 100) * sortedValues.length) - 1));
  return sortedValues[index];
}

function resolveServerOrigin(req) {
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  const forwardedHost = String(req.headers['x-forwarded-host'] || '').split(',')[0].trim();
  const protocol = forwardedProto || req.protocol || 'https';
  const host = forwardedHost || req.get('host') || '';
  if (!host) return '';
  return protocol + '://' + host;
}

async function runTrafficLoadProbe({ url, connections, durationSeconds, requestTimeoutMs = 8000 }) {
  const statusCounts = Object.create(null);
  const latencies = [];
  let requestCount = 0;
  let errorCount = 0;
  const startedAt = Date.now();
  const stopAt = startedAt + (durationSeconds * 1000);

  const workers = Array.from({ length: connections }, async () => {
    while (Date.now() < stopAt) {
      const requestStartedAt = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);

      try {
        const response = await fetch(url, {
          method: 'GET',
          cache: 'no-store',
          redirect: 'manual',
          signal: controller.signal,
          headers: {
            'User-Agent': 'AzubiMatchAdminTrafficProbe/1.0'
          }
        });

        const statusKey = String(response.status || 0);
        statusCounts[statusKey] = (statusCounts[statusKey] || 0) + 1;
        await response.arrayBuffer().catch(() => null);
      } catch (_err) {
        errorCount += 1;
        statusCounts.error = (statusCounts.error || 0) + 1;
      } finally {
        clearTimeout(timeoutId);
        const latencyMs = Math.max(0, Date.now() - requestStartedAt);
        latencies.push(latencyMs);
        requestCount += 1;
      }
    }
  });

  await Promise.all(workers);

  const endedAt = Date.now();
  const elapsedSeconds = Math.max(0.001, (endedAt - startedAt) / 1000);
  const sorted = latencies.slice().sort((a, b) => a - b);
  const avgLatency = sorted.length
    ? (sorted.reduce((sum, value) => sum + value, 0) / sorted.length)
    : 0;

  return {
    startedAt: new Date(startedAt).toISOString(),
    endedAt: new Date(endedAt).toISOString(),
    elapsedSeconds: Number(elapsedSeconds.toFixed(2)),
    requestCount,
    errorCount,
    requestsPerSecond: Number((requestCount / elapsedSeconds).toFixed(2)),
    statusCounts,
    latencyMs: {
      min: sorted.length ? sorted[0] : 0,
      p50: percentileFromSorted(sorted, 50),
      p95: percentileFromSorted(sorted, 95),
      p99: percentileFromSorted(sorted, 99),
      max: sorted.length ? sorted[sorted.length - 1] : 0,
      avg: Number(avgLatency.toFixed(2))
    }
  };
}

async function runRegistrationBurstProbe({ baseUrl, totalRequests, parallelism, requestTimeoutMs = 10000 }) {
  const statusCounts = Object.create(null);
  const latencies = [];
  let successCount = 0;
  let errorCount = 0;
  let completed = 0;

  const runId = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  const attemptedEmails = [];
  let cursor = 0;
  const startedAt = Date.now();

  const nextJobIndex = () => {
    if (cursor >= totalRequests) return null;
    const current = cursor;
    cursor += 1;
    return current;
  };

  const workers = Array.from({ length: parallelism }, async () => {
    while (true) {
      const index = nextJobIndex();
      if (index === null) break;

      const email = 'burst-' + runId + '-' + String(index + 1).padStart(3, '0') + '@azubimatcher-test.invalid';
      attemptedEmails.push(email);

      const password = 'Burst_' + Math.random().toString(36).slice(2, 10) + '9A!';
      const requestStartedAt = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);

      try {
        const response = await fetch(baseUrl + '/api/auth/register', {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'AzubiMatchAdminRegistrationBurst/1.0'
          },
          body: JSON.stringify({
            email,
            password,
            role: 'student'
          })
        });

        const statusKey = String(response.status || 0);
        statusCounts[statusKey] = (statusCounts[statusKey] || 0) + 1;
        if (response.ok) {
          successCount += 1;
        }
        await response.arrayBuffer().catch(() => null);
      } catch (_err) {
        errorCount += 1;
        statusCounts.error = (statusCounts.error || 0) + 1;
      } finally {
        clearTimeout(timeoutId);
        const latencyMs = Math.max(0, Date.now() - requestStartedAt);
        latencies.push(latencyMs);
        completed += 1;
      }
    }
  });

  await Promise.all(workers);

  let cleanupDeletedUsers = 0;
  try {
    if (attemptedEmails.length > 0) {
      const cleanupResult = await pool.query(
        'DELETE FROM users WHERE email = ANY($1::text[])',
        [attemptedEmails]
      );
      cleanupDeletedUsers = Number(cleanupResult.rowCount || 0);
    }
  } catch (cleanupError) {
    console.error('[admin/registration-burst cleanup]', cleanupError.message);
  }

  const endedAt = Date.now();
  const elapsedSeconds = Math.max(0.001, (endedAt - startedAt) / 1000);
  const sorted = latencies.slice().sort((a, b) => a - b);
  const avgLatency = sorted.length
    ? (sorted.reduce((sum, value) => sum + value, 0) / sorted.length)
    : 0;

  return {
    startedAt: new Date(startedAt).toISOString(),
    endedAt: new Date(endedAt).toISOString(),
    elapsedSeconds: Number(elapsedSeconds.toFixed(2)),
    totalRequests,
    completedRequests: completed,
    successCount,
    errorCount,
    requestsPerSecond: Number((completed / elapsedSeconds).toFixed(2)),
    statusCounts,
    cleanup: {
      attemptedEmails: attemptedEmails.length,
      deletedUsers: cleanupDeletedUsers
    },
    latencyMs: {
      min: sorted.length ? sorted[0] : 0,
      p50: percentileFromSorted(sorted, 50),
      p95: percentileFromSorted(sorted, 95),
      p99: percentileFromSorted(sorted, 99),
      max: sorted.length ? sorted[sorted.length - 1] : 0,
      avg: Number(avgLatency.toFixed(2))
    }
  };
}

// Admin-Authentifizierung über statisches Secret (Env-Variable)
function requireAdmin(req, res, next) {
  const secret = process.env.AZUBIMATCH_ADMIN_SECRET;
  if (!secret) {
    return res.status(503).json({ error: 'Admin-Zugang nicht konfiguriert.' });
  }
  const authHeader = req.headers['authorization'] ?? '';
  const provided = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!provided || provided !== secret) {
    return res.status(403).json({ error: 'Ungültiger Admin-Token.' });
  }
  next();
}

// Sicherstellen, dass alle Tabellen mit erweiterten Feldern existieren
async function ensureExtendedSchema() {
  // student_profiles erweitern
  const studentCols = [
    'kurzprofil_einzeiler TEXT',
    'besondere_faehigkeiten TEXT',
    'abgeschlossene_ausbildung TEXT',
    'behinderung VARCHAR(100)',
    'behinderungs_art VARCHAR(200)',
    'behinderungs_grad VARCHAR(50)',
    'grundschule_von VARCHAR(20)',
    'grundschule_bis VARCHAR(20)',
    'weiterfuehrende_von VARCHAR(20)',
    'weiterfuehrende_schulform VARCHAR(100)',
    'weiterfuehrende_bis VARCHAR(20)',
    'wahlfach VARCHAR(100)',
    'note_mathe VARCHAR(10)',
    'note_deutsch VARCHAR(10)',
    'note_englisch VARCHAR(10)',
    'note_wahlfach VARCHAR(10)',
    'profilbid VARCHAR(30)',
    'profil_code VARCHAR(20)',
    'verified BOOLEAN DEFAULT FALSE',
    'registrierung_abgeschlossen BOOLEAN DEFAULT FALSE',
    'vollprofil_freigegeben BOOLEAN DEFAULT FALSE',
    'user_email VARCHAR(320)',
    'berufswunsch VARCHAR(200)',
    'match_umkreis INTEGER DEFAULT 25',
  ];
  for (const col of studentCols) {
    const colName = col.split(' ')[0];
    await pool.query(
      `ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS ${col}`
    ).catch(() => {});
  }

  // firm_profiles erweitern
  const firmCols = [
    'kontaktperson VARCHAR(200)',
    'telefon VARCHAR(60)',
    'email VARCHAR(320)',
    'profilbid VARCHAR(30)',
    'verified BOOLEAN DEFAULT FALSE',
    'user_email VARCHAR(320)',
  ];
  for (const col of firmCols) {
    await pool.query(
      `ALTER TABLE firm_profiles ADD COLUMN IF NOT EXISTS ${col}`
    ).catch(() => {});
  }

  await ensureReminderSchema().catch(() => {});
}

ensureExtendedSchema().catch((err) =>
  console.error('[admin] Schema-Erweiterung fehlgeschlagen:', err.message)
);

// GET /api/admin/stats
router.get('/stats', requireAdmin, async (_req, res) => {
  try {
    const [usersResult, studentsResult, firmsResult, verifiedStudents, verifiedFirms] =
      await Promise.all([
        pool.query('SELECT COUNT(*) FROM users'),
        pool.query("SELECT COUNT(*) FROM users WHERE role = 'student'"),
        pool.query("SELECT COUNT(*) FROM users WHERE role = 'firm'"),
        pool.query('SELECT COUNT(*) FROM student_profiles WHERE verified = TRUE'),
        pool.query('SELECT COUNT(*) FROM firm_profiles WHERE verified = TRUE'),
      ]);
    return res.json({
      totalUsers: Number(usersResult.rows[0].count),
      totalStudents: Number(studentsResult.rows[0].count),
      totalFirms: Number(firmsResult.rows[0].count),
      verifiedStudents: Number(verifiedStudents.rows[0].count),
      verifiedFirms: Number(verifiedFirms.rows[0].count),
    });
  } catch (err) {
    console.error('[admin/stats]', err.message);
    return res.status(500).json({ error: 'Statistiken konnten nicht geladen werden.' });
  }
});

// POST /api/admin/traffic-test
router.post('/traffic-test', requireAdmin, async (req, res) => {
  const body = req.body ?? {};
  const targetKey = String(body.targetKey || 'themeCss').trim();
  const target = TRAFFIC_TEST_TARGETS[targetKey];

  if (!target) {
    return res.status(400).json({
      error: 'Ungültiger Test-Endpunkt.',
      availableTargets: Object.keys(TRAFFIC_TEST_TARGETS)
    });
  }

  const connections = Math.round(clampNumber(body.connections, 1, 30, 8));
  const durationSeconds = Math.round(clampNumber(body.durationSeconds, 5, 60, 12));

  try {
    const result = await runTrafficLoadProbe({
      url: target.url,
      connections,
      durationSeconds
    });

    return res.json({
      success: true,
      target: {
        key: targetKey,
        label: target.label,
        url: target.url
      },
      config: {
        connections,
        durationSeconds
      },
      result
    });
  } catch (err) {
    console.error('[admin/traffic-test]', err.message);
    return res.status(500).json({ error: 'Traffic-Test konnte nicht ausgeführt werden.' });
  }
});

// POST /api/admin/registration-burst-test
router.post('/registration-burst-test', requireAdmin, async (req, res) => {
  const body = req.body ?? {};
  const totalRequests = Math.round(clampNumber(body.totalRequests, 5, 120, 20));
  const parallelism = Math.round(clampNumber(body.parallelism, 1, 20, 5));
  const baseUrl = resolveServerOrigin(req);

  if (!baseUrl) {
    return res.status(500).json({ error: 'Server-URL konnte nicht ermittelt werden.' });
  }

  try {
    const result = await runRegistrationBurstProbe({
      baseUrl,
      totalRequests,
      parallelism
    });

    return res.json({
      success: true,
      config: {
        totalRequests,
        parallelism
      },
      result
    });
  } catch (err) {
    console.error('[admin/registration-burst-test]', err.message);
    return res.status(500).json({ error: 'Registrierungsburst-Test konnte nicht ausgeführt werden.' });
  }
});

// GET /api/admin/users?role=student|firm&q=suche&limit=100&offset=0
router.get('/users', requireAdmin, async (req, res) => {
  const { role, q, limit = 100, offset = 0 } = req.query;
  const lim = Math.min(Number(limit) || 100, 500);
  const off = Number(offset) || 0;

  try {
    let query = `
      SELECT
        u.id,
        u.email,
        u.role,
        u.created_at,
        sp.id            AS student_profile_id,
        sp.name          AS student_name,
        sp.stadt         AS student_stadt,
        sp.plz           AS student_plz,
        sp.beruf         AS student_beruf,
        sp.schulabschluss,
        sp.sprachen,
        sp.kurzprofil_einzeiler,
        sp.besondere_faehigkeiten,
        sp.behinderung,
        sp.behinderungs_art,
        sp.behinderungs_grad,
        sp.verified      AS student_verified,
        sp.registrierung_abgeschlossen,
        sp.vollprofil_freigegeben,
        sp.profilbid,
        sp.profil_code,
        sp.berufswunsch,
        sp.match_umkreis AS student_umkreis,
        sp.updated_at    AS student_updated_at,
        fp.id            AS firm_profile_id,
        fp.firmenname,
        fp.stadt         AS firm_stadt,
        fp.plz           AS firm_plz,
        fp.branche,
        fp.ausbildungsberufe,
        fp.beschreibung,
        fp.website,
        fp.kontaktperson,
        fp.telefon,
        fp.email         AS firm_email,
        fp.verified      AS firm_verified,
        fp.match_umkreis AS firm_umkreis,
        fp.updated_at    AS firm_updated_at,
        CASE
          WHEN u.role = 'student' AND (sp.user_id IS NULL OR COALESCE(sp.registrierung_abgeschlossen, FALSE) = FALSE) THEN 'Nur Konto'
          WHEN u.role = 'firm' AND (
            fp.user_id IS NULL
            OR NULLIF(TRIM(fp.firmenname), '') IS NULL
            OR NULLIF(TRIM(fp.stadt), '') IS NULL
            OR NULLIF(TRIM(fp.plz), '') IS NULL
            OR NULLIF(TRIM(fp.branche), '') IS NULL
            OR NULLIF(TRIM(fp.ausbildungsberufe), '') IS NULL
          ) THEN 'Nur Konto'
          WHEN u.role = 'student' AND COALESCE(sp.verified, FALSE) = TRUE THEN 'Verifiziert'
          WHEN u.role = 'firm' AND COALESCE(fp.verified, FALSE) = TRUE THEN 'Verifiziert'
          ELSE 'Offen'
        END AS account_status
      FROM users u
      LEFT JOIN student_profiles sp ON sp.user_id = u.id
      LEFT JOIN firm_profiles fp ON fp.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (role === 'student' || role === 'firm') {
      params.push(role);
      query += ` AND u.role = $${params.length}`;
    }

    if (q) {
      params.push(`%${q.toLowerCase()}%`);
      const n = params.length;
      query += ` AND (
        LOWER(u.email) LIKE $${n}
        OR LOWER(sp.name) LIKE $${n}
        OR LOWER(sp.beruf) LIKE $${n}
        OR LOWER(sp.stadt) LIKE $${n}
        OR LOWER(fp.firmenname) LIKE $${n}
        OR LOWER(fp.branche) LIKE $${n}
      )`;
    }

    query += ` ORDER BY u.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(lim, off);

    const result = await pool.query(query, params);

    // Gesamtanzahl für Pagination
    let countQuery = `SELECT COUNT(*) FROM users u
      LEFT JOIN student_profiles sp ON sp.user_id = u.id
      LEFT JOIN firm_profiles fp ON fp.user_id = u.id
      WHERE 1=1`;
    const countParams = [];
    if (role === 'student' || role === 'firm') {
      countParams.push(role);
      countQuery += ` AND u.role = $${countParams.length}`;
    }
    if (q) {
      countParams.push(`%${q.toLowerCase()}%`);
      const n = countParams.length;
      countQuery += ` AND (LOWER(u.email) LIKE $${n} OR LOWER(sp.name) LIKE $${n} OR LOWER(sp.beruf) LIKE $${n} OR LOWER(sp.stadt) LIKE $${n} OR LOWER(fp.firmenname) LIKE $${n} OR LOWER(fp.branche) LIKE $${n})`;
    }
    const countResult = await pool.query(countQuery, countParams);

    return res.json({
      total: Number(countResult.rows[0].count),
      limit: lim,
      offset: off,
      users: result.rows,
    });
  } catch (err) {
    console.error('[admin/users]', err.message);
    return res.status(500).json({ error: 'Nutzer konnten nicht geladen werden.' });
  }
});

// GET /api/admin/user/:id  – Einzelner Nutzer mit vollständigem Profil
router.get('/user/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Ungültige ID.' });

  try {
    const result = await pool.query(
      `SELECT u.*, sp.*, fp.*
       FROM users u
       LEFT JOIN student_profiles sp ON sp.user_id = u.id
       LEFT JOIN firm_profiles fp ON fp.user_id = u.id
       WHERE u.id = $1`,
      [id]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Nicht gefunden.' });
    const row = { ...result.rows[0] };
    delete row.password; // Passwort-Hash niemals zurückgeben
    return res.json({ user: row });
  } catch (err) {
    console.error('[admin/user/:id]', err.message);
    return res.status(500).json({ error: 'Nutzer konnte nicht geladen werden.' });
  }
});

// PATCH /api/admin/user/:id/verify  – Student oder Firma verifizieren/sperren
router.patch('/user/:id/verify', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Ungültige ID.' });
  const { verified, role } = req.body ?? {};

  try {
    const table = role === 'firm' ? 'firm_profiles' : 'student_profiles';
    await pool.query(
      `UPDATE ${table} SET verified = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2`,
      [!!verified, id]
    );
    return res.json({ ok: true, verified: !!verified });
  } catch (err) {
    console.error('[admin/user/:id/verify]', err.message);
    return res.status(500).json({ error: 'Status konnte nicht gesetzt werden.' });
  }
});

// DELETE /api/admin/user/:id  – Nutzer löschen (CASCADE löscht Profile mit)
router.delete('/user/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Ungültige ID.' });

  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Nicht gefunden.' });
    return res.json({ ok: true, deleted: id });
  } catch (err) {
    console.error('[admin/user/:id DELETE]', err.message);
    return res.status(500).json({ error: 'Nutzer konnte nicht gelöscht werden.' });
  }
});

// POST /api/admin/profile-reminders/run – Erinnerungsmails fuer "Nur Konto" senden
router.post('/profile-reminders/run', requireAdmin, async (req, res) => {
  try {
    const portalBaseUrl = resolvePortalBaseUrl(req);
    const result = await runProfileCompletionReminderJob({
      origin: 'admin_api',
      portalBaseUrl
    });
    if (!result.ok && result.reason === 'missing_mail_endpoint') {
      return res.status(503).json({
        error: 'Mail-Endpoint fuer Erinnerungen ist nicht konfiguriert (AZUBIMATCH_REMINDER_MAIL_ENDPOINT).',
        result
      });
    }
    return res.json({ success: true, result });
  } catch (err) {
    console.error('[admin/profile-reminders/run]', err.message);
    return res.status(500).json({ error: 'Erinnerungsmails konnten nicht versendet werden.' });
  }
});

export { runProfileCompletionReminderJob, resolvePortalBaseUrl };

export default router;

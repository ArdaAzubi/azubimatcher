import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.mjs';
import studentRoutes from './routes/student.mjs';
import firmRoutes from './routes/firm.mjs';
import adminRoutes from './routes/admin.mjs';
import { runProfileCompletionReminderJob } from './routes/admin.mjs';

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

// CORS – erlaubt Anfragen vom lokalen Frontend, Strato und Vercel
const allowedOrigins = new Set([
  'http://127.0.0.1:8091',
  'http://localhost:8091',
  'http://127.0.0.1:3000',
  'http://localhost:3000',
  'http://127.0.0.1:4176',
  'https://azubimatcher.com',
  'http://azubimatcher.com',
  // Produktions-Frontend (Vercel) – wird per Env-Variable gesetzt
  ...(process.env.ALLOWED_ORIGIN ? [process.env.ALLOWED_ORIGIN] : []),
]);

const localDevOriginPattern = /^http:\/\/(127\.0\.0\.1|localhost):(3000|4176|8091)$/;
// Vercel Preview-Deploys: https://<projekt>-<hash>-<team>.vercel.app
const vercelPreviewPattern = /^https:\/\/[a-zA-Z0-9-]+-[a-zA-Z0-9]+-[a-zA-Z0-9-]+\.vercel\.app$/;

const corsOptions = {
  origin: (origin, cb) => {
    if (
      !origin ||
      allowedOrigins.has(origin) ||
      localDevOriginPattern.test(origin) ||
      vercelPreviewPattern.test(origin)
    ) {
      return cb(null, true);
    }

    return cb(null, false);
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.options('/api/*path', cors(corsOptions));

app.use(express.json({ limit: '1mb' }));

// Routen
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/firm', firmRoutes);
app.use('/api/admin', adminRoutes);

function toBooleanEnv(value, fallback = false) {
  if (value == null || value === '') return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return fallback;
}

function startProfileReminderScheduler() {
  const schedulerEnabled = toBooleanEnv(process.env.AZUBIMATCH_PROFILE_REMINDER_SCHEDULER_ENABLED, true);
  if (!schedulerEnabled) {
    console.log('[profile-reminder] Scheduler deaktiviert.');
    return;
  }

  const intervalMsRaw = Number(process.env.AZUBIMATCH_PROFILE_REMINDER_SCHEDULER_INTERVAL_MS || 3600000);
  const intervalMs = Number.isFinite(intervalMsRaw) && intervalMsRaw >= 60000 ? intervalMsRaw : 3600000;
  const startupDelayMs = 30000;
  let running = false;

  const runOnce = async () => {
    if (running) return;
    running = true;
    try {
      const result = await runProfileCompletionReminderJob({
        origin: 'scheduler',
        portalBaseUrl: String(process.env.AZUBIMATCH_PORTAL_BASE_URL || 'https://azubimatcher.com').replace(/\/$/, '')
      });
      if (result.skipped) {
        console.log('[profile-reminder] Skip:', result.reason || 'unknown');
      } else {
        console.log('[profile-reminder] Lauf abgeschlossen. Kandidaten:', result.candidates, 'Gesendet:', result.sent, 'Fehler:', result.failed);
      }
    } catch (err) {
      console.error('[profile-reminder] Scheduler-Fehler:', err?.message || err);
    } finally {
      running = false;
    }
  };

  setTimeout(() => {
    runOnce().catch(() => {});
  }, startupDelayMs);

  setInterval(() => {
    runOnce().catch(() => {});
  }, intervalMs);

  console.log('[profile-reminder] Scheduler aktiv. Intervall (ms):', intervalMs);
}

// Health-Check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 404 fuer unbekannte API-Pfade
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Endpunkt nicht gefunden.' });
});

// Auf Railway muss auf 0.0.0.0 gelauscht werden; lokal bleibt 127.0.0.1
const listenHost = process.env.RAILWAY_ENVIRONMENT ? '0.0.0.0' : '127.0.0.1';

app.listen(PORT, listenHost, () => {
  console.log(`AzubiMatch API laeuft auf http://127.0.0.1:${PORT}`);
  console.log('Endpunkte:');
  console.log('  POST /api/auth/register');
  console.log('  POST /api/auth/login');
  console.log('  GET  /api/auth/me');
  console.log('  GET  /api/student/profile  (JWT erforderlich)');
  console.log('  PUT  /api/student/profile  (JWT erforderlich)');
  console.log('  GET  /api/firm/profile     (JWT erforderlich)');
  console.log('  PUT  /api/firm/profile     (JWT erforderlich)');
  console.log('  GET  /api/health');
  console.log('  GET  /api/admin/stats      (Admin-Token)');
  console.log('  GET  /api/admin/users      (Admin-Token)');
  console.log('  GET  /api/admin/user/:id   (Admin-Token)');
  console.log('  PATCH /api/admin/user/:id/verify (Admin-Token)');
  console.log('  DELETE /api/admin/user/:id (Admin-Token)');
  console.log('  POST /api/admin/traffic-test (Admin-Token)');
  console.log('  POST /api/admin/registration-burst-test (Admin-Token)');
  console.log('  POST /api/admin/profile-reminders/run (Admin-Token)');
  startProfileReminderScheduler();
});

export default app;

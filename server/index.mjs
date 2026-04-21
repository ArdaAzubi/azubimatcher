import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.mjs';
import studentRoutes from './routes/student.mjs';
import firmRoutes from './routes/firm.mjs';

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
});

export default app;

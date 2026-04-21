import pg from 'pg';

const { Pool } = pg;

// Railway stellt DATABASE_URL bereit; lokal werden einzelne Variablen genutzt.
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 8000,
    })
  : new Pool({
      host: process.env.AZUBIMATCH_DB_HOST ?? '127.0.0.1',
      port: Number(process.env.AZUBIMATCH_DB_PORT ?? 5432),
      database: process.env.AZUBIMATCH_DB_NAME ?? 'azubimatch',
      user: process.env.AZUBIMATCH_DB_USER ?? 'azubimatch_app',
      password: process.env.AZUBIMATCH_DB_PASSWORD,
      ssl: process.env.AZUBIMATCH_DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 8000,
    });

export default pool;

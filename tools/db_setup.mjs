/**
 * AzubiMatch – Node.js PostgreSQL-Verbindungscheck und Basis-Setup
 * Ausfuehren: node tools/db_setup.mjs
 *
 * Pflicht-Umgebungsvariablen (oder Standardwerte werden genutzt):
 *   AZUBIMATCH_DB_HOST     (Standard: 127.0.0.1)
 *   AZUBIMATCH_DB_PORT     (Standard: 5432)
 *   AZUBIMATCH_DB_NAME     (Standard: azubimatch)
 *   AZUBIMATCH_DB_USER     (Standard: azubimatch_app)
 *   AZUBIMATCH_DB_PASSWORD (Pflicht)
 */

import pg from 'pg';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { Pool } = pg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const schemaPath = path.join(rootDir, 'database', 'postgresql', 'setup.sql');

const pool = new Pool({
  host: process.env.AZUBIMATCH_DB_HOST ?? '127.0.0.1',
  port: Number(process.env.AZUBIMATCH_DB_PORT ?? 5432),
  database: process.env.AZUBIMATCH_DB_NAME ?? 'azubimatch',
  user: process.env.AZUBIMATCH_DB_USER ?? 'azubimatch_app',
  password: process.env.AZUBIMATCH_DB_PASSWORD,
  ssl: process.env.AZUBIMATCH_DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 8000,
});

async function main() {
  const client = await pool.connect();
  try {
    const versionResult = await client.query('SELECT version()');
    console.log('Verbindung OK:', versionResult.rows[0].version.split(',')[0]);

    const countResult = await client.query('SELECT COUNT(*) AS cnt FROM users');
    console.log(`users-Tabelle erreichbar. Eintraege: ${countResult.rows[0].cnt}`);

    console.log('Node.js <-> PostgreSQL Setup abgeschlossen.');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Fehler:', err.message);
  process.exit(1);
});

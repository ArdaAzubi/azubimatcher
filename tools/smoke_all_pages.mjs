/**
 * Smoke-Check aller Seiten
 * Startet einen lokalen Static-HTTP-Server und prueft jede root-HTML-Seite
 * auf HTTP-Status, Dokumentstruktur und fehlende Script/Style-Ressourcen.
 *
 * Aufruf: node tools/smoke_all_pages.mjs
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PORT = 14239;
const BASE = `http://127.0.0.1:${PORT}`;

// ── Alle root-level App-Seiten ──────────────────────────────────────────────
const PAGES = [
  'index.html',
  'home.html',
  'anmeldung.html',
  'app.html',
  'admin.html',
  'bewerber.html',
  'bewerber_app.html',
  'bewerber_praktikum.html',
  'bewerber_profil.html',
  'firma.html',
  'firma_profil.html',
  'firma_praktikum.html',
  'firma_schnellprofil.html',
  'platform.html',
  'profil.html',
  'lehrberufe.html',
  'inklusion.html',
  'trainings.html',
  'ausbildung-sichern.html',
  'berufsfelder-markt.html',
  'datenschutzerklaerung.html',
  'impressum.html',
  'nutzungsbedingungen.html',
].filter(f => fs.existsSync(path.join(ROOT, f)));

// ── Mime-Types ───────────────────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.webp': 'image/webp',
  '.ico':  'image/x-icon',
  '.woff2':'font/woff2',
  '.webmanifest': 'application/manifest+json',
};

// ── Statischer Dateiserver ───────────────────────────────────────────────────
function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const raw = String(req.url || '/').split('?')[0];
      const rel = decodeURIComponent(raw === '/' ? '/index.html' : raw);
      const target = path.normalize(path.join(ROOT, rel));

      // Path-Traversal-Schutz
      if (!target.startsWith(ROOT + path.sep) && target !== ROOT) {
        res.writeHead(403); res.end('Forbidden'); return;
      }

      if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) {
        res.writeHead(404); res.end('Not Found'); return;
      }

      const ext = path.extname(target).toLowerCase();
      const mime = MIME[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mime });
      fs.createReadStream(target).pipe(res);
    });

    server.listen(PORT, '127.0.0.1', () => resolve(server));
  });
}

// ── Ressourcen aus HTML extrahieren (<script src>, <link href>, <img src>) ──
function extractAssets(html) {
  const assets = [];
  const patterns = [
    /< *script[^>]+src=["']([^"'?#]+)/gi,
    /< *link[^>]+href=["']([^"'?#]+)/gi,
    /< *img[^>]+src=["']([^"'?#]+)/gi,
  ];
  for (const re of patterns) {
    let m;
    re.lastIndex = 0;
    while ((m = re.exec(html)) !== null) {
      const url = m[1].trim();
      if (!url.startsWith('http') && !url.startsWith('//') && !url.startsWith('data:')) {
        assets.push(url);
      }
    }
  }
  return [...new Set(assets)];
}

// ── Einzelne Seite pruefen ───────────────────────────────────────────────────
async function checkPage(page) {
  const url = `${BASE}/${page}`;
  const issues = [];

  let html;
  try {
    const res = await fetch(url);
    if (res.status !== 200) {
      issues.push(`HTTP ${res.status}`);
      return { page, ok: false, issues };
    }
    html = await res.text();
  } catch (err) {
    issues.push(`Fetch-Fehler: ${err.message}`);
    return { page, ok: false, issues };
  }

  // Strukturpruefung
  if (!/<html[\s>]/i.test(html))   issues.push('kein <html>-Tag');
  if (!/<head[\s>]/i.test(html))   issues.push('kein <head>-Tag');
  if (!/<body[\s>]/i.test(html))   issues.push('kein <body>-Tag');
  if (!/<title[\s>]/i.test(html))  issues.push('kein <title>-Tag');

  // Doppeltes <html>/<body> (defektes Template-Compositing)
  const htmlCount  = (html.match(/<html[\s>]/gi)  || []).length;
  const bodyCount  = (html.match(/<body[\s>]/gi)  || []).length;
  const headCount  = (html.match(/<head[\s>]/gi)  || []).length;
  if (htmlCount  > 1) issues.push(`<html> ${htmlCount}× vorhanden`);
  if (bodyCount  > 1) issues.push(`<body> ${bodyCount}× vorhanden`);
  if (headCount  > 1) issues.push(`<head> ${headCount}× vorhanden`);

  // Fehlende lokale Ressourcen pruefen
  const assets = extractAssets(html);
  const missing = [];
  await Promise.all(assets.map(async (asset) => {
    try {
      const r = await fetch(`${BASE}/${asset.replace(/^\//, '')}`);
      if (r.status === 404) missing.push(asset);
    } catch { /* Netzwerkfehler ignorieren – Server laeuft lokal */ }
  }));
  if (missing.length) issues.push(`Fehlende Assets (${missing.length}): ${missing.join(', ')}`);

  return { page, ok: issues.length === 0, issues };
}

// ── Hauptprogramm ────────────────────────────────────────────────────────────
(async () => {
  console.log(`\nSmoke-Check: ${PAGES.length} Seite(n) werden geprueft …\n`);

  const server = await startServer();

  const results = [];
  for (const page of PAGES) {
    process.stdout.write(`  ${page.padEnd(35)}`);
    const result = await checkPage(page);
    results.push(result);
    if (result.ok) {
      console.log('✓ OK');
    } else {
      console.log(`✗ FEHLER`);
      for (const issue of result.issues) {
        console.log(`      → ${issue}`);
      }
    }
  }

  server.close();

  const failed = results.filter(r => !r.ok);
  console.log(`\n${'─'.repeat(60)}`);
  if (failed.length === 0) {
    console.log(`✓  Alle ${results.length} Seiten bestanden den Smoke-Check.\n`);
    process.exit(0);
  } else {
    console.log(`✗  ${failed.length} von ${results.length} Seiten haben Probleme:\n`);
    for (const r of failed) {
      console.log(`   ${r.page}`);
      for (const issue of r.issues) console.log(`     → ${issue}`);
    }
    console.log();
    process.exit(1);
  }
})();

/**
 * Diagnostic probe (not a test) — boots the app, restores the atlas fixture,
 * and dumps what masterStorage actually holds for 'gl-store' after reload.
 * Usage: node tests/e2e/_helpers/atlas-seed-probe.mjs
 */
import { chromium } from 'playwright';
import initSqlJs from 'sql.js';
import { createHash, createDecipheriv } from 'node:crypto';

const BASE = 'http://localhost:5173';

const COLUMN_MAPPING = [
  { sourceColumn: '', targetField: 'date', isRequired: true },
  { sourceColumn: '', targetField: 'accountCode', isRequired: true },
  { sourceColumn: '', targetField: 'debit', isRequired: false },
  { sourceColumn: '', targetField: 'credit', isRequired: false },
  { sourceColumn: '', targetField: 'description', isRequired: false },
  { sourceColumn: '', targetField: 'reference', isRequired: false },
];

const GL_ENTRIES = [
  { id: 'e1', accountCode: '4000', debit: 0, credit: 100000, period: '2026-01', date: '2026-01-15' },
  { id: 'e2', accountCode: '4000', debit: 0, credit: 120000, period: '2026-02', date: '2026-02-15' },
];

function canonicalJSON(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(canonicalJSON).join(',')}]`;
  const entries = Object.entries(value)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${JSON.stringify(k)}:${canonicalJSON(v)}`);
  return `{${entries.join(',')}}`;
}

function buildBackupJson(theme = 'dark') {
  const data = {
    'gl-store': {
      state: { entries: GL_ENTRIES, importHistory: [], columnMapping: COLUMN_MAPPING },
      version: 1,
    },
    'ui-store': {
      state: { sidebarCollapsed: false, theme, globalDateRange: { start: '2024-01-01', end: '2024-12-31' } },
      version: 1,
    },
  };
  const storeSizes = {};
  for (const [k, v] of Object.entries(data)) storeSizes[k] = canonicalJSON(v).length;
  const checksum = createHash('sha256').update(canonicalJSON(data)).digest('hex');
  return JSON.stringify(
    { metadata: { formatVersion: 2, appVersion: '1.0.0', exportedAt: '2026-01-01T00:00:00.000Z', storeSizes, checksum }, data },
    null,
    2
  );
}

const TAURI_SHIM = () => {
  Object.defineProperty(window, '__TAURI_INTERNALS__', { value: {}, configurable: true });
  localStorage.setItem('finplan-setup-complete', 'true');
};

const browser = await chromium.launch();
const page = await browser.newPage();
page.on('console', (msg) => {
  if (msg.type() === 'error' && !msg.text().includes('X-Frame') && !msg.text().includes('frame-ancestors') && !msg.text().includes('unsupported MIME') && !msg.text().includes('SW registration')) {
    console.log('CONSOLE:', msg.type(), msg.text().slice(0, 250));
  }
});
page.on('pageerror', (err) => console.log('PAGEERROR:', String(err).slice(0, 250)));

await page.addInitScript(TAURI_SHIM);
await page.goto(BASE + '/');
console.log('TITLE after boot:', await page.title());

await page.goto(BASE + '/settings/backup');
await page.locator('input[type="file"]').setInputFiles({
  name: 'probe.json',
  mimeType: 'application/json',
  buffer: Buffer.from(buildBackupJson()),
});
await page.getByRole('alert').waitFor({ timeout: 15000 });
console.log('ALERT:', (await page.getByRole('alert').innerText()).slice(0, 200));
await page.waitForTimeout(2500); // allow auto-reload

await page.goto(BASE + '/dashboard');
await page.waitForTimeout(3000);
console.log('DASHBOARD TEXT:', (await page.locator('main').innerText()).slice(0, 200).replace(/\n/g, ' | '));

const dbB64 = await page.evaluate(() => localStorage.getItem('finplan-sqljs-db'));
const keyB64 = await page.evaluate(() => localStorage.getItem('finplan.storage-key.v1'));
console.log('sqljs-db present:', dbB64 !== null, dbB64 ? `(${dbB64.length} chars)` : '');
if (dbB64 && keyB64) {
  const SQL = await initSqlJs({ locateFile: (f) => `node_modules/sql.js/dist/${f}` });
  const db = new SQL.Database(Buffer.from(dbB64, 'base64'));
  const key = Buffer.from(keyB64, 'base64');
  const keyHash = Buffer.from(createHash('sha256').update(key).digest());
  const res = db.exec('SELECT id, value FROM stores');
  for (const r of res) {
    for (const row of r.values) {
      const id = row[0];
      const combined = Buffer.from(row[1], 'base64');
      const iv = combined.subarray(0, 12);
      const ciphertext = combined.subarray(12);
      let plaintext;
      try {
        const decipher = createDecipheriv('aes-256-gcm', keyHash, iv);
        plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
      } catch (e) {
        plaintext = `DECRYPT FAILED: ${e.message}`;
      }
      console.log(`STORE ${id} (plaintext):`, plaintext.slice(0, 400));
    }
  }
  db.close();
}
await browser.close();

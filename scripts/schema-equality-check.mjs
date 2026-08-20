#!/usr/bin/env node
/**
 * W0.8.4 schema-fork equality gate.
 *
 * Two schema homes exist today:
 *   A. src-tauri/migrations/*.sql          (35-ish tables, the desktop SoR)
 *   B. server/src/db/*.ts in-code DDL      (auth, audit, period-close extras)
 *
 * This gate fails when a table is CREATE'd in BOTH homes with disagreeing
 * column names. Server-only and SQL-only tables are listed, not failed —
 * they are the documented split, not silent drift.
 *
 *   node scripts/schema-equality-check.mjs
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function extractCreateTables(sql) {
  const tables = new Map();
  const re = /CREATE TABLE(?: IF NOT EXISTS)?\s+["'`]?([A-Za-z_][A-Za-z0-9_]*)["'`]?\s*\(/gi;
  let match;
  while ((match = re.exec(sql))) {
    const name = match[1].toLowerCase();
    const start = match.index + match[0].length - 1;
    const body = sliceParen(sql, start);
    if (body === null) continue;
    tables.set(name, columnsFromBody(body));
  }
  return tables;
}

function sliceParen(text, openIndex) {
  if (text[openIndex] !== '(') return null;
  let depth = 0;
  for (let i = openIndex; i < text.length; i++) {
    const ch = text[i];
    if (ch === '(') depth += 1;
    else if (ch === ')') {
      depth -= 1;
      if (depth === 0) return text.slice(openIndex + 1, i);
    }
  }
  return null;
}

function columnsFromBody(body) {
  const cols = [];
  let current = '';
  let depth = 0;
  for (const ch of body) {
    if (ch === '(') depth += 1;
    if (ch === ')') depth -= 1;
    if (ch === ',' && depth === 0) {
      pushCol(cols, current);
      current = '';
    } else {
      current += ch;
    }
  }
  pushCol(cols, current);
  return cols;
}

function pushCol(cols, raw) {
  const line = raw.replace(/--.*$/gm, '').trim();
  if (!line) return;
  const upper = line.toUpperCase();
  if (
    upper.startsWith('PRIMARY KEY') ||
    upper.startsWith('FOREIGN KEY') ||
    upper.startsWith('UNIQUE') ||
    upper.startsWith('CHECK') ||
    upper.startsWith('CONSTRAINT')
  ) {
    return;
  }
  const ident = line.match(/^["'`]?([A-Za-z_][A-Za-z0-9_]*)["'`]?/);
  if (ident) cols.push(ident[1].toLowerCase());
}

function loadSqlHome() {
  const dir = join(ROOT, 'src-tauri/migrations');
  const merged = readdirSync(dir)
    .filter((f) => f.endsWith('.sql') && !f.includes('.test.'))
    .sort()
    .map((f) => readFileSync(join(dir, f), 'utf8'))
    .join('\n');
  return extractCreateTables(merged);
}

function loadServerHome() {
  const files = [
    'server/src/db/migrate.ts',
    'server/src/db/auditSchema.ts',
    'server/src/db/schema.ts',
    'server/src/middleware/entityAuth.ts',
  ];
  const merged = files
    .map((rel) => {
      try {
        return readFileSync(join(ROOT, rel), 'utf8');
      } catch {
        return '';
      }
    })
    .join('\n');
  return extractCreateTables(merged);
}

const sqlTables = loadSqlHome();
const serverTables = loadServerHome();

const sqlNames = [...sqlTables.keys()].sort();
const serverNames = [...serverTables.keys()].sort();
const shared = sqlNames.filter((n) => serverTables.has(n));
const sqlOnly = sqlNames.filter((n) => !serverTables.has(n));
const serverOnly = serverNames.filter((n) => !sqlTables.has(n));

const failures = [];
for (const name of shared) {
  const a = [...sqlTables.get(name)].sort();
  const b = [...serverTables.get(name)].sort();
  const onlySql = a.filter((c) => !b.includes(c));
  const onlyServer = b.filter((c) => !a.includes(c));
  if (onlySql.length || onlyServer.length) {
    failures.push(
      `shared table ${name}: SQL-only columns [${onlySql.join(', ')}] ` +
        `server-only columns [${onlyServer.join(', ')}]`
    );
  }
}

console.log('Schema homes:');
console.log(`  SQL   (src-tauri/migrations)  ${sqlNames.length} tables`);
console.log(`  server (in-code DDL)          ${serverNames.length} tables`);
console.log(`  shared                        ${shared.length}: ${shared.join(', ') || '—'}`);
console.log(`  SQL-only                      ${sqlOnly.length}: ${sqlOnly.join(', ')}`);
console.log(`  server-only                   ${serverOnly.length}: ${serverOnly.join(', ')}`);

if (failures.length) {
  console.error('\nSCHEMA EQUALITY FAILED (W0.8.4):\n');
  for (const f of failures) console.error(`  ✗ ${f}`);
  console.error(
    '\n  Shared tables must have the same column names in both homes.\n' +
      '  Move the definition to src-tauri/migrations/*.sql and keep in-code DDL additive (ALTER).'
  );
  process.exit(1);
}

console.log('✓ Shared tables agree on column names.');

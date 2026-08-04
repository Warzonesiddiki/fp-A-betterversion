#!/usr/bin/env node
/**
 * Money primitive adoption ratchet (N-0009).
 *
 * Audit ZCFA-2026-07-29-002 measured the canonical money primitive
 * (`src/utils/money.ts`, decimal.js-backed) in use by only 2 of 188 modules,
 * while 31 `toFixed(2)` sites in engines/stores were still being used as
 * financial truth and `FXEngine.convert` returned 0.07700000000000001.
 *
 * Migrating every financial path is a multi-week change. What must NOT happen
 * meanwhile is silent REGRESSION — new raw-float money code being added while
 * the migration is in flight. This script measures adoption and fails CI if
 * the count of raw float money sites INCREASES above the recorded baseline.
 *
 * Baseline is stored in scripts/money-adoption-baseline.json. Lowering the
 * baseline is the goal; raising it requires deleting this guard, which is a
 * visible act in review.
 *
 * Usage:
 *   node scripts/money-adoption.mjs            # check against baseline
 *   node scripts/money-adoption.mjs --update   # re-record baseline (must go DOWN)
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname, basename, relative } from 'node:path';

const ROOT = process.cwd();
const BASELINE_PATH = join(ROOT, 'scripts', 'money-adoption-baseline.json');
const isTest = (f) => /\.(test|bench|benchmark|spec)\.[tj]sx?$/.test(f);

/** Directories whose arithmetic is considered a FINANCIAL path. */
// 2026-08-04: src/workers added — the consolidation worker ran ASC 810 math
// (FX translation, eliminations, minority interest) on raw floats entirely
// outside the previous scan; financial workers are first-class financial
// paths and must be guarded like engines/stores/services.
const FINANCIAL_DIRS = ['src/engines', 'src/store', 'src/utils', 'src/services', 'src/workers'];

/**
 * Server financial paths (2026-08-04). The server is a separate package that
 * cannot import src/utils/money.ts across the package boundary, so its
 * canonical money usage is decimal.js directly (same engine, documented in
 * the migrated routes). It still gets the same ratchet treatment: adoption
 * must never drop and raw value-producing toFixed() must never appear.
 */
const SERVER_DIR = 'server/src';

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (['.ts', '.tsx'].includes(extname(p)) && !isTest(basename(p))) out.push(p);
  }
  return out;
}

const files = FINANCIAL_DIRS.flatMap((d) => walk(join(ROOT, d)));
const serverFiles = walk(join(ROOT, SERVER_DIR));

let usesMoney = 0;
const toFixedSites = [];
const moneyModules = [];

for (const f of files) {
  const text = readFileSync(f, 'utf8');
  const rel = relative(ROOT, f).replace(/\\/g, '/');

  if (/from\s+['"](@\/utils\/money|.*\/money)['"]/.test(text)) {
    usesMoney += 1;
    moneyModules.push(rel);
  }

  // `toFixed(2)` used as a VALUE (financial truth) rather than for display.
  // We count every occurrence in financial dirs; display formatting should go
  // through formatMoney() in src/utils/money.ts.
  const matches = text.match(/\.toFixed\(\s*\d\s*\)/g);
  if (matches) toFixedSites.push({ file: rel, count: matches.length });
}

let serverUsesMoney = 0;
let serverToFixed = 0;
const serverMoneyModules = [];

for (const f of serverFiles) {
  const text = readFileSync(f, 'utf8');
  const rel = relative(ROOT, f).replace(/\\/g, '/');

  if (/from\s+['"]decimal\.js['"]/.test(text)) {
    serverUsesMoney += 1;
    serverMoneyModules.push(rel);
  }

  const matches = text.match(/\.toFixed\(\s*\d\s*\)/g);
  if (matches) serverToFixed += matches.length;
}

const totalToFixed = toFixedSites.reduce((a, b) => a + b.count, 0);

const measured = {
  financialModules: files.length,
  modulesUsingMoneyPrimitive: usesMoney,
  adoptionPercent: Number(((usesMoney / files.length) * 100).toFixed(2)),
  rawToFixedSites: totalToFixed,
  serverFinancialModules: serverFiles.length,
  serverModulesUsingMoneyPrimitive: serverUsesMoney,
  serverRawToFixedSites: serverToFixed,
};

console.log('Money primitive adoption (financial paths only):');
console.log(`  financial modules scanned     ${measured.financialModules}`);
console.log(`  modules using money primitive ${measured.modulesUsingMoneyPrimitive}`);
console.log(`  adoption                      ${measured.adoptionPercent}%`);
console.log(`  raw toFixed(n) sites          ${measured.rawToFixedSites}`);
console.log('');
if (moneyModules.length) {
  console.log('  Modules on the money primitive:');
  for (const m of moneyModules) console.log(`    - ${m}`);
  console.log('');
}
console.log('Server financial paths (decimal.js — canonical engine):');
console.log(`  financial modules scanned     ${measured.serverFinancialModules}`);
console.log(`  modules using decimal.js      ${measured.serverModulesUsingMoneyPrimitive}`);
console.log(`  raw toFixed(n) sites          ${measured.serverRawToFixedSites}`);
if (serverMoneyModules.length) {
  console.log('  Server modules on decimal.js:');
  for (const m of serverMoneyModules) console.log(`    - ${m}`);
}
console.log('');

if (process.argv.includes('--update')) {
  writeFileSync(
    BASELINE_PATH,
    JSON.stringify({ ...measured, recordedAt: new Date().toISOString() }, null, 2) + '\n'
  );
  console.log(`Baseline recorded at ${relative(ROOT, BASELINE_PATH)}`);
  process.exit(0);
}

if (!existsSync(BASELINE_PATH)) {
  console.error('No baseline recorded. Run: node scripts/money-adoption.mjs --update');
  process.exit(1);
}

const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
const failures = [];

if (measured.rawToFixedSites > baseline.rawToFixedSites) {
  failures.push(
    `raw toFixed() sites in financial paths INCREASED: ${baseline.rawToFixedSites} -> ${measured.rawToFixedSites}. ` +
      'Use the canonical money primitive (src/utils/money.ts) instead of float rounding.'
  );
}

if (measured.modulesUsingMoneyPrimitive < baseline.modulesUsingMoneyPrimitive) {
  failures.push(
    `money primitive adoption DECREASED: ${baseline.modulesUsingMoneyPrimitive} -> ${measured.modulesUsingMoneyPrimitive} modules.`
  );
}

if (measured.serverRawToFixedSites > (baseline.serverRawToFixedSites ?? Infinity)) {
  failures.push(
    `raw toFixed() sites in server financial paths INCREASED: ${baseline.serverRawToFixedSites} -> ${measured.serverRawToFixedSites}. ` +
      'Use decimal.js (canonical engine) instead of float rounding in the server.'
  );
}

if (measured.serverModulesUsingMoneyPrimitive < (baseline.serverModulesUsingMoneyPrimitive ?? -1)) {
  failures.push(
    `decimal.js adoption in server DECREASED: ${baseline.serverModulesUsingMoneyPrimitive} -> ${measured.serverModulesUsingMoneyPrimitive} modules.`
  );
}

if (failures.length) {
  console.error('MONEY ADOPTION RATCHET FAILED:\n');
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}

console.log(
  `✓ Ratchet holds (baseline: ${baseline.modulesUsingMoneyPrimitive} modules, ` +
    `${baseline.rawToFixedSites} toFixed sites; server: ` +
    `${baseline.serverModulesUsingMoneyPrimitive ?? measured.serverModulesUsingMoneyPrimitive} modules, ` +
    `${baseline.serverRawToFixedSites ?? measured.serverRawToFixedSites} toFixed sites).`
);

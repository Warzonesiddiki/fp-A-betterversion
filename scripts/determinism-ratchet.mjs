#!/usr/bin/env node
/**
 * Determinism ratchet (NFR-001 in docs/discovery/requirements-register.md;
 * audit item P1-10).
 *
 * Financial calculations must produce identical output for identical input
 * regardless of when or where they run. Code that reads the wall clock or a
 * random source directly inside the calculation paths cannot be replayed,
 * cannot be pinned in tests, and rots silently (13 tests in this repository
 * failed on 2026-09-01 for exactly this reason).
 *
 * This script counts the non-deterministic call sites in the calculation
 * paths (src/engines, src/store, src/services, src/utils) and fails if any
 * FILE's count rises above its recorded baseline, or a new file appears with
 * any. Lowering the baseline is the goal; the approved replacements are:
 *
 *   new Date() / Date.now()   ->  now() / todayISO() from src/utils/clock.ts
 *   Math.random()             ->  an injected, seeded generator
 *
 * Files are listed individually in the baseline so a regression is
 * attributable to a file, not hidden by an unrelated fix elsewhere.
 *
 * Usage:
 *   node scripts/determinism-ratchet.mjs              # check against baseline
 *   node scripts/determinism-ratchet.mjs --update     # re-record (per-file totals must not rise)
 *   node scripts/determinism-ratchet.mjs --list       # print every site
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname, basename, relative } from 'node:path';

const ROOT = process.cwd();
const BASELINE_PATH = join(ROOT, 'scripts', 'determinism-baseline.json');
const isTest = (f) => /\.(test|bench|benchmark|spec|stories)\.[tj]sx?$/.test(f);

/** Directories where calculations and persisted financial state live. */
const CALC_DIRS = ['src/engines', 'src/store', 'src/services', 'src/utils'];

/** The one module allowed to touch the system clock. */
const ALLOWED_FILES = new Set(['src/utils/clock.ts']);

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

const PATTERNS = {
  // `new Date()` with no arguments = "now". `new Date(x)` parses a value and is fine.
  newDateNow: /\bnew\s+Date\s*\(\s*\)/g,
  dateNow: /\bDate\.now\s*\(\s*\)/g,
  mathRandom: /\bMath\.random\s*\(\s*\)/g,
};

/** Strip comments so documentation that mentions `new Date()` is not counted. */
function stripComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

const files = CALC_DIRS.flatMap((d) => walk(join(ROOT, d)));
const perFile = {};
const totals = { newDateNow: 0, dateNow: 0, mathRandom: 0 };
const sites = [];

for (const f of files) {
  const rel = relative(ROOT, f).replace(/\\/g, '/');
  if (ALLOWED_FILES.has(rel)) continue;
  const text = stripComments(readFileSync(f, 'utf8'));
  let fileTotal = 0;
  for (const [key, re] of Object.entries(PATTERNS)) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      totals[key] += 1;
      fileTotal += 1;
      const line = text.slice(0, m.index).split('\n').length;
      sites.push({ file: rel, line, kind: key });
    }
  }
  if (fileTotal > 0) perFile[rel] = fileTotal;
}

const total = Object.values(totals).reduce((a, b) => a + b, 0);
const measured = {
  modulesScanned: files.length,
  filesWithSites: Object.keys(perFile).length,
  newDateNow: totals.newDateNow,
  dateNow: totals.dateNow,
  mathRandom: totals.mathRandom,
  total,
};

console.log('Determinism ratchet (calculation paths: engines, store, services, utils):');
console.log(`  modules scanned             ${measured.modulesScanned}`);
console.log(`  files with sites            ${measured.filesWithSites}`);
console.log(`  'new Date()'                ${measured.newDateNow}`);
console.log(`  'Date.now()'                ${measured.dateNow}`);
console.log(`  'Math.random()'             ${measured.mathRandom}`);
console.log(`  total non-deterministic     ${measured.total}`);
console.log('');

if (process.argv.includes('--list')) {
  for (const s of sites) console.log(`  ${s.file}:${s.line}  ${s.kind}`);
  console.log('');
}

const sortedPerFile = Object.fromEntries(Object.entries(perFile).sort(([a], [b]) => a.localeCompare(b)));

if (process.argv.includes('--update')) {
  if (existsSync(BASELINE_PATH)) {
    const prev = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
    const risen = Object.entries(sortedPerFile).filter(([f, n]) => n > (prev.perFile?.[f] ?? 0));
    if (risen.length) {
      console.error('Refusing to record a baseline that is WORSE than the previous one:');
      for (const [f, n] of risen) console.error(`  ✗ ${f}: ${prev.perFile?.[f] ?? 0} -> ${n}`);
      console.error('Fix the regression (use src/utils/clock.ts) or delete this guard explicitly.');
      process.exit(1);
    }
  }
  writeFileSync(
    BASELINE_PATH,
    JSON.stringify({ ...measured, perFile: sortedPerFile, recordedAt: '2026-10-15' }, null, 2) + '\n'
  );
  console.log(`Baseline recorded at ${relative(ROOT, BASELINE_PATH)}`);
  process.exit(0);
}

if (!existsSync(BASELINE_PATH)) {
  console.error('No baseline recorded. Run: node scripts/determinism-ratchet.mjs --update');
  process.exit(1);
}

const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
const failures = [];
for (const [f, n] of Object.entries(sortedPerFile)) {
  const before = baseline.perFile?.[f] ?? 0;
  if (n > before) {
    failures.push(
      `${f}: non-deterministic sites ${before} -> ${n}. ` +
        'Use now()/todayISO() from src/utils/clock.ts or an injected seeded generator.'
    );
  }
}

if (failures.length) {
  console.error('DETERMINISM RATCHET FAILED:\n');
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}

const improved = baseline.total - measured.total;
console.log(
  `✓ Ratchet holds (baseline: ${baseline.total} sites across ${baseline.filesWithSites} files` +
    (improved > 0
      ? `; now ${measured.total} — ${improved} fewer. Run --update to lock in the improvement).`
      : ').')
);

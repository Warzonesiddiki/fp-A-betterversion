#!/usr/bin/env node
/**
 * Type-safety ratchet for financial paths (N-0015).
 *
 * The canonical money primitive ratchet (scripts/money-adoption.mjs) guards
 * against raw-float regression in financial arithmetic. This is its twin for
 * TYPE SAFETY: it counts the dangerous type-escape hatches (`as any`,
 * `as unknown as`, `@ts-ignore`, `@ts-expect-error`) in the financial code
 * paths (src/engines, src/store, src/utils, src/services) and fails CI if the
 * count INCREASES above the recorded baseline.
 *
 * Financial code that opts out of the type system is exactly where a silent
 * rounding, sign, or shape bug is most expensive, so regression here must be a
 * visible, reviewable act rather than an accident. Lowering the baseline is the
 * goal; raising it requires deleting this guard.
 *
 * Baseline is stored in scripts/type-safety-baseline.json.
 *
 * Usage:
 *   node scripts/type-safety-ratchet.mjs            # check against baseline
 *   node scripts/type-safety-ratchet.mjs --update   # re-record baseline (must go DOWN)
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname, basename, relative } from 'node:path';

const ROOT = process.cwd();
const BASELINE_PATH = join(ROOT, 'scripts', 'type-safety-baseline.json');
const isTest = (f) => /\.(test|bench|benchmark|spec)\.[tj]sx?$/.test(f);

/** Directories whose type safety is considered a FINANCIAL path. */
const FINANCIAL_DIRS = ['src/engines', 'src/store', 'src/utils', 'src/services'];

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

// Patterns that defeat the type system. `\b` word boundaries avoid matching
// substrings inside identifiers (e.g. `payload`).
const PATTERNS = {
  asAny: /\bas\s+any\b/g,
  asUnknownAs: /\bas\s+unknown\s+as\b/g,
  tsIgnore: /@ts-ignore/g,
  tsExpectError: /@ts-expect-error/g,
};

const totals = { asAny: 0, asUnknownAs: 0, tsIgnore: 0, tsExpectError: 0 };
const sites = [];

for (const f of files) {
  const text = readFileSync(f, 'utf8');
  const rel = relative(ROOT, f).replace(/\\/g, '/');
  let fileTotal = 0;
  for (const [key, re] of Object.entries(PATTERNS)) {
    // Reset lastIndex because /g regexes are stateful when reused.
    re.lastIndex = 0;
    const m = text.match(re);
    if (m) {
      totals[key] += m.length;
      fileTotal += m.length;
    }
  }
  if (fileTotal > 0) sites.push({ file: rel, count: fileTotal });
}

const totalTypeEscapes = Object.values(totals).reduce((a, b) => a + b, 0);

const measured = {
  financialModules: files.length,
  asAny: totals.asAny,
  asUnknownAs: totals.asUnknownAs,
  tsIgnore: totals.tsIgnore,
  tsExpectError: totals.tsExpectError,
  totalTypeEscapes,
};

console.log('Type-safety ratchet (financial paths only):');
console.log(`  financial modules scanned   ${measured.financialModules}`);
console.log(`  'as any'                    ${measured.asAny}`);
console.log(`  'as unknown as'             ${measured.asUnknownAs}`);
console.log(`  '@ts-ignore'                ${measured.tsIgnore}`);
console.log(`  '@ts-expect-error'          ${measured.tsExpectError}`);
console.log(`  total type escapes          ${measured.totalTypeEscapes}`);
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
  console.error('No baseline recorded. Run: node scripts/type-safety-ratchet.mjs --update');
  process.exit(1);
}

const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
const failures = [];

if (measured.totalTypeEscapes > baseline.totalTypeEscapes) {
  failures.push(
    `type-escape sites in financial paths INCREASED: ${baseline.totalTypeEscapes} -> ${measured.totalTypeEscapes} ` +
      `(as any ${baseline.asAny}->${measured.asAny}, as unknown as ${baseline.asUnknownAs}->${measured.asUnknownAs}). ` +
      'Add a typed interface instead of `as any` / `as unknown as`.'
  );
}

if (failures.length) {
  console.error('TYPE-SAFETY RATCHET FAILED:\n');
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}

console.log(
  `✓ Ratchet holds (baseline: ${baseline.totalTypeEscapes} type escapes — ` +
    `${baseline.asAny} 'as any', ${baseline.asUnknownAs} 'as unknown as').`
);

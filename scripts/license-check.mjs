#!/usr/bin/env node
/**
 * license:check — verify production dependency licenses are acceptable.
 *
 * FAIL-CLOSED (fixed 2026-10-21, audit P2-21).
 *
 * WHY THIS WAS REWRITTEN
 * ----------------------
 * The previous version had three defects that made it a gate that could not
 * fail — the same class of vacuous gate this repo has already shipped once
 * (ratchet-docs-check matched a hard-coded `/`, so on Windows it never read the
 * file it was given):
 *
 *   1. `ACCEPTABLE_LICENSES` was declared and NEVER USED. The script was a
 *      denylist only, so `UNKNOWN` and any unrecognised license fell through to
 *      `console.log("✅ name: UNKNOWN")` — an unverifiable license was blessed.
 *   2. A dependency with no readable license at all became the literal string
 *      `UNKNOWN`, matched no rejected pattern, and passed.
 *   3. The outer `catch` printed "best-effort" and exited **0**, so if
 *      `npm ls` failed (no node_modules, unparseable JSON, exec error) the
 *      script reported success having verified nothing.
 *
 * Exit codes are now meaningful:
 *   0  every dependency resolved to an acceptable license
 *   1  at least one rejected or unverifiable license
 *   2  the inventory could not be read at all — nothing was verified (fail closed)
 *
 * This is a policy check, not legal advice and not a global legal certification.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();

// -- arguments ------------------------------------------------------------
const argOf = (name, fallback = null) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const rootOverride = argOf('root');
const jsonFixture = argOf('npm-ls-json');

// -- policy ---------------------------------------------------------------
const REJECTED_PATTERNS = [
  'GPL-1.0',
  'GPL-2.0',
  'GPL-3.0',
  'AGPL',
  'SSPL',
  'BUSL',
  'CC-BY-NC',
  'UNLICENSED',
  'CPAL',
  'OSL',
  'EUPL',
];

// The allowlist that the previous version defined and never consulted.
const ACCEPTABLE = new Set(
  [
    'MIT',
    'ISC',
    'Apache-2.0',
    'BSD-2-Clause',
    'BSD-3-Clause',
    '0BSD',
    'CC0-1.0',
    'CC-BY-4.0',
    'Unlicense',
    'WTFPL',
    'Python-2.0',
    'PSF-2.0',
    'MPL-2.0',
    'BlueOak-1.0.0',
    'MIT-0',
  ].map((l) => l.toLowerCase())
);

/** Strip SPDX suffixes so `GPL-3.0-or-later` is still recognisable as GPL. */
const baseOf = (token) =>
  token
    .trim()
    .replace(/\*+$/, '')
    .replace(/\+$/, '')
    .replace(/-(only|or-later)$/i, '')
    .toLowerCase();

/** 'ok' | 'rejected' | 'unknown' for a single license identifier. */
function classifyOne(token) {
  const raw = token.trim();
  if (!raw) return 'unknown';
  // npm emits this when the license text lives in a file we cannot read.
  if (/^SEE LICEN[CS]E IN /i.test(raw)) return 'unknown';

  const base = baseOf(raw);
  const upper = base.toUpperCase();

  for (const rejected of REJECTED_PATTERNS) {
    if (upper.includes(rejected)) return 'rejected';
  }
  // Guard the copyleft family even if not enumerated above.
  if (upper.includes('COPYLEFT')) return 'rejected';

  if (ACCEPTABLE.has(base)) return 'ok';
  return 'unknown';
}

/**
 * Evaluate an SPDX expression.
 *   A OR B   -> ok if any side is ok; rejected only if every side is rejected
 *   A AND B  -> ok only if every side is ok; rejected if any side is rejected
 * Anything containing an unresolvable token is 'unknown' (fail closed).
 */
function classifyExpression(expression) {
  if (!expression || typeof expression !== 'string') return 'unknown';
  const expr = expression.trim();
  if (!expr) return 'unknown';
  if (/^SEE LICEN[CS]E IN /i.test(expr)) return 'unknown';

  const orParts = expr.split(/\s+OR\s+/i).map((p) => p.trim());
  const results = orParts.map((part) => {
    const andParts = part
      .replace(/^\(|\)$/g, '')
      .split(/\s+AND\s+/i)
      .map((p) => p.replace(/^\(|\)$/g, '').trim())
      .filter(Boolean);
    const classes = andParts.map(classifyOne);
    if (classes.includes('rejected')) return 'rejected';
    if (classes.every((c) => c === 'ok')) return 'ok';
    return 'unknown';
  });

  if (results.includes('ok')) return 'ok';
  if (results.every((r) => r === 'rejected')) return 'rejected';
  return 'unknown';
}

// -- inventory ------------------------------------------------------------
let inventory;
try {
  const output = jsonFixture
    ? readFileSync(jsonFixture, 'utf8')
    : execSync('npm ls --omit=dev --json --all 2>/dev/null', {
        cwd: rootOverride || ROOT,
        encoding: 'utf8',
        maxBuffer: 20 * 1024 * 1024,
      });
  inventory = JSON.parse(output);
} catch (e) {
  // Fail closed: nothing was verified, so this is not a pass.
  console.error('❌ License check could not read the dependency inventory.');
  console.error(`   ${e.message}`);
  console.error(
    '   Nothing was verified. Run `npm ci` first, or pass --npm-ls-json=<file> with `npm ls --json` output.'
  );
  console.error('   Exit 2 = unverifiable (fail closed), not a pass.');
  process.exit(2);
}

const deps = inventory.dependencies || {};
const names = Object.keys(deps);

if (names.length === 0) {
  console.error('❌ License check found zero production dependencies to verify.');
  console.error('   That is not a pass — an empty inventory cannot establish licensing.');
  process.exit(2);
}

// -- evaluate -------------------------------------------------------------
let rejected = 0;
let unverified = 0;
const unverifiedNames = [];

for (const name of names) {
  const info = deps[name];
  if (!info || typeof info !== 'object') {
    unverified++;
    unverifiedNames.push(`${name} (no metadata)`);
    console.error(`  ⚠️  ${name}: no metadata — CANNOT VERIFY`);
    continue;
  }

  const declared =
    (typeof info.license === 'string' && info.license) ||
    info.licenses?.[0]?.type ||
    (typeof info.licenses === 'string' ? info.licenses : null) ||
    null;

  if (!declared) {
    unverified++;
    unverifiedNames.push(`${name} (no license field)`);
    console.error(`  ⚠️  ${name}: no license field — CANNOT VERIFY`);
    continue;
  }

  const verdict = classifyExpression(declared);

  if (verdict === 'rejected') {
    rejected++;
    console.error(`  ❌ ${name}: ${declared} (REJECTED)`);
  } else if (verdict === 'unknown') {
    unverified++;
    unverifiedNames.push(`${name} (${declared})`);
    console.error(`  ⚠️  ${name}: ${declared} — CANNOT VERIFY (not on the allowlist)`);
  } else {
    console.log(`  ✅ ${name}: ${declared}`);
  }
}

console.log('');
console.log(`Checked ${names.length} production dependenc${names.length === 1 ? 'y' : 'ies'}.`);

const failures = rejected + unverified;

if (failures > 0) {
  if (rejected > 0) console.error(`❌ ${rejected} rejected license(s).`);
  if (unverified > 0) {
    console.error(`❌ ${unverified} unverifiable license(s) — failing closed:`);
    for (const n of unverifiedNames) console.error(`     - ${n}`);
    console.error('   Add the license to ACCEPTABLE_LICENSES only after reviewing it,');
    console.error('   or replace the dependency. "Cannot verify" is not "acceptable".');
  }
  process.exit(1);
}

console.log('✅ License check passed — every dependency resolved to an acceptable license.');
console.log('   Scope: declared license metadata only. Not a legal certification.');
process.exit(0);

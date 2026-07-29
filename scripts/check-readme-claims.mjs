#!/usr/bin/env node
/**
 * README claim gate (F-0034).
 *
 * The audit found the README asserting things the repository contradicts:
 * "Production-Ready" while tsc failed and the bundle crashed on load, a
 * "Coverage 100%" badge next to a 50% threshold, "100% decimal.js" with one
 * importer, "7 Web Workers" with four files, "End-to-end encryption" over a
 * hardcoded key. Documentation drift is a defect class, so it gets a gate.
 *
 * Every rule below is checked against the FILESYSTEM, not against a copy of the
 * expected text: the check fails if the claim stops matching measured reality,
 * in either direction. Exit 0 = README matches what the repo can prove.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = process.cwd();
const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');

const failures = [];
const checks = [];

function check(name, fn) {
  try {
    const detail = fn();
    checks.push({ name, ok: true, detail });
  } catch (error) {
    checks.push({ name, ok: false, detail: error.message });
    failures.push(`${name}: ${error.message}`);
  }
}

function walk(dir, filter, acc = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, filter, acc);
    else if (filter(entry.name, full)) acc.push(full);
  }
  return acc;
}

const isSource = (name) =>
  ['.ts', '.tsx'].includes(extname(name)) && !name.includes('.test.') && !name.includes('.bench.');

// ---------------------------------------------------------------------------
// Banned claims: statements the repository cannot currently support.
// ---------------------------------------------------------------------------
const BANNED = [
  {
    pattern: /Status\*{0,2}:?\s*🟢\s*Production-Ready/i,
    why: 'Production-Ready status claim while audit ZCFA-2026-07-28-001 findings remain open',
  },
  {
    pattern: /Coverage_100%25|Coverage[_ ]100%/i,
    why: 'Coverage 100% badge (configured thresholds are 50%; no full-suite coverage run completes)',
  },
  {
    pattern: /100% integration of `?decimal\.js`?/i,
    why: '100% decimal.js claim (measured adoption is a small subset of financial modules)',
  },
  {
    pattern: /\*\*End-to-end encryption\*\*/,
    why: 'End-to-end encryption claim (implementation is local at-rest encryption with a device key)',
  },
  {
    pattern: /Test Coverage\*{0,2}\s*\|\s*80%\+/i,
    why: '80%+ coverage claim without a completed coverage run',
  },
];

for (const { pattern, why } of BANNED) {
  check(`no banned claim: ${why}`, () => {
    const match = readme.match(pattern);
    if (match) throw new Error(`README still contains "${match[0].trim()}"`);
    return 'absent';
  });
}

// ---------------------------------------------------------------------------
// Measured claims: numbers in the README must equal what is on disk.
// ---------------------------------------------------------------------------
check('worker count matches src/workers/*.worker.ts', () => {
  const actual = walk(join(ROOT, 'src', 'workers'), (n) => n.endsWith('.worker.ts')).length;
  const claimed = readme.match(/Web Workers \((\d+) active\)/);
  if (!claimed) throw new Error('no "Web Workers (N active)" claim found to verify');
  if (Number(claimed[1]) !== actual) {
    throw new Error(`README claims ${claimed[1]} workers, filesystem has ${actual}`);
  }
  return `${actual} workers`;
});

check('store count matches src/store/*.ts', () => {
  const actual = readdirSync(join(ROOT, 'src', 'store')).filter(
    (n) => n.endsWith('.ts') && !n.includes('.test.')
  ).length;
  const claimed = readme.match(/Zustand Stores \((\d+) stores\)/);
  if (!claimed) throw new Error('no "Zustand Stores (N stores)" claim found to verify');
  if (Number(claimed[1]) !== actual) {
    throw new Error(`README claims ${claimed[1]} stores, filesystem has ${actual}`);
  }
  return `${actual} stores`;
});

check('engine count matches src/engines/*.ts', () => {
  const actual = readdirSync(join(ROOT, 'src', 'engines')).filter(
    (n) =>
      n.endsWith('.ts') &&
      !n.includes('.test.') &&
      !n.includes('.bench.') &&
      // Generated plumbing, not an engine module (N-0013).
      n !== 'engineManifest.generated.ts'
  ).length;
  const claimed = readme.match(/Financial Engines \((\d+) modules\)/);
  if (!claimed) throw new Error('no "Financial Engines (N modules)" claim found to verify');
  if (Number(claimed[1]) !== actual) {
    throw new Error(`README claims ${claimed[1]} engines, filesystem has ${actual}`);
  }
  return `${actual} engines`;
});

check('decimal.js adoption claim matches measured importers', () => {
  const claimed = readme.match(/Measured adoption: (\d+) of\s*\n?\s*(\d+) engine\/store modules/);
  if (!claimed) throw new Error('no "Measured adoption: N of M" claim found to verify');
  const importers = [
    ...walk(join(ROOT, 'src', 'engines'), isSource),
    ...walk(join(ROOT, 'src', 'store'), isSource),
  ].filter((file) =>
    /from '(@\/utils\/money|\.\.\/utils\/money|\.\/money)'/.test(readFileSync(file, 'utf8'))
  );
  if (importers.length !== Number(claimed[1])) {
    throw new Error(
      `README claims ${claimed[1]} money.ts adopters, measured ${importers.length}: ` +
        importers.map((f) => f.slice(ROOT.length + 1)).join(', ')
    );
  }
  return `${importers.length} adopters`;
});

check('coverage threshold statement matches vite.config.ts', () => {
  const config = readFileSync(join(ROOT, 'vite.config.ts'), 'utf8');
  const configured = config.match(/thresholds:\s*\{[^}]*statements:\s*(\d+)/s);
  if (!configured) throw new Error('could not read coverage thresholds from vite.config.ts');
  const stated = readme.match(/thresholds in `vite\.config\.ts` are (\d+)%/);
  if (!stated) throw new Error('README does not state the configured coverage threshold');
  if (stated[1] !== configured[1]) {
    throw new Error(`README states ${stated[1]}%, vite.config.ts configures ${configured[1]}%`);
  }
  return `${configured[1]}%`;
});

check('no hardcoded storage key claim/material in README', () => {
  const retired = ['finplan-master-storage', 'key-change-in-production'].join('-');
  if (readme.includes(retired)) throw new Error('retired hardcoded key literal present');
  return 'absent';
});

// ---------------------------------------------------------------------------
for (const { name, ok, detail } of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

if (failures.length > 0) {
  console.error(`\n${failures.length} README claim check(s) failed.`);
  console.error(
    'Fix the product or fix the claim. Do not ship documentation the repo contradicts.'
  );
  process.exit(1);
}
console.log(`\nAll ${checks.length} README claim checks passed.`);

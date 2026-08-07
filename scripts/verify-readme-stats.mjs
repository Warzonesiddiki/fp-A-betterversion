#!/usr/bin/env node
/**
 * Documentation truth check (N-0014).
 *
 * Audit ZCFA-2026-07-29-002 found README statistics that contradicted both
 * reality AND other sections of the same README (7 workers vs 4, "202+"
 * engines vs 188, 35 stores vs 38, "80%+ coverage" vs a 50% threshold).
 *
 * This script MEASURES the repository and fails if a documented figure does
 * not match. It exists so documentation cannot silently drift again: it runs
 * in CI as `npm run docs:verify`.
 *
 * It deliberately measures the same way the auditor did:
 *   engines  = non-test modules in src/engines (top level)
 *   shipped  = engines with at least one non-test consumer
 *   stores   = non-test modules in src/store
 *   workers  = *.worker.ts modules in src/workers
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, basename } from 'node:path';

const ROOT = process.cwd();
const isTest = (f) => /\.(test|bench|benchmark|spec)\.[tj]sx?$/.test(f);

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = join(dir, e);
    let s;
    try {
      s = statSync(p);
    } catch {
      continue;
    }
    if (s.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const allSrc = walk(join(ROOT, 'src')).filter(
  (f) => ['.ts', '.tsx'].includes(extname(f)) && !isTest(basename(f))
);

// --- engines -----------------------------------------------------------
const engineDir = join(ROOT, 'src', 'engines');
// NOTE: counted with the SAME convention as scripts/generate-engine-manifest.mjs
// (the manifest is the canonical "loadable engine" registry): top-level .ts,
// excluding tests, benchmarks (incl. .benchmark.), type-only modules and
// internal plumbing. Counting benchmark fixtures or type-only files as
// "engines" previously produced a false 190-module / 7-orphan headline.
const ENGINE_EXCLUDED = new Set([
  'index',
  'types',
  'engineManifest.generated',
  'EngineRegistry',
  'ReportBuilderTypes',
  'report-builder-types',
]);
const engineFiles = readdirSync(engineDir)
  .filter(
    (f) =>
      f.endsWith('.ts') &&
      !isTest(f) &&
      !ENGINE_EXCLUDED.has(basename(f, '.ts'))
  )
  .map((f) => basename(f, '.ts'));

const sourceBlobs = allSrc
  .filter((f) => !f.startsWith(engineDir) || basename(f) === 'index.ts')
  .map((f) => {
    try {
      return readFileSync(f, 'utf8');
    } catch {
      return '';
    }
  });

const engineDirBlobs = allSrc
  .filter((f) => f.startsWith(engineDir))
  .map((f) => ({ name: basename(f, '.ts'), text: readFileSync(f, 'utf8') }));

// Reachability is case/kebab-insensitive: `report-builder-types` imports are
// matched by the normalized file name, so kebab-case consumers cannot produce
// a false orphan.
const normalize = (s) => s.toLowerCase().replace(/[-_]/g, '');
const shippedEngines = engineFiles.filter((name) => {
  const needle = normalize(name);
  const re = new RegExp(`\\b${needle}\\b`);
  if (sourceBlobs.some((t) => re.test(normalize(t)))) return true;
  // consumed by another engine that is itself reachable
  return engineDirBlobs.some((e) => e.name !== name && re.test(normalize(e.text)));
});
const orphanEngines = engineFiles.filter((n) => !shippedEngines.includes(n));

// --- stores / workers --------------------------------------------------
const storeCount = readdirSync(join(ROOT, 'src', 'store')).filter(
  (f) => f.endsWith('.ts') && !isTest(f) && f !== 'index.ts'
).length;

const workerCount = readdirSync(join(ROOT, 'src', 'workers')).filter(
  (f) => f.endsWith('.worker.ts') && !isTest(f)
).length;

// --- coverage threshold -------------------------------------------------
const viteConfig = readFileSync(join(ROOT, 'vite.config.ts'), 'utf8');
const stmtMatch = viteConfig.match(/statements:\s*(\d+)/);
const coverageThreshold = stmtMatch ? Number(stmtMatch[1]) : null;

const measured = {
  engines: engineFiles.length,
  shippedEngines: shippedEngines.length,
  orphanEngines: orphanEngines.length,
  stores: storeCount,
  workers: workerCount,
  coverageThreshold,
};

// --- assertions against README -----------------------------------------
const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');
const failures = [];

const forbidden = [
  { pattern: /Active Workers \((\d+)\)/g, expect: measured.workers, label: 'worker count' },
  {
    pattern: /Financial Engines \((\d+)(?: modules)?\)/g,
    expect: measured.engines,
    label: 'engine count',
  },
  {
    pattern: /Store Architecture \((\d+) Stores\)/g,
    expect: measured.stores,
    label: 'store count',
  },
];

for (const { pattern, expect, label } of forbidden) {
  for (const m of readme.matchAll(pattern)) {
    if (Number(m[1]) !== expect) {
      failures.push(`README ${label}: claims ${m[1]}, measured ${expect}  ("${m[0]}")`);
    }
  }
}

if (/Maintain 80%\+ coverage/i.test(readme) && coverageThreshold !== 80) {
  failures.push(
    `README claims "Maintain 80%+ coverage" but the enforced threshold is ${coverageThreshold}%`
  );
}

if (/\*\*Marketplace\*\*: Discover and install plugins/.test(readme)) {
  failures.push(
    'README advertises a plugin Marketplace ("Discover and install plugins") but no marketplace backend exists'
  );
}

// RELEASE_CHECKLIST must not claim a full-suite pass unless one is recorded.
try {
  const checklist = readFileSync(join(ROOT, 'RELEASE_CHECKLIST.md'), 'utf8');
  if (/- \[x\].*All test batches verified passing/i.test(checklist)) {
    failures.push(
      'RELEASE_CHECKLIST claims "[x] All test batches verified passing" — not permitted without a recorded full-suite exit 0'
    );
  }
} catch {
  /* checklist optional */
}

console.log('Measured repository statistics:');
for (const [k, v] of Object.entries(measured)) console.log(`  ${k.padEnd(18)} ${v}`);
console.log('');

if (failures.length > 0) {
  console.error('DOCUMENTATION TRUTH CHECK FAILED:\n');
  for (const f of failures) console.error(`  ✗ ${f}`);
  console.error(
    `\n${failures.length} false or contradictory documentation claim(s). ` +
      'Fix the documentation, not this script.'
  );
  process.exit(1);
}

console.log('✓ Documentation truth check passed — all measured claims match.');

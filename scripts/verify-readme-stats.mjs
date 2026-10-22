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

// Runtime consumers = everything outside src/engines. The barrel
// (src/engines/index.ts) and the generated manifest re-export every engine,
// so counting them as consumers made every engine "reachable" by definition
// (the 2026-10-15 audit found 85 engines with no page/store/service caller
// while this script reported 0 orphans). They are excluded here.
const sourceBlobs = allSrc
  .filter((f) => !f.startsWith(engineDir))
  .map((f) => {
    try {
      return readFileSync(f, 'utf8');
    } catch {
      return '';
    }
  });

const ENGINE_PLUMBING = new Set(['index', 'engineManifest.generated', 'EngineRegistry']);
const engineDirBlobs = allSrc
  .filter((f) => f.startsWith(engineDir) && !ENGINE_PLUMBING.has(basename(f, extname(f))))
  .map((f) => ({ name: basename(f, '.ts'), text: readFileSync(f, 'utf8') }));

// Reachability is case/kebab-insensitive: `report-builder-types` imports are
// matched by the normalized file name, so kebab-case consumers cannot produce
// a false orphan.
const normalize = (s) => s.toLowerCase().replace(/[-_]/g, '');
const needleOf = (name) => new RegExp(`\\b${normalize(name)}\\b`);
const normalizedSource = sourceBlobs.map(normalize);
const normalizedEngines = engineDirBlobs.map((e) => ({ name: e.name, text: normalize(e.text) }));
// Fixed point: directly reachable from runtime code, or consumed by an engine
// that is itself reachable. Engine↔engine cycles with no runtime entry stay orphans.
const reachable = new Set(
  engineFiles.filter((name) => normalizedSource.some((t) => needleOf(name).test(t)))
);
let grew = true;
while (grew) {
  grew = false;
  for (const name of engineFiles) {
    if (reachable.has(name)) continue;
    const re = needleOf(name);
    if (normalizedEngines.some((e) => e.name !== name && reachable.has(e.name) && re.test(e.text))) {
      reachable.add(name);
      grew = true;
    }
  }
}
const shippedEngines = engineFiles.filter((n) => reachable.has(n));
const orphanEngines = engineFiles.filter((n) => !reachable.has(n));

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

// --- routes -------------------------------------------------------------
// Counted with the SAME regex as scripts/generate-route-map.js, which is the
// canonical route inventory. Two different route counts in one repo (the 2026
// audit found 242 in README vs 231 measured) is exactly the drift this script
// exists to stop.
const APP_TSX = readFileSync(join(ROOT, 'src', 'App.tsx'), 'utf8');
const ROUTE_RE =
  /<Route\s+path="([^"]+)"\s+element=\{\s*(?:<Navigate[\s\S]*?to="([^"]+)"|<([A-Za-z][\w.]*))/g;
const routeCount = [...APP_TSX.matchAll(ROUTE_RE)].length;

// --- test files ---------------------------------------------------------
// Discovered exactly as Vitest does (vite.config.ts test.include/exclude):
//   include  src/**/*.test.ts, src/**/*.test.tsx
//   exclude  tests/**, node_modules/**, __benchmarks__/**, *.bench.test.*,
//            *.benchmark.test.*
// This is a FILE count. It is deliberately not a test count: a test tally can
// only come from running the suite (~1,057 s sharded, 8 GB heap), so this gate
// asserts what it can actually measure. A test tally in the README must be
// labelled as a recorded run instead of masquerading as a live measurement.
const testFiles = walk(join(ROOT, 'src')).filter((f) => {
  const base = basename(f);
  if (!/\.test\.(ts|tsx)$/.test(base)) return false;
  if (/\.(bench|benchmark)\.test\.(ts|tsx)$/.test(base)) return false;
  return !f.split(/[\\/]/).includes('__benchmarks__');
}).length;

const measured = {
  engines: engineFiles.length,
  shippedEngines: shippedEngines.length,
  orphanEngines: orphanEngines.length,
  stores: storeCount,
  workers: workerCount,
  routes: routeCount,
  testFiles,
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
  {
    pattern: /(\d+) reachable engines/g,
    expect: measured.shippedEngines,
    label: 'reachable engine count',
  },
  {
    pattern: /(\d+) orphan engines/g,
    expect: measured.orphanEngines,
    label: 'orphan engine count',
  },
  {
    // README: "routed page modules (242 <Route>s ...)"
    pattern: /(\d+)\s*<Route>/g,
    expect: measured.routes,
    label: 'route count',
  },
  {
    // README: "~1,315 files · ~13,350 tests"
    pattern: /~?([\d,]+)\s+test files|~?([\d,]+)\s+files\s+·/g,
    expect: measured.testFiles,
    label: 'test file count',
    // Two capture groups: use whichever matched.
    transform: (s) => Number(s.replace(/,/g, '')),
  },
];

// Words that assert a measurement no script produces are forbidden outright.
const unbackedClaims = [
  { re: /100%\s*(money\s*safety|green)/i, why: 'no script measures "100% money safety/green"' },
  { re: /Engines Shipped/i, why: 'use "reachable engines" (measured) — a file with a test is not shipped' },
];
for (const { re, why } of unbackedClaims) {
  const m = readme.match(re);
  if (m) failures.push(`README unbacked claim "${m[0]}": ${why}`);
}

for (const { pattern, expect, label } of forbidden) {
  for (const m of readme.matchAll(pattern)) {
    // Patterns may expose two capture groups (one per wording variant); take
    // the first that actually matched.
    const raw = m.slice(1).find((g) => g !== undefined);
    if (raw === undefined) continue;
    const claimed = Number(String(raw).replace(/,/g, ''));
    if (claimed !== expect) {
      failures.push(`README ${label}: claims ${raw}, measured ${expect}  ("${m[0]}")`);
    }
  }
}

// A test TALLY cannot be measured by this gate (it needs a full ~1,057 s
// sharded run). If the README states one, it must be presented as a recorded
// result, not as a live measurement — otherwise the number drifts unwatched.
const tallyMatch = readme.match(/([\d,]+)\s+tests\b/);
if (tallyMatch && !/recorded/i.test(readme)) {
  failures.push(
    `README states a test tally ("${tallyMatch[0]}") without labelling it a recorded run. ` +
      'This gate measures test FILES; a test count needs `npm run test:sharded` evidence.'
  );
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

if (process.argv.includes('--list')) {
  console.log(`Orphan engines (${orphanEngines.length}) — no runtime consumer outside src/engines:`);
  for (const n of orphanEngines) console.log(`  - ${n}`);
  console.log('');
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

#!/usr/bin/env node
/**
 * Engine reachability classifier (Omega Council — roadmap evidence).
 *
 * The "never need another tool" goal is gated by REACHABILITY: a capability a
 * user cannot reach through any page/store/service is, for them, missing. This
 * classifies every engine module by whether real app code can reach it.
 *
 * REACHABILITY IS TRANSITIVE AND INCLUDES LAZY LOADING (corrected 2026-08-02).
 * -------------------------------------------------------------------------
 * The original version only counted DIRECT static imports from
 * src/{pages,store,services,components,hooks}. That undercounted badly and
 * produced a false "105 orphan engines" headline, because it missed:
 *
 *   1. Lazy/dynamic reachability. `src/engines/engineManifest.generated.ts`
 *      maps every engine id to `() => import('./Engine')`. `EngineRegistry`
 *      consumes that manifest and `src/pages/admin/EngineCatalogPage.tsx`
 *      (routed at `/admin/engines` in App.tsx) lists, loads and inspects every
 *      manifest entry. An engine in the manifest IS reachable by a user at
 *      runtime — that page exists precisely to make it so.
 *
 *   2. Transitive reachability. Engine A imported by reachable engine B is
 *      reachable. `report-builder-types` for example is imported by three
 *      manifest engines and was previously reported as an orphan.
 *
 * Categories:
 *   - reachable_direct   : statically imported by src/{pages,store,services,components,hooks}
 *   - reachable_lazy     : present in the generated manifest, so loadable via
 *                          EngineRegistry / the routed engine catalog page
 *   - reachable_transitive: imported by another reachable engine
 *   - orphan_tested      : genuinely unreachable, but has a colocated test
 *                          -> real, tested logic with no product surface
 *                          -> WIRE CANDIDATES
 *   - orphan_untested    : unreachable AND no test -> likely dead/experimental
 *                          -> DELETE/INVESTIGATE CANDIDATES
 *
 * Usage: node scripts/engine-reachability.mjs [--json]
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname, basename, relative } from 'node:path';

const ROOT = process.cwd();
const ENGINES_DIR = join(ROOT, 'src/engines');
const APP_CONSUMERS = ['src/pages', 'src/store', 'src/services', 'src/components', 'src/hooks'];

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (['.ts', '.tsx'].includes(extname(p))) out.push(p);
  }
  return out;
}

// Engine modules: top-level .ts under src/engines, excluding barrels/manifest/test/bench.
const isEngine = (f) =>
  /\.ts$/.test(f) &&
  !/\.(test|bench|benchmark|spec)\./.test(f) &&
  !['index.ts', 'types.ts'].includes(basename(f)) &&
  !/^engineManifest/.test(basename(f)) &&
  !/\.types\./.test(f);

/**
 * Type-only / internal-plumbing modules. These are NOT loadable engines, so
 * counting them as unreachable engines is a category error. This list is kept
 * in sync with EXCLUDED in scripts/generate-engine-manifest.mjs — the manifest
 * generator deliberately omits them because a pure-type module has no runtime
 * export to load. `assertExclusionsInSync()` below fails loudly if the two ever
 * drift apart.
 */
const TYPE_ONLY_MODULES = new Set(['EngineRegistry', 'ReportBuilderTypes', 'report-builder-types']);

/** Fail loudly if this script and the manifest generator disagree. */
function assertExclusionsInSync() {
  const genPath = join(ROOT, 'scripts', 'generate-engine-manifest.mjs');
  if (!existsSync(genPath)) return;
  const block = readFileSync(genPath, 'utf8').match(/const EXCLUDED = new Set\(\[([\s\S]*?)\]\)/);
  if (!block) return;
  const generatorExcluded = new Set(
    [...block[1].matchAll(/'([^']+)'/g)]
      .map((m) => m[1])
      .filter((n) => !['index', 'engineManifest.generated'].includes(n))
  );
  const missing = [...generatorExcluded].filter((n) => !TYPE_ONLY_MODULES.has(n));
  const extra = [...TYPE_ONLY_MODULES].filter((n) => !generatorExcluded.has(n));
  if (missing.length || extra.length) {
    console.error(
      'ENGINE EXCLUSION DRIFT: scripts/engine-reachability.mjs and ' +
        'scripts/generate-engine-manifest.mjs disagree.\n' +
        (missing.length ? `  only in manifest generator: ${missing.join(', ')}\n` : '') +
        (extra.length ? `  only in reachability script: ${extra.join(', ')}\n` : '')
    );
    process.exit(1);
  }
}
assertExclusionsInSync();

const engineFiles = readdirSync(ENGINES_DIR)
  .filter((f) => isEngine(f) && !TYPE_ONLY_MODULES.has(basename(f, '.ts')))
  .map((f) => join('src/engines', f));
const engineNames = new Set(engineFiles.map((f) => basename(f, '.ts')));

/** 1. Direct static imports from app-consumer directories. */
const directHits = new Set();
for (const dir of APP_CONSUMERS) {
  for (const file of walk(join(ROOT, dir))) {
    let text;
    try {
      text = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    for (const spec of text.match(/from\s+['"][^'"]*\/engines\/([A-Za-z0-9_-]+)['"]/g) ?? []) {
      directHits.add(spec.replace(/.*\/engines\//, '').replace(/['"]/g, ''));
    }
    // Lazy route-level imports: import('@/engines/Foo')
    for (const spec of text.match(/import\(\s*['"][^'"]*\/engines\/([A-Za-z0-9_-]+)['"]\s*\)/g) ??
      []) {
      directHits.add(spec.replace(/.*\/engines\//, '').replace(/['"()\s]/g, ''));
    }
  }
}

/**
 * 2. Lazy reachability via the generated manifest.
 * Only counts if the manifest is actually consumed by app code — otherwise it
 * would be a registry nothing can reach, which is the bug this repo already hit.
 */
const manifestPath = join(ENGINES_DIR, 'engineManifest.generated.ts');
const manifestText = existsSync(manifestPath) ? readFileSync(manifestPath, 'utf8') : '';
const manifestEntries = new Set(
  [...manifestText.matchAll(/^\s*'?([A-Za-z0-9_-]+)'?:\s*\(\)\s*=>\s*import\(/gm)].map((m) => m[1])
);
const manifestIsConsumed = APP_CONSUMERS.some((dir) =>
  walk(join(ROOT, dir)).some((file) => {
    try {
      return /engineManifest\.generated|EngineRegistry/.test(readFileSync(file, 'utf8'));
    } catch {
      return false;
    }
  })
);
const lazyHits = manifestIsConsumed ? manifestEntries : new Set();

/** 3. Transitive closure: engines imported by already-reachable engines. */
const engineImports = new Map();
for (const f of engineFiles) {
  const name = basename(f, '.ts');
  let text = '';
  try {
    text = readFileSync(join(ROOT, f), 'utf8');
  } catch {
    /* unreadable file contributes no edges */
  }
  const deps = new Set();
  for (const spec of text.match(/from\s+['"]\.\/([A-Za-z0-9_-]+)['"]/g) ?? []) {
    const dep = spec.replace(/.*\.\//, '').replace(/['"]/g, '');
    if (engineNames.has(dep)) deps.add(dep);
  }
  engineImports.set(name, deps);
}

const reachable = new Set([...directHits, ...lazyHits].filter((n) => engineNames.has(n)));
const transitive = new Set();
const queue = [...reachable];
while (queue.length) {
  for (const dep of engineImports.get(queue.pop()) ?? []) {
    if (!reachable.has(dep)) {
      reachable.add(dep);
      transitive.add(dep);
      queue.push(dep);
    }
  }
}

const hasTest = (name) =>
  existsSync(join(ENGINES_DIR, `${name}.test.ts`)) ||
  existsSync(join(ENGINES_DIR, '__tests__', `${name}.test.ts`));

const reachableDirect = [];
const reachableLazy = [];
const reachableTransitive = [];
const orphanTested = [];
const orphanUntested = [];

for (const f of engineFiles) {
  const name = basename(f, '.ts');
  const rel = relative(ROOT, f).replace(/\\/g, '/');
  if (directHits.has(name)) reachableDirect.push(rel);
  else if (lazyHits.has(name)) reachableLazy.push(rel);
  else if (transitive.has(name)) reachableTransitive.push(rel);
  else if (hasTest(name)) orphanTested.push(rel);
  else orphanUntested.push(rel);
}

const total = engineFiles.length;
const reachableTotal = reachableDirect.length + reachableLazy.length + reachableTransitive.length;

const result = {
  total,
  reachable: reachableTotal,
  reachable_direct: reachableDirect.length,
  reachable_lazy: reachableLazy.length,
  reachable_transitive: reachableTransitive.length,
  orphan_tested: orphanTested.length,
  orphan_untested: orphanUntested.length,
  orphan_total: orphanTested.length + orphanUntested.length,
  manifest_consumed_by_app: manifestIsConsumed,
  reachable_direct_list: reachableDirect.sort(),
  reachable_lazy_list: reachableLazy.sort(),
  reachable_transitive_list: reachableTransitive.sort(),
  orphan_tested_list: orphanTested.sort(),
  orphan_untested_list: orphanUntested.sort(),
};

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

console.log('🔧 Engine reachability (Omega Council roadmap evidence)\n');
console.log(`  total engines               ${total}`);
console.log(`  reachable (any path)        ${reachableTotal}`);
console.log(`    • direct static import    ${reachableDirect.length}`);
console.log(
  `    • lazy via manifest       ${reachableLazy.length}   ${
    manifestIsConsumed
      ? '(EngineRegistry + /admin/engines)'
      : '(MANIFEST NOT CONSUMED — not counted)'
  }`
);
console.log(`    • transitive via engine   ${reachableTransitive.length}`);
console.log(`  orphan, HAS test            ${orphanTested.length}   ← WIRE CANDIDATES`);
console.log(`  orphan, NO test             ${orphanUntested.length}   ← DELETE/INVESTIGATE`);
console.log('');

if (orphanTested.length) {
  console.log('  Wire candidates (tested, genuinely unreachable):');
  for (const e of orphanTested) console.log(`    • ${e}`);
  console.log('');
}
if (orphanUntested.length) {
  console.log('  Delete/investigate candidates (unreachable, untested):');
  for (const e of orphanUntested) console.log(`    • ${e}`);
  console.log('');
}

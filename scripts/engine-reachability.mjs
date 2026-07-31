#!/usr/bin/env node
/**
 * Engine reachability classifier (Omega Council — roadmap evidence).
 *
 * The "never need another tool" goal is gated by REACHABILITY: a capability a
 * user cannot reach through any page/store/service is, for them, missing. This
 * classifies every engine module by whether real app code imports it, so the
 * council can plan a wiring/removal program instead of guessing.
 *
 * Categories:
 *   - reachable        : imported by src/{pages,store,services,components,hooks}
 *   - orphan_tested    : NOT imported by app code, but has a colocated test
 *                        -> real, tested logic that simply lacks a product surface
 *                        -> WIRE CANDIDATES (highest goal-leverage)
 *   - orphan_untested  : NOT imported AND no test -> likely dead/experimental
 *                        -> DELETE/INVESTIGATE CANDIDATES
 *
 * Usage: node scripts/engine-reachability.mjs [--json]
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname, basename, relative } from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
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

const engineFiles = readdirSync(join(ROOT, 'src/engines'))
  .filter((f) => isEngine(f))
  .map((f) => join('src/engines', f));

// One-pass grep of all app-consumer source for engine import specifiers.
const importHits = new Set();
for (const dir of APP_CONSUMERS) {
  for (const file of walk(join(ROOT, dir))) {
    let text;
    try {
      text = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const m = text.match(/from\s+['"][^'"]*\/engines\/([A-Za-z0-9_-]+)['"]/g);
    if (m) for (const spec of m) importHits.add(spec.replace(/.*\/engines\//, '').replace(/['"]/g, ''));
  }
}

const hasTest = (name) => existsSync(join(ROOT, 'src/engines', `${name}.test.ts`));

const reachable = [];
const orphanTested = [];
const orphanUntested = [];
for (const f of engineFiles) {
  const name = basename(f, '.ts');
  const rel = relative(ROOT, f).replace(/\\/g, '/');
  if (importHits.has(name)) reachable.push(rel);
  else if (hasTest(name)) orphanTested.push(rel);
  else orphanUntested.push(rel);
}

const total = engineFiles.length;
const asJson = process.argv.includes('--json');

const result = {
  total,
  reachable: reachable.length,
  orphan_tested: orphanTested.length,
  orphan_untested: orphanUntested.length,
  orphan_total: orphanTested.length + orphanUntested.length,
  orphan_tested_list: orphanTested.sort(),
  orphan_untested_list: orphanUntested.sort(),
};

if (asJson) {
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

console.log('🔧 Engine reachability (Omega Council roadmap evidence)\n');
console.log(`  total engines              ${total}`);
console.log(`  reachable (app-imported)   ${reachable.length}`);
console.log(`  orphan, HAS test           ${orphanTested.length}   ← WIRE CANDIDATES`);
console.log(`  orphan, NO test            ${orphanUntested.length}   ← DELETE/INVESTIGATE`);
console.log(`  total unreachable          ${orphanTested.length + orphanUntested.length}`);
console.log('');
if (orphanTested.length) {
  console.log(`  Wire candidates (tested, no product surface) — first 40:`);
  for (const e of orphanTested.sort().slice(0, 40)) console.log(`    • ${e}`);
  if (orphanTested.length > 40) console.log(`    … and ${orphanTested.length - 40} more (use --json)`);
}
void execSync; // keep import meaningful for future --json hashing

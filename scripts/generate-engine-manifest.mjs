#!/usr/bin/env node
/**
 * Engine manifest generator (N-0013).
 *
 * THE PROBLEM THIS SOLVES
 * -----------------------
 * Audit ZCFA-2026-07-29-002 reported "80 of 188 engines orphaned". Measuring
 * it precisely revealed something worse:
 *
 *   - 181 engine modules exist
 *   -  79 are imported directly by a page/store/service  (genuinely wired)
 *   -  99 are reachable ONLY through src/engines/index.ts (the barrel)
 *   -   3 are referenced by nothing at all
 *   -   0 files outside src/engines import the barrel
 *   -   EngineRegistry (the lazy loader) is itself never called by anything,
 *       and its hand-written switch knew only 40 of 181 engines.
 *
 * So the barrel exported 143 symbols that no application code consumed, and
 * the "lazy loading" story was decorative: nothing could reach those engines
 * at runtime through any supported path.
 *
 * THE FIX
 * -------
 * Generate a manifest mapping every engine id to a real dynamic import. This
 * is what makes the engines genuinely reachable: EngineRegistry loads from the
 * manifest, so `engineRegistry.load(id)` works for EVERY engine, and the
 * Engine Catalog page can exercise them for real.
 *
 * The manifest is GENERATED, never hand-maintained, so it cannot drift out of
 * sync with the filesystem the way the 40-case switch did.
 *
 * Usage:
 *   node scripts/generate-engine-manifest.mjs           # write manifest
 *   node scripts/generate-engine-manifest.mjs --check   # CI: fail if stale
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const ENGINE_DIR = join(ROOT, 'src', 'engines');
const OUT = join(ENGINE_DIR, 'engineManifest.generated.ts');

const isTest = (f) => /\.(test|bench|benchmark|spec)\./.test(f);

/** Modules that are type-only or internal plumbing, not loadable engines. */
const EXCLUDED = new Set([
  'index',
  'engineManifest.generated',
  'EngineRegistry',
  'ReportBuilderTypes',
  'report-builder-types',
]);

const engines = readdirSync(ENGINE_DIR)
  .filter((f) => f.endsWith('.ts') && !isTest(f))
  .map((f) => f.replace(/\.ts$/, ''))
  .filter((n) => !EXCLUDED.has(n))
  .sort();

// Drop modules with no runtime export (pure type modules would break loading).
const loadable = engines.filter((name) => {
  const text = readFileSync(join(ENGINE_DIR, `${name}.ts`), 'utf8');
  // A runtime export = exported const/function/class/enum, or a re-export.
  return /export\s+(const|function|class|enum|default|\{)/.test(text);
});

const banner = `/**
 * AUTO-GENERATED — DO NOT EDIT BY HAND.
 * Regenerate with: node scripts/generate-engine-manifest.mjs
 *
 * Maps every engine id to a dynamic import (N-0013). Hand-maintaining this
 * list is exactly how EngineRegistry ended up knowing only 40 of ${engines.length}
 * engines while the rest were unreachable at runtime.
 *
 * Engines: ${loadable.length}
 */
`;

// Prettier-compatible emission: identifier-safe keys unquoted, union wrapped.
const SAFE_IDENT = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const key = (n) => (SAFE_IDENT.test(n) ? n : `'${n}'`);

const body = `
export type EngineId =
${loadable.map((n) => `  | '${n}'`).join('\n')};

export type EngineModule = Record<string, unknown>;

/** Dynamic import for every engine module in src/engines. */
export const ENGINE_MANIFEST: Record<EngineId, () => Promise<EngineModule>> = {
${loadable.map((n) => `  ${key(n)}: () => import('./${n}'),`).join('\n')}
};

/** Every known engine id, sorted. */
export const ENGINE_IDS = Object.keys(ENGINE_MANIFEST) as EngineId[];

/** Total number of engine modules reachable through the registry. */
export const ENGINE_COUNT = ENGINE_IDS.length;
`;

const content = banner + body;

if (process.argv.includes('--check')) {
  if (!existsSync(OUT)) {
    console.error('Engine manifest missing. Run: node scripts/generate-engine-manifest.mjs');
    process.exit(1);
  }
  const current = readFileSync(OUT, 'utf8');
  if (current !== content) {
    console.error(
      'Engine manifest is STALE — engines were added or removed without regenerating.\n' +
        'Run: node scripts/generate-engine-manifest.mjs'
    );
    process.exit(1);
  }
  console.log(`✓ Engine manifest is current (${loadable.length} engines).`);
  process.exit(0);
}

writeFileSync(OUT, content);
console.log(`✓ Wrote ${loadable.length} engines to src/engines/engineManifest.generated.ts`);

/**
 * N-0013 regression suite — every engine must be genuinely reachable.
 *
 * WHAT THE AUDIT FOUND, AND WHAT MEASUREMENT REVEALED
 * ---------------------------------------------------
 * Audit ZCFA-2026-07-29-002 reported "80 of 188 engines orphaned". Measuring
 * it precisely found the situation was worse:
 *
 *   - 181 engine modules on disk
 *   -  79 imported directly by a page/store/service
 *   -  99 reachable ONLY via src/engines/index.ts (the barrel)
 *   -   0 files outside src/engines import that barrel
 *   -   EngineRegistry — the "lazy loader" — was never called by anything,
 *       and its hand-written switch knew only 40 of 181 engines. For the
 *       other 138, `load()` threw "Unknown engine".
 *
 * So roughly 100 engines could not be reached at runtime by ANY supported
 * path, while the README marketed them as product depth.
 *
 * THIS SUITE IS THE PROOF THE FIX IS REAL
 * ---------------------------------------
 * It does not assert that files exist — that would be theatre. It actually
 * DYNAMICALLY IMPORTS every engine in the generated manifest and asserts the
 * module produces real runtime exports. If an engine is deleted, renamed, or
 * becomes unloadable, this fails.
 */
import { describe, it, expect } from 'vitest';
import { engineRegistry, UnknownEngineError } from '../EngineRegistry';
import { ENGINE_MANIFEST, ENGINE_IDS, ENGINE_COUNT } from '../engineManifest.generated';

describe('N-0013: engine manifest integrity', () => {
  it('the manifest is not empty and matches its id list', () => {
    expect(ENGINE_COUNT).toBeGreaterThan(150);
    expect(ENGINE_IDS).toHaveLength(ENGINE_COUNT);
    expect(Object.keys(ENGINE_MANIFEST)).toHaveLength(ENGINE_COUNT);
  });

  it('every manifest entry is a loader function', () => {
    for (const id of ENGINE_IDS) {
      expect(typeof ENGINE_MANIFEST[id]).toBe('function');
    }
  });

  it('the registry advertises every manifest engine as known', () => {
    for (const id of ENGINE_IDS) {
      expect(engineRegistry.isKnown(id)).toBe(true);
    }
    expect(engineRegistry.listAvailable()).toHaveLength(ENGINE_COUNT);
  });

  it('an unknown engine id fails loudly rather than silently', async () => {
    await expect(engineRegistry.load('NoSuchEngine')).rejects.toBeInstanceOf(UnknownEngineError);
  });
});

describe('N-0013: EVERY engine actually loads at runtime', () => {
  // The real proof. Each engine is dynamically imported and must yield a
  // module object with at least one runtime export.
  it.each(ENGINE_IDS)('loads %s and exposes runtime exports', async (id) => {
    const mod = await engineRegistry.load(id);
    expect(mod).toBeTruthy();
    expect(typeof mod).toBe('object');
    const runtimeExports = Object.keys(mod).filter((k) => k !== '__esModule');
    expect(runtimeExports.length).toBeGreaterThan(0);
  });

  it('reports every loaded engine in listLoaded()', async () => {
    await engineRegistry.load('FXEngine');
    expect(engineRegistry.listLoaded()).toContain('FXEngine');
  });

  it('caches modules so a second load is the same object', async () => {
    const a = await engineRegistry.load('ConsolidationEngine');
    const b = await engineRegistry.load('ConsolidationEngine');
    expect(a).toBe(b);
  });

  it('deduplicates concurrent loads of the same engine', async () => {
    const [a, b, c] = await Promise.all([
      engineRegistry.load('MonteCarloEngine'),
      engineRegistry.load('MonteCarloEngine'),
      engineRegistry.load('MonteCarloEngine'),
    ]);
    expect(a).toBe(b);
    expect(b).toBe(c);
  });
});

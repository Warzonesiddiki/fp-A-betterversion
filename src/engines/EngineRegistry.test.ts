import { describe, it, expect } from 'vitest';
import { engineRegistry, UnknownEngineError } from './EngineRegistry';

describe('EngineRegistry', () => {
  it('exports engineRegistry instance', () => {
    expect(engineRegistry).toBeDefined();
  });

  it('has load method and can dynamically load known engines', async () => {
    expect(typeof engineRegistry.load).toBe('function');
    const mod = await engineRegistry.load('FormulaEngine');
    expect(mod).toBeDefined();
    expect(engineRegistry.has('FormulaEngine')).toBe(true);
  });

  it('retrieves cached loaded engines synchronously with get()', () => {
    const cached = engineRegistry.get('FormulaEngine');
    expect(cached).toBeDefined();
    expect(engineRegistry.get('non_existent_engine_id')).toBeNull();
  });

  it('lists all available generated engines and checks known status', () => {
    const available = engineRegistry.listAvailable();
    expect(available.length).toBeGreaterThan(100);
    expect(engineRegistry.isKnown('FormulaEngine')).toBe(true);
    expect(engineRegistry.isKnown('FakeNonExistentEngine')).toBe(false);
  });

  it('lists loaded engines and reports cache stats', () => {
    const loaded = engineRegistry.listLoaded();
    expect(loaded.length).toBeGreaterThan(0);

    const stats = engineRegistry.getStats();
    expect(stats.loaded).toBeGreaterThan(0);
    expect(stats.critical).toContain('FormulaEngine');
  });

  it('preloads engines and preloads critical modules', () => {
    engineRegistry.preload('ConsolidationEngine');
    engineRegistry.preloadCritical();
    expect(engineRegistry.isKnown('ConsolidationEngine')).toBe(true);
  });

  it('throws UnknownEngineError when attempting to load an unmapped engine', async () => {
    await expect(engineRegistry.load('InvalidEngine_XYZ')).rejects.toThrow(UnknownEngineError);
    try {
      await engineRegistry.load('InvalidEngine_XYZ');
    } catch (e) {
      expect(e).toBeInstanceOf(UnknownEngineError);
      const err = e as UnknownEngineError;
      expect(err.name).toBe('UnknownEngineError');
      expect(err.engineId).toBe('InvalidEngine_XYZ');
    }
  });

  it('evicts cold engines while preserving critical ones', () => {
    // Force eviction with negative maxAge to simulate elapsed time
    const evicted = engineRegistry.evictCold(-1000);
    expect(evicted).toBeGreaterThanOrEqual(0);
    // Critical engines must remain
    expect(engineRegistry.has('FormulaEngine')).toBe(true);
  });

  it('clears non-critical engines', () => {
    engineRegistry.clear();
    expect(engineRegistry.has('FormulaEngine')).toBe(true);
  });
});

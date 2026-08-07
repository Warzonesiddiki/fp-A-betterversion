/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { ReportCacheEngine } from './ReportCacheEngine';

describe('ReportCacheEngine', () => {
  let engine: ReportCacheEngine;

  beforeEach(() => {
    engine = new ReportCacheEngine();
  });

  describe('set and get', () => {
    it('stores and retrieves a value', () => {
      engine.set('key1', { data: 'test' }, 'report1');
      expect(engine.get('key1')).toEqual({ data: 'test' });
    });

    it('returns undefined for missing key', () => {
      expect(engine.get('missing')).toBeUndefined();
    });

    it('expires entries after ttlMs', async () => {
      const shortEngine = new ReportCacheEngine({ ttlMs: 5 });
      shortEngine.set('temp', 'val', 'rep1');
      expect(shortEngine.get('temp')).toBe('val');

      // Fast-forward or wait
      await new Promise((r) => setTimeout(r, 15));
      expect(shortEngine.get('temp')).toBeUndefined();
      expect(shortEngine.has('temp')).toBe(false);
    });
  });

  describe('delete and has', () => {
    it('removes a cached entry', () => {
      engine.set('key1', 'value1', 'report1');
      engine.delete('key1');
      expect(engine.get('key1')).toBeUndefined();
      expect(engine.has('key1')).toBe(false);
    });
  });

  describe('eviction policies: LRU, LFU, FIFO', () => {
    it('evicts using LRU policy', async () => {
      const lruEngine = new ReportCacheEngine({ maxSize: 2, evictionPolicy: 'lru' });
      lruEngine.set('k1', 'v1', 'r1');
      await new Promise((r) => setTimeout(r, 5));
      lruEngine.set('k2', 'v2', 'r2');
      await new Promise((r) => setTimeout(r, 5));
      lruEngine.get('k1'); // Access k1 to make k2 least recently used
      await new Promise((r) => setTimeout(r, 5));
      lruEngine.set('k3', 'v3', 'r3'); // Evicts k2

      expect(lruEngine.get('k1')).toBe('v1');
      expect(lruEngine.get('k2')).toBeUndefined();
      expect(lruEngine.get('k3')).toBe('v3');
    });

    it('evicts using LFU policy', () => {
      const lfuEngine = new ReportCacheEngine({ maxSize: 2, evictionPolicy: 'lfu' });
      lfuEngine.set('k1', 'v1', 'r1');
      lfuEngine.set('k2', 'v2', 'r2');
      lfuEngine.get('k1');
      lfuEngine.get('k1'); // k1 count = 2, k2 count = 0
      lfuEngine.set('k3', 'v3', 'r3'); // Evicts k2

      expect(lfuEngine.get('k1')).toBe('v1');
      expect(lfuEngine.get('k2')).toBeUndefined();
    });

    it('evicts using FIFO policy', () => {
      const fifoEngine = new ReportCacheEngine({ maxSize: 2, evictionPolicy: 'fifo' });
      fifoEngine.set('k1', 'v1', 'r1');
      fifoEngine.set('k2', 'v2', 'r2');
      fifoEngine.set('k3', 'v3', 'r3'); // Evicts k1 (first in)

      expect(fifoEngine.get('k1')).toBeUndefined();
      expect(fifoEngine.get('k2')).toBe('v2');
      expect(fifoEngine.get('k3')).toBe('v3');
    });
  });

  describe('cleanup, configure, serialization and stats', () => {
    it('cleans up expired entries and updates stats', async () => {
      const expEngine = new ReportCacheEngine({ ttlMs: 5 });
      expEngine.set('k1', 'v1', 'r1');
      expEngine.set('k2', [1, 2, 3], 'r2');

      await new Promise((r) => setTimeout(r, 15));
      const removed = expEngine.cleanup();
      expect(removed).toBe(2);
      expect(expEngine.getStats().currentSize).toBe(0);
    });

    it('serializes and deserializes state', () => {
      engine.set('k1', 'v1', 'r1');
      engine.set('k2', { val: 42, bool: true, nullVal: null }, 'r2');
      engine.get('k1');

      const json = engine.serialize();
      const newEngine = new ReportCacheEngine();
      newEngine.deserialize(json);

      expect(newEngine.get('k1')).toBe('v1');
      expect(newEngine.get('k2')).toEqual({ val: 42, bool: true, nullVal: null });
      expect(newEngine.getEntries()).toHaveLength(2);
    });

    it('allows reconfiguring runtime parameters', () => {
      engine.configure({ maxSize: 50, ttlMs: 10000 });
      expect(engine.getConfig().maxSize).toBe(50);
      expect(engine.getConfig().ttlMs).toBe(10000);
    });

    it('invalidates entries by report ID', () => {
      engine.set('key1', 'value1', 'report1');
      engine.set('key2', 'value2', 'report1');
      engine.set('key3', 'value3', 'report2');
      const count = engine.invalidateByReport('report1');
      expect(count).toBe(2);
      expect(engine.get('key3')).toBeDefined();
    });

    it('clears all entries', () => {
      engine.set('k1', 'v1', 'r1');
      engine.clear();
      expect(engine.get('k1')).toBeUndefined();
    });
  });
});

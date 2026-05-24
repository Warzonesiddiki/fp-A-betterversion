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
  });

  describe('delete', () => {
    it('removes a cached entry', () => {
      engine.set('key1', 'value1', 'report1');
      engine.delete('key1');
      expect(engine.get('key1')).toBeUndefined();
    });
  });

  describe('has', () => {
    it('returns true for existing key', () => {
      engine.set('key1', 'value1', 'report1');
      expect(engine.has('key1')).toBe(true);
    });

    it('returns false for missing key', () => {
      expect(engine.has('missing')).toBe(false);
    });
  });

  describe('clear', () => {
    it('removes all entries', () => {
      engine.set('key1', 'value1', 'report1');
      engine.set('key2', 'value2', 'report2');
      engine.clear();
      expect(engine.get('key1')).toBeUndefined();
      expect(engine.get('key2')).toBeUndefined();
    });
  });

  describe('getStats', () => {
    it('returns cache statistics', () => {
      engine.set('key1', 'value1', 'report1');
      const stats = engine.getStats();
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('currentSize');
      expect(stats).toHaveProperty('hitRate');
      expect(stats.currentSize).toBe(1);
    });
  });

  describe('invalidateByReport', () => {
    it('removes entries by report ID', () => {
      engine.set('key1', 'value1', 'report1');
      engine.set('key2', 'value2', 'report1');
      engine.set('key3', 'value3', 'report2');
      const count = engine.invalidateByReport('report1');
      expect(count).toBe(2);
      expect(engine.get('key3')).toBeDefined();
    });
  });
});

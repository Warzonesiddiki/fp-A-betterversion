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

    it('returns null for missing key', () => {
      expect(engine.get('missing')).toBeNull();
    });
  });

  describe('invalidate', () => {
    it('removes a cached entry', () => {
      engine.set('key1', 'value1', 'report1');
      engine.invalidate('key1');
      expect(engine.get('key1')).toBeNull();
    });
  });

  describe('clear', () => {
    it('removes all entries', () => {
      engine.set('key1', 'value1', 'report1');
      engine.set('key2', 'value2', 'report2');
      engine.clear();
      expect(engine.get('key1')).toBeNull();
      expect(engine.get('key2')).toBeNull();
    });
  });

  describe('getStats', () => {
    it('returns cache statistics', () => {
      engine.set('key1', 'value1', 'report1');
      const stats = engine.getStats();
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('size');
    });
  });
});

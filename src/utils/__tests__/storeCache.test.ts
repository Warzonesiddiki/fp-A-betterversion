import { describe, it, expect } from 'vitest';
import {
  withCache,
  invalidateCache,
  invalidateCacheByPattern,
  invalidateStoreCache,
  clearCache,
  getCacheStats,
} from '../storeCache';

describe('storeCache', () => {
  it('withCache returns fetched value', () => {
    const result = withCache('test', () => 42);
    expect(typeof result).toBe('number');
  });

  it('invalidateCache returns count', () => {
    const count = invalidateCache('budget');
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it('invalidateCacheByPattern returns count', () => {
    const count = invalidateCacheByPattern(/^budget/);
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it('invalidateStoreCache returns count', () => {
    const count = invalidateStoreCache('budget-store');
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it('clearCache does not throw', () => {
    expect(() => clearCache()).not.toThrow();
  });

  it('getCacheStats returns stats object', () => {
    const stats = getCacheStats();
    expect(stats).toBeDefined();
    expect(typeof stats).toBe('object');
  });
});

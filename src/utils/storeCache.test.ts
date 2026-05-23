import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted to create mock functions before vi.mock hoisting
const { mockGetOrSet, mockInvalidateByPrefix, mockInvalidateByPattern, mockClear, mockGetStats } =
  vi.hoisted(() => ({
    mockGetOrSet: vi.fn(),
    mockInvalidateByPrefix: vi.fn(),
    mockInvalidateByPattern: vi.fn(),
    mockClear: vi.fn(),
    mockGetStats: vi.fn(),
  }));

vi.mock('@/engines/QueryCache', () => ({
  QueryCache: class MockQueryCache {
    getOrSet = mockGetOrSet;
    invalidateByPrefix = mockInvalidateByPrefix;
    invalidateByPattern = mockInvalidateByPattern;
    clear = mockClear;
    getStats = mockGetStats;
  },
}));

import {
  withCache,
  invalidateCache,
  invalidateCacheByPattern,
  clearCache,
  getCacheStats,
  invalidateStoreCache,
  storeCache,
} from './storeCache';

describe('withCache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call cache.getOrSet with key and fetcher', () => {
    const fetcher = vi.fn().mockReturnValue('result');
    mockGetOrSet.mockReturnValue('result');

    const result = withCache('test-key', fetcher);

    expect(mockGetOrSet).toHaveBeenCalledWith('test-key', fetcher, undefined);
    expect(result).toBe('result');
  });

  it('should pass optional ttl', () => {
    const fetcher = vi.fn().mockReturnValue('result');
    mockGetOrSet.mockReturnValue('result');

    withCache('test-key', fetcher, 60000);

    expect(mockGetOrSet).toHaveBeenCalledWith('test-key', fetcher, 60000);
  });

  it('should return cached value without calling fetcher directly', () => {
    mockGetOrSet.mockReturnValue('cached-value');

    const fetcher = vi.fn();
    const result = withCache('key', fetcher);

    expect(result).toBe('cached-value');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('should handle fetcher that returns undefined', () => {
    mockGetOrSet.mockReturnValue(undefined);

    const result = withCache('key', () => undefined);
    expect(result).toBeUndefined();
  });

  it('should handle fetcher that returns null', () => {
    mockGetOrSet.mockReturnValue(null);

    const result = withCache('key', () => null);
    expect(result).toBeNull();
  });
});

describe('invalidateCache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call cache.invalidateByPrefix with prefix', () => {
    mockInvalidateByPrefix.mockReturnValue(3);

    const count = invalidateCache('budget:');

    expect(mockInvalidateByPrefix).toHaveBeenCalledWith('budget:');
    expect(count).toBe(3);
  });

  it('should return 0 when no entries match', () => {
    mockInvalidateByPrefix.mockReturnValue(0);

    const count = invalidateCache('nonexistent:');
    expect(count).toBe(0);
  });
});

describe('invalidateCacheByPattern', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call cache.invalidateByPattern with regex', () => {
    mockInvalidateByPattern.mockReturnValue(2);
    const pattern = /budget:.*/;

    const count = invalidateCacheByPattern(pattern);

    expect(mockInvalidateByPattern).toHaveBeenCalledWith(pattern);
    expect(count).toBe(2);
  });

  it('should return 0 when no entries match pattern', () => {
    mockInvalidateByPattern.mockReturnValue(0);

    const count = invalidateCacheByPattern(/nothing/);
    expect(count).toBe(0);
  });
});

describe('clearCache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call cache.clear', () => {
    clearCache();
    expect(mockClear).toHaveBeenCalled();
  });
});

describe('getCacheStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return cache statistics', () => {
    const stats = {
      hits: 100,
      misses: 10,
      hitRate: 0.91,
      totalSize: 1024,
      entryCount: 50,
      evictions: 5,
    };
    mockGetStats.mockReturnValue(stats);

    const result = getCacheStats();

    expect(mockGetStats).toHaveBeenCalled();
    expect(result).toEqual(stats);
  });
});

describe('invalidateStoreCache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should invalidate entries by store name prefix', () => {
    mockInvalidateByPrefix.mockReturnValue(5);

    const count = invalidateStoreCache('budget');

    expect(mockInvalidateByPrefix).toHaveBeenCalledWith('budget:');
    expect(count).toBe(5);
  });
});

describe('storeCache export', () => {
  it('should export the cache instance', () => {
    expect(storeCache).toBeDefined();
    expect(storeCache.getOrSet).toBeInstanceOf(Function);
  });
});

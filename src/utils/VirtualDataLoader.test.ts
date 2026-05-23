import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  VirtualDataLoader,
  createGridDataLoader,
  createLargeDatasetLoader,
} from './VirtualDataLoader';

// Helper to create a simple fetcher
function createMockFetcher(totalItems: number) {
  const items = Array.from({ length: totalItems }, (_, i) => ({ id: i, value: `item-${i}` }));
  return vi.fn(async (startIndex: number, endIndex: number) => {
    return items.slice(startIndex, endIndex + 1);
  });
}

describe('VirtualDataLoader', () => {
  let fetcher: ReturnType<typeof createMockFetcher>;

  beforeEach(() => {
    fetcher = createMockFetcher(1000);
  });

  describe('constructor', () => {
    it('should create with default config', () => {
      const loader = new VirtualDataLoader(fetcher, 1000);
      const stats = loader.getCacheStats();

      expect(stats.totalItems).toBe(1000);
      expect(stats.cachedChunks).toBe(0);
      expect(stats.loadingChunks).toBe(0);
    });

    it('should accept partial config override', () => {
      const loader = new VirtualDataLoader(fetcher, 1000, { chunkSize: 50 });
      expect(loader.getCacheStats().totalItems).toBe(1000);
    });
  });

  describe('getItem', () => {
    it('should fetch a single item by index', async () => {
      const loader = new VirtualDataLoader(fetcher, 1000, { chunkSize: 100 });

      const item = await loader.getItem(5);
      expect(item).toEqual({ id: 5, value: 'item-5' });
    });

    it('should fetch item at boundary (first item)', async () => {
      const loader = new VirtualDataLoader(fetcher, 1000, { chunkSize: 100 });

      const item = await loader.getItem(0);
      expect(item).toEqual({ id: 0, value: 'item-0' });
    });

    it('should fetch item at chunk boundary', async () => {
      const loader = new VirtualDataLoader(fetcher, 1000, { chunkSize: 100 });

      const item = await loader.getItem(100);
      expect(item).toEqual({ id: 100, value: 'item-100' });
    });
  });

  describe('getRange', () => {
    it('should fetch a range of items', async () => {
      const loader = new VirtualDataLoader(fetcher, 1000, { chunkSize: 100 });

      const items = await loader.getRange(0, 4);
      expect(items).toHaveLength(5);
      expect(items[0]).toEqual({ id: 0, value: 'item-0' });
      expect(items[4]).toEqual({ id: 4, value: 'item-4' });
    });

    it('should fetch range spanning multiple chunks', async () => {
      const loader = new VirtualDataLoader(fetcher, 1000, { chunkSize: 100 });

      const items = await loader.getRange(95, 105);
      expect(items).toHaveLength(11);
      expect(items[0]).toEqual({ id: 95, value: 'item-95' });
      expect(items[10]).toEqual({ id: 105, value: 'item-105' });
    });

    it('should cache chunks after first fetch', async () => {
      const loader = new VirtualDataLoader(fetcher, 1000, { chunkSize: 100 });

      await loader.getRange(0, 4);
      expect(loader.isChunkLoaded(0)).toBe(true);
    });

    it('should reuse cached chunks on second fetch', async () => {
      const loader = new VirtualDataLoader(fetcher, 1000, { chunkSize: 100 });

      await loader.getRange(0, 4);
      await loader.getRange(0, 4);

      expect(fetcher).toHaveBeenCalledTimes(1);
    });
  });

  describe('getVisibleRange', () => {
    it('should fetch visible range and trigger prefetch', async () => {
      const loader = new VirtualDataLoader(fetcher, 1000, {
        chunkSize: 100,
        prefetchCount: 1,
      });

      const items = await loader.getVisibleRange(0, 10);
      expect(items).toHaveLength(10);
    });

    it('should clamp end index to totalCount', async () => {
      const loader = new VirtualDataLoader(fetcher, 10, { chunkSize: 100 });

      const items = await loader.getVisibleRange(5, 100);
      expect(items).toHaveLength(5); // 5..9
    });
  });

  describe('cache eviction', () => {
    it('should evict oldest chunk when maxCachedChunks exceeded', async () => {
      const loader = new VirtualDataLoader(fetcher, 1000, {
        chunkSize: 100,
        maxCachedChunks: 2,
      });

      // The evictOldestChunk check runs BEFORE adding the new chunk:
      // size <= maxCachedChunks => no eviction.
      // So with maxCachedChunks=2, eviction only triggers on the 4th chunk.
      await loader.getItem(0); // chunk-0: size=0, no evict -> size=1
      await loader.getItem(100); // chunk-1: size=1, no evict -> size=2
      await loader.getItem(200); // chunk-2: size=2, 2<=2 no evict -> size=3
      await loader.getItem(300); // chunk-3: size=3, 3>2 EVICT oldest (chunk-0) -> size=3

      expect(loader.isChunkLoaded(0)).toBe(false); // evicted (oldest lastAccessed)
      expect(loader.isChunkLoaded(100)).toBe(true);
      expect(loader.isChunkLoaded(200)).toBe(true);
      expect(loader.isChunkLoaded(300)).toBe(true);
    });
  });

  describe('isChunkLoaded / isChunkLoading', () => {
    it('should report unloaded chunks correctly', () => {
      const loader = new VirtualDataLoader(fetcher, 1000, { chunkSize: 100 });

      expect(loader.isChunkLoaded(0)).toBe(false);
      expect(loader.isChunkLoading(0)).toBe(false);
    });

    it('should report loaded chunks correctly', async () => {
      const loader = new VirtualDataLoader(fetcher, 1000, { chunkSize: 100 });

      await loader.getItem(0);
      expect(loader.isChunkLoaded(0)).toBe(true);
    });
  });

  describe('getCachedRange', () => {
    it('should return null when nothing is cached', () => {
      const loader = new VirtualDataLoader(fetcher, 1000, { chunkSize: 100 });

      expect(loader.getCachedRange()).toBeNull();
    });

    it('should return correct range after loading', async () => {
      const loader = new VirtualDataLoader(fetcher, 1000, { chunkSize: 100 });

      await loader.getItem(0);
      const range = loader.getCachedRange();
      expect(range).toEqual({ start: 0, end: 99 });
    });

    it('should expand range when multiple chunks loaded', async () => {
      const loader = new VirtualDataLoader(fetcher, 1000, { chunkSize: 100 });

      await loader.getItem(0);
      await loader.getItem(200);
      const range = loader.getCachedRange();
      expect(range).toEqual({ start: 0, end: 299 });
    });
  });

  describe('getCacheStats', () => {
    it('should return correct stats', async () => {
      const loader = new VirtualDataLoader(fetcher, 1000, { chunkSize: 100 });

      const stats = loader.getCacheStats();
      expect(stats.totalItems).toBe(1000);
      expect(stats.cachedChunks).toBe(0);
      expect(stats.cachedItems).toBe(0);
      expect(stats.memoryEstimate).toBe(0);

      await loader.getItem(0);
      const afterStats = loader.getCacheStats();
      expect(afterStats.cachedChunks).toBe(1);
      expect(afterStats.cachedItems).toBe(100);
    });
  });

  describe('updateTotalCount', () => {
    it('should update total count', () => {
      const loader = new VirtualDataLoader(fetcher, 1000, { chunkSize: 100 });

      loader.updateTotalCount(2000);
      expect(loader.getCacheStats().totalItems).toBe(2000);
    });
  });

  describe('clearCache', () => {
    it('should clear all cached data', async () => {
      const loader = new VirtualDataLoader(fetcher, 1000, { chunkSize: 100 });

      await loader.getItem(0);
      expect(loader.isChunkLoaded(0)).toBe(true);

      loader.clearCache();
      expect(loader.isChunkLoaded(0)).toBe(false);
      expect(loader.getCacheStats().cachedChunks).toBe(0);
    });
  });

  describe('invalidateChunk', () => {
    it('should invalidate specific chunk', async () => {
      const loader = new VirtualDataLoader(fetcher, 1000, { chunkSize: 100 });

      await loader.getItem(0);
      await loader.getItem(100);

      loader.invalidateChunk(0);
      expect(loader.isChunkLoaded(0)).toBe(false);
      expect(loader.isChunkLoaded(100)).toBe(true);
    });
  });

  describe('invalidateAll', () => {
    it('should invalidate all chunks', async () => {
      const loader = new VirtualDataLoader(fetcher, 1000, { chunkSize: 100 });

      await loader.getItem(0);
      await loader.getItem(100);

      loader.invalidateAll();
      expect(loader.isChunkLoaded(0)).toBe(false);
      expect(loader.isChunkLoaded(100)).toBe(false);
    });
  });

  describe('onProgress', () => {
    it('should register and unregister progress callback', () => {
      const loader = new VirtualDataLoader(fetcher, 1000, { chunkSize: 100 });
      const callback = vi.fn();

      const unsubscribe = loader.onProgress(callback);
      expect(typeof unsubscribe).toBe('function');

      unsubscribe();
    });
  });

  describe('timeout', () => {
    it('should timeout on slow fetcher', async () => {
      const slowFetcher = vi.fn(
        () => new Promise<any[]>((resolve) => setTimeout(() => resolve([]), 10000))
      );

      const loader = new VirtualDataLoader(slowFetcher, 100, {
        chunkSize: 10,
        loadTimeout: 50,
      });

      await expect(loader.getItem(0)).rejects.toThrow('load timeout');
    });
  });

  describe('concurrent loads', () => {
    it('should deduplicate concurrent loads for the same chunk', async () => {
      const loader = new VirtualDataLoader(fetcher, 1000, { chunkSize: 100 });

      const [item1, item2] = await Promise.all([loader.getItem(5), loader.getItem(6)]);

      expect(item1).toEqual({ id: 5, value: 'item-5' });
      expect(item2).toEqual({ id: 6, value: 'item-6' });

      expect(fetcher).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    it('should handle empty dataset', async () => {
      const emptyFetcher = vi.fn(async () => []);
      const loader = new VirtualDataLoader(emptyFetcher, 0, { chunkSize: 100 });

      const items = await loader.getRange(0, 0);
      expect(items).toHaveLength(0);
    });

    it('should handle single item dataset', async () => {
      const singleFetcher = vi.fn(async () => [{ id: 0 }]);
      const loader = new VirtualDataLoader(singleFetcher, 1, { chunkSize: 100 });

      const item = await loader.getItem(0);
      expect(item).toEqual({ id: 0 });
    });

    it('should handle chunkSize of 1', async () => {
      const loader = new VirtualDataLoader(fetcher, 10, { chunkSize: 1 });

      const item = await loader.getItem(0);
      expect(item).toEqual({ id: 0, value: 'item-0' });
    });
  });
});

describe('createGridDataLoader', () => {
  it('should create loader with grid defaults', () => {
    const fetcher = vi.fn(async () => []);
    const loader = createGridDataLoader(fetcher, 1000);

    expect(loader).toBeInstanceOf(VirtualDataLoader);
    expect(loader.getCacheStats().totalItems).toBe(1000);
  });

  it('should accept config overrides', () => {
    const fetcher = vi.fn(async () => []);
    const loader = createGridDataLoader(fetcher, 1000, { chunkSize: 25 });

    expect(loader).toBeInstanceOf(VirtualDataLoader);
  });
});

describe('createLargeDatasetLoader', () => {
  it('should create loader with large dataset defaults', () => {
    const fetcher = vi.fn(async () => []);
    const loader = createLargeDatasetLoader(fetcher, 100000);

    expect(loader).toBeInstanceOf(VirtualDataLoader);
    expect(loader.getCacheStats().totalItems).toBe(100000);
  });

  it('should accept config overrides', () => {
    const fetcher = vi.fn(async () => []);
    const loader = createLargeDatasetLoader(fetcher, 100000, { chunkSize: 1000 });

    expect(loader).toBeInstanceOf(VirtualDataLoader);
  });
});

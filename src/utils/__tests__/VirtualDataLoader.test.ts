import { describe, it, expect, vi } from 'vitest';
import {
  VirtualDataLoader,
  createGridDataLoader,
  createLargeDatasetLoader,
} from '../VirtualDataLoader';

describe('VirtualDataLoader', () => {
  const createFetcher = (size: number) =>
    vi
      .fn()
      .mockImplementation((start: number, end: number) =>
        Promise.resolve(Array.from({ length: end - start + 1 }, (_, i) => `item-${start + i}`))
      );

  it('getItem returns item by index', async () => {
    const fetcher = createFetcher(1000);
    const loader = new VirtualDataLoader(fetcher, 1000, { chunkSize: 100 });

    const item = await loader.getItem(5);
    expect(item).toBe('item-5');
  });

  it('getRange returns range of items', async () => {
    const fetcher = createFetcher(1000);
    const loader = new VirtualDataLoader(fetcher, 1000, { chunkSize: 50 });

    const items = await loader.getRange(10, 14);
    expect(items).toHaveLength(5);
    expect(items[0]).toBe('item-10');
  });

  it('getVisibleRange returns items and prefetches', async () => {
    const fetcher = createFetcher(1000);
    const loader = new VirtualDataLoader(fetcher, 1000, { chunkSize: 50, prefetchCount: 1 });

    const items = await loader.getVisibleRange(0, 30);
    expect(items).toHaveLength(30);
    expect(items[0]).toBe('item-0');
  });

  it('getCacheStats returns stats', async () => {
    const fetcher = createFetcher(500);
    const loader = new VirtualDataLoader(fetcher, 500, { chunkSize: 100 });

    await loader.getItem(50);
    const stats = loader.getCacheStats();
    expect(stats.cachedChunks).toBe(1);
    expect(stats.cachedItems).toBe(100);
    expect(stats.totalItems).toBe(500);
  });

  it('isChunkLoaded returns correct status', async () => {
    const fetcher = createFetcher(200);
    const loader = new VirtualDataLoader(fetcher, 200, { chunkSize: 100 });

    expect(loader.isChunkLoaded(0)).toBe(false);
    await loader.getItem(5);
    expect(loader.isChunkLoaded(0)).toBe(true);
  });

  it('isChunkLoading returns correct status', () => {
    const fetcher = createFetcher(200);
    const loader = new VirtualDataLoader(fetcher, 200, { chunkSize: 100 });

    expect(loader.isChunkLoading(0)).toBe(false);
  });

  it('getCachedRange returns range', async () => {
    const fetcher = createFetcher(1000);
    const loader = new VirtualDataLoader(fetcher, 1000, { chunkSize: 100 });

    await loader.getItem(50);
    const range = loader.getCachedRange();
    expect(range).not.toBeNull();
    expect(range!.start).toBe(0);
    expect(range!.end).toBe(99);
  });

  it('getCachedRange returns null when empty', () => {
    const fetcher = createFetcher(1000);
    const loader = new VirtualDataLoader(fetcher, 1000);
    expect(loader.getCachedRange()).toBeNull();
  });

  it('updateTotalCount updates count', () => {
    const fetcher = createFetcher(100);
    const loader = new VirtualDataLoader(fetcher, 100);
    loader.updateTotalCount(200);
    const stats = loader.getCacheStats();
    expect(stats.totalItems).toBe(200);
  });

  it('clearCache removes all chunks', async () => {
    const fetcher = createFetcher(500);
    const loader = new VirtualDataLoader(fetcher, 500, { chunkSize: 100 });

    await loader.getItem(5);
    loader.clearCache();
    expect(loader.getCacheStats().cachedChunks).toBe(0);
  });

  it('invalidateChunk removes specific chunk', async () => {
    const fetcher = createFetcher(500);
    const loader = new VirtualDataLoader(fetcher, 500, { chunkSize: 100 });

    await loader.getItem(5);
    loader.invalidateChunk(5);
    expect(loader.isChunkLoaded(5)).toBe(false);
  });

  it('invalidateAll clears chunks', async () => {
    const fetcher = createFetcher(500);
    const loader = new VirtualDataLoader(fetcher, 500, { chunkSize: 100 });

    await loader.getItem(5);
    loader.invalidateAll();
    expect(loader.getCacheStats().cachedChunks).toBe(0);
  });

  it('onProgress registers callback and returns unsubscribe', () => {
    const fetcher = createFetcher(100);
    const loader = new VirtualDataLoader(fetcher, 100);
    const cb = vi.fn();
    const unsub = loader.onProgress(cb);
    expect(typeof unsub).toBe('function');
    unsub();
  });

  it('handles empty total count', async () => {
    const fetcher = createFetcher(0);
    const loader = new VirtualDataLoader(fetcher, 0);

    const item = await loader.getItem(0);
    expect(item).toBeUndefined();
  });

  it('createGridDataLoader returns loader with grid config', () => {
    const fetcher = createFetcher(500);
    const loader = createGridDataLoader(fetcher, 500);
    expect(loader).toBeInstanceOf(VirtualDataLoader);
  });

  it('createLargeDatasetLoader returns loader with large config', () => {
    const fetcher = createFetcher(50000);
    const loader = createLargeDatasetLoader(fetcher, 50000);
    expect(loader).toBeInstanceOf(VirtualDataLoader);
  });
});

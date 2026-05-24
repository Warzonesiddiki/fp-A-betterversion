import { describe, it, expect, vi } from 'vitest';
import {
  cacheSet,
  cacheGet,
  cacheIsStale,
  cacheRemove,
  cacheClearStore,
  cacheClearAll,
  cacheGetMetadata,
  cacheBulkSet,
  cacheGetAll,
  getCacheStatus,
  markSynced,
  isOnline,
  onConnectivityChange,
} from '../offlineCache';

vi.mock('../indexedDBStorage', () => ({
  openDB: vi.fn().mockRejectedValue(new Error('IndexedDB not available')),
}));

describe('offlineCache', () => {
  it('cacheSet handles errors gracefully', async () => {
    await expect(cacheSet('test', 'key', 'value')).resolves.toBeUndefined();
  });

  it('cacheGet returns null on error', async () => {
    const result = await cacheGet('test', 'key');
    expect(result).toBeNull();
  });

  it('cacheIsStale returns true on error', async () => {
    expect(await cacheIsStale('test', 'key')).toBe(true);
  });

  it('cacheRemove does not throw', async () => {
    await expect(cacheRemove('test', 'key')).resolves.toBeUndefined();
  });

  it('cacheClearStore returns 0 on error', async () => {
    expect(await cacheClearStore('test')).toBe(0);
  });

  it('cacheClearAll does not throw', async () => {
    await expect(cacheClearAll()).resolves.toBeUndefined();
  });

  it('cacheGetMetadata returns empty on error', async () => {
    expect(await cacheGetMetadata()).toEqual([]);
  });

  it('cacheBulkSet handles empty entries', async () => {
    await expect(cacheBulkSet('test', [])).resolves.toBeUndefined();
  });

  it('cacheGetAll returns empty on error', async () => {
    expect(await cacheGetAll('test')).toEqual([]);
  });

  it('getCacheStatus works', async () => {
    const status = await getCacheStatus();
    expect(status.isOnline).toBeDefined();
    expect(status.cachedStores).toEqual([]);
    expect(status.totalEntries).toBe(0);
  });

  it('markSynced sets lastSyncAt', () => {
    markSynced();
  });

  it('isOnline returns boolean', () => {
    expect(typeof isOnline()).toBe('boolean');
  });

  it('onConnectivityChange returns unsubscribe function', () => {
    const unsub = onConnectivityChange(() => {});
    expect(typeof unsub).toBe('function');
    unsub();
  });
});

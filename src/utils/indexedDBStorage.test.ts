/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, afterAll } from 'vitest';
import 'fake-indexeddb/auto';
import { indexedDBStorage, isStorageAvailable } from './indexedDBStorage';

describe('indexedDBStorage', () => {
  const originalIDB = global.indexedDB;

  afterAll(() => {
    global.indexedDB = originalIDB;
  });

  it('isStorageAvailable returns false if IDB is missing', async () => {
    (global as any).indexedDB = undefined;

    const available = await isStorageAvailable();
    expect(available).toBe(false);
  });

  it('isStorageAvailable returns true if IDB is present', async () => {
    // fake-indexeddb/auto installs a spec-compliant IndexedDB on globalThis.
    (global as any).indexedDB = originalIDB;
    const available = await isStorageAvailable();
    expect(available).toBe(true);
  });

  it('round-trips a value through the real object store', async () => {
    (global as any).indexedDB = originalIDB;
    const key = 'round-trip-test';
    await indexedDBStorage.setItem(key, { hello: 'world', n: 42 });
    const value = await indexedDBStorage.getItem(key);
    expect(value).toEqual({ hello: 'world', n: 42 });
    await indexedDBStorage.removeItem(key);
    const after = await indexedDBStorage.getItem(key);
    expect(after).toBeNull();
  });

  it('has required methods', () => {
    expect(indexedDBStorage.getItem).toBeDefined();
    expect(indexedDBStorage.setItem).toBeDefined();
    expect(indexedDBStorage.removeItem).toBeDefined();
  });
});

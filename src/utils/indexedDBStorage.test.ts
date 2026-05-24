/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { indexedDBStorage, isStorageAvailable } from './indexedDBStorage';

// We can't easily test real IDB without fake-indexeddb.
// But we can test isStorageAvailable and the interface of indexedDBStorage.

describe('indexedDBStorage', () => {
  it('isStorageAvailable returns false if IDB is missing', async () => {
    // Temporarily mock indexedDB
    const originalIDB = global.indexedDB;
    (global as any).indexedDB = undefined;

    const available = await isStorageAvailable();
    expect(available).toBe(false);

    global.indexedDB = originalIDB;
  });

  it.skip('isStorageAvailable returns true if IDB is present', async () => {
    // Skipped: jsdom does not support IndexedDB. This test requires a browser or fake-indexeddb.
  });

  it('has required methods', () => {
    expect(indexedDBStorage.getItem).toBeDefined();
    expect(indexedDBStorage.setItem).toBeDefined();
    expect(indexedDBStorage.removeItem).toBeDefined();
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { openDB, indexedDBStorage, isStorageAvailable } from '../indexedDBStorage';

describe('indexedDBStorage', () => {
  it('indexedDBStorage has required methods', () => {
    expect(indexedDBStorage.getItem).toBeDefined();
    expect(indexedDBStorage.setItem).toBeDefined();
    expect(indexedDBStorage.removeItem).toBeDefined();
  });

  it('isStorageAvailable returns false without indexedDB', async () => {
    const result = await isStorageAvailable();
    expect(result).toBe(false);
  });
});

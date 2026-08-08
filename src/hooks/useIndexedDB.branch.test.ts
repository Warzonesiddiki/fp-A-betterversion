import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIndexedDB } from './useIndexedDB';

// Use the fake IndexedDB implementation so no real browser API is required.
// (fake-indexeddb must be installed before the hook runs, since the hook calls
// indexedDB.open lazily on each operation.)
import 'fake-indexeddb/auto';

describe('useIndexedDB — branch sweep', () => {
  beforeEach(async () => {
    // Drop any databases created by previous tests
    if (typeof indexedDB !== 'undefined' && 'databases' in indexedDB) {
      const dbs = await (
        indexedDB as unknown as { databases: () => Promise<{ name: string }[]> }
      ).databases();
      for (const db of dbs) {
        indexedDB.deleteDatabase(db.name);
      }
    }
  });

  it('returns null from getItem when the database cannot open', async () => {
    const { result } = renderHook(() => useIndexedDB('nope-db', 'store'));
    // Force openDB failure by firing onerror on the open request
    const originalOpen = indexedDB.open.bind(indexedDB);
    (indexedDB as unknown as { open: () => IDBOpenDBRequest }).open = () => {
      const req = originalOpen('nope-db');
      setTimeout(() => {
        req.onerror?.(new Event('error') as never);
      }, 0);
      return req as IDBOpenDBRequest;
    };
    await expect(result.current.getItem('k')).resolves.toBeNull();
    (indexedDB as unknown as { open: () => IDBOpenDBRequest }).open = originalOpen;
  });

  it('set/get/remove round-trip through a real database', async () => {
    const { result } = renderHook(() => useIndexedDB('test-db', 'kv'));
    await act(async () => {
      await result.current.setItem('name', 'FinPlan');
      expect(await result.current.getItem<string>('name')).toBe('FinPlan');
      expect(await result.current.getItem<string>('missing')).toBeNull();
      await result.current.removeItem('name');
      expect(await result.current.getItem<string>('name')).toBeNull();
    });
  });

  it('clear wipes the store and getAll returns the stored records', async () => {
    const { result } = renderHook(() => useIndexedDB('test-db-2', 'kv'));
    await act(async () => {
      await result.current.setItem('a', 1);
      await result.current.setItem('b', 2);
      const all = await result.current.getAll<number>();
      expect(all.sort()).toEqual([1, 2]);
      await result.current.clear();
      expect(await result.current.getAll()).toEqual([]);
    });
  });

  it('creates the object store on first open via onupgradeneeded', async () => {
    const { result } = renderHook(() => useIndexedDB('fresh-db', 'auto-store'));
    await act(async () => {
      await result.current.setItem('k', 'v');
      expect(await result.current.getItem('k')).toBe('v');
      expect(await result.current.getAll()).toEqual(['v']);
    });
  });
});

/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useIndexedDB } from './useIndexedDB';

describe('useIndexedDB', () => {
  let mockDb: any;
  let mockStore: any;
  let mockTx: any;

  beforeEach(() => {
    mockStore = {
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn(),
      getAll: vi.fn(),
    };
    mockTx = {
      objectStore: vi.fn().mockReturnValue(mockStore),
    };
    mockDb = {
      transaction: vi.fn().mockReturnValue(mockTx),
    };

    const mockOpenRequest = {
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
      result: mockDb,
    };

    vi.stubGlobal('indexedDB', {
      open: vi.fn().mockReturnValue(mockOpenRequest),
    });
  });

  it('getItem calls store.get', async () => {
    const { result } = renderHook(() => useIndexedDB('testDB', 'testStore'));

    const promise = result.current.getItem('key1');

    // Simulate IDB success
    const openReq = (indexedDB.open as any).mock.results[0].value;
    openReq.onsuccess();

    const getReq = { onsuccess: null, result: 'value1' };
    mockStore.get.mockReturnValue(getReq);

    // Small delay to let openDB resolve
    await new Promise((r) => setTimeout(r, 0));

    (getReq as any).onsuccess();

    const val = await promise;
    expect(val).toBe('value1');
    expect(mockStore.get).toHaveBeenCalledWith('key1');
  });

  it('setItem calls store.put', async () => {
    const { result } = renderHook(() => useIndexedDB('testDB', 'testStore'));

    const promise = result.current.setItem('key1', 'value1');

    const openReq = (indexedDB.open as any).mock.results[0].value;
    openReq.onsuccess();

    const putReq = { onsuccess: null };
    mockStore.put.mockReturnValue(putReq);

    await new Promise((r) => setTimeout(r, 0));
    (putReq as any).onsuccess();

    await promise;
    expect(mockStore.put).toHaveBeenCalledWith('value1', 'key1');
  });
});

/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDataVersion, setDataVersion } from './dataMigration';
import * as dbStorage from './indexedDBStorage';

vi.mock('./indexedDBStorage', () => ({
  openDB: vi.fn(),
}));

describe('dataMigration utility', () => {
  let mockDb: any;
  let mockObjectStore: any;
  let mockTx: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockObjectStore = {
      get: vi.fn(),
      put: vi.fn(),
    };
    mockTx = {
      objectStore: vi.fn().mockReturnValue(mockObjectStore),
      oncomplete: null,
    };
    mockDb = {
      transaction: vi.fn().mockReturnValue(mockTx),
    };
    (dbStorage.openDB as any).mockResolvedValue(mockDb);
  });

  it('getDataVersion returns version from DB', async () => {
    const mockRequest = { onsuccess: null, result: { value: 2 } };
    mockObjectStore.get.mockReturnValue(mockRequest);

    const promise = getDataVersion();

    // Simulate async success
    setTimeout(() => {
      if (mockRequest.onsuccess) (mockRequest as any).onsuccess();
    }, 0);

    const result = await promise;
    expect(result).toBe(2);
  });

  it('getDataVersion returns 0 if not found', async () => {
    const mockRequest = { onsuccess: null, result: null };
    mockObjectStore.get.mockReturnValue(mockRequest);

    const promise = getDataVersion();

    setTimeout(() => {
      if (mockRequest.onsuccess) (mockRequest as any).onsuccess();
    }, 0);

    const result = await promise;
    expect(result).toBe(0);
  });

  it('setDataVersion puts version in DB', async () => {
    const promise = setDataVersion(5);

    setTimeout(() => {
      if (mockTx.oncomplete) mockTx.oncomplete();
    }, 0);

    await promise;
    expect(mockObjectStore.put).toHaveBeenCalledWith({ key: 'data-version', value: 5 });
  });
});

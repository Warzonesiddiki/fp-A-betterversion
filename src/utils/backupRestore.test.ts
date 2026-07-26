/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BackupRestore } from './backupRestore';
import * as dbStorage from './indexedDBStorage';

vi.mock('./indexedDBStorage', () => ({
  openDB: vi.fn(),
}));

describe('BackupRestore utility', () => {
  let mockDb: any;
  let mockObjectStore: any;
  let mockTx: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockObjectStore = {
      getAll: vi.fn(),
      put: vi.fn(),
      count: vi.fn(),
    };
    mockTx = {
      objectStore: vi.fn().mockReturnValue(mockObjectStore),
      oncomplete: null,
      onerror: null,
    };
    mockDb = {
      objectStoreNames: {
        contains: vi.fn(() => true),
      },
      transaction: vi.fn().mockReturnValue(mockTx),
    };
    (dbStorage.openDB as any).mockResolvedValue(mockDb);

    // Mock global browser APIs
    if (typeof window !== 'undefined') {
      window.URL.createObjectURL = vi.fn().mockReturnValue('mock-url');
      window.URL.revokeObjectURL = vi.fn();
    }
  });

  it('importBackup handles invalid format', async () => {
    const file = new File(['{}'], 'backup.json', { type: 'application/json' });
    const result = await BackupRestore.importBackup(file);
    expect(result.success).toBe(false);
    expect(result.errors[0]!).toContain('Invalid backup format');
  });

  it('importBackup handles valid format and writes to DB', async () => {
    const backupData = {
      metadata: { appVersion: '0.1.0', exportedAt: '2024', storeCounts: {} },
      data: { store1: { foo: 'bar' } },
    };
    const file = new File([JSON.stringify(backupData)], 'backup.json', {
      type: 'application/json',
    });

    const promise = BackupRestore.importBackup(file);

    // Simulate transaction complete
    setTimeout(() => {
      if (mockTx.oncomplete) mockTx.oncomplete();
    }, 0);

    const result = await promise;
    expect(result.success).toBe(true);
    expect(mockObjectStore.put).toHaveBeenCalledWith({ id: 'store1', value: { foo: 'bar' } });
  });

  it('importBackup handles parse errors', async () => {
    const file = new File(['invalid json'], 'backup.json', { type: 'application/json' });
    const result = await BackupRestore.importBackup(file);
    expect(result.success).toBe(false);
    expect(result.errors[0]!).toContain('Failed to parse backup');
  });

  it('checkIntegrity reports store counts', async () => {
    mockObjectStore.count.mockImplementation(() => {
      const request: any = { result: 2, onsuccess: null, onerror: null };
      setTimeout(() => {
        request.onsuccess?.();
        mockTx.oncomplete?.();
      }, 0);
      return request;
    });

    const result = await BackupRestore.checkIntegrity();
    expect(result.ok).toBe(true);
    expect(result.stores.stores).toBe(2);
    expect(result.stores.backups).toBe(2);
    expect(result.stores.metadata).toBe(2);
  });
});

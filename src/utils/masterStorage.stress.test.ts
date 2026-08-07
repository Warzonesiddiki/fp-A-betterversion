import { describe, it, expect, vi, beforeEach } from 'vitest';
import { masterStorage } from './masterStorage';

const { mockSqlJs, mockTauriSql } = vi.hoisted(() => ({
  mockSqlJs: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
  mockTauriSql: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

vi.mock('./sqlJsStorage', () => ({
  sqlJsStorage: mockSqlJs,
}));

vi.mock('./tauriSqlStorage', () => ({
  tauriSqlStorage: mockTauriSql,
  isTauri: vi.fn(),
}));

import { isTauri } from './tauriSqlStorage';

describe('masterStorage Stress Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (masterStorage as any).__resetCache();
    mockSqlJs.setItem.mockResolvedValue(undefined);
    mockTauriSql.setItem.mockResolvedValue(undefined);
  });

  it('handles 1000 rapid concurrent writes', async () => {
    vi.mocked(isTauri).mockResolvedValue(false); // Browser mode → sqlJsStorage backend

    const operations = Array.from({ length: 1000 }, (_, i) =>
      masterStorage.setItem(`key-${i}`, { value: JSON.stringify({ data: i }) } as any)
    );

    await Promise.all(operations);

    expect(mockSqlJs.setItem).toHaveBeenCalledTimes(1000);
    expect(mockTauriSql.setItem).not.toHaveBeenCalled();
  });

  it('handles failover scenarios (simulated)', async () => {
    vi.mocked(isTauri).mockResolvedValue(true); // Desktop mode

    mockTauriSql.setItem.mockRejectedValueOnce(new Error('DB Locked'));

    // Failures surface as StorageWriteError wrapping the backend cause —
    // never silent. (masterStorage does not silently fall back mid-write.)
    await expect(masterStorage.setItem('fail-key', { value: 'value' } as any)).rejects.toThrow(
      /DB Locked/
    );
  });

  it('verifies data consistency with large payloads (5MB)', async () => {
    vi.mocked(isTauri).mockResolvedValue(false);

    const largeData = 'a'.repeat(5 * 1024 * 1024);
    await masterStorage.setItem('large-payload', { value: largeData } as any);

    // The payload crosses the boundary encrypted (AES-GCM base64) and is
    // chunked by wrapChunkedStorage — the backend must receive string
    // payloads under the chunked key namespace for the original key.
    const calls = mockSqlJs.setItem.mock.calls as [string, unknown][];
    expect(calls.length).toBeGreaterThan(0);
    for (const [key, value] of calls) {
      expect(key.startsWith('large-payload')).toBe(true);
      if (key === 'large-payload') {
        // Chunk metadata record.
        expect(typeof value).toBe('object');
      } else {
        // Chunk slice records wrap the string payload as { value }.
        expect(typeof (value as { value?: unknown }).value).toBe('string');
      }
    }
    expect(mockTauriSql.setItem).not.toHaveBeenCalled();
  });
});

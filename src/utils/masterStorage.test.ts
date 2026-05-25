/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted to create mock functions before vi.mock hoisting
const {
  mockIndexedDBGetItem,
  mockIndexedDBSetItem,
  mockIndexedDBRemoveItem,
  mockTauriSqlGetItem,
  mockTauriSqlSetItem,
  mockTauriSqlRemoveItem,
  mockIsTauri,
} = vi.hoisted(() => ({
  mockIndexedDBGetItem: vi.fn(),
  mockIndexedDBSetItem: vi.fn(),
  mockIndexedDBRemoveItem: vi.fn(),
  mockTauriSqlGetItem: vi.fn(),
  mockTauriSqlSetItem: vi.fn(),
  mockTauriSqlRemoveItem: vi.fn(),
  mockIsTauri: vi.fn(),
}));

vi.mock('./indexedDBStorage', () => ({
  indexedDBStorage: {
    getItem: mockIndexedDBGetItem,
    setItem: mockIndexedDBSetItem,
    removeItem: mockIndexedDBRemoveItem,
  },
}));

vi.mock('./tauriSqlStorage', () => ({
  tauriSqlStorage: {
    getItem: mockTauriSqlGetItem,
    setItem: mockTauriSqlSetItem,
    removeItem: mockTauriSqlRemoveItem,
  },
  isTauri: mockIsTauri,
}));

import { masterStorage } from './masterStorage';

describe('masterStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // NOTE: masterStorage caches isTauri result in a module-level variable.
    // The first test determines which backend is used for ALL subsequent tests.
    // We test Tauri backend first, then the caching behavior.
  });

  // Since masterStorage caches isTauri() on first call, we test the Tauri path
  // in the first test group (isTauri returns true).
  describe('getItem (Tauri path - first call sets cache)', () => {
    it('should delegate to tauriSqlStorage when on Tauri', async () => {
      mockIsTauri.mockResolvedValue(true);
      mockTauriSqlGetItem.mockResolvedValue({ state: 'test-data', version: 1 });

      const result = await masterStorage.getItem('test-store');

      expect(mockTauriSqlGetItem).toHaveBeenCalledWith('test-store');
      expect(result).toEqual({ state: 'test-data', version: 1 });
    });

    it('should return null when tauri storage returns null', async () => {
      mockTauriSqlGetItem.mockResolvedValue(null);

      const result = await masterStorage.getItem('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('setItem (Tauri path)', () => {
    it('should delegate to tauriSqlStorage', async () => {
      mockTauriSqlSetItem.mockResolvedValue(undefined);

      const value = { state: { data: 'test' }, version: 1 };
      await masterStorage.setItem('test-store', value);

      expect(mockTauriSqlSetItem).toHaveBeenCalledWith('test-store', JSON.stringify(value));
    });
  });

  describe('removeItem (Tauri path)', () => {
    it('should delegate to tauriSqlStorage', async () => {
      mockTauriSqlRemoveItem.mockResolvedValue(undefined);

      await masterStorage.removeItem('test-store');

      expect(mockTauriSqlRemoveItem).toHaveBeenCalledWith('test-store');
    });
  });

  describe('caching behavior', () => {
    it('should only call isTauri once (cached after first call)', async () => {
      const initialCallCount = mockIsTauri.mock.calls.length;

      // These should all use the cached value, not call isTauri again
      mockTauriSqlGetItem.mockResolvedValue(null);
      await masterStorage.getItem('store-a');
      await masterStorage.getItem('store-b');
      await masterStorage.getItem('store-c');

      // isTauri should not have been called again
      expect(mockIsTauri.mock.calls.length).toBe(initialCallCount);
    });
  });

  describe('error handling', () => {
    it('should propagate errors from underlying storage', async () => {
      mockTauriSqlGetItem.mockRejectedValue(new Error('Storage error'));

      await expect(masterStorage.getItem('store')).rejects.toThrow('Storage error');
    });
  });
});

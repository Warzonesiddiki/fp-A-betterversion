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

// Mock wrapChunkedStorage to be a passthrough (jsdom doesn't have Web Workers)
vi.mock('./chunkedStorage', () => ({
  wrapChunkedStorage: <T>(storage: T) => storage,
}));

import {
  masterStorage,
  StorageReadError,
  StorageWriteError,
  subscribeStorageErrors,
  type StorageErrorEvent,
} from './masterStorage';

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
      // N-0002: values at rest are ENCRYPTED. This test previously fed a raw
      // plaintext object straight back from the backend, which can never
      // decrypt — it only passed while getItem swallowed the failure and
      // returned null. Round-trip through setItem so the stored payload is a
      // real ciphertext, then assert the decrypted value matches.
      mockIsTauri.mockResolvedValue(true);
      const value = { state: 'test-data', version: 1 };

      let storedCiphertext: unknown;
      mockTauriSqlSetItem.mockImplementation(async (_k: string, v: unknown) => {
        storedCiphertext = v;
      });
      await masterStorage.setItem('test-store', value);
      expect(typeof storedCiphertext).toBe('string');

      mockTauriSqlGetItem.mockResolvedValue(storedCiphertext);
      const result = await masterStorage.getItem('test-store');

      expect(mockTauriSqlGetItem).toHaveBeenCalledWith('test-store');
      // getItem returns the DESERIALIZED payload (JSON.parse of the decrypted
      // plaintext) — zustand persist v5 reads `.state`/`.version` directly and
      // never parses a string (P0-2026-08-12). Assert the round-tripped value.
      const decoded = typeof result === 'string' ? JSON.parse(result) : result;
      expect(decoded).toEqual(value);
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

      // Value is encrypted before persisting, so we verify it was called with
      // the correct key and a string (the encrypted payload).
      expect(mockTauriSqlSetItem).toHaveBeenCalledTimes(1);
      const [calledKey, calledValue] = mockTauriSqlSetItem.mock.calls[0]!;
      expect(calledKey).toBe('test-store');
      expect(typeof calledValue).toBe('string');
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

  // W6-P0-04 contract locks: once the RAW backends stop swallowing errors
  // (typed StorageBackendError), masterStorage's designed fail-closed read
  // path, quota-exceeded handling, and error-event surfacing must execute.
  describe('fail-closed error surfacing (W6-P0-04)', () => {
    const collect = (): { events: StorageErrorEvent[]; unsubscribe: () => void } => {
      const events: StorageErrorEvent[] = [];
      const unsubscribe = subscribeStorageErrors((event) => events.push(event));
      return { events, unsubscribe };
    };

    it('read failure rejects with typed StorageReadError(kind=backend) and emits a read event — never null', async () => {
      const { events, unsubscribe } = collect();
      try {
        mockTauriSqlGetItem.mockRejectedValue(new Error('disk read failure'));

        const promise = masterStorage.getItem('budget-store');
        await expect(promise).rejects.toBeInstanceOf(StorageReadError);
        const err = (await promise.catch((e: unknown) => e)) as StorageReadError;
        expect(err.kind).toBe('backend');
        expect(err.storeKey).toBe('budget-store');
        expect(err.cause).toBeInstanceOf(Error);

        expect(events).toHaveLength(1);
        expect(events[0]!.operation).toBe('read');
        expect(events[0]!.storeKey).toBe('budget-store');
        expect(events[0]!.error).toBe(err);
      } finally {
        unsubscribe();
        mockTauriSqlGetItem.mockResolvedValue(null);
      }
    });

    it('write/quota failure rejects with typed StorageWriteError(kind=backend) and emits a write event', async () => {
      const { events, unsubscribe } = collect();
      try {
        mockTauriSqlSetItem.mockRejectedValue(
          Object.assign(new Error('database or disk is full'), { name: 'QuotaExceededError' })
        );

        const value = { state: { data: 'test' }, version: 1 };
        await expect(masterStorage.setItem('quota-store', value)).rejects.toBeInstanceOf(
          StorageWriteError
        );
        const err = (await masterStorage
          .setItem('quota-store', value)
          .catch((e: unknown) => e)) as StorageWriteError;
        expect(err.kind).toBe('backend');
        expect(err.storeKey).toBe('quota-store');
        expect((err.cause as Error)?.name).toBe('QuotaExceededError');

        expect(events.length).toBeGreaterThanOrEqual(2);
        expect(events.every((e) => e.operation === 'write')).toBe(true);
        expect((events[0]!.error as StorageWriteError).kind).toBe('backend');
      } finally {
        unsubscribe();
        mockTauriSqlSetItem.mockResolvedValue(undefined);
      }
    });

    it('remove failure rethrows and emits a remove event', async () => {
      const { events, unsubscribe } = collect();
      try {
        mockTauriSqlRemoveItem.mockRejectedValue(new Error('delete failed'));

        await expect(masterStorage.removeItem('gone-store')).rejects.toThrow('delete failed');

        expect(events).toHaveLength(1);
        expect(events[0]!.operation).toBe('remove');
        expect(events[0]!.storeKey).toBe('gone-store');
      } finally {
        unsubscribe();
        mockTauriSqlRemoveItem.mockResolvedValue(undefined);
      }
    });
  });
});

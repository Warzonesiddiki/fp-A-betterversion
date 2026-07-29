/**
 * @vitest-environment jsdom
 *
 * N-0002 regression suite — storage must FAIL LOUDLY, never silently.
 *
 * Audit ZCFA-2026-07-29-002 finding N-0002:
 *   "masterStorage swallows errors and resolves null" — a backend read failure
 *   and a decryption failure both returned `null`, which zustand `persist`
 *   treats as "no saved data". A user with a broken/locked/corrupt backend was
 *   silently given an EMPTY store and shown zeros as if they were real
 *   financial data.
 *
 * Invariant under test:
 *   absent data  -> resolves null   (legitimate empty state)
 *   FAILED read  -> REJECTS         (never mistaken for empty state)
 *   FAILED write -> REJECTS
 *   bad decrypt  -> REJECTS, never returns ciphertext
 * and every failure emits a user-visible storage error event.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockSqlGet, mockSqlSet, mockSqlRemove, mockTauriGet, mockIsTauri } = vi.hoisted(() => ({
  mockSqlGet: vi.fn(),
  mockSqlSet: vi.fn(),
  mockSqlRemove: vi.fn(),
  mockTauriGet: vi.fn(),
  mockIsTauri: vi.fn(),
}));

vi.mock('../sqlJsStorage', () => ({
  sqlJsStorage: { getItem: mockSqlGet, setItem: mockSqlSet, removeItem: mockSqlRemove },
}));

vi.mock('../tauriSqlStorage', () => ({
  tauriSqlStorage: { getItem: mockTauriGet, setItem: vi.fn(), removeItem: vi.fn() },
  isTauri: mockIsTauri,
}));

// Keep the chunking wrapper transparent so we test masterStorage semantics.
vi.mock('../chunkedStorage', () => ({
  wrapChunkedStorage: (s: unknown) => s,
  __resetWorkerAvailabilityForTests: vi.fn(),
}));

import {
  masterStorage,
  subscribeStorageErrors,
  StorageReadError,
  StorageWriteError,
  StorageDecryptionError,
} from '../masterStorage';

describe('N-0002: masterStorage fails closed and loudly', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsTauri.mockResolvedValue(false);
    masterStorage.__resetCache?.();
    localStorage.clear();
  });

  it('absent data still resolves null (empty state remains legitimate)', async () => {
    mockSqlGet.mockResolvedValue(null);
    await expect(masterStorage.getItem('budget-store')).resolves.toBeNull();
  });

  it('REJECTS when the backend read throws (never null)', async () => {
    mockSqlGet.mockRejectedValue(new Error('SQLITE_CORRUPT: database disk image is malformed'));
    await expect(masterStorage.getItem('budget-store')).rejects.toBeInstanceOf(StorageReadError);
  });

  it('emits a user-visible error event on read failure', async () => {
    const events: { operation: string; storeKey: string }[] = [];
    const unsub = subscribeStorageErrors((e) => events.push(e));
    mockSqlGet.mockRejectedValue(new Error('backend offline'));

    await expect(masterStorage.getItem('gl-store')).rejects.toThrow();
    unsub();

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ operation: 'read', storeKey: 'gl-store' });
  });

  it('REJECTS on decryption failure and never returns ciphertext as state', async () => {
    // Non-empty, non-decryptable payload -> must fail closed, not pass through.
    mockSqlGet.mockResolvedValue('QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVo=');

    const result = await masterStorage.getItem('gl-store').catch((e: unknown) => e);
    expect(result).toBeInstanceOf(Error);
    // Whatever the failure mode, the ciphertext must never be handed back.
    expect(typeof result === 'string').toBe(false);
    expect(String(result)).not.toContain('QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVo');
  });

  it('a decryption failure is a StorageDecryptionError, not silent null', async () => {
    mockSqlGet.mockResolvedValue('bm90LWEtdmFsaWQtY2lwaGVydGV4dC1wYXlsb2Fk');
    const result = await masterStorage.getItem('gl-store').catch((e: unknown) => e);
    expect(result).not.toBeNull();
    expect(result).toBeInstanceOf(StorageDecryptionError);
  });

  it('REJECTS on write failure (quota exceeded)', async () => {
    mockSqlSet.mockRejectedValue(new DOMException('quota exceeded', 'QuotaExceededError'));
    await expect(
      masterStorage.setItem('budget-store', { state: { a: 1 }, version: 1 })
    ).rejects.toBeInstanceOf(StorageWriteError);
  });

  it('emits a user-visible error event on write failure', async () => {
    const events: { operation: string }[] = [];
    const unsub = subscribeStorageErrors((e) => events.push(e));
    mockSqlSet.mockRejectedValue(new Error('disk full'));

    await expect(masterStorage.setItem('gl-store', { state: {}, version: 1 })).rejects.toThrow();
    unsub();

    expect(events.some((e) => e.operation === 'write')).toBe(true);
  });

  it('REJECTS on remove failure', async () => {
    mockSqlRemove.mockRejectedValue(new Error('backend gone'));
    await expect(masterStorage.removeItem('gl-store')).rejects.toThrow();
  });

  it('a failed read is never indistinguishable from an empty store', async () => {
    mockSqlGet.mockResolvedValue(null);
    const empty = await masterStorage.getItem('budget-store');

    mockSqlGet.mockRejectedValue(new Error('io error'));
    const failed = await masterStorage.getItem('budget-store').catch(() => 'THREW');

    expect(empty).toBeNull();
    expect(failed).toBe('THREW');
  });
});

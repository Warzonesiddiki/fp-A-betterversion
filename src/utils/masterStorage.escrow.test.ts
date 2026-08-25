/**
 * @vitest-environment jsdom
 *
 * Key-escrow boot gate (scheme a): when a recovery escrow record exists and
 * the per-install device key is MISSING or CORRUPT, resolveKeyMaterial must
 * FAIL CLOSED with StorageKeyUnavailableError('escrow-recovery-available')
 * instead of silently rotating to a fresh key that would permanently orphan
 * every recoverable ciphertext on disk (hazard: former lines 152-155).
 * Without an escrow record the legacy rotate-fresh behavior is preserved.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const { memSqlJs } = vi.hoisted(() => ({ memSqlJs: new Map<string, unknown>() }));

vi.mock('./sqlJsStorage', () => ({
  sqlJsStorage: {
    getItem: async (n: string) => (memSqlJs.has(n) ? memSqlJs.get(n) : null),
    setItem: async (n: string, v: unknown) => {
      memSqlJs.set(n, v);
    },
    removeItem: async (n: string) => {
      memSqlJs.delete(n);
    },
  },
}));

vi.mock('./tauriSqlStorage', () => ({
  tauriSqlStorage: { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() },
  isTauri: async () => false,
}));

vi.mock('./chunkedStorage', () => ({
  wrapChunkedStorage: (s: unknown) => s,
  __resetWorkerAvailabilityForTests: vi.fn(),
}));

import {
  masterStorage,
  subscribeStorageErrors,
  StorageKeyUnavailableError,
  type StorageErrorEvent,
} from './masterStorage';
import {
  DEVICE_KEY_ITEM,
  ESCROW_RECORD_ITEM,
  enrollKeyEscrow,
  recoverStorageKey,
} from './keyEscrow';

let savedMasterStorageKey: string | undefined;

beforeEach(() => {
  savedMasterStorageKey = process.env.MASTER_STORAGE_KEY;
  delete process.env.MASTER_STORAGE_KEY;
  memSqlJs.clear();
  masterStorage.__resetCache?.();
  localStorage.clear();
});

afterEach(() => {
  if (savedMasterStorageKey === undefined) delete process.env.MASTER_STORAGE_KEY;
  else process.env.MASTER_STORAGE_KEY = savedMasterStorageKey;
});

describe('escrow boot gate: device key missing', () => {
  it('getItem rejects with StorageKeyUnavailableError("escrow-recovery-available")', async () => {
    await masterStorage.setItem('vault', 'treasury-data'); // creates device key + ciphertext
    await enrollKeyEscrow();
    localStorage.removeItem(DEVICE_KEY_ITEM);

    const outcome = await masterStorage.getItem('vault').catch((e: unknown) => e);
    expect(outcome).toBeInstanceOf(StorageKeyUnavailableError);
    expect((outcome as Error).message).toContain('escrow-recovery-available');
  });

  it('setItem rejects too — no fresh-key writes while recovery is pending', async () => {
    await masterStorage.setItem('vault', 'treasury-data');
    await enrollKeyEscrow();
    localStorage.removeItem(DEVICE_KEY_ITEM);

    await expect(masterStorage.setItem('vault2', 'more')).rejects.toThrow(
      /escrow-recovery-available/
    );
    // The failure must NOT have minted a replacement key.
    expect(localStorage.getItem(DEVICE_KEY_ITEM)).toBeNull();
  });

  it('surfaces through the storage error channel', async () => {
    await masterStorage.setItem('vault', 'x');
    await enrollKeyEscrow();
    localStorage.removeItem(DEVICE_KEY_ITEM);

    const events: StorageErrorEvent[] = [];
    const unsub = subscribeStorageErrors((e) => events.push(e));
    await expect(masterStorage.getItem('vault')).rejects.toBeInstanceOf(StorageKeyUnavailableError);
    unsub();

    expect(
      events.some((e) => e.operation === 'decrypt' && e.error instanceof StorageKeyUnavailableError)
    ).toBe(true);
  });

  it('full loop: recoverStorageKey(code) restores the key and old data decrypts unchanged', async () => {
    await masterStorage.setItem('ledger', 'general-ledger-2026');
    const { code } = await enrollKeyEscrow();
    localStorage.removeItem(DEVICE_KEY_ITEM);
    await expect(masterStorage.getItem('ledger')).rejects.toBeInstanceOf(
      StorageKeyUnavailableError
    );

    await recoverStorageKey(code);

    expect(await masterStorage.getItem('ledger')).toBe('general-ledger-2026');
    // New writes keep working under the restored root key.
    await masterStorage.setItem('post-recovery', 'still-fine');
    expect(await masterStorage.getItem('post-recovery')).toBe('still-fine');
  }, 120_000);
});

describe('escrow boot gate: device key corrupt', () => {
  it('rejects instead of silently rotating, and writes NO new key', async () => {
    await masterStorage.setItem('vault', 'data');
    await enrollKeyEscrow();
    localStorage.setItem(DEVICE_KEY_ITEM, '@@@not-base64@@@');

    await expect(masterStorage.getItem('vault')).rejects.toThrow(/escrow-recovery-available/);
    expect(localStorage.getItem(DEVICE_KEY_ITEM)).toBe('@@@not-base64@@@');
  });
});

describe('legacy behavior preserved WITHOUT an escrow record', () => {
  it('missing key + no escrow -> fresh device key is generated and persisted', async () => {
    expect(localStorage.getItem(DEVICE_KEY_ITEM)).toBeNull();
    await masterStorage.setItem('fresh', 'value');
    const keyItem = localStorage.getItem(DEVICE_KEY_ITEM);
    expect(keyItem).not.toBeNull();
    expect(keyItem!.length).toBeGreaterThan(32); // base64 of 32 bytes
    expect(await masterStorage.getItem('fresh')).toBe('value');
  });

  it('corrupt key + no escrow -> rotates to a fresh working key', async () => {
    localStorage.setItem(DEVICE_KEY_ITEM, '###garbage###');
    await masterStorage.setItem('rotated', 'value');
    const keyItem = localStorage.getItem(DEVICE_KEY_ITEM);
    expect(keyItem).not.toBeNull();
    expect(keyItem).not.toBe('###garbage###');
    expect(await masterStorage.getItem('rotated')).toBe('value');
  });
});

describe('operator override precedence', () => {
  it('MASTER_STORAGE_KEY env still satisfies resolution even with escrow enrolled', async () => {
    await masterStorage.setItem('pre-env', 'before');
    await enrollKeyEscrow();
    localStorage.removeItem(DEVICE_KEY_ITEM);

    process.env.MASTER_STORAGE_KEY = 'test-only-operator-key';
    // Env key differs from the escrowed device key, so old data will not
    // decrypt — but resolution itself must NOT be blocked by the gate.
    await masterStorage.setItem('env-store', 'env-value');
    expect(await masterStorage.getItem('env-store')).toBe('env-value');
    expect(localStorage.getItem(ESCROW_RECORD_ITEM)).not.toBeNull();
  }, 60_000);
});

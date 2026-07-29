import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * F-0014 / F-0011 / F-0012: masterStorage security hardening.
 *
 *  - F-0014: no hardcoded AES key in source or bundle.
 *  - F-0011: no storage write may fail silently (KAV-14 quota simulation).
 *  - F-0012: decryption failure fails closed — ciphertext never becomes state.
 *
 * The worker/chunking layer and concrete backends are replaced with
 * fault-injectable in-memory backends so the REAL logic of masterStorage
 * (encryption, key management, error surfacing) is exercised end to end.
 */

const { memSqlJs, memTauri, fault } = vi.hoisted(() => ({
  memSqlJs: new Map<string, unknown>(),
  memTauri: new Map<string, unknown>(),
  fault: {
    nextSetError: null as Error | null,
    nextGetError: null as Error | null,
    nextRemoveError: null as Error | null,
  },
}));

function makeBackend(mem: Map<string, unknown>) {
  return {
    getItem: async (name: string) => {
      if (fault.nextGetError) {
        const e = fault.nextGetError;
        fault.nextGetError = null;
        throw e;
      }
      return mem.has(name) ? mem.get(name) : null;
    },
    setItem: async (name: string, value: unknown) => {
      if (fault.nextSetError) {
        const e = fault.nextSetError;
        fault.nextSetError = null;
        throw e;
      }
      mem.set(name, value);
    },
    removeItem: async (name: string) => {
      if (fault.nextRemoveError) {
        const e = fault.nextRemoveError;
        fault.nextRemoveError = null;
        throw e;
      }
      mem.delete(name);
    },
  };
}

vi.mock('@/utils/sqlJsStorage', () => ({ sqlJsStorage: makeBackend(memSqlJs) }));
vi.mock('@/utils/tauriSqlStorage', () => ({
  tauriSqlStorage: makeBackend(memTauri),
  isTauri: async () => false,
}));
vi.mock('@/utils/chunkedStorage', () => ({ wrapChunkedStorage: (s: unknown) => s }));

import {
  masterStorage,
  subscribeStorageErrors,
  StorageWriteError,
  StorageKeyUnavailableError,
  type StorageErrorEvent,
} from '../masterStorage';

describe('F-0014: no hardcoded storage key', () => {
  it('the retired hardcoded key literal appears nowhere in src/utils', () => {
    // Needle assembled at runtime so this regression test itself does not
    // trip the grep-based secret scanner it enforces.
    const retiredKey = ['finplan', 'master', 'storage', 'key', 'change', 'in', 'production'].join(
      '-'
    );
    const files = readdirSync(join(__dirname, '..')).filter((f) => f.endsWith('.ts'));
    for (const file of files) {
      const content = readFileSync(join(__dirname, '..', file), 'utf8');
      expect(content.includes(retiredKey)).toBe(false);
    }
  });

  it('masterStorage.ts contains no default/fallback key assignment', () => {
    const content = readFileSync(join(__dirname, '../masterStorage.ts'), 'utf8');
    // The only key sources are the env override and a generated device key.
    expect(content).toContain('MASTER_STORAGE_KEY');
    expect(content).toContain('crypto.getRandomValues');
    expect(content).not.toMatch(/STORAGE_KEY_RAW\s*=\s*['"]/);
  });

  it('generates and persists a per-install device key (never shipped)', async () => {
    localStorage.removeItem('finplan.storage-key.v1');
    await masterStorage.setItem('key-provenance-test', 'secret-value');
    const storedKey = localStorage.getItem('finplan.storage-key.v1');
    expect(storedKey).not.toBeNull();
    expect(storedKey!.length).toBeGreaterThan(32); // base64 of 32 bytes
    // The device key is NOT any constant — regeneration after wipe differs.
    const first = storedKey!;
    localStorage.removeItem('finplan.storage-key.v1');
    await masterStorage.setItem('key-provenance-test-2', 'secret-value-2');
    const second = localStorage.getItem('finplan.storage-key.v1');
    expect(second).not.toBeNull();
    expect(second).not.toBe(first);
  });
});

describe('F-0012: decryption fails closed', () => {
  const events: StorageErrorEvent[] = [];
  let unsubscribe: () => void;

  beforeEach(() => {
    events.length = 0;
    unsubscribe = subscribeStorageErrors((e) => events.push(e));
  });
  afterEach(() => unsubscribe());

  it('roundtrip stores ciphertext, not plaintext, and decrypts correctly', async () => {
    await masterStorage.setItem('rt', 'confidential journal data');
    const atRest = memSqlJs.get('rt');
    expect(typeof atRest).toBe('string');
    expect(atRest as string).not.toContain('confidential');
    expect(await masterStorage.getItem('rt')).toBe('confidential journal data');
  });

  it('corrupted ciphertext -> REJECTS + visible decrypt error, never raw blob as state', async () => {
    await masterStorage.setItem('corrupt', 'sensitive');
    // Simulate corruption / foreign-key data (or legacy old-key data).
    memSqlJs.set('corrupt', 'AAAAAAAABBBBBBBBCCCCCCCCDDDDDDDD');

    // N-0002: this used to resolve `null`, which zustand persist reads as
    // "no saved data" — silently discarding recoverable user data and
    // starting them on an empty store. It must now REJECT.
    const outcome = await masterStorage.getItem('corrupt').catch((e: unknown) => e);
    expect(outcome).toBeInstanceOf(Error);
    // Critically: the corrupted blob must NOT be returned as if it were data.
    expect(outcome).not.toBe('AAAAAAAABBBBBBBBCCCCCCCCDDDDDDDD');
    expect(String(outcome)).not.toContain('AAAAAAAABBBBBBBBCCCCCCCCDDDDDDDD');

    const decryptEvents = events.filter((e) => e.operation === 'decrypt');
    expect(decryptEvents).toHaveLength(1);
    expect(decryptEvents[0]!.storeKey).toBe('corrupt');
    expect(decryptEvents[0]!.message).toContain('Failed to decrypt');
    expect(decryptEvents[0]!.message).toContain('Recovery:');
  });

  it('backend read error surfaces an event and REJECTS (not silent, not null)', async () => {
    fault.nextGetError = new Error('SQL backend exploded');

    // N-0002: a FAILED read must never be indistinguishable from an empty
    // store. Absent data still resolves null; a failure now rejects.
    const outcome = await masterStorage.getItem('whatever').catch((e: unknown) => e);
    expect(outcome).toBeInstanceOf(Error);
    expect(outcome).not.toBeNull();
    expect(events.some((e) => e.operation === 'read' && e.message.includes('SQL backend'))).toBe(
      true
    );
  });
});

describe('F-0011: no silent storage writes (KAV-14)', () => {
  it('KAV-14: QuotaExceededError produces a user-visible error and a thrown StorageWriteError', async () => {
    const events: StorageErrorEvent[] = [];
    const unsubscribe = subscribeStorageErrors((e) => events.push(e));
    const quota = new DOMException('quota exceeded', 'QuotaExceededError');
    fault.nextSetError = quota;

    await expect(masterStorage.setItem('big-store', 'x'.repeat(1000))).rejects.toThrow(
      StorageWriteError
    );
    expect(events).toHaveLength(1);
    expect(events[0]!.operation).toBe('write');
    expect(events[0]!.storeKey).toBe('big-store');
    expect(events[0]!.error).toBeInstanceOf(StorageWriteError);
    expect((events[0]!.error as StorageWriteError).kind).toBe('backend');
    unsubscribe();
  });

  it('encryption failure (key unavailable) surfaces and throws', async () => {
    // Remove both key sources: no env override, no localStorage device key,
    // and break localStorage.setItem so the device key cannot persist.
    localStorage.removeItem('finplan.storage-key.v1');
    const setSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    const events: StorageErrorEvent[] = [];
    const unsubscribe = subscribeStorageErrors((e) => events.push(e));

    await expect(masterStorage.setItem('no-key', 'data')).rejects.toThrow(StorageWriteError);
    expect(events[0]!.operation).toBe('write');
    expect(events[0]!.message).toContain('encrypt');
    // Root cause chain reaches the key provider.
    expect(events[0]!.error.cause).toBeInstanceOf(StorageKeyUnavailableError);
    unsubscribe();
    setSpy.mockRestore();
  });

  it('removeItem failure surfaces via the error channel and throws', async () => {
    memSqlJs.set('doomed', 'value');
    fault.nextRemoveError = new Error('SQL DELETE failed');
    const events: StorageErrorEvent[] = [];
    const unsubscribe = subscribeStorageErrors((e) => events.push(e));
    await expect(masterStorage.removeItem('doomed')).rejects.toThrow('SQL DELETE failed');
    expect(events).toHaveLength(1);
    expect(events[0]!.operation).toBe('remove');
    expect(events[0]!.storeKey).toBe('doomed');
    unsubscribe();
  });
});

describe('MASTER_STORAGE_KEY env override (documented escape hatch)', () => {
  it('uses the env key when explicitly provided', async () => {
    const original = process.env.MASTER_STORAGE_KEY;
    process.env.MASTER_STORAGE_KEY = 'test-only-env-key-not-shipped';
    try {
      await masterStorage.setItem('env-test', 'env-secret');
      expect(await masterStorage.getItem('env-test')).toBe('env-secret');
    } finally {
      if (original === undefined) delete process.env.MASTER_STORAGE_KEY;
      else process.env.MASTER_STORAGE_KEY = original;
    }
  });
});

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  SecureStorage,
  SecureStorageMemoryAdapter,
  resetDefaultSecureStorage,
  getDefaultSecureStorage,
} from './SecureStorage';
import { ENCRYPTION_CONSTANTS } from '../engines/EncryptionEngine';

const hasCryptoSubtle =
  typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.subtle !== 'undefined';
const describeIfCrypto = hasCryptoSubtle ? describe : describe.skip;

const PASSWORD = 'TestP@ssw0rd!2024';

function newStore(opts?: { password?: string; ttl?: number; prefix?: string }): SecureStorage {
  return new SecureStorage({
    adapter: new SecureStorageMemoryAdapter(),
    password: opts?.password ?? PASSWORD,
    keyPrefix: opts?.prefix ?? 'test:fpa:sec:',
    defaultTtlMs: opts?.ttl,
  });
}

describeIfCrypto('SecureStorage — namespace & key validation', () => {
  let store: SecureStorage;
  beforeEach(() => {
    store = newStore();
  });

  it('rejects empty namespace', async () => {
    await expect(store.setItem('', 'k', 'v')).rejects.toThrow(/namespace/);
  });

  it('rejects namespace with invalid characters', async () => {
    await expect(store.setItem('bad ns', 'k', 'v')).rejects.toThrow(/namespace/);
    await expect(store.setItem('bad/ns', 'k', 'v')).rejects.toThrow(/namespace/);
  });

  it('rejects namespace > 128 chars', async () => {
    const big = 'a'.repeat(129);
    await expect(store.setItem(big, 'k', 'v')).rejects.toThrow(/≤ 128/);
  });

  it('rejects empty key', async () => {
    await expect(store.setItem('auth', '', 'v')).rejects.toThrow(/key/);
  });

  it('rejects key > 256 chars', async () => {
    const big = 'k'.repeat(257);
    await expect(store.setItem('auth', big, 'v')).rejects.toThrow(/≤ 256/);
  });
});

describeIfCrypto('SecureStorage — password strength', () => {
  it('throws on weak password in constructor', () => {
    expect(
      () => new SecureStorage({ adapter: new SecureStorageMemoryAdapter(), password: 'short' })
    ).toThrow(/at least/);
  });

  it('accepts strong password in constructor', () => {
    expect(
      () => new SecureStorage({ adapter: new SecureStorageMemoryAdapter(), password: PASSWORD })
    ).not.toThrow();
  });

  it('falls back to ephemeral password if none is provided', () => {
    const s = new SecureStorage({ adapter: new SecureStorageMemoryAdapter() });
    expect(s).toBeInstanceOf(SecureStorage);
  });
});

describeIfCrypto('SecureStorage — setItem / getItem round-trip', () => {
  let store: SecureStorage;
  beforeEach(() => {
    store = newStore();
  });

  it('round-trips a string value', async () => {
    await store.setItem('auth', 'token', 'abc.def.ghi');
    expect(await store.getItem<string>('auth', 'token')).toBe('abc.def.ghi');
  });

  it('round-trips a structured object', async () => {
    const obj = { user: { id: 42, name: 'Alice' }, scopes: ['read', 'write'] };
    await store.setItem('auth', 'profile', obj);
    expect(await store.getItem<typeof obj>('auth', 'profile')).toEqual(obj);
  });

  it('returns null for missing items', async () => {
    expect(await store.getItem<string>('auth', 'missing')).toBeNull();
  });

  it('isolates namespaces (same key, different namespace = different value)', async () => {
    await store.setItem('user:1', 'name', 'Alice');
    await store.setItem('user:2', 'name', 'Bob');
    expect(await store.getItem<string>('user:1', 'name')).toBe('Alice');
    expect(await store.getItem<string>('user:2', 'name')).toBe('Bob');
  });

  it('overwrites a previous value on second setItem', async () => {
    await store.setItem('auth', 'token', 'v1');
    await store.setItem('auth', 'token', 'v2');
    expect(await store.getItem<string>('auth', 'token')).toBe('v2');
  });

  it('ciphertext on disk does NOT contain the plaintext', async () => {
    const adapter = new SecureStorageMemoryAdapter();
    const s = new SecureStorage({ adapter, password: PASSWORD });
    const secret = 'super-secret-marker-12345';
    await s.setItem('auth', 'token', secret);
    const raw = adapter.getItem('test:auth:token') ?? adapter.getItem('fpa:sec:auth:token') ?? '';
    expect(raw).not.toContain(secret);
    // Confirm the underlying ciphertext looks encrypted (contains the enc: prefix)
    expect(raw).toMatch(/enc:/);
  });
});

describeIfCrypto('SecureStorage — AAD binding (CWE-326)', () => {
  it('rejects cross-namespace / cross-key reads (AEAD AAD mismatch)', async () => {
    const adapter = new SecureStorageMemoryAdapter();
    const s = new SecureStorage({ adapter, password: PASSWORD });
    await s.setItem('user:1', 'token', 'secret-1');
    // Manually read the envelope and swap the namespace on disk to simulate tamper.
    const raw = adapter.getItem('fpa:sec:user:1:token')!;
    const envelope = JSON.parse(raw);
    envelope.ns = 'user:2';
    adapter.setItem('fpa:sec:user:1:token', JSON.stringify(envelope));
    // Reading should fail or auto-purge; the value is NOT returned as 'secret-1'.
    const out = await s.getItem<string>('user:1', 'token');
    expect(out).toBeNull();
    // The tampered entry should be removed.
    expect(adapter.getItem('fpa:sec:user:1:token')).toBeNull();
  });
});

describeIfCrypto('SecureStorage — TTL', () => {
  it('returns null and removes expired items on read', async () => {
    const adapter = new SecureStorageMemoryAdapter();
    const s = new SecureStorage({
      adapter,
      password: PASSWORD,
      defaultTtlMs: 50, // 50 ms
    });
    await s.setItem('auth', 'token', 'abc');
    await new Promise((r) => setTimeout(r, 100));
    expect(await s.getItem<string>('auth', 'token')).toBeNull();
    expect(adapter.getItem('fpa:sec:auth:token')).toBeNull();
  });

  it('respects custom ttlMs on setItem', async () => {
    const adapter = new SecureStorageMemoryAdapter();
    const s = new SecureStorage({ adapter, password: PASSWORD, defaultTtlMs: 0 });
    await s.setItem('auth', 'token', 'abc', { ttlMs: 50 });
    expect(await s.getItem<string>('auth', 'token')).toBe('abc');
    await new Promise((r) => setTimeout(r, 100));
    expect(await s.getItem<string>('auth', 'token')).toBeNull();
  });

  it('rejects negative ttlMs', async () => {
    const s = newStore();
    await expect(store_setTtl(s, -1)).rejects.toThrow(/non-negative/);
  });

  it('rejects non-finite ttlMs', async () => {
    const s = newStore();
    await expect(store_setTtl(s, Number.NaN)).rejects.toThrow(/non-negative/);
  });
});

async function store_setTtl(s: SecureStorage, ttl: number): Promise<void> {
  await s.setItem('auth', 'token', 'v', { ttlMs: ttl });
}

describeIfCrypto('SecureStorage — removeItem / clearNamespace / clearAll', () => {
  it('removeItem returns true when item existed', async () => {
    const s = newStore();
    await s.setItem('auth', 'token', 'abc');
    expect(s.removeItem('auth', 'token')).toBe(true);
    expect(s.removeItem('auth', 'token')).toBe(false);
  });

  it('clearNamespace removes only that namespace', async () => {
    const s = newStore();
    await s.setItem('auth', 'token', 'a');
    await s.setItem('auth', 'refresh', 'b');
    await s.setItem('user:1', 'name', 'Alice');
    expect(s.clearNamespace('auth')).toBe(2);
    expect(await s.getItem<string>('user:1', 'name')).toBe('Alice');
  });

  it('clearAll wipes every namespace under the prefix', async () => {
    const s = newStore({ prefix: 'pfx:' });
    await s.setItem('auth', 'token', 'a');
    await s.setItem('user:1', 'name', 'Alice');
    expect(s.clearAll()).toBe(2);
    expect(await s.getItem<string>('auth', 'token')).toBeNull();
    expect(await s.getItem<string>('user:1', 'name')).toBeNull();
  });
});

describeIfCrypto('SecureStorage — size()', () => {
  it('counts non-expired items in a namespace', async () => {
    const s = newStore();
    await s.setItem('auth', 'token', 'a');
    await s.setItem('auth', 'refresh', 'b');
    expect(await s.size('auth')).toBe(2);
    expect(await s.size('other')).toBe(0);
  });

  it('skips and removes expired items when counting', async () => {
    const s = new SecureStorage({
      adapter: new SecureStorageMemoryAdapter(),
      password: PASSWORD,
      defaultTtlMs: 30,
    });
    await s.setItem('auth', 'token', 'a');
    await new Promise((r) => setTimeout(r, 50));
    expect(await s.size('auth')).toBe(0);
  });
});

describeIfCrypto('SecureStorage — rotateNamespacePassword()', () => {
  it('re-encrypts items under the new password', async () => {
    const adapter = new SecureStorageMemoryAdapter();
    const s = new SecureStorage({ adapter, password: PASSWORD });
    await s.setItem('auth', 'token', 'abc');
    await s.setItem('auth', 'refresh', 'xyz');
    const result = await s.rotateNamespacePassword('auth', 'NewP@ssw0rd!2025');
    expect(result.rotated).toBe(2);
    expect(result.failed).toBe(0);
    // After rotation, reading with a new instance bound to the new password should work.
    const s2 = new SecureStorage({ adapter, password: 'NewP@ssw0rd!2025' });
    expect(await s2.getItem<string>('auth', 'token')).toBe('abc');
    expect(await s2.getItem<string>('auth', 'refresh')).toBe('xyz');
  });

  it('rejects weak new password', async () => {
    const s = newStore();
    await s.setItem('auth', 'token', 'abc');
    await expect(s.rotateNamespacePassword('auth', 'short')).rejects.toThrow(/at least/);
  });

  it('reports per-item failures via onError callback', async () => {
    const adapter = new SecureStorageMemoryAdapter();
    const s = new SecureStorage({ adapter, password: PASSWORD });
    await s.setItem('auth', 'token', 'abc');
    // Tamper with one envelope so it cannot be decrypted.
    const raw = adapter.getItem('fpa:sec:auth:token')!;
    const env = JSON.parse(raw);
    env.ciphertext = 'enc:' + btoa('not-a-real-envelope');
    adapter.setItem('fpa:sec:auth:token', JSON.stringify(env));
    const errors: string[] = [];
    const result = await s.rotateNamespacePassword('auth', 'NewP@ssw0rd!2025', {
      onError: (k) => errors.push(k),
    });
    expect(result.failed).toBe(1);
    expect(errors).toContain('token');
  });
});

describeIfCrypto('SecureStorage — schema version mismatch', () => {
  it('auto-removes envelopes with a different schema version', async () => {
    const adapter = new SecureStorageMemoryAdapter();
    const s = new SecureStorage({ adapter, password: PASSWORD });
    await s.setItem('auth', 'token', 'abc');
    const raw = adapter.getItem('fpa:sec:auth:token')!;
    const env = JSON.parse(raw);
    env.v = 999; // future version
    adapter.setItem('fpa:sec:auth:token', JSON.stringify(env));
    expect(await s.getItem<string>('auth', 'token')).toBeNull();
    expect(adapter.getItem('fpa:sec:auth:token')).toBeNull();
  });
});

describeIfCrypto('SecureStorage — malformed payload', () => {
  it('treats malformed JSON as missing and removes it', async () => {
    const adapter = new SecureStorageMemoryAdapter();
    const s = new SecureStorage({ adapter, password: PASSWORD });
    adapter.setItem('fpa:sec:auth:token', '{not-json');
    expect(await s.getItem<string>('auth', 'token')).toBeNull();
    expect(adapter.getItem('fpa:sec:auth:token')).toBeNull();
  });
});

describeIfCrypto('SecureStorage — singleton helpers', () => {
  beforeEach(() => resetDefaultSecureStorage());
  afterEach(() => resetDefaultSecureStorage());

  it('getDefaultSecureStorage returns the same instance', () => {
    const a = getDefaultSecureStorage({
      adapter: new SecureStorageMemoryAdapter(),
      password: PASSWORD,
    });
    const b = getDefaultSecureStorage();
    expect(a).toBe(b);
  });

  it('resetDefaultSecureStorage clears the singleton', () => {
    const a = getDefaultSecureStorage({
      adapter: new SecureStorageMemoryAdapter(),
      password: PASSWORD,
    });
    resetDefaultSecureStorage();
    const b = getDefaultSecureStorage();
    expect(a).not.toBe(b);
  });
});

// =============================================================================
// Smoke tests so the file always reports coverage
// =============================================================================

describe('SecureStorage — module exports', () => {
  it('exports ENCRYPTION_CONSTANTS via EncryptionEngine', () => {
    expect(ENCRYPTION_CONSTANTS.CURRENT_KEY_VERSION).toBeGreaterThan(0);
  });
  it('SecureStorageMemoryAdapter exists', () => {
    expect(new SecureStorageMemoryAdapter()).toBeInstanceOf(SecureStorageMemoryAdapter);
  });
});

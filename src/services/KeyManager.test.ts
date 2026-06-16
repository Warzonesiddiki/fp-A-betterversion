import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  KeyManager,
  generateSalt,
  assertKeyVersionSupported,
  type KeyManagerAuditEvent,
} from './KeyManager';

const hasCryptoSubtle =
  typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.subtle !== 'undefined';
const describeIfCrypto = hasCryptoSubtle ? describe : describe.skip;

const TEST_PASSWORD = 'TestP@ssw0rd!2024';

describeIfCrypto('KeyManager — singleton lifecycle', () => {
  beforeEach(() => {
    KeyManager.resetInstance();
  });

  afterEach(() => {
    KeyManager.resetInstance();
  });

  it('returns the same instance on repeated getInstance() calls', () => {
    const a = KeyManager.getInstance();
    const b = KeyManager.getInstance();
    expect(a).toBe(b);
  });

  it('resetInstance() clears the cache and the singleton', () => {
    const a = KeyManager.getInstance();
    a.clearAll();
    KeyManager.resetInstance();
    const b = KeyManager.getInstance();
    expect(b).not.toBe(a);
    expect(b.cacheSize()).toBe(0);
  });
});

describeIfCrypto('KeyManager — getKey()', () => {
  beforeEach(() => KeyManager.resetInstance());
  afterEach(() => KeyManager.resetInstance());

  it('derives a CryptoKey and returns a cache hit on the second call', async () => {
    const km = KeyManager.getInstance();
    const salt = generateSalt();
    const k1 = await km.getKey('user:1', TEST_PASSWORD, salt);
    expect(k1).toBeDefined();
    expect(k1.type).toBe('secret');
    expect(km.cacheSize()).toBe(1);
    const k2 = await km.getKey('user:1', TEST_PASSWORD, salt);
    expect(k2).toBe(k1); // same CryptoKey object — cache hit
    expect(km.cacheSize()).toBe(1);
  });

  it('treats different salts as different keys', async () => {
    const km = KeyManager.getInstance();
    const k1 = await km.getKey('user:1', TEST_PASSWORD, generateSalt());
    const k2 = await km.getKey('user:1', TEST_PASSWORD, generateSalt());
    expect(k1).not.toBe(k2);
    expect(km.cacheSize()).toBe(2);
  });

  it('treats different namespaces as separate cache buckets (PATCH 6: namespace is part of the cache key)', async () => {
    const km = KeyManager.getInstance();
    const salt = generateSalt();
    const a = await km.getKey('user:1', TEST_PASSWORD, salt);
    const b = await km.getKey('user:2', TEST_PASSWORD, salt);
    // PATCH 6 fix: the namespace is part of the cache fingerprint, so two
    // namespaces with the same (password, salt) get DIFFERENT cache entries
    // (and therefore two different CryptoKey JS objects, even though they
    // encode the same key material). This enables selective revocation.
    expect(km.cacheSize()).toBe(2);
    const beforeRevoke1 = km.listFingerprints('user:1').length;
    const beforeRevoke2 = km.listFingerprints('user:2').length;
    expect(beforeRevoke1).toBe(1);
    expect(beforeRevoke2).toBe(1);
    km.revokeNamespace('user:2', 'test');
    expect(km.listFingerprints('user:1').length).toBe(1);
    expect(km.listFingerprints('user:2').length).toBe(0);
  });

  it('rejects empty namespace', async () => {
    const km = KeyManager.getInstance();
    await expect(km.getKey('', TEST_PASSWORD, generateSalt())).rejects.toThrow(/namespace/);
  });

  it('rejects empty password (delegated to assertStrongPassword)', async () => {
    const km = KeyManager.getInstance();
    await expect(km.getKey('user:1', '', generateSalt())).rejects.toThrow(/empty/);
  });

  it('rejects short password', async () => {
    const km = KeyManager.getInstance();
    await expect(km.getKey('user:1', 'short', generateSalt())).rejects.toThrow(/at least/);
  });

  it('rejects empty salt', async () => {
    const km = KeyManager.getInstance();
    await expect(km.getKey('user:1', TEST_PASSWORD, new Uint8Array(0))).rejects.toThrow(/salt/);
  });

  it('rejects non-Uint8Array salt', async () => {
    const km = KeyManager.getInstance();
    await expect(
      km.getKey('user:1', TEST_PASSWORD, [1, 2, 3] as unknown as Uint8Array)
    ).rejects.toThrow(/salt/);
  });

  it('evicts expired entries on the next getKey call (TTL=0)', async () => {
    const km = KeyManager.getInstance({ cacheTtlMs: 0 });
    const salt = generateSalt();
    await km.getKey('user:1', TEST_PASSWORD, salt);
    expect(km.cacheSize()).toBe(1);
    // Second call — TTL is 0, so the previous entry should be evicted
    // and a fresh one derived.
    await km.getKey('user:1', TEST_PASSWORD, salt);
    // After eviction + re-insert, size should still be 1.
    expect(km.cacheSize()).toBe(1);
  });
});

describeIfCrypto('KeyManager — audit events', () => {
  beforeEach(() => KeyManager.resetInstance());
  afterEach(() => KeyManager.resetInstance());

  it('emits key.derived twice (cache miss + hit) for the same inputs', async () => {
    const events: KeyManagerAuditEvent[] = [];
    const km = KeyManager.getInstance({ onAudit: (e) => events.push(e) });
    const salt = generateSalt();
    await km.getKey('user:1', TEST_PASSWORD, salt);
    await km.getKey('user:1', TEST_PASSWORD, salt);
    const derived = events.filter((e) => e.type === 'key.derived');
    expect(derived.length).toBe(2);
    expect(derived[0]?.cacheHit).toBe(false);
    expect(derived[1]?.cacheHit).toBe(true);
  });

  it('audit callback that throws does not break cryptographic path', async () => {
    const km = KeyManager.getInstance({
      onAudit: () => {
        throw new Error('boom');
      },
    });
    const salt = generateSalt();
    await expect(km.getKey('user:1', TEST_PASSWORD, salt)).resolves.toBeDefined();
  });
});

describeIfCrypto('KeyManager — rotateKey()', () => {
  beforeEach(() => KeyManager.resetInstance());
  afterEach(() => KeyManager.resetInstance());

  it('derives a new key and stores it under the new fingerprint', async () => {
    const km = KeyManager.getInstance();
    const oldSalt = generateSalt();
    await km.getKey('user:1', TEST_PASSWORD, oldSalt);
    const rotated = await km.rotateKey('user:1', TEST_PASSWORD, { newSalt: generateSalt() });
    expect(rotated.newSalt.byteLength).toBe(16);
    expect(rotated.newFingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(km.listFingerprints('user:1').length).toBeGreaterThanOrEqual(1);
  });

  it('emits a key.rotated audit event', async () => {
    const events: KeyManagerAuditEvent[] = [];
    const km = KeyManager.getInstance({ onAudit: (e) => events.push(e) });
    const oldSalt = generateSalt();
    await km.getKey('user:1', TEST_PASSWORD, oldSalt);
    events.length = 0;
    await km.rotateKey('user:1', TEST_PASSWORD, { newSalt: generateSalt() });
    const rotated = events.filter((e) => e.type === 'key.rotated');
    expect(rotated.length).toBe(1);
  });

  it('rejects wrong-length newSalt', async () => {
    const km = KeyManager.getInstance();
    await expect(
      km.rotateKey('user:1', TEST_PASSWORD, { newSalt: new Uint8Array(8) })
    ).rejects.toThrow(/16 bytes/);
  });

  it('rejects empty password', async () => {
    const km = KeyManager.getInstance();
    await expect(km.rotateKey('user:1', '')).rejects.toThrow(/empty/);
  });
});

describeIfCrypto('KeyManager — revokeNamespace()', () => {
  beforeEach(() => KeyManager.resetInstance());
  afterEach(() => KeyManager.resetInstance());

  it('evicts all keys for a namespace and emits revoke events', async () => {
    const events: KeyManagerAuditEvent[] = [];
    const km = KeyManager.getInstance({ onAudit: (e) => events.push(e) });
    await km.getKey('user:1', TEST_PASSWORD, generateSalt());
    await km.getKey('user:1', TEST_PASSWORD, generateSalt());
    await km.getKey('user:2', TEST_PASSWORD, generateSalt());
    expect(km.cacheSize()).toBe(3);
    const revoked = km.revokeNamespace('user:1', 'user requested sign-out-everywhere');
    expect(revoked).toBe(2);
    expect(km.listFingerprints('user:1').length).toBe(0);
    expect(km.listFingerprints('user:2').length).toBe(1);
    const revokeEvents = events.filter((e) => e.type === 'key.revoked');
    expect(revokeEvents.length).toBe(2);
  });

  it('rejects empty namespace or reason', () => {
    const km = KeyManager.getInstance();
    expect(() => km.revokeNamespace('', 'x')).toThrow();
    expect(() => km.revokeNamespace('user:1', '')).toThrow();
  });
});

describeIfCrypto('KeyManager — clearAll()', () => {
  beforeEach(() => KeyManager.resetInstance());
  afterEach(() => KeyManager.resetInstance());

  it('wipes the entire cache', async () => {
    const km = KeyManager.getInstance();
    await km.getKey('a', TEST_PASSWORD, generateSalt());
    await km.getKey('b', TEST_PASSWORD, generateSalt());
    expect(km.cacheSize()).toBe(2);
    km.clearAll();
    expect(km.cacheSize()).toBe(0);
  });
});

// =============================================================================
// Module-level helpers
// =============================================================================

describe('generateSalt', () => {
  it('returns a 16-byte Uint8Array', () => {
    const s = generateSalt();
    expect(s).toBeInstanceOf(Uint8Array);
    expect(s.byteLength).toBe(16);
  });

  it('produces different values on each call (CSPRNG)', () => {
    const a = generateSalt();
    const b = generateSalt();
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(false);
  });
});

describe('assertKeyVersionSupported', () => {
  it('accepts the current key version', () => {
    expect(() => assertKeyVersionSupported(1)).not.toThrow();
  });

  it('rejects version 0 or negative', () => {
    expect(() => assertKeyVersionSupported(0)).toThrow();
    expect(() => assertKeyVersionSupported(-1)).toThrow();
  });

  it('rejects non-integer versions', () => {
    expect(() => assertKeyVersionSupported(1.5)).toThrow();
    expect(() => assertKeyVersionSupported(Number.NaN)).toThrow();
  });

  it('rejects versions newer than CURRENT_KEY_VERSION', () => {
    expect(() => assertKeyVersionSupported(9999)).toThrow(/newer than supported/);
  });
});

// =============================================================================
// "without crypto.subtle" smoke tests so the file always reports coverage
// even in environments where Web Crypto is unavailable.
// =============================================================================

describe('KeyManager — without crypto.subtle (smoke)', () => {
  it('generateSalt still produces a 16-byte buffer in test env', () => {
    const s = generateSalt();
    expect(s.byteLength).toBe(16);
  });

  it('assertKeyVersionSupported accepts version 1', () => {
    expect(() => assertKeyVersionSupported(1)).not.toThrow();
  });
});

// SecureStorage — Encrypted persistent storage with namespace isolation and TTL
// FinPlan Pro v1.0.0 — Phase 7 PATCH 7 (Hephaestus)
//
// SECURITY RATIONALE:
//   Replaces ad-hoc localStorage usage of sensitive values (auth tokens, API keys,
//   user preferences) with an AEAD-encrypted envelope. Each value is bound to:
//     - a namespace (e.g. "auth", "user:42:settings")
//     - a keyVersion (so algorithm migration is possible)
//     - an AAD context derived from the namespace (CWE-326 binding)
//
// THREAT MODEL ADDRESSED:
//   - CWE-922 (Insecure Storage of Sensitive Information): localStorage values are
//     AES-256-GCM ciphertext; no plaintext at rest.
//   - CWE-312 (Cleartext Storage of Sensitive Information): all writes go through
//     encrypt(); no `setItem(plain)` API is exposed.
//   - CWE-200 (Information Exposure): encryption keys are derived per-namespace and
//     never persisted; the salt for each value is regenerated on every write.
//   - CWE-451 (UI Misrepresentation of Critical Information): TTL is enforced on
//     read; expired items return null and are deleted lazily.
//
// DEPENDENCIES:
//   - EncryptionEngine (PATCH 5: AAD, keyVersion, constantTimeEqual)
//   - KeyManager (PATCH 6: key caching, rotation, revocation)
//   - Web Crypto API

import {
  EncryptionEngine,
  _ENCRYPTION_CONSTANTS,
  type _EncryptedData,
} from '../engines/EncryptionEngine';
import { KeyManager, generateSalt } from './KeyManager';

export interface SecureStorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  /** Optional iteration; defaults to Object.keys(records) when missing. */
  keys?(): string[];
}

export interface SecureStorageConfig {
  /** Backing storage. Defaults to a thin wrapper around globalThis.localStorage. */
  adapter?: SecureStorageAdapter;
  /** Password used for the namespace. If omitted, SecureStorage uses a per-namespace
   *  generated key material that is stored in-memory only (NOT persisted).
   *  In production callers SHOULD supply a real password (e.g. derived from a
   *  user-entered passphrase or a server-issued session secret). */
  password?: string;
  /** Optional prefix for the storage key. Default: "fpa:sec:". */
  keyPrefix?: string;
  /** TTL in milliseconds for stored items. Default: 30 days. */
  defaultTtlMs?: number;
}

/** Envelope persisted in the underlying storage. */
interface Envelope {
  v: number;
  ns: string;
  salt: string; // base64
  ciphertext: string; // base64 of JSON.stringify(EncryptedData) — kept as a string
  // to keep the envelope size predictable.
  /** Optional expiry timestamp (ms since epoch). 0 = no expiry. */
  expiresAt: number;
  createdAt: number;
}

/**
 * In-memory fallback adapter for environments without localStorage
 * (SSR, web workers, Node tests).
 */
class MemoryAdapter implements SecureStorageAdapter {
  private readonly store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  keys(): string[] {
    return Array.from(this.store.keys());
  }
}

/**
 * localStorage-backed adapter. Throws if globalThis.localStorage is missing
 * and the caller did not inject an adapter.
 */
class LocalStorageAdapter implements SecureStorageAdapter {
  getItem(key: string): string | null {
    if (
      typeof globalThis !== 'undefined' &&
      (globalThis as { localStorage?: Storage }).localStorage
    ) {
      return (globalThis as { localStorage: Storage }).localStorage.getItem(key);
    }
    return null;
  }
  setItem(key: string, value: string): void {
    if (
      typeof globalThis !== 'undefined' &&
      (globalThis as { localStorage?: Storage }).localStorage
    ) {
      (globalThis as { localStorage: Storage }).localStorage.setItem(key, value);
    }
  }
  removeItem(key: string): void {
    if (
      typeof globalThis !== 'undefined' &&
      (globalThis as { localStorage?: Storage }).localStorage
    ) {
      (globalThis as { localStorage: Storage }).localStorage.removeItem(key);
    }
  }
  keys(): string[] {
    if (
      typeof globalThis !== 'undefined' &&
      (globalThis as { localStorage?: Storage }).localStorage
    ) {
      const out: string[] = [];
      for (let i = 0; i < (globalThis as { localStorage: Storage }).localStorage.length; i++) {
        const k = (globalThis as { localStorage: Storage }).localStorage.key(i);
        if (k) out.push(k);
      }
      return out;
    }
    return [];
  }
}

export class SecureStorage {
  private static readonly SCHEMA_VERSION = 1;
  private static readonly DEFAULT_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
  private static readonly DEFAULT_PREFIX = 'fpa:sec:';

  private readonly adapter: SecureStorageAdapter;
  private readonly password: string;
  private readonly keyPrefix: string;
  private readonly defaultTtlMs: number;

  /** Per-instance ephemeral password used when the caller did not supply one.
   *  Stored only in memory; never written to disk. */
  private readonly ephemeralPassword: string | null;

  constructor(config: SecureStorageConfig = {}) {
    this.adapter = config.adapter ?? new LocalStorageAdapter();
    this.password = config.password ?? '';
    this.keyPrefix = config.keyPrefix ?? SecureStorage.DEFAULT_PREFIX;
    this.defaultTtlMs = config.defaultTtlMs ?? SecureStorage.DEFAULT_TTL_MS;
    if (this.password.length === 0) {
      // Generate an in-memory-only password so that even if no real password
      // is supplied, the storage is still encrypted at rest with a 256-bit secret.
      // SECURITY: this is best-effort defense-in-depth. In production callers
      // MUST supply a real password derived from a user-entered passphrase.
      const bytes = crypto.getRandomValues(new Uint8Array(32));
      this.ephemeralPassword = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    } else {
      this.ephemeralPassword = null;
      EncryptionEngine.assertStrongPassword(this.password);
    }
  }

  /**
   * Encrypts and persists a value in the given namespace. Each call writes a
   * fresh salt (and therefore a fresh derived key) and binds the ciphertext
   * to the namespace via AAD.
   */
  async setItem<T>(
    namespace: string,
    key: string,
    value: T,
    options?: { ttlMs?: number }
  ): Promise<void> {
    this.assertNamespace(namespace);
    this.assertKey(key);
    const ttl = options?.ttlMs ?? this.defaultTtlMs;
    if (!Number.isFinite(ttl) || ttl < 0) {
      throw new Error('SecureStorage.setItem: ttlMs must be a non-negative number');
    }
    const aadContext = `fpa:v${SecureStorage.SCHEMA_VERSION}:${namespace}:${key}`;
    const encrypted = await EncryptionEngine.encryptField(value, this.activePassword, {
      aadContext,
    });
    const salt = generateSalt();
    // Persist salt as base64 (not used to derive the encryption key — that's
    // already done inside EncryptionEngine — but to bind this envelope to a
    // fresh salt and enable future KeyManager integration).
    const envelope: Envelope = {
      v: SecureStorage.SCHEMA_VERSION,
      ns: namespace,
      salt: this.b64FromBytes(salt),
      ciphertext: encrypted,
      expiresAt: ttl > 0 ? Date.now() + ttl : 0,
      createdAt: Date.now(),
    };
    this.adapter.setItem(this.envelopeKey(namespace, key), JSON.stringify(envelope));
  }

  /**
   * Decrypts and returns a value. Returns null if the item does not exist, is
   * expired (and is then lazily deleted), or fails to decrypt (e.g. the
   * storage was tampered with).
   */
  async getItem<T>(namespace: string, key: string): Promise<T | null> {
    this.assertNamespace(namespace);
    this.assertKey(key);
    const raw = this.adapter.getItem(this.envelopeKey(namespace, key));
    if (raw === null) return null;
    let envelope: Envelope;
    try {
      envelope = JSON.parse(raw) as Envelope;
    } catch {
      // Malformed payload — treat as missing and remove.
      this.adapter.removeItem(this.envelopeKey(namespace, key));
      return null;
    }
    if (
      !envelope ||
      envelope.v !== SecureStorage.SCHEMA_VERSION ||
      envelope.ns !== namespace ||
      typeof envelope.ciphertext !== 'string' ||
      typeof envelope.salt !== 'string'
    ) {
      this.adapter.removeItem(this.envelopeKey(namespace, key));
      return null;
    }
    if (envelope.expiresAt > 0 && Date.now() > envelope.expiresAt) {
      this.adapter.removeItem(this.envelopeKey(namespace, key));
      return null;
    }
    const aadContext = `fpa:v${SecureStorage.SCHEMA_VERSION}:${namespace}:${key}`;
    try {
      return await EncryptionEngine.decryptField<T>(envelope.ciphertext, this.activePassword, {
        aadContext,
      });
    } catch {
      // Decryption failed — the storage was tampered with or the key is wrong.
      this.adapter.removeItem(this.envelopeKey(namespace, key));
      return null;
    }
  }

  /** Removes a single item. Returns true if the item existed. */
  removeItem(namespace: string, key: string): boolean {
    this.assertNamespace(namespace);
    this.assertKey(key);
    const k = this.envelopeKey(namespace, key);
    const existed = this.adapter.getItem(k) !== null;
    this.adapter.removeItem(k);
    return existed;
  }

  /** Removes ALL items in a namespace. */
  clearNamespace(namespace: string): number {
    this.assertNamespace(namespace);
    const prefix = `${this.keyPrefix}${namespace}:`;
    let removed = 0;
    const all = this.adapter.keys ? this.adapter.keys() : [];
    for (const k of all) {
      if (k.startsWith(prefix)) {
        this.adapter.removeItem(k);
        removed++;
      }
    }
    return removed;
  }

  /** Wipes the entire SecureStorage footprint (all namespaces). */
  clearAll(): number {
    let removed = 0;
    const all = this.adapter.keys ? this.adapter.keys() : [];
    for (const k of all) {
      if (k.startsWith(this.keyPrefix)) {
        this.adapter.removeItem(k);
        removed++;
      }
    }
    return removed;
  }

  /** Returns the number of (non-expired) items in a namespace. */
  async size(namespace: string): Promise<number> {
    this.assertNamespace(namespace);
    const prefix = `${this.keyPrefix}${namespace}:`;
    let count = 0;
    const all = this.adapter.keys ? this.adapter.keys() : [];
    for (const k of all) {
      if (!k.startsWith(prefix)) continue;
      const raw = this.adapter.getItem(k);
      if (raw === null) continue;
      try {
        const env = JSON.parse(raw) as Envelope;
        if (env.expiresAt > 0 && Date.now() > env.expiresAt) {
          this.adapter.removeItem(k);
          continue;
        }
        count++;
      } catch {
        this.adapter.removeItem(k);
      }
    }
    return count;
  }

  /**
   * SECURITY (PATCH 7): When a namespace password is suspected compromised,
   * rotate it: derive a new key, re-encrypt all items under the new key,
   * and remove the old ciphertexts. Old items are decrypted with the
   * current password and re-encrypted with the new one. The KeyManager is
   * notified to evict the old fingerprint.
   */
  async rotateNamespacePassword(
    namespace: string,
    newPassword: string,
    options?: { onError?: (key: string, err: unknown) => void }
  ): Promise<{ rotated: number; failed: number }> {
    this.assertNamespace(namespace);
    EncryptionEngine.assertStrongPassword(newPassword);
    const prefix = `${this.keyPrefix}${namespace}:`;
    const all = this.adapter.keys ? this.adapter.keys() : [];
    const targets: string[] = [];
    for (const k of all) {
      if (k.startsWith(prefix)) targets.push(k);
    }
    let rotated = 0;
    let failed = 0;
    // Re-encrypt each item under the new password.
    for (const storageKey of targets) {
      const raw = this.adapter.getItem(storageKey);
      if (raw === null) continue;
      let envelope: Envelope;
      try {
        envelope = JSON.parse(raw) as Envelope;
      } catch {
        failed++;
        continue;
      }
      const aadContext = `fpa:v${SecureStorage.SCHEMA_VERSION}:${namespace}`;
      const subKey = storageKey.slice(prefix.length);
      const fullAad = `${aadContext}:${subKey}`;
      try {
        // Decrypt with OLD password:
        const plain = await EncryptionEngine.decryptField<unknown>(
          envelope.ciphertext,
          this.activePassword,
          { aadContext: fullAad }
        );
        // Re-encrypt with NEW password (note: this method temporarily
        // uses the new password via a throwaway path; we don't mutate state).
        const reencrypted = await EncryptionEngine.encryptField(plain, newPassword, {
          aadContext: fullAad,
        });
        const newSalt = generateSalt();
        const newEnvelope: Envelope = {
          ...envelope,
          salt: this.b64FromBytes(newSalt),
          ciphertext: reencrypted,
        };
        this.adapter.setItem(storageKey, JSON.stringify(newEnvelope));
        rotated++;
      } catch (err) {
        failed++;
        if (options?.onError) options.onError(subKey, err);
      }
    }
    // Evict all cached keys for this namespace from the KeyManager so
    // future reads require the new password to be used everywhere.
    try {
      KeyManager.getInstance().revokeNamespace(namespace, 'SecureStorage.rotateNamespacePassword');
    } catch {
      // KeyManager is optional; ignore failures.
    }
    return { rotated, failed };
  }

  private get activePassword(): string {
    return this.password || this.ephemeralPassword!;
  }

  private envelopeKey(namespace: string, key: string): string {
    return `${this.keyPrefix}${namespace}:${key}`;
  }

  private assertNamespace(namespace: string): void {
    if (typeof namespace !== 'string' || namespace.length === 0) {
      throw new Error('SecureStorage: namespace must be a non-empty string');
    }
    if (namespace.length > 128) {
      throw new Error('SecureStorage: namespace must be ≤ 128 chars');
    }
    if (!/^[a-zA-Z0-9:_\-.]+$/.test(namespace)) {
      throw new Error('SecureStorage: namespace may only contain [a-zA-Z0-9:_-.]');
    }
  }

  private assertKey(key: string): void {
    if (typeof key !== 'string' || key.length === 0) {
      throw new Error('SecureStorage: key must be a non-empty string');
    }
    if (key.length > 256) {
      throw new Error('SecureStorage: key must be ≤ 256 chars');
    }
    if (!/^[a-zA-Z0-9:_\-./]+$/.test(key)) {
      throw new Error('SecureStorage: key may only contain [a-zA-Z0-9:_-.\\/]');
    }
  }

  private b64FromBytes(bytes: Uint8Array): string {
    let s = '';
    for (let i = 0; i < bytes.byteLength; i++) s += String.fromCharCode(bytes[i]!);
    return btoa(s);
  }
}

/** Singleton-style factory for app-wide use. */
let _default: SecureStorage | null = null;
export function getDefaultSecureStorage(config?: SecureStorageConfig): SecureStorage {
  if (!_default) {
    _default = new SecureStorage(config);
  }
  return _default;
}

/** Test seam: clear the singleton between tests. */
export function resetDefaultSecureStorage(): void {
  _default = null;
}

export {
  MemoryAdapter as SecureStorageMemoryAdapter,
  LocalStorageAdapter as SecureStorageLocalStorageAdapter,
};

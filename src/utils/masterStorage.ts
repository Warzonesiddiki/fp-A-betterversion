import type { PersistStorage } from 'zustand/middleware';
import { sqlJsStorage } from './sqlJsStorage';
import { tauriSqlStorage, isTauri } from './tauriSqlStorage';
import { wrapChunkedStorage } from './chunkedStorage';
import { decodeMoneyGraph, encodeMoneyGraph } from './moneySerialize';

let _isTauriCache: boolean | null = null;

async function checkTauri() {
  if (_isTauriCache === null) {
    _isTauriCache = await isTauri();
  }
  return _isTauriCache;
}

// ---------------------------------------------------------------------------
// Typed storage errors (F-0011 / F-0012 / F-0014)
// ---------------------------------------------------------------------------

/** No encryption key is available — storage must fail closed. */
export class StorageKeyUnavailableError extends Error {
  constructor(reason: string) {
    super(`Storage encryption key unavailable: ${reason}`);
    this.name = 'StorageKeyUnavailableError';
  }
}

/** Decryption failed. The ciphertext is NEVER returned as plaintext. */
export class StorageDecryptionError extends Error {
  readonly storeKey: string;

  constructor(storeKey: string, cause?: unknown) {
    super(
      `Failed to decrypt persisted value for "${storeKey}". ` +
        'Data may be corrupted or was encrypted with a different key. ' +
        'Recovery: restore from a backup, or clear local storage to start fresh.'
    );
    this.name = 'StorageDecryptionError';
    this.storeKey = storeKey;
    if (cause !== undefined) this.cause = cause;
  }
}

/**
 * A persist READ failed at the backend (N-0002).
 *
 * This is deliberately distinct from "the key is absent". Absent data yields
 * `null`; a FAILED read throws. Collapsing the two is what allowed a broken
 * backend to hydrate an empty store and present it as the user's real data.
 */
export class StorageReadError extends Error {
  readonly storeKey: string;
  readonly kind: 'backend' | 'deserialize';

  constructor(storeKey: string, kind: StorageReadError['kind'], cause?: unknown) {
    super(
      `Failed to read persisted value for "${storeKey}" (${kind}): ${describeCause(cause)}. ` +
        'Data was NOT loaded. Recovery: retry, or restore from a backup. ' +
        'Do not treat this as an empty dataset.'
    );
    this.name = 'StorageReadError';
    this.storeKey = storeKey;
    this.kind = kind;
    if (cause !== undefined) this.cause = cause;
  }
}

/** A persist write failed (quota, serialization, encryption, or backend). */
export class StorageWriteError extends Error {
  readonly storeKey: string;
  readonly kind: 'serialize' | 'encrypt' | 'backend';

  constructor(storeKey: string, kind: StorageWriteError['kind'], cause?: unknown) {
    super(`Failed to persist "${storeKey}" (${kind}): ${describeCause(cause)}`);
    this.name = 'StorageWriteError';
    this.storeKey = storeKey;
    this.kind = kind;
    if (cause !== undefined) this.cause = cause;
  }
}

function describeCause(cause: unknown): string {
  if (cause instanceof Error) return cause.message;
  return String(cause);
}

// ---------------------------------------------------------------------------
// Storage error event channel (F-0011): write/read failures surface here so
// the UI can show an actionable error instead of silently losing data.
// ---------------------------------------------------------------------------

export interface StorageErrorEvent {
  operation: 'read' | 'write' | 'remove' | 'decrypt';
  storeKey: string;
  message: string;
  error: Error;
}

type StorageErrorListener = (event: StorageErrorEvent) => void;
const storageErrorListeners = new Set<StorageErrorListener>();

/** Subscribe to storage failures. Returns an unsubscribe function. */
export function subscribeStorageErrors(listener: StorageErrorListener): () => void {
  storageErrorListeners.add(listener);
  return () => {
    storageErrorListeners.delete(listener);
  };
}

function emitStorageError(event: StorageErrorEvent): void {
  for (const listener of storageErrorListeners) {
    try {
      listener(event);
    } catch {
      // A broken listener must never break the storage layer.
    }
  }
}

// ---------------------------------------------------------------------------
// Key management (F-0014)
// ---------------------------------------------------------------------------
//
// There is NO hardcoded fallback key. Resolution order:
//  1. MASTER_STORAGE_KEY env var — explicit operator/test override.
//  2. Per-install device key: a random 256-bit key generated on first run and
//     kept in localStorage under 'finplan.storage-key.v1'. This prevents the
//     key from being shipped in the bundle. On the browser-only build this
//     protects data at rest against offline copies of the SQL.js database
//     made WITHOUT the key item; it does NOT defend against an attacker with
//     full access to the same browser profile (documented in
//     docs/architecture/security.md). Desktop keychain integration is the
//     planned upgrade path for the Tauri build.
//  3. Anything else: fail closed with StorageKeyUnavailableError.
//
// Migration note: data previously encrypted with the retired hardcoded key
// cannot be decrypted by design — reads fail closed with a visible
// StorageDecryptionError and the documented recovery path (restore from
// backup or reset), rather than silently serving ciphertext as state.

const DEVICE_KEY_ITEM = 'finplan.storage-key.v1';

function resolveKeyMaterial(): Uint8Array {
  if (typeof process !== 'undefined' && process.env?.MASTER_STORAGE_KEY) {
    return new TextEncoder().encode(process.env.MASTER_STORAGE_KEY);
  }
  if (typeof localStorage !== 'undefined') {
    const existing = localStorage.getItem(DEVICE_KEY_ITEM);
    if (existing) {
      try {
        return base64ToBytes(existing);
      } catch {
        // Corrupted key item: rotate to a fresh device key below.
      }
    }
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const fresh = crypto.getRandomValues(new Uint8Array(32));
      try {
        localStorage.setItem(DEVICE_KEY_ITEM, bytesToBase64(fresh));
        return fresh;
      } catch (e) {
        throw new StorageKeyUnavailableError(
          `could not persist per-install device key (${describeCause(e)})`
        );
      }
    }
  }
  throw new StorageKeyUnavailableError(
    'set MASTER_STORAGE_KEY or run in an environment with localStorage and Web Crypto'
  );
}

async function deriveStorageKey(): Promise<CryptoKey> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new StorageKeyUnavailableError('Web Crypto API is not available');
  }
  const keyMaterial = resolveKeyMaterial();
  const hashBuffer = await crypto.subtle.digest('SHA-256', keyMaterial as BufferSource);
  return crypto.subtle.importKey('raw', hashBuffer.slice(0, 32), { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
}

// Base64 helpers.
//
// The previous implementation used `btoa(String.fromCharCode(...combined))`,
// which spreads every ciphertext byte into a separate function argument. Past
// roughly 100KB that exceeds the JS argument limit and throws
// "RangeError: Maximum call stack size exceeded" — i.e. persisting any
// realistically sized dataset (a 10K-row GL import is ~5.6MB) failed outright.
// Encoding in fixed-size chunks keeps the argument count bounded.
const BASE64_CHUNK_SIZE = 0x8000; // 32KB of bytes per fromCharCode call

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += BASE64_CHUNK_SIZE) {
    const chunk = bytes.subarray(i, i + BASE64_CHUNK_SIZE);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function base64ToBytes(encoded: string): Uint8Array {
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function encryptStorageValue(value: string): Promise<string> {
  const key = await deriveStorageKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(value)
  );
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return bytesToBase64(combined);
}

async function decryptStorageValue(encrypted: string, storeKey: string): Promise<string> {
  try {
    const key = await deriveStorageKey();
    const bytes = base64ToBytes(encrypted);
    const iv = bytes.slice(0, 12);
    const ciphertext = bytes.slice(12);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
    return new TextDecoder().decode(decrypted);
  } catch (cause) {
    // F-0012: fail closed. Never hand ciphertext or a corrupt blob back as
    // if it were application state.
    throw new StorageDecryptionError(storeKey, cause);
  }
}

// ---------------------------------------------------------------------------
// Storage Layer
// ---------------------------------------------------------------------------

const chunkedTauriStorage = wrapChunkedStorage(tauriSqlStorage);
const chunkedSqlJsStorage = wrapChunkedStorage(sqlJsStorage);

/**
 * Master Zustand persist storage for FinPlan Pro. 29 stores funnel through this.
 * Wraps localStorage (sqlJsStorage or tauriSqlStorage) with version-aware migration.
 * T-Hephaestus T-HEP-015 PBKDF2 100k→600k migration target (target cycle 10 wave 7).
 * @see ADR-005 (masterStorage) + ADR-007 (encryption-at-rest) + ADR-010 (schema migration).
 * @internal Invoked by every persisted store's `persist()` middleware — DO NOT bypass.
 */
// Zustand's PersistStorage<S> is consumed with per-store state types T; the
// documented ecosystem pattern for a shared storage adapter is a bivariant
// state generic. All values crossing THIS module's boundaries are strings.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface MasterStorage extends PersistStorage<any, unknown> {
  // The adapter's runtime contract is "any serializable value" (strings pass
  // through, objects are JSON-serialized), so setItem accepts unknown rather
  // than zustand's StorageValue<S> envelope.
  setItem(name: string, value: unknown): Promise<void>;
  __resetCache: () => void;
  migrateFromIndexedDB: () => Promise<import('./migration/legacyStorageMigration').MigrationResult>;
}

export const masterStorage: MasterStorage = {
  getItem: async (name) => {
    let raw: unknown;
    try {
      const isDesktop = await checkTauri();
      raw = isDesktop
        ? await chunkedTauriStorage.getItem(name)
        : await chunkedSqlJsStorage.getItem(name);
    } catch (cause) {
      // N-0002: a backend read FAILURE is not "no data". Returning null here
      // let a failed read hydrate an EMPTY store, which the app then presented
      // as valid state — silent financial misstatement. The failure is now
      // surfaced AND propagated so callers must handle it explicitly.
      const error =
        cause instanceof StorageReadError ? cause : new StorageReadError(name, 'backend', cause);
      emitStorageError({ operation: 'read', storeKey: name, message: error.message, error });
      throw error;
    }
    if (raw === null || raw === undefined) return null;
    const serialized = typeof raw === 'string' ? raw : JSON.stringify(raw);
    try {
      const plaintext = await decryptStorageValue(serialized, name);
      try {
        // Zustand persist v5 requires the DESERIALIZED envelope object — its
        // hydrate() reads `storageValue.state` / `.version` directly and never
        // JSON.parses a string return (P0-2026-08-12, found by the F-02 browser
        // baseline): returning the plaintext string here made EVERY persisted
        // store silently skip hydration on boot — data appeared to persist
        // (writes succeeded) but was never restored after a restart, in both
        // the browser and Tauri backends. Parse here so zustand, backup/restore,
        // and the migration/benchmark consumers all receive the real object.
        const parsed = JSON.parse(plaintext) as unknown;
        // W0.8.2: revive `$d:` money tags. `as: 'number'` is a compatibility
        // concession for stores typed as number; the at-rest form is a string.
        return decodeMoneyGraph(parsed, { as: 'number' }) as NonNullable<
          Awaited<ReturnType<MasterStorage['getItem']>>
        >;
      } catch {
        // Non-JSON values (plain string payloads such as the first-run marker
        // or pre-envelope legacy rows) degrade to the raw string unchanged.
        return plaintext as unknown as NonNullable<Awaited<ReturnType<MasterStorage['getItem']>>>;
      }
    } catch (cause) {
      // F-0012 + N-0002: fail closed AND fail loudly. Corrupted or
      // foreign-key ciphertext must never become application state, and must
      // never be downgraded to "no data" — that silently discards the user's
      // real (recoverable) data and starts them on an empty store.
      const error =
        cause instanceof StorageDecryptionError ? cause : new StorageDecryptionError(name, cause);
      emitStorageError({ operation: 'decrypt', storeKey: name, message: error.message, error });
      throw error;
    }
  },
  setItem: async (name, value) => {
    try {
      // W0.8.2: money fields become `$d:<canonical>` strings before JSON, so
      // IEEE-754 cannot leak into the persisted envelope (INV-009).
      const payload = value !== null && typeof value === 'object' ? encodeMoneyGraph(value) : value;
      const serialized = typeof payload === 'string' ? payload : JSON.stringify(payload);
      let encryptedValue: string;
      try {
        encryptedValue = await encryptStorageValue(serialized);
      } catch (cause) {
        throw new StorageWriteError(name, 'encrypt', cause);
      }
      const isDesktop = await checkTauri();
      try {
        // The encrypted payload is always a base64 string. The chunked
        // backend's declared input type is StorageValue<unknown>; it passes
        // string payloads through to the worker unchanged at runtime.
        type BackendInput = Parameters<typeof chunkedTauriStorage.setItem>[1];
        const payload = encryptedValue as unknown as BackendInput;
        if (isDesktop) {
          await chunkedTauriStorage.setItem(name, payload);
        } else {
          await chunkedSqlJsStorage.setItem(name, payload);
        }
      } catch (cause) {
        // QuotaExceededError, SQL failures, etc. land here.
        throw new StorageWriteError(name, 'backend', cause);
      }
    } catch (cause) {
      // F-0011: no write may fail silently.
      const error =
        cause instanceof StorageWriteError
          ? cause
          : new StorageWriteError(name, 'serialize', cause);
      emitStorageError({ operation: 'write', storeKey: name, message: error.message, error });
      throw error;
    }
  },
  removeItem: async (name) => {
    try {
      const isDesktop = await checkTauri();
      if (isDesktop) {
        return await chunkedTauriStorage.removeItem(name);
      }
      return await chunkedSqlJsStorage.removeItem(name);
    } catch (cause) {
      const error = cause instanceof Error ? cause : new Error(describeCause(cause));
      emitStorageError({ operation: 'remove', storeKey: name, message: error.message, error });
      throw error;
    }
  },
  /** @internal For testing only */
  __resetCache: () => {
    _isTauriCache = null;
  },

  // B3 Enhancement: Explicit migration helper (called from onboarding or settings)
  async migrateFromIndexedDB() {
    const { migrateFromIndexedDB } = await import('@/utils/migration/legacyStorageMigration');
    return migrateFromIndexedDB();
  },
};

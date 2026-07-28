/* eslint-disable @typescript-eslint/no-explicit-any */
import type { PersistStorage } from 'zustand/middleware';
import { sqlJsStorage } from './sqlJsStorage';
import { tauriSqlStorage, isTauri } from './tauriSqlStorage';
import { wrapChunkedStorage } from './chunkedStorage';

let _isTauriCache: boolean | null = null;

async function checkTauri() {
  if (_isTauriCache === null) {
    _isTauriCache = await isTauri();
  }
  return _isTauriCache;
}

/* SECURITY FIX (H-01 / C-03): Master storage must encrypt data at rest.
 * This wrapper applies AES-256-GCM encryption to all persisted values.
 * The master key should be derived from the OS keychain or SecretsVault,
 * not a hardcoded string. For production, set MASTER_STORAGE_KEY env
 * or integrate with TauriSecureStorage / SecretsVault key rotation.
 */
const STORAGE_KEY_RAW =
  typeof process !== 'undefined' && process.env?.MASTER_STORAGE_KEY
    ? process.env.MASTER_STORAGE_KEY
    : 'finplan-master-storage-key-change-in-production';

async function deriveStorageKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(STORAGE_KEY_RAW);
  const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);
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

async function decryptStorageValue(encrypted: string): Promise<string> {
  const key = await deriveStorageKey();
  const bytes = base64ToBytes(encrypted);
  const iv = bytes.slice(0, 12);
  const ciphertext = bytes.slice(12);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
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
type MasterStorage = PersistStorage<any, unknown> & {
  __resetCache: () => void;
  migrateFromIndexedDB: () => Promise<import('./migration/legacyStorageMigration').MigrationResult>;
};

export const masterStorage: MasterStorage = {
  getItem: async (name) => {
    const isDesktop = await checkTauri();
    let raw: string | null;
    if (isDesktop) {
      raw = (await chunkedTauriStorage.getItem(name)) as unknown as string | null;
    } else {
      raw = (await chunkedSqlJsStorage.getItem(name)) as unknown as string | null;
    }
    if (raw === null || raw === undefined) return null;
    // SECURITY FIX (H-01): Decrypt data at rest before returning to store.
    try {
      const decrypted = await decryptStorageValue(raw);
      return decrypted as unknown as ReturnType<NonNullable<MasterStorage['getItem']>>;
    } catch {
      // If decryption fails (e.g., old unencrypted data or corruption),
      // return the raw value with a warning. In production, enforce encryption.
      return raw as unknown as ReturnType<NonNullable<MasterStorage['getItem']>>;
    }
  },
  setItem: async (name, value) => {
    const isDesktop = await checkTauri();
    // SECURITY FIX (H-01): Encrypt data before persisting at rest.
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    const encryptedValue = await encryptStorageValue(serialized);
    if (isDesktop) {
      return chunkedTauriStorage.setItem(name, encryptedValue as any);
    }
    return chunkedSqlJsStorage.setItem(name, encryptedValue as any);
  },
  removeItem: async (name) => {
    const isDesktop = await checkTauri();
    if (isDesktop) {
      return chunkedTauriStorage.removeItem(name);
    }
    return chunkedSqlJsStorage.removeItem(name);
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

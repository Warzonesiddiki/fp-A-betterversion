import { openDB } from './indexedDBStorage';

// =============================================================================
// OFFLINE CACHE — IndexedDB-backed cache with metadata for offline data
// =============================================================================

export interface CacheEntry<T = unknown> {
  readonly key: string;
  readonly value: T;
  readonly cachedAt: string;
  readonly expiresAt: string | null;
  readonly version: number;
  readonly storeName: string;
}

export interface CacheMetadata {
  readonly key: string;
  readonly cachedAt: string;
  readonly expiresAt: string | null;
  readonly version: number;
  readonly storeName: string;
  readonly isStale: boolean;
}

export interface CacheStatus {
  readonly isOnline: boolean;
  readonly lastSyncAt: string | null;
  readonly cachedStores: readonly string[];
  readonly totalEntries: number;
}

const CACHE_STORE_NAME = 'offline-cache';
const CACHE_META_STORE_NAME = 'offline-cache-meta';
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const CURRENT_CACHE_VERSION = 1;

let _lastSyncAt: string | null = null;

/**
 * Get the shared IndexedDB database instance. The offline-cache and
 * offline-cache-meta object stores are created during the upgrade
 * handler in indexedDBStorage.ts openDB().
 */
async function getDB(): Promise<IDBDatabase> {
  return openDB();
}

/**
 * Store a value in the offline cache with metadata.
 */
export async function cacheSet<T>(
  storeName: string,
  key: string,
  value: T,
  ttlMs: number = DEFAULT_TTL_MS
): Promise<void> {
  const now = new Date();
  const entry: CacheEntry<T> = {
    key: `${storeName}:${key}`,
    value,
    cachedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + ttlMs).toISOString(),
    version: CURRENT_CACHE_VERSION,
    storeName,
  };

  try {
    const db = await getDB();
    const tx = db.transaction([CACHE_STORE_NAME, CACHE_META_STORE_NAME], 'readwrite');
    tx.objectStore(CACHE_STORE_NAME).put(entry);
    tx.objectStore(CACHE_META_STORE_NAME).put({
      key: entry.key,
      cachedAt: entry.cachedAt,
      expiresAt: entry.expiresAt,
      version: entry.version,
      storeName,
    });
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Fail silently — offline cache is best-effort
  }
}

/**
 * Retrieve a value from the offline cache. Returns null if missing or expired.
 */
export async function cacheGet<T>(storeName: string, key: string): Promise<T | null> {
  try {
    const db = await getDB();
    const fullKey = `${storeName}:${key}`;
    return new Promise((resolve) => {
      const tx = db.transaction(CACHE_STORE_NAME, 'readonly');
      const req = tx.objectStore(CACHE_STORE_NAME).get(fullKey);
      req.onsuccess = () => {
        const entry = req.result as CacheEntry<T> | undefined;
        if (!entry) {
          resolve(null);
          return;
        }
        // Check expiration
        if (entry.expiresAt && new Date(entry.expiresAt) < new Date()) {
          resolve(null);
          return;
        }
        resolve(entry.value);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Check if a cached entry is stale (exists but expired).
 */
export async function cacheIsStale(storeName: string, key: string): Promise<boolean> {
  try {
    const db = await getDB();
    const fullKey = `${storeName}:${key}`;
    return new Promise((resolve) => {
      const tx = db.transaction(CACHE_META_STORE_NAME, 'readonly');
      const req = tx.objectStore(CACHE_META_STORE_NAME).get(fullKey);
      req.onsuccess = () => {
        const meta = req.result as { expiresAt: string | null } | undefined;
        if (!meta) {
          resolve(true); // no entry = stale
          return;
        }
        if (meta.expiresAt && new Date(meta.expiresAt) < new Date()) {
          resolve(true);
          return;
        }
        resolve(false);
      };
      req.onerror = () => resolve(true);
    });
  } catch {
    return true;
  }
}

/**
 * Get metadata for all cached entries, optionally filtered by store name.
 */
export async function cacheGetMetadata(storeName?: string): Promise<CacheMetadata[]> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(CACHE_META_STORE_NAME, 'readonly');
      const req = tx.objectStore(CACHE_META_STORE_NAME).getAll();
      req.onsuccess = () => {
        const entries = (req.result ?? []) as Array<{
          key: string;
          cachedAt: string;
          expiresAt: string | null;
          version: number;
          storeName: string;
        }>;
        const now = new Date();
        const filtered = storeName ? entries.filter((e) => e.storeName === storeName) : entries;
        resolve(
          filtered.map((e) => ({
            ...e,
            isStale: e.expiresAt ? new Date(e.expiresAt) < now : false,
          }))
        );
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

/**
 * Remove a specific entry from the offline cache.
 */
export async function cacheRemove(storeName: string, key: string): Promise<void> {
  try {
    const db = await getDB();
    const fullKey = `${storeName}:${key}`;
    const tx = db.transaction([CACHE_STORE_NAME, CACHE_META_STORE_NAME], 'readwrite');
    tx.objectStore(CACHE_STORE_NAME).delete(fullKey);
    tx.objectStore(CACHE_META_STORE_NAME).delete(fullKey);
    await new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Fail silently
  }
}

/**
 * Clear all cached entries for a specific store.
 */
export async function cacheClearStore(storeName: string): Promise<number> {
  try {
    const db = await getDB();
    const metaEntries = await cacheGetMetadata(storeName);
    if (metaEntries.length === 0) return 0;

    const tx = db.transaction([CACHE_STORE_NAME, CACHE_META_STORE_NAME], 'readwrite');
    const cacheStore = tx.objectStore(CACHE_STORE_NAME);
    const metaStore = tx.objectStore(CACHE_META_STORE_NAME);

    for (const meta of metaEntries) {
      cacheStore.delete(meta.key);
      metaStore.delete(meta.key);
    }

    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(metaEntries.length);
      tx.onerror = () => resolve(0);
    });
  } catch {
    return 0;
  }
}

/**
 * Clear all entries from the offline cache.
 */
export async function cacheClearAll(): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction([CACHE_STORE_NAME, CACHE_META_STORE_NAME], 'readwrite');
    tx.objectStore(CACHE_STORE_NAME).clear();
    tx.objectStore(CACHE_META_STORE_NAME).clear();
    await new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Fail silently
  }
}

/**
 * Get overall cache status: online state, last sync time, cached stores.
 */
export async function getCacheStatus(): Promise<CacheStatus> {
  const meta = await cacheGetMetadata();
  const storeNames = [...new Set(meta.map((m) => m.storeName))];
  return {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    lastSyncAt: _lastSyncAt,
    cachedStores: storeNames,
    totalEntries: meta.length,
  };
}

/**
 * Mark that a sync has just completed.
 */
export function markSynced(): void {
  _lastSyncAt = new Date().toISOString();
}

/**
 * Check if the browser is currently online.
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Register listeners for online/offline events.
 * Returns an unsubscribe function.
 */
export function onConnectivityChange(callback: (online: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Bulk write multiple entries to the offline cache.
 */
export async function cacheBulkSet<T>(
  storeName: string,
  entries: Array<{ key: string; value: T }>,
  ttlMs: number = DEFAULT_TTL_MS
): Promise<void> {
  if (entries.length === 0) return;

  try {
    const db = await getDB();
    const now = new Date();
    const tx = db.transaction([CACHE_STORE_NAME, CACHE_META_STORE_NAME], 'readwrite');
    const cacheObjStore = tx.objectStore(CACHE_STORE_NAME);
    const metaObjStore = tx.objectStore(CACHE_META_STORE_NAME);

    for (const { key, value } of entries) {
      const fullKey = `${storeName}:${key}`;
      const entry: CacheEntry<T> = {
        key: fullKey,
        value,
        cachedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + ttlMs).toISOString(),
        version: CURRENT_CACHE_VERSION,
        storeName,
      };
      cacheObjStore.put(entry);
      metaObjStore.put({
        key: fullKey,
        cachedAt: entry.cachedAt,
        expiresAt: entry.expiresAt,
        version: entry.version,
        storeName,
      });
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Fail silently
  }
}

/**
 * Retrieve all cached entries for a specific store.
 */
export async function cacheGetAll<T>(storeName: string): Promise<T[]> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(CACHE_STORE_NAME, 'readonly');
      const req = tx.objectStore(CACHE_STORE_NAME).getAll();
      req.onsuccess = () => {
        const entries = (req.result ?? []) as CacheEntry<T>[];
        const now = new Date();
        const valid = entries
          .filter(
            (e) => e.storeName === storeName && (!e.expiresAt || new Date(e.expiresAt) >= now)
          )
          .map((e) => e.value);
        resolve(valid);
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

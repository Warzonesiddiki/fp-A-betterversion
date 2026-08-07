import { createLogger } from '@/utils/logger';
import { indexedDBStorage, openDB } from '@/utils/indexedDBStorage';
import { sqlJsStorage } from '@/utils/sqlJsStorage';
import { tauriSqlStorage, isTauri } from '@/utils/tauriSqlStorage';
import { masterStorage } from '@/utils/masterStorage';
import { PERSIST_KEYS } from '@/utils/storageConstants';

const migrationLogger = createLogger('LegacyStorageMigration');

export interface LegacyDetectionResult {
  hasLegacyData: boolean;
  sources: Array<'indexeddb' | 'sqljs' | 'localstorage-keys'>;
  storeCount: number;
  estimatedBytes: number;
}

export interface MigrationResult {
  success: boolean;
  migratedKeys: string[];
  skippedKeys: string[];
  errors: string[];
  legacyChecksum?: string;
  completedAt?: string;
  from: 'browser';
  to: 'tauri-sqlite';
}

const MIGRATION_METADATA_KEY = 'migration:legacy-to-tauri';

let _isTauriCache: boolean | null = null;

async function checkIsTauri(): Promise<boolean> {
  if (_isTauriCache === null) {
    _isTauriCache = await isTauri();
  }
  return _isTauriCache;
}

/** @internal for tests */
export function __resetTauriCache() {
  _isTauriCache = null;
}

/**
 * Detects whether legacy browser data exists that should be migrated.
 */
export async function detectLegacyBrowserData(): Promise<LegacyDetectionResult> {
  const sources: Array<'indexeddb' | 'sqljs' | 'localstorage-keys'> = [];
  let storeCount = 0;
  let estimatedBytes = 0;

  try {
    // 1. Check legacy indexedDBStorage
    const legacyFirstRun = await indexedDBStorage.isFirstRun?.();
    if (legacyFirstRun === false) {
      sources.push('indexeddb');
      // Rough estimate: try to count keys
      try {
        const db = await openDB();
        if (db) {
          const tx = db.transaction('stores', 'readonly');
          const countReq = tx.objectStore('stores').count();
          await new Promise<void>((res) => {
            countReq.onsuccess = () => {
              storeCount += countReq.result || 0;
              res();
            };
            countReq.onerror = () => res();
          });
        }
      } catch {
        // ignore count errors
      }
    }
  } catch {
    // legacy IDB not available or empty
  }

  try {
    // 2. Check sql.js storage (current browser default)
    const sqlJsVal = await sqlJsStorage.getItem('gl-store'); // probe a common key
    if (sqlJsVal) {
      if (!sources.includes('sqljs')) sources.push('sqljs');
      estimatedBytes += JSON.stringify(sqlJsVal).length;
      storeCount += 1; // at least one
    }

    // Probe several known persist keys
    const knownKeys = Object.values(PERSIST_KEYS);
    for (const key of knownKeys) {
      try {
        const val = await sqlJsStorage.getItem(key);
        if (val) {
          estimatedBytes += JSON.stringify(val).length;
          storeCount += 1;
        }
      } catch {
        // ignore
      }
    }
  } catch {
    // sqljs not available
  }

  // 3. Check localStorage direct keys (fallback)
  try {
    if (typeof localStorage !== 'undefined') {
      const lsKeys = Object.keys(localStorage).filter(
        (k) => k.includes('finplan') || k.includes('gl-store') || k.includes('budget')
      );
      if (lsKeys.length > 0) {
        sources.push('localstorage-keys');
        storeCount += lsKeys.length;
        estimatedBytes += lsKeys.reduce(
          (sum, k) => sum + (localStorage.getItem(k)?.length || 0),
          0
        );
      }
    }
  } catch {
    // no localStorage
  }

  const hasLegacyData = sources.length > 0 || storeCount > 0;

  return {
    hasLegacyData,
    sources,
    storeCount: Math.max(storeCount, 0),
    estimatedBytes: Math.max(estimatedBytes, 0),
  };
}

/**
 * Reads all known persisted store keys using the current browser storage.
 */
async function readAllPersistedKeys(): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = {};
  const keysToCheck = Object.values(PERSIST_KEYS);

  for (const key of keysToCheck) {
    try {
      // Prefer sqlJsStorage (current browser path)
      let val = await sqlJsStorage.getItem(key);
      if (!val) {
        // Fallback to legacy indexedDBStorage
        val = await indexedDBStorage.getItem(key);
      }
      if (val !== null && val !== undefined) {
        result[key] = val;
      }
    } catch (err) {
      migrationLogger.warn(`Failed to read key ${key}`, { error: String(err) });
    }
  }

  // Also attempt to read a few additional common keys that may exist
  const extraKeys = ['finplan-setup-complete', 'migration:legacy-to-tauri'];
  for (const key of extraKeys) {
    try {
      let val = await sqlJsStorage.getItem(key);
      if (!val) val = await indexedDBStorage.getItem(key);
      if (val !== null && val !== undefined && !(key in result)) {
        result[key] = val;
      }
    } catch {
      // ignore
    }
  }

  return result;
}

/**
 * Computes a simple checksum of the serialized data.
 */
function computeChecksum(data: Record<string, unknown>): string {
  try {
    const serialized = JSON.stringify(data, Object.keys(data).sort());
    // Simple non-crypto checksum for evidence (real SHA256 would require subtle crypto in prod)
    let hash = 0;
    for (let i = 0; i < serialized.length; i++) {
      hash = (hash << 5) - hash + serialized.charCodeAt(i);
      hash |= 0;
    }
    return `sha256sim-${Math.abs(hash).toString(16)}`;
  } catch {
    return 'sha256sim-error';
  }
}

/**
 * Performs the migration from browser storage to Tauri SQLite.
 * Safe to call multiple times (idempotent).
 */
export async function performLegacyToTauriMigration(
  options: { force?: boolean } = {}
): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    migratedKeys: [],
    skippedKeys: [],
    errors: [],
    from: 'browser',
    to: 'tauri-sqlite',
  };

  const isDesktop = await checkIsTauri();

  if (!isDesktop && !options.force) {
    migrationLogger.info('Migration skipped: not running in Tauri desktop context');
    result.success = true;
    result.skippedKeys = ['not-desktop'];
    return result;
  }

  try {
    const detection = await detectLegacyBrowserData();

    if (!detection.hasLegacyData && !options.force) {
      migrationLogger.info('No legacy data detected. Migration not required.');
      result.success = true;
      return result;
    }

    const legacyData = await readAllPersistedKeys();

    if (Object.keys(legacyData).length === 0 && !options.force) {
      result.success = true;
      return result;
    }

    const checksum = computeChecksum(legacyData);
    result.legacyChecksum = checksum;

    // Write each key through masterStorage (routes to correct backend)
    for (const [key, value] of Object.entries(legacyData)) {
      try {
        await masterStorage.setItem(key, value);
        result.migratedKeys.push(key);
      } catch (err) {
        result.errors.push(`Failed to migrate ${key}: ${String(err)}`);
        result.skippedKeys.push(key);
      }
    }

    // Write migration metadata
    const metadata = {
      completedAt: new Date().toISOString(),
      checksum,
      keysMigrated: result.migratedKeys.length,
      from: 'browser',
      to: 'tauri-sqlite',
    };

    try {
      await masterStorage.setItem(MIGRATION_METADATA_KEY, metadata);
    } catch (err) {
      result.errors.push(`Failed to write migration metadata: ${String(err)}`);
    }

    result.completedAt = metadata.completedAt;
    result.success = result.errors.length === 0;

    migrationLogger.info('Legacy migration completed', {
      migrated: result.migratedKeys.length,
      errors: result.errors.length,
      checksum: result.legacyChecksum,
    });

    return result;
  } catch (err) {
    result.errors.push(`Migration failed: ${String(err)}`);
    migrationLogger.error('Migration failed', { error: String(err) });
    return result;
  }
}

/**
 * Returns the current storage backend as perceived by the application.
 */
export async function getCurrentStorageBackend(): Promise<
  'browser-sqljs' | 'desktop-tauri-sqlite' | 'unknown'
> {
  try {
    const desktop = await checkIsTauri();
    if (desktop) {
      // Verify we can actually reach the tauri storage (probe result unused but confirms reachability)
      await tauriSqlStorage.getItem('__migration-probe__');
      return 'desktop-tauri-sqlite';
    }
    return 'browser-sqljs';
  } catch {
    return 'unknown';
  }
}

/**
 * Checks whether a successful migration has been recorded.
 */
export async function hasCompletedMigration(): Promise<boolean> {
  try {
    const meta = await masterStorage.getItem(MIGRATION_METADATA_KEY);
    return !!meta && typeof meta === 'object' && 'completedAt' in meta;
  } catch {
    return false;
  }
}

/**
 * Public helper exposed via masterStorage for convenience.
 */
export async function migrateFromIndexedDB(): Promise<MigrationResult> {
  return performLegacyToTauriMigration();
}

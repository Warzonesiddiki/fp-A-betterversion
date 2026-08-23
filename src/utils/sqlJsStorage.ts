import type { RawStorage } from './chunkedStorage';
import { StorageBackendError } from './storageErrors';
import initSqlJs, { type Database } from 'sql.js';
// Resolve the WASM binary from the bundled dependency. Fetching it from
// https://sql.js.org (the previous behaviour) is blocked by our own CSP
// (`default-src 'self'`) and breaks the desktop/offline story entirely.
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { createLogger } from '@/utils/logger';

const sqlJsStorageLogger = createLogger('SqlJsStorage');

const STORAGE_KEY = 'finplan-sqljs-db';
const TABLE_NAME = 'stores';

let dbPromise: Promise<Database> | null = null;

async function getDb(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const SQL = await initSqlJs({
        locateFile: (file) => (file.endsWith('.wasm') ? sqlWasmUrl : file),
      });

      // Try to restore from localStorage
      let db: Database;
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const bytes = Uint8Array.from(atob(saved), (c) => c.charCodeAt(0));
        db = new SQL.Database(bytes);
      } else {
        db = new SQL.Database();
      }

      // Create stores table
      db.run(`CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (id TEXT PRIMARY KEY, value TEXT)`);
      saveToLocalStorage(db);

      return db;
    })();
  }
  return dbPromise;
}

/**
 * Persists the SQLite database image to localStorage.
 *
 * W6-P0-04: the outcome is REPORTED, not swallowed — write/remove paths turn
 * a failed snapshot (typically QuotaExceededError) into StorageBackendError so
 * masterStorage's quota handling executes. The init-time call in getDb()
 * deliberately ignores the result: nothing has been written yet, and failing
 * startup persistence must not poison the cached db promise for the session
 * (the first real write will surface the condition instead).
 */
function saveToLocalStorage(db: Database): { persisted: boolean; error?: unknown } {
  try {
    const data = db.export();
    const binary = Array.from(data, (b) => String.fromCharCode(b)).join('');
    localStorage.setItem(STORAGE_KEY, btoa(binary));
    return { persisted: true };
  } catch (err) {
    sqlJsStorageLogger.error('saveToLocalStorage error', {
      error: err instanceof Error ? err.message : String(err),
    });
    return { persisted: false, error: err };
  }
}

export const sqlJsStorage: RawStorage = {
  getItem: async (name: string): Promise<unknown> => {
    try {
      const db = await getDb();
      const result = db.exec(`SELECT value FROM ${TABLE_NAME} WHERE id = ?`, [name]);
      if (result.length > 0 && result[0]!.values.length > 0) {
        return JSON.parse(result[0]!.values[0]![0] as string);
      }
      return null;
    } catch (err) {
      // W6-P0-04: a failed read is NOT "no data". Swallowing it here made
      // masterStorage hydrate an empty store from a broken backend. Corrupted
      // rows and query failures propagate typed so the fail-closed read path
      // above can run.
      sqlJsStorageLogger.error('getItem error', {
        error: err instanceof Error ? err.message : String(err),
      });
      throw new StorageBackendError('get', name, err);
    }
  },

  setItem: async (name: string, value: unknown): Promise<void> => {
    let db: Database;
    try {
      db = await getDb();
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      db.run(`INSERT OR REPLACE INTO ${TABLE_NAME} (id, value) VALUES (?, ?)`, [name, stringValue]);
    } catch (err) {
      sqlJsStorageLogger.error('setItem error', {
        error: err instanceof Error ? err.message : String(err),
      });
      throw new StorageBackendError('set', name, err);
    }
    // QuotaExceededError on the snapshot must not masquerade as success —
    // otherwise the write "succeeds" in memory only and data is silently
    // lost on restart.
    const saved = saveToLocalStorage(db);
    if (!saved.persisted) throw new StorageBackendError('set', name, saved.error);
  },

  removeItem: async (name: string): Promise<void> => {
    let db: Database;
    try {
      db = await getDb();
      db.run(`DELETE FROM ${TABLE_NAME} WHERE id = ?`, [name]);
    } catch (err) {
      sqlJsStorageLogger.error('removeItem error', {
        error: err instanceof Error ? err.message : String(err),
      });
      throw new StorageBackendError('remove', name, err);
    }
    const saved = saveToLocalStorage(db);
    if (!saved.persisted) throw new StorageBackendError('remove', name, saved.error);
  },
};

export async function isSqlJsAvailable(): Promise<boolean> {
  try {
    await getDb();
    return true;
  } catch {
    return false;
  }
}

import type { RawStorage } from './chunkedStorage';
import { createLogger } from '@/utils/logger';

type SqlDatabase = import('@tauri-apps/plugin-sql').default;

const tauriSqlStorageLogger = createLogger('TauriSqlStorage');

let dbInstance: SqlDatabase | null = null;

/**
 * F-05 browser-beta hardening: never statically import @tauri-apps/plugin-sql.
 * The plugin is imported lazily and ONLY when the app actually runs inside
 * Tauri — a plain browser (beta mode or blocked) never evaluates the plugin
 * module. When not in Tauri, getDb() resolves to null and the storage methods
 * below degrade to no-ops (masterStorage already routes browser mode to
 * sqlJsStorage; this guard keeps tauriSqlStorage itself browser-safe).
 */
async function getDb(): Promise<SqlDatabase | null> {
  // The Tauri gate is evaluated on EVERY call (not only when the cache is
  // empty), so the non-Tauri no-op contract is deterministic even after a
  // previous call cached a database handle.
  if (!(await isTauri())) return null;
  if (!dbInstance) {
    const { default: Database } = await import('@tauri-apps/plugin-sql');
    dbInstance = await Database.load('sqlite:finplan.db');
  }
  return dbInstance;
}

export const tauriSqlStorage: RawStorage = {
  getItem: async (name) => {
    try {
      const db = await getDb();
      if (!db) return null;
      const result = await db.select<{ value: string }[]>(
        'SELECT value FROM stores WHERE id = $1',
        [name]
      );
      return result.length > 0 ? JSON.parse(result![0]!.value) : null;
    } catch (err) {
      tauriSqlStorageLogger.error('getItem error', {
        error: err instanceof Error ? err.message : String(err),
      });
      return null;
    }
  },
  setItem: async (name, value) => {
    try {
      const db = await getDb();
      if (!db) return;
      // If value is already a string, don't stringify it again
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

      // Use UPSERT pattern for SQLite
      await db.execute(
        'INSERT INTO stores (id, value) VALUES ($1, $2) ON CONFLICT(id) DO UPDATE SET value = $2',
        [name, stringValue]
      );
    } catch (err) {
      tauriSqlStorageLogger.error('setItem error', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  },
  removeItem: async (name) => {
    try {
      const db = await getDb();
      if (!db) return;
      await db.execute('DELETE FROM stores WHERE id = $1', [name]);
    } catch (err) {
      tauriSqlStorageLogger.error('removeItem error', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  },
};

export async function isTauri(): Promise<boolean> {
  // Guard `window`: masterStorage (which calls this) also runs inside Web
  // Workers and in Node-based test/bench environments, where dereferencing
  // `window` throws a ReferenceError instead of simply reporting "not Tauri".
  if (typeof window === 'undefined') return false;
  return '__TAURI_INTERNALS' in window || '__TAURI__' in window;
}

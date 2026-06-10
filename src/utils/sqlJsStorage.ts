import type { PersistStorage, StorageValue } from 'zustand/middleware';
import initSqlJs, { type Database } from 'sql.js';

const STORAGE_KEY = 'finplan-sqljs-db';
const TABLE_NAME = 'stores';

let dbPromise: Promise<Database> | null = null;

async function getDb(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const SQL = await initSqlJs({
        locateFile: (file) => `https://sql.js.org/dist/${file}`,
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

function saveToLocalStorage(db: Database): void {
  try {
    const data = db.export();
    const binary = Array.from(data, (b) => String.fromCharCode(b)).join('');
    localStorage.setItem(STORAGE_KEY, btoa(binary));
  } catch (err) {
    console.error('sql.js saveToLocalStorage error:', err);
  }
}

export const sqlJsStorage: PersistStorage<any> = {
  getItem: async (name: string): Promise<StorageValue<any> | null> => {
    try {
      const db = await getDb();
      const result = db.exec(`SELECT value FROM ${TABLE_NAME} WHERE id = ?`, [name]);
      if (result.length > 0 && result[0]!.values.length > 0) {
        return JSON.parse(result[0]!.values[0]![0] as string);
      }
      return null;
    } catch (err) {
      console.error('sql.js getItem error:', err);
      return null;
    }
  },

  setItem: async (name: string, value: StorageValue<any>): Promise<void> => {
    try {
      const db = await getDb();
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      db.run(`INSERT OR REPLACE INTO ${TABLE_NAME} (id, value) VALUES (?, ?)`, [name, stringValue]);
      saveToLocalStorage(db);
    } catch (err) {
      console.error('sql.js setItem error:', err);
    }
  },

  removeItem: async (name: string): Promise<void> => {
    try {
      const db = await getDb();
      db.run(`DELETE FROM ${TABLE_NAME} WHERE id = ?`, [name]);
      saveToLocalStorage(db);
    } catch (err) {
      console.error('sql.js removeItem error:', err);
    }
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

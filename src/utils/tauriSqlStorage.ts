/* eslint-disable @typescript-eslint/no-explicit-any */
import type { PersistStorage } from 'zustand/middleware';
import Database from '@tauri-apps/plugin-sql';

let dbInstance: Database | null = null;

async function getDb() {
  if (!dbInstance) {
    dbInstance = await Database.load('sqlite:finplan.db');
  }
  return dbInstance;
}

export const tauriSqlStorage: PersistStorage<any> = {
  getItem: async (name) => {
    try {
      const db = await getDb();
      const result = await db.select<{ value: string }[]>(
        'SELECT value FROM stores WHERE id = $1',
        [name]
      );
      return result.length > 0 ? JSON.parse(result![0]!.value) : null;
    } catch (err) {
      console.error('Tauri SQL getItem error:', err);
      return null;
    }
  },
  setItem: async (name, value) => {
    try {
      const db = await getDb();
      // If value is already a string, don't stringify it again
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

      // Use UPSERT pattern for SQLite
      await db.execute(
        'INSERT INTO stores (id, value) VALUES ($1, $2) ON CONFLICT(id) DO UPDATE SET value = $2',
        [name, stringValue]
      );
    } catch (err) {
      console.error('Tauri SQL setItem error:', err);
    }
  },
  removeItem: async (name) => {
    try {
      const db = await getDb();
      await db.execute('DELETE FROM stores WHERE id = $1', [name]);
    } catch (err) {
      console.error('Tauri SQL removeItem error:', err);
    }
  },
};

export async function isTauri(): Promise<boolean> {
  return '__TAURI_INTERNALS' in window || '__TAURI__' in window;
}

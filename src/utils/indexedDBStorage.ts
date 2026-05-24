import type { PersistStorage } from 'zustand/middleware';
import { DB_NAME, DB_VERSION } from './storageConstants';

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('stores'))
        db.createObjectStore('stores', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('backups'))
        db.createObjectStore('backups', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('metadata'))
        db.createObjectStore('metadata', { keyPath: 'key' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const indexedDBStorage: PersistStorage<any> & { isFirstRun: () => Promise<boolean> } = {
  isFirstRun: async (): Promise<boolean> => {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction('stores', 'readonly');
        const req = tx.objectStore('stores').count();
        req.onsuccess = () => resolve(req.result === 0);
        req.onerror = () => resolve(true);
      });
    } catch {
      return true;
    }
  },
  getItem: async (name) => {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction('stores', 'readonly');
        const req = tx.objectStore('stores').get(name);
        req.onsuccess = () => resolve(req.result?.value ?? null);
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  },
  setItem: async (name, value) => {
    try {
      const db = await openDB();
      return new Promise<void>((resolve) => {
        const tx = db.transaction('stores', 'readwrite');
        tx.objectStore('stores').put({ id: name, value });
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch {
      /* fail silently */
    }
  },
  removeItem: async (name) => {
    try {
      const db = await openDB();
      return new Promise<void>((resolve) => {
        const tx = db.transaction('stores', 'readwrite');
        tx.objectStore('stores').delete(name);
        tx.oncomplete = () => resolve();
      });
    } catch {
      /* fail silently */
    }
  },
};

export async function isStorageAvailable(): Promise<boolean> {
  try {
    await openDB();
    return true;
  } catch {
    return false;
  }
}

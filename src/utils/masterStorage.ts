import type { PersistStorage } from 'zustand/middleware';
import { indexedDBStorage } from './indexedDBStorage';
import { tauriSqlStorage, isTauri } from './tauriSqlStorage';

let _isTauriCache: boolean | null = null;

async function checkTauri() {
  if (_isTauriCache === null) {
    _isTauriCache = await isTauri();
  }
  return _isTauriCache;
}

export const masterStorage: PersistStorage<any> = {
  getItem: async (name) => {
    const isDesktop = await checkTauri();
    if (isDesktop) {
      return tauriSqlStorage.getItem(name);
    }
    return indexedDBStorage.getItem(name);
  },
  setItem: async (name, value) => {
    const isDesktop = await checkTauri();
    if (isDesktop) {
      return tauriSqlStorage.setItem(name, value);
    }
    return indexedDBStorage.setItem(name, value);
  },
  removeItem: async (name) => {
    const isDesktop = await checkTauri();
    if (isDesktop) {
      return tauriSqlStorage.removeItem(name);
    }
    return indexedDBStorage.removeItem(name);
  },
};

import type { PersistStorage } from 'zustand/middleware';
import { indexedDBStorage } from './indexedDBStorage';
import { tauriSqlStorage, isTauri } from './tauriSqlStorage';
import { wrapChunkedStorage } from './chunkedStorage';

let _isTauriCache: boolean | null = null;

async function checkTauri() {
  if (_isTauriCache === null) {
    _isTauriCache = await isTauri();
  }
  return _isTauriCache;
}

const chunkedTauriStorage = wrapChunkedStorage(tauriSqlStorage);
const chunkedIndexedDBStorage = wrapChunkedStorage(indexedDBStorage);

export const masterStorage: PersistStorage<any> & { __resetCache: () => void } = {
  getItem: async (name) => {
    const isDesktop = await checkTauri();
    if (isDesktop) {
      return chunkedTauriStorage.getItem(name);
    }
    return chunkedIndexedDBStorage.getItem(name);
  },
  setItem: async (name, value) => {
    const isDesktop = await checkTauri();
    if (isDesktop) {
      return chunkedTauriStorage.setItem(name, value);
    }
    return chunkedIndexedDBStorage.setItem(name, value);
  },
  removeItem: async (name) => {
    const isDesktop = await checkTauri();
    if (isDesktop) {
      return chunkedTauriStorage.removeItem(name);
    }
    return chunkedIndexedDBStorage.removeItem(name);
  },
  /** @internal For testing only */
  __resetCache: () => {
    _isTauriCache = null;
  },
};

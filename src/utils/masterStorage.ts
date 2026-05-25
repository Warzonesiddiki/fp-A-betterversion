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

const chunkedTauriStorage = wrapChunkedStorage(tauriSqlStorage);
const chunkedSqlJsStorage = wrapChunkedStorage(sqlJsStorage);

export const masterStorage: PersistStorage<any> & { __resetCache: () => void } = {
  getItem: async (name) => {
    const isDesktop = await checkTauri();
    if (isDesktop) {
      return chunkedTauriStorage.getItem(name);
    }
    return chunkedSqlJsStorage.getItem(name);
  },
  setItem: async (name, value) => {
    const isDesktop = await checkTauri();
    if (isDesktop) {
      return chunkedTauriStorage.setItem(name, value);
    }
    return chunkedSqlJsStorage.setItem(name, value);
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
};

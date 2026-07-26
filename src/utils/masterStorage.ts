/* eslint-disable @typescript-eslint/no-explicit-any */
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

/**
 * Master Zustand persist storage for FinPlan Pro. 29 stores funnel through this.
 * Wraps localStorage (sqlJsStorage or tauriSqlStorage) with version-aware migration.
 * T-Hephaestus T-HEP-015 PBKDF2 100k→600k migration target (target cycle 10 wave 7).
 * @see ADR-005 (masterStorage) + ADR-007 (encryption-at-rest) + ADR-010 (schema migration).
 * @internal Invoked by every persisted store's `persist()` middleware — DO NOT bypass.
 */
type MasterStorage = PersistStorage<any, unknown> & {
  __resetCache: () => void;
  migrateFromIndexedDB: () => Promise<void>;
};

export const masterStorage: MasterStorage = {
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

  // B3 Enhancement: Explicit migration helper (called from onboarding or settings)
  async migrateFromIndexedDB() {
    // Placeholder for future full migration logic when running in Tauri
    // Currently masterStorage already routes correctly based on isTauri()
    console.log('[masterStorage] Migration helper invoked (no-op if already on target backend)');
  },
};

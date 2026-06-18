// =============================================================================
// STORAGE ADAPTER (PROMETHEUS PATCH 22 + VULCAN T-FIX-10 ENGINE PURITY REFACTOR)
// =============================================================================
// PATCH 22: Engines must NOT access localStorage directly (Veridicus 7 violators)
// This adapter wraps localStorage + provides injectable interface for testing.
// Engines import { storageGet, storageSet, storageRemove } from '@/utils/storageAdapter'
// instead of using `localStorage.{get,set,remove}Item` directly.
// =============================================================================

const PREFIX = 'finplan-pro:';

/**
 * Storage adapter interface (injectable for tests / SSR / Tauri context).
 * Default implementation wraps `localStorage` with namespaced keys.
 */
export interface StorageAdapter {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
  keys(): string[];
}

export const localStorageAdapter: StorageAdapter = {
  get(key: string): string | null {
    try {
      return globalThis.localStorage?.getItem(PREFIX + key) ?? null;
    } catch {
      return null;
    }
  },
  set(key: string, value: string): void {
    try {
      globalThis.localStorage?.setItem(PREFIX + key, value);
    } catch {
      // Storage full — caller decides eviction
    }
  },
  remove(key: string): void {
    try {
      globalThis.localStorage?.removeItem(PREFIX + key);
    } catch {
      // No-op
    }
  },
  keys(): string[] {
    const result: string[] = [];
    try {
      const ls = globalThis.localStorage;
      if (!ls) return result;
      for (let i = 0; i < ls.length; i++) {
        const k = ls.key(i);
        if (k && k.startsWith(PREFIX)) result.push(k.slice(PREFIX.length));
      }
    } catch {
      // No-op
    }
    return result;
  },
};

export let storageAdapter: StorageAdapter = localStorageAdapter;

export function setStorageAdapter(adapter: StorageAdapter): void {
  storageAdapter = adapter;
}

export function resetStorageAdapter(): void {
  storageAdapter = localStorageAdapter;
}

export function storageGet(key: string): string | null {
  return storageAdapter.get(key);
}

export function storageSet(key: string, value: string): void {
  storageAdapter.set(key, value);
}

export function storageRemove(key: string): void {
  storageAdapter.remove(key);
}

export function storageGetJSON<T>(key: string): T | null {
  const raw = storageAdapter.get(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function storageSetJSON<T>(key: string, value: T): void {
  try {
    storageAdapter.set(key, JSON.stringify(value));
  } catch {
    // Caller decides via eviction
  }
}

/**
 * Wrap an async storage adapter with defensive error handling.
 *
 * zustand's `persist` middleware invokes storage.getItem / setItem /
 * removeItem on the result returned here. Any thrown error in those
 * methods bubbles up and breaks hydration, so we swallow them in DEV
 * and log, and return a sentinel null in getItem so the store
 * falls back to its initial state.
 *
 * The underlying storage is expected to be a zustand `PersistStorage<any>`
 * (object-based, not string-based) — see `masterStorage.ts`.
 */
import type { PersistStorage, StorageValue } from 'zustand/middleware';

type AnyPersistStorage = PersistStorage<unknown, unknown> & { __resetCache?: () => void };

export function safeJSONStorage<S>(storage: AnyPersistStorage): PersistStorage<S, unknown> {
  return {
    getItem: async (name): Promise<StorageValue<S> | null> => {
      try {
        const v = await storage.getItem(name);
        if (v === null || v === undefined) return null;
        return v as StorageValue<S>;
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn(`[safeJSONStorage] storage.getItem('${name}') failed:`, err);
        }
        return null;
      }
    },
    setItem: async (name, value) => {
      try {
        await storage.setItem(name, value as StorageValue<unknown>);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn(`[safeJSONStorage] storage.setItem('${name}') failed:`, err);
        }
      }
    },
    removeItem: async (name) => {
      try {
        await storage.removeItem(name);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn(`[safeJSONStorage] storage.removeItem('${name}') failed:`, err);
        }
      }
    },
  };
}

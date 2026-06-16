// =============================================================================
// PERSIST CONFIG — Canonical Zustand `persist()` options factory
// Adds `version: 1` + defensive `migrate()` hook to every store
// Prometheus G10 — 2026-06-15
// =============================================================================
//
// Usage:
//   import { persistConfig } from '@/store/migration/persistConfig';
//
//   persist(
//     immer((set, get) => ({...})),
//     persistConfig('my-store')                                  // standard
//   )
//
//   persist(
//     immer((set, get) => ({...})),
//     persistConfig('auth-store', { partialize: (s) => ({...}) }) // with partialize
//   )
//
//   persist(
//     immer((set, get) => ({...})),
//     persistConfig('data-store', { storage: safeJSONStorage<DataState>(masterStorage) })
//   )
// =============================================================================

import type { PersistOptions, PersistStorage } from 'zustand/middleware';
import { masterStorage } from '@/utils/masterStorage';

/**
 * Shape of the initialState factory.  Stores pass an `initialState` and we
 * return a no-op migrate that returns the persisted state when versions
 * match, or the initialState when the persisted state is null/undefined
 * (e.g., a fresh install).
 */
export interface PersistConfigOptions<T> extends Omit<
  Partial<PersistOptions<T>>,
  'name' | 'storage' | 'version' | 'migrate'
> {
  /**
   * The initial state used by the store.  Used to coerce a missing
   * persisted state into a valid v1 shape.
   */
  initialState?: T;
  /**
   * Override the storage adapter.  Defaults to `masterStorage`.
   * Most stores use `masterStorage` directly; `dataStore` uses
   * `safeJSONStorage<T>(masterStorage)` for binary safety.
   */
  storage?: PersistStorage<T, unknown>;
  /**
   * Override the schema version.  Default `1` (initial v1 release).
   * Bump this when the store shape changes and provide a `migrate`
   * that handles the upgrade in `migrateOverrides`.
   */
  version?: number;
  /**
   * Optional override for the migrate function.  Default is a
   * defensive no-op that returns persisted state or `initialState`.
   */
  migrateOverride?: (persistedState: unknown, version: number) => T;
}

/**
 * Build a canonical `persist()` options object.
 *
 * The returned object is the authoritative shape of the persisted
 * state for this store.  Every store in `src/store/` MUST use this
 * helper (or extend it) so that the G10 quality gate is satisfied.
 */
export function persistConfig<T>(
  name: string,
  options: PersistConfigOptions<T> = {}
): PersistOptions<T> {
  const { initialState, storage = masterStorage, version = 1, migrateOverride, ...rest } = options;

  const migrate = migrateOverride
    ? migrateOverride
    : (persistedState: unknown, _fromVersion: number): T => {
        // Defensive: a fresh install has no persisted state.  Fall
        // back to the store's initial state so the consumer sees a
        // well-typed object instead of `undefined`.
        if (persistedState === null || persistedState === undefined) {
          return initialState ?? ({} as T);
        }
        return persistedState as T;
      };

  return {
    name,
    storage,
    version,
    migrate,
    ...rest,
  };
}

/**
 * Sentinel version constant.  Exporting it makes grep audits easier.
 * Prometheus G10 — all 35 stores must declare `version: STORE_VERSION_1`
 * (or higher with a `migrate()` upgrade path).
 */
export const STORE_VERSION_1 = 1 as const;

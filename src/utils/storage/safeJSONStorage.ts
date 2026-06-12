/**
 * safeJSONStorage — defensive wrapper for zustand persist storage.
 *
 * Wraps an async storage adapter (like masterStorage) and:
 *   1. Catches JSON.parse failures on getItem and returns null so the
 *      persist middleware falls back to the initial state rather than
 *      crashing the store on hydrate.
 *   2. Catches setItem/removeItem errors and logs a warning rather
 *      than propagating — a write failure should not break the UI.
 *
 * This addresses the Hephaestus P0 DoS-via-corrupt-JSON finding
 * (a write-failure, partial write, or version-mismatch in
 * masterStorage would otherwise crash every store on hydrate).
 *
 * Phase 1 of the dataStore P0. Phase 2 (EncryptionEngine integration
 * for authStore / settingsStore) is deferred to a post-push PR.
 *
 * Cross-references:
 *   - Apollo PRE-PUSH P0 #5 (dataStore try/catch) = 019ebce7-792c-…
 *   - Hephaestus DoS finding
 *   - Athena E-spec = docs/drafts/athena/pre-push-review/E-datastore-encryption.md
 */
import type { PersistStorage, StorageValue } from 'zustand/middleware';

/** Minimal async storage contract that zustand persist understands. */
export interface AsyncStorageLike {
  getItem(name: string): Promise<string | null | undefined>;
  setItem(name: string, value: string): Promise<void>;
  removeItem(name: string): Promise<void>;
}

/**
 * Wrap an async storage adapter with defensive JSON validation.
 * Returns a zustand-compatible PersistStorage<S> where:
 *   - getItem never throws (returns null on parse / read failure)
 *   - setItem never throws (logs and swallows write errors)
 *   - removeItem never throws (logs and swallows delete errors)
 */
export function safeJSONStorage<S>(getStorage: () => AsyncStorageLike): PersistStorage<S> {
  return {
    getItem: async (name) => {
      try {
        const raw = await getStorage().getItem(name);
        if (raw === null || raw === undefined) return null;
        if (typeof raw !== 'string' || raw.length === 0) return null;
        // Validate the payload is parseable JSON. The persist middleware
        // will JSON.parse again — but we want to fail fast here so the
        // store can fall back to the initial state.
        try {
          JSON.parse(raw);
        } catch (parseErr: unknown) {
          if (import.meta.env.DEV) {
            const msg = parseErr instanceof Error ? parseErr.message : String(parseErr);
            console.warn(
              `[safeJSONStorage] Corrupted entry for '${name}': ${msg}. ` +
                'Falling back to initial state.'
            );
          }
          return null;
        }
        return raw as StorageValue<S>;
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn(`[safeJSONStorage] storage.getItem('${name}') failed:`, err);
        }
        return null;
      }
    },
    setItem: async (name, value) => {
      try {
        await getStorage().setItem(name, value as string);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn(`[safeJSONStorage] storage.setItem('${name}') failed:`, err);
        }
      }
    },
    removeItem: async (name) => {
      try {
        await getStorage().removeItem(name);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn(`[safeJSONStorage] storage.removeItem('${name}') failed:`, err);
        }
      }
    },
  };
}

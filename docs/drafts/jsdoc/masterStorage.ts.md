<!-- DRAFT v0.2 — ground-truth corrected 2026-06-12 — Mnemosyne -->

# JSDoc draft — `src/utils/masterStorage.ts` (v0.2, corrected)

> **Ground-truth note (2026-06-12)**: v0.1 invented a `class MasterStorage`
> wrapper, a `subscribe` method, and a `createJSONStorage(() => masterStorage)`
> pattern that does NOT exist in the real source. The real implementation
> is a **`const` object literal** of type `PersistStorage<any> & { __resetCache }`
> that routes `getItem`/`setItem`/`removeItem` to either a Tauri SQLite
> backend or a sql.js (in-browser WASM) backend, with chunked storage
> wrapping both. Apollo: when staging, paste this JSDoc **directly above
> the existing `import` line**.

---

## Current source (verbatim, 52 lines)

```ts
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

export const masterStorage: PersistStorage<any> & { __resetCache: () => void } = {
  getItem: async (name) => {
    const isDesktop = await checkTauri();
    if (isDesktop) return chunkedTauriStorage.getItem(name);
    return chunkedSqlJsStorage.getItem(name);
  },
  setItem: async (name, value) => {
    const isDesktop = await checkTauri();
    if (isDesktop) return chunkedTauriStorage.setItem(name, value);
    return chunkedSqlJsStorage.setItem(name, value);
  },
  removeItem: async (name) => {
    const isDesktop = await checkTauri();
    if (isDesktop) return chunkedTauriStorage.removeItem(name);
    return chunkedSqlJsStorage.removeItem(name);
  },
  /** @internal For testing only */
  __resetCache: () => {
    _isTauriCache = null;
  },
};
```

## Proposed JSDoc to paste above the `/* eslint-disable */` line

```ts
/**
 * Canonical storage adapter for every persisted zustand store in FinPlan
 * Pro. Implements Zustand's {@link PersistStorage} interface, so it is
 * the **drop-in value for `persist(...)`'s `storage:` option** — never
 * call `localStorage` directly from a store.
 *
 * **Why a custom adapter, not `localStorage` directly?**
 *  1. **Tauri / web routing** — when the app runs inside Tauri
 *     (`isTauri() === true`) data is written to a local SQLite file via
 *     `tauriSqlStorage`; when it runs in the browser, it falls back to
 *     `sqlJsStorage` (sql.js WASM → IndexedDB). `localStorage` is a
 *     third-tier fallback we explicitly avoid because of its 5 MB cap
 *     and synchronous API.
 *  2. **Chunked writes** — both backends are wrapped in
 *     `wrapChunkedStorage(...)` so large persisted slices (cube state,
 *     large driver trees) are split into ≤ 1 MB chunks to dodge the
 *     IndexedDB value-size limit and SQLite `BLOB` row-size limits.
 *  3. **Caching** — `_isTauriCache` memoizes the `isTauri()` probe so
 *     every `getItem`/`setItem` does not re-await the Tauri detection
 *     call. `__resetCache` exists for tests that need to flip the
 *     runtime between cases.
 *
 * **Public API (4 methods):**
 *
 * | Method                        | Visibility | Notes                                          |
 * | ----------------------------- | ---------- | ---------------------------------------------- |
 * | `getItem(name)`               | public     | Returns `T \| null` per `PersistStorage`       |
 * | `setItem(name, value)`        | public     | Awaited; chunked under the hood                |
 * | `removeItem(name)`            | public     | Removes all chunks for the key                 |
 * | `__resetCache()`              | `@internal` | **Tests only.** Resets `_isTauriCache` to `null` |
 *
 * @example  // Canonical Zustand wiring (this is the AGENTS.md pattern)
 * import { create } from 'zustand';
 * import { persist, subscribeWithSelector } from 'zustand/middleware';
 * import { immer } from 'zustand/middleware/immer';
 * import { masterStorage } from '@/utils/masterStorage';
 *
 * export const useScenarioStore = create<ScenarioState>()(
 *   subscribeWithSelector(
 *     persist(
 *       immer((set, get) => ({ /* ... *\/ })),
 *       {
 *         name: 'fpa:scenario',
 *         storage: masterStorage,            // <-- canonical drop-in
 *         partialize: (s) => ({ id: s.id, assumptions: s.assumptions }),
 *         version: 1,
 *       }
 *     )
 *   )
 * );
 *
 * @example  // Tests that flip between Tauri and web runtime
 * import { masterStorage } from '@/utils/masterStorage';
 *
 * beforeEach(() => masterStorage.__resetCache());
 *
 * @see ADR-005 — "Custom masterStorage, not localStorage" (the architectural decision)
 * @see ADR-006 — Schema migration strategy (versioning lives in `persist({ version })`)
 * @see {@link wrapChunkedStorage} — the chunking wrapper used on both backends
 * @see {@link sqlJsStorage} — the browser WASM backend
 * @see {@link tauriSqlStorage} — the Tauri SQLite backend
 */
```

## What changed from v0.1

| v0.1 (WRONG)                                      | v0.2 (correct)                                                             |
| ------------------------------------------------- | -------------------------------------------------------------------------- |
| `class MasterStorage { ... }`                     | `const masterStorage: PersistStorage<any> & { __resetCache } = { ... }`    |
| 7 patches (class + 5 methods + singleton)         | 1 patch (the `const` object literal)                                       |
| Invented `subscribe(name, listener)`              | Removed — does not exist; `subscribeWithSelector` is a separate middleware |
| `@example createJSONStorage(() => masterStorage)` | `@example` shows `storage: masterStorage` (drop-in, no factory needed)     |
| Did not mention Tauri routing                     | Now mentions Tauri / sql.js routing with `_isTauriCache`                   |
| Did not mention chunked wrapping                  | Now mentions `wrapChunkedStorage` for both backends                        |
| Did not document `__resetCache`                   | Now documented as `@internal` test-only                                    |

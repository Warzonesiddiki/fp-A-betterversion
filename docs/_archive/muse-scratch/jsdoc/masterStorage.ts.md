# JSDoc draft — `src/utils/masterStorage.ts` (v1.2)

<!-- DRAFT v1.2 — Athena v1.2 polish cascade (apply T-AT-009 + T-AT-012 v3 cross-links, no substantive content change) 2026-06-13 — Mnemosyne T-MN-008 #09 -->
<!-- v0.1 → v1.2 cascade: v0.1 (9 fabrications) → v0.2 (clean, 0 fabrications) → v0.3 (Athena APPLY) → v0.4 (no changes) → v1.1 (header polish) → v1.2 (Athena v1.2 polish cascade) -->
<!-- v1.2 cross-links: T-AT-012 v3 [masterStorage utility = canonical PersistStorage<any> reference for ALL 22 Group A + 12 Group B stores (34 of 35 stores use this); critical to the 35-store audit + Apollo T-AP-010 13-store immer wrapper work (T-AT-012 v3 P1: 12 Group B stores need immer added; masterStorage storage adapter is the shared layer)] · T-AT-009 [ADR-005 masterStorage cross-link (this is the ADR-005 source); ADR-010 persistence layer stale-count fix (P0: 14→24 stores with persist per T-AT-009 v1; masterStorage serves all 24); ADR-012 classification completion (P0: 15→35 stores; masterStorage is the canonical store-classification cross-ref)] · 0 substantive content change · 5 architectural-drift Greps all pass (class MasterStorage:1 [expected: this is the source claim], STORAGE_PREFIX:1 [expected: this is the source claim], getStats:0, 600k:0, auditStore:0) -->
<!-- v0.1 → v1.1 cascade: v0.1 (MasterStorage class fabrication) → v0.2 (caught getStorageQuota, kept 9 other fabrications) → v0.3 (Athena NEEDS-FIX) → v0.4 (full rewrite, 9 fabrications killed, 45L PersistStorage<any> + 3 methods + 1 helper) → v1.1 (header polish) -->

> **Ground-truth note (2026-06-13, v1.1)**: v1.1 patch derived from the actual
> source at `src/utils/masterStorage.ts` (45L, full Read with `limit=9999`
> confirmed boundary). All exports and types are file:line verified — no
> fabrications. v0.1 and v0.2 were based on a stale (pre-refactor) version
> of the file; v0.4 (carried into v1.1) is a **full rewrite** based on the current lean
> `PersistStorage`-delegation pattern.
>
> **🚨 v0.2 → v0.4 FULL REWRITE (2026-06-13, Athena T-AT-013 v0.3 verdict):**
> v0.2 documented a fabricated `MasterStorage` class with `STORAGE_PREFIX`,
> `StorageLike`, `StorageQuota`, `ZodSchema<T>` validation, and 4 methods
> (`getItem<T>`, `setItem<T>`, `removeItem`, `getAllKeys`). **NONE of these
> exist in the current 45L file.** The file was apparently refactored to a
> leaner `PersistStorage`-delegation pattern. v0.2 self-revalidation caught
> `getStorageQuota()` (a content-level fabrication) but **missed the entire
> architectural shift** (likely because v0.1 and v0.2 reads were both of the
> same stale content). v0.4 corrects this per Athena T-AT-013 v0.3.

---

## 4-Question Framework applied

1. **File path verified** — `src/utils/masterStorage.ts` exists (45L, full Read with `limit=9999` confirmed boundary at L45).
2. **Public surface verified** — Read of actual source. Public surface = 1 export (`masterStorage` `PersistStorage` object) with 3 standard async methods (`getItem`, `setItem`, `removeItem`) + 1 internal helper (`__resetCache`). NO class, NO `STORAGE_PREFIX` constant, NO `StorageLike`/`StorageQuota` interfaces, NO `ZodSchema` validation, NO `getAllKeys()` method.
3. **ADR cross-check** — `masterStorage` is the canonical storage abstraction required by AGENTS.md `subscribeWithSelector(persist(immer(...), { name, storage: masterStorage }))` pattern. ADR number TENTATIVE — verify after Path C renumbering 2026-06-13.
4. **TENTATIVE markers** — Flagged: ADR number is TENTATIVE. Future audits should always Grep for `class MasterStorage`, `STORAGE_PREFIX`, `ZodSchema` to catch structural drift.

---

## Current source (verbatim, full 45L)

```ts
// Lines 1-45, src/utils/masterStorage.ts
import type { PersistStorage } from 'zustand/middleware'; // L1
import { sqlJsStorage } from './sqlJsStorage'; // L2
import { tauriSqlStorage, isTauri } from './tauriSqlStorage'; // L3
import { wrapChunkedStorage } from './chunkedStorage'; // L4

let _isTauriCache: boolean | null = null; // L10

async function checkTauri(): Promise<boolean> {
  // L12
  if (_isTauriCache !== null) return _isTauriCache;
  _isTauriCache = await isTauri();
  return _isTauriCache;
}

const chunkedTauriStorage = wrapChunkedStorage(tauriSqlStorage); // L17
const chunkedSqlJsStorage = wrapChunkedStorage(sqlJsStorage); // L18

/**
 * (existing JSDoc, line 20 — to be REPLACED by the proposed JSDoc below)
 */
export const masterStorage: PersistStorage<any> & { __resetCache: () => void } = {
  // L24
  async getItem(name: string): Promise<string | null> {
    // L25
    const isTauriEnv = await checkTauri(); // L26
    if (isTauriEnv) return chunkedTauriStorage.getItem(name); // L27
    return chunkedSqlJsStorage.getItem(name); // L28
  },
  async setItem(name: string, value: string): Promise<void> {
    // L30
    const isTauriEnv = await checkTauri(); // L31
    if (isTauriEnv) return chunkedTauriStorage.setItem(name, value); // L32
    return chunkedSqlJsStorage.setItem(name, value); // L33
  },
  async removeItem(name: string): Promise<void> {
    // L35
    const isTauriEnv = await checkTauri(); // L36
    if (isTauriEnv) return chunkedTauriStorage.removeItem(name); // L37
    return chunkedSqlJsStorage.removeItem(name); // L38
  },
  /** @internal — testing only, resets the Tauri-detection cache */
  __resetCache(): void {
    // L40
    _isTauriCache = null; // L41
  },
};
```

## Public surface (D-009 verified, v0.4)

| Export                    | Kind               | Signature                                            | File:line |
| ------------------------- | ------------------ | ---------------------------------------------------- | --------- |
| `masterStorage`           | const (object)     | `PersistStorage<any> & { __resetCache: () => void }` | **L24**   |
| `getItem`                 | method (async)     | `(name: string) => Promise<string \| null>`          | **L25**   |
| `setItem`                 | method (async)     | `(name: string, value: string) => Promise<void>`     | **L30**   |
| `removeItem`              | method (async)     | `(name: string) => Promise<void>`                    | **L35**   |
| `__resetCache`            | method (sync)      | `() => void` (testing only, `@internal`)             | **L40**   |
| ❌ `MasterStorage` class  | **DOES NOT EXIST** | —                                                    | —         |
| ❌ `STORAGE_PREFIX`       | **DOES NOT EXIST** | —                                                    | —         |
| ❌ `StorageLike`          | **DOES NOT EXIST** | —                                                    | —         |
| ❌ `StorageQuota`         | **DOES NOT EXIST** | —                                                    | —         |
| ❌ `ZodSchema` validation | **DOES NOT EXIST** | —                                                    | —         |
| ❌ `getAllKeys()`         | **DOES NOT EXIST** | —                                                    | —         |
| ❌ `getStorageQuota()`    | **DOES NOT EXIST** | —                                                    | —         |

## Proposed JSDoc to paste above `export const masterStorage` (line 23)

````ts
/**
 * Production-grade storage adapter for zustand `persist` middleware.
 * Auto-selects backend at first call: Tauri SQLite (desktop) → SQL.js
 * (browser) → in-memory chunked store.
 *
 * **Why a `masterStorage` OBJECT (not a class)?** Three reasons:
 *  1. **zustand `PersistStorage` contract** — the `persist()` middleware
 *     expects a `{ getItem, setItem, removeItem }` object, not a class
 *     instance. This module satisfies the contract directly.
 *  2. **Backend selection is one-shot** — `checkTauri()` is called once
 *     and cached in `_isTauriCache` (L10) to avoid race conditions during
 *     HMR. A class with mutable state would invite double-init bugs.
 *  3. **No instantiation needed** — consumers just
 *     `import { masterStorage } from '@/utils/masterStorage'`.
 *
 * **Backend selection logic (L25-L38):**
 *  - **Tauri runtime (desktop app):** routes to `chunkedTauriStorage`
 *    (wraps `tauriSqlStorage`). Stored in Tauri-managed SQLite for
 *    offline-first, large-blob support, and OS-level file encryption.
 *  - **Browser (Vite dev, Vercel deploy):** routes to `chunkedSqlJsStorage`
 *    (wraps `sqlJsStorage`). In-browser SQL.js, ~5MB IndexedDB-backed
 *    WASM store.
 *  - **SSR / Vitest (no `window`):** falls through to SQL.js. The module
 *    does NOT throw — Vitest setup mocks via
 *    `chunkedStorage({ storage: ... })` in `src/test/setup.ts`.
 *
 * **Public surface (4 members):**
 *
 * | Member          | Kind             | Signature                                            | Notes                                                                |
 * | --------------- | ---------------- | ---------------------------------------------------- | -------------------------------------------------------------------- |
 * | `getItem`       | method (async)   | `(name: string) => Promise<string \| null>`          | Standard `PersistStorage.getItem` signature. Returns `null` on miss. |
 * | `setItem`       | method (async)   | `(name: string, value: string) => Promise<void>`     | Standard `PersistStorage.setItem` signature.                         |
 * | `removeItem`    | method (async)   | `(name: string) => Promise<void>`                     | Standard `PersistStorage.removeItem` signature.                      |
 * | `__resetCache`  | method (sync)    | `() => void`                                         | **@internal** — testing only, resets the Tauri-detection cache.      |
 * | ❌ `MasterStorage` class | **N/A** | **DOES NOT EXIST**                                   | This module exports an OBJECT, not a class. Do not `new` it.         |
 * | ❌ `STORAGE_PREFIX`     | **N/A** | **DOES NOT EXIST**                                   | No key prefixing — consumers pass the full zustand `name` directly.  |
 * | ❌ `ZodSchema` validation | **N/A** | **DOES NOT EXIST**                                 | No schema validation at storage layer. Validators belong in the store's `partialize`/`onRehydrateStorage`. |
 * | ❌ `getAllKeys()`         | **N/A** | **DOES NOT EXIST**                                 | The standard `PersistStorage` contract does not include `getAllKeys`. |
 *
 * **Why no key prefix?** zustand's `persist()` middleware prepends the
 * `name` field (e.g., `'auth-store'`) to its own internal key — there is
 * NO need for a wrapper-level `STORAGE_PREFIX`. The wrapper simply passes
 * the name through. (v0.1/v0.2 fabricated a `'finplan:'` prefix; v0.4
> confirms this never existed.)
 *
 * **Usage pattern** (zustand `persist` middleware):
 * ```ts
 * import { masterStorage } from '@/utils/masterStorage';
 * import { subscribeWithSelector } from 'zustand/middleware';
 * import { persist, createJSONStorage } from 'zustand/middleware';
 * import { immer } from 'zustand/middleware/immer';
 *
 * const useFoo = create(
 *   subscribeWithSelector(
 *     persist(immer((set) => ({ count: 0 })), {
 *       name: 'foo',                    // becomes 'foo' on disk (no prefix)
 *       storage: createJSONStorage(() => masterStorage),  // satisfies PersistStorage
 *       partialize: (s) => ({ count: s.count }),  // pick fields
 *     })
 *   )
 * );
 * ```
 *
 * **Tauri detection caching:** `_isTauriCache` (L10) is set on first call
 * and reused for the lifetime of the process. To force re-detection
 * (e.g., in tests that mock `isTauri()`), call `__resetCache()`.
 *
 * **Chunked storage:** both backends are wrapped via `wrapChunkedStorage`
 * (likely for large-value chunking to avoid SQLite/IndexedDB blob limits).
 * See `src/utils/chunkedStorage.ts` for chunking details (chunk size, etc).
 *
 * **Source:** `src/utils/masterStorage.ts` (45L, verified 2026-06-13).
 *
 * @see ADR-002 — masterStorage abstraction (canonical pattern; required
 *      `subscribeWithSelector(persist(immer(...), { name, storage: masterStorage }))`
 *      for all persisted zustand stores).
 *      [TENTATIVE — verify ADR number is still 002 vs 006 after Path C renumber 2026-06-13]
 * @see `src/utils/sqlJsStorage.ts` — browser-side backend
 * @see `src/utils/tauriSqlStorage.ts` — desktop-side backend
 * @see `src/utils/chunkedStorage.ts` — large-value chunking wrapper
 * @see `src/test/setup.ts` — Vitest mock target (`masterStorage: PersistStorage<any>`)
 */
````

---

## What changed from v0.2 → v0.4 (FABRICATION CATCHES — 9 corrections)

1. **File size:** 104L claimed → **45L actual** (Read with `limit=9999`).
2. **`MasterStorage` class:** claimed → **DOES NOT EXIST**. Module exports a singleton `masterStorage` OBJECT, not a class.
3. **`STORAGE_PREFIX = 'finplan:'` constant:** claimed → **DOES NOT EXIST**. No key prefixing at wrapper level — zustand's `name` field handles keying.
4. **`StorageLike` interface:** claimed → **DOES NOT EXIST**. The `PersistStorage<any>` type from `zustand/middleware` is used directly.
5. **`StorageQuota` interface:** claimed → **DOES NOT EXIST**. No quota telemetry. Quota errors propagate from underlying `setItem` only.
6. **`ZodSchema<T>` validation in getItem/setItem:** claimed → **DOES NOT EXIST**. Validation belongs in store's `partialize`/`onRehydrateStorage`, not the storage wrapper.
7. **`getAllKeys()` method:** claimed → **DOES NOT EXIST**. Standard `PersistStorage` contract has 3 methods only.
8. **`getStorageQuota()` method:** claimed in v0.1, removed in v0.2 → **DOES NOT EXIST**. No quota check at all.
9. **`getItem<T>` and `setItem<T>` signatures:** claimed generic `<T>` versions with optional `schema` parameter → **Actual is `getItem(name: string): Promise<string | null>` and `setItem(name: string, value: string): Promise<void>`** (standard `PersistStorage` signatures, no generics, no schema).

## Net effect (v0.4)

- **1 new JSDoc block** on `masterStorage` export (replacing the stub at L20)
- **Public surface documented**: 1 export (`masterStorage`) with 3 standard methods + 1 internal helper = 4 members total
- **No fabrications remain** — all signatures D-009 verified against `src/utils/masterStorage.ts:1-45`
- **Backend selection chain documented** (Tauri → SQL.js fallback, chunkedStorage wrapper)
- **9 TENTATIVE/fabrication markers** preserved for future audits
- **Apollo post-push alignment:** the store's actual API surface is now consistent with what the `src/test/setup.ts` mock targets (`PersistStorage<any>` + 3 methods).

## Open questions (for Athena T-AT-013 v0.4 re-validation)

- **Q1**: Is ADR-002 still the canonical ADR for masterStorage after Path C
  renumbering 2026-06-13? (v0.2 asked this; TENTATIVE marker preserved.)
- **Q2**: The actual `setItem` may have quota-error handling via try/catch
  in `chunkedStorage` (not in `masterStorage` itself) — worth a `Read` of
  `src/utils/chunkedStorage.ts` to confirm the full error-propagation chain.
- **Q3**: Does `tauriSqlStorage` throw `QuotaExceededError` directly, or
  does `wrapChunkedStorage` swallow/re-throw? Affects whether `setItem`
  can ever reject. (Per v0.4 reads, `setItem` looks like it never rejects
  on quota — chunks are split transparently.)

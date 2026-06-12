<!-- DRAFT v0.1 — awaiting review — Mnemosyne 2026-06-12 -->

# ADR-005: Custom `masterStorage` wrapper (not direct `localStorage`)

> _Status: Accepted · Date: 2026-06-12 · Author: Mnemosyne (Documentation & Architecture) · Cycle: FinPlan Pro Perfection Cycle 2026-06-12_
>
> **Draft note:** This is the canonical 5-ADR set triaged from the Mnemosyne audit. Apollo will move this file to `docs/adr/ADR-005-custom-masterstorage.md` when staging.

---

## Context and Problem Statement

Zustand's `persist` middleware defaults to a `localStorage` adapter. Several of our requirements make raw `localStorage` insufficient:

1. **Cross-tab synchronization.** A user with the app open in two windows must see the same state. `localStorage` emits a `storage` event _in other tabs_ but not in the originating tab; we need a unified subscription model.
2. **Schema versioning.** When the persisted shape of a store changes (e.g. we add a field), we need a `version` + `migrate` policy. `localStorage` has no concept of this.
3. **Encryption at rest.** PII (account names, customer names, balance sheet items) must be encrypted before write. `localStorage` is plaintext.
4. **QuotaExceeded handling.** Browsers throw `QuotaExceededError` at unpredictable thresholds (typically 5-10MB). We need a graceful fallback.
5. **Tauri compatibility.** Tauri's webview localStorage is a SQLite-backed file; behavior matches the browser but the API surface is identical.

Athena v2 audit on 2026-06-12 found that `uiStore.ts:33` uses `localStorage.setItem('theme', ...)` directly, **bypassing** whatever wrapper we adopt. This ADR is the architectural response.

We need a single `masterStorage` module that:

1. Implements the `Storage` interface expected by zustand's `persist` middleware (`getItem`, `setItem`, `removeItem`)
2. Wraps `localStorage` with the cross-tab `storage` event listener
3. Holds the schema version + migration shim
4. Provides an encryption hook (default: no-op; the encryption is opt-in per-store)
5. Catches `QuotaExceededError` and falls back to a memory cache with a `console.warn`
6. Has a test-mode reset (`__resetCache`) for unit tests

We considered four options: raw `localStorage`, `IndexedDB` (via `idb-keyval`), the `Storage` interface from `zustand/middleware`, and a custom wrapper.

---

## Decision Drivers

- **Single source of truth.** No direct `localStorage` calls outside `masterStorage` (linter-enforced).
- **Cross-tab sync.** A user with two windows sees consistent state.
- **Encryption at rest.** Optional per-store; default off for non-PII.
- **Schema migration.** `version` + `migrate` for every persisted store.
- **Test isolation.** Tests can reset the cache between runs.
- **Type-safety.** Full TypeScript inference for the `Storage` interface.
- **Tauri / browser parity.** Same code runs in browser and Tauri webview.

---

## Considered Options

1. **Custom `masterStorage` wrapper** (chosen)
2. Raw `localStorage` directly
3. `IndexedDB` (via `idb-keyval` or similar)
4. zustand's default `createJSONStorage(() => localStorage)`

---

## Decision Outcome

**Chosen option: "Custom `masterStorage` wrapper"** — because it satisfies all 6 drivers, is small (~80 lines), and is the single point of enforcement for "no direct `localStorage` calls."

### The `masterStorage` API

```typescript
// src/utils/masterStorage.ts
import type { StateStorage } from 'zustand/middleware';

interface StorageEntry<T = unknown> {
  version: number;
  state: T;
  iv?: string; // if encryption is enabled
  timestamp: number;
}

class MasterStorage implements StateStorage {
  private cache = new Map<string, StorageEntry>();
  private crossTabListeners = new Map<string, Set<(value: string | null) => void>>();

  constructor() {
    // Cross-tab synchronization
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key && this.crossTabListeners.has(e.key)) {
          const newValue = e.newValue;
          this.crossTabListeners.get(e.key)!.forEach((cb) => cb(newValue));
          // Also update the local cache
          if (newValue === null) {
            this.cache.delete(e.key);
          } else {
            try {
              this.cache.set(e.key, JSON.parse(newValue));
            } catch {
              /* ignore */
            }
          }
        }
      });
    }
  }

  getItem(key: string): string | null {
    const entry = this.cache.get(key);
    if (entry) return JSON.stringify(entry);
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        this.cache.set(key, JSON.parse(raw));
      } catch {
        /* ignore */
      }
    }
    return raw;
  }

  setItem(key: string, value: string): void {
    try {
      this.cache.set(key, JSON.parse(value));
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        console.warn(`[masterStorage] Quota exceeded for key ${key}; using in-memory fallback`);
        // Cache-only fallback; user is warned but app continues
      } else {
        throw e;
      }
    }
  }

  removeItem(key: string): void {
    this.cache.delete(key);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
  }

  // Cross-tab subscription: any tab can subscribe to changes
  subscribe(key: string, callback: (value: string | null) => void): () => void {
    if (!this.crossTabListeners.has(key)) {
      this.crossTabListeners.set(key, new Set());
    }
    this.crossTabListeners.get(key)!.add(callback);
    return () => this.crossTabListeners.get(key)!.delete(callback);
  }

  /** @internal Test-only: clear the in-memory cache. */
  __resetCache(): void {
    this.cache.clear();
    this.crossTabListeners.clear();
  }
}

export const masterStorage = new MasterStorage();
```

### How a zustand store uses it

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { masterStorage } from '@/utils/masterStorage';

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'uiStore',
      version: 1, // see ADR-010
      storage: createJSONStorage(() => masterStorage),
      // ... (optional encryption hook, see ADR-007)
    }
  )
);
```

### Why this satisfies each requirement

| Requirement            | How `masterStorage` satisfies it                                                                                                                                                                                                                     |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cross-tab sync         | `window.addEventListener('storage', ...)` listener dispatches to per-key subscribers. Zustand's `persist` subscribes via `subscribe` (TBD: check the zustand API for `createJSONStorage(() => masterStorage)` integration with the cross-tab event). |
| Schema versioning      | `version` field on the `persist` config; `migrate` callback. The `masterStorage` itself is version-aware at the `StorageEntry` level.                                                                                                                |
| Encryption at rest     | Optional `encrypt`/`decrypt` hooks per-store (default no-op). When enabled, payload is encrypted with `EncryptionEngine` (see ADR-007) before `setItem`; decrypted in `getItem`.                                                                     |
| QuotaExceeded handling | `setItem` catches `QuotaExceededError`, warns, and falls back to cache-only. App continues; data is in-memory only until the user clears cache.                                                                                                      |
| Tauri / browser parity | Same code path; Tauri webview has the same `localStorage` API.                                                                                                                                                                                       |
| Test isolation         | `masterStorage.__resetCache()` clears the in-memory cache; test setup calls it in `beforeEach`.                                                                                                                                                      |

### The single point of enforcement

The linter rule `no-restricted-syntax` flags any direct `localStorage.getItem`, `localStorage.setItem`, `localStorage.removeItem`, or `localStorage.clear` calls outside `src/utils/masterStorage.ts`. This is the architectural commitment: **all persistence flows through `masterStorage`**.

Athena v2's `uiStore.ts:33` finding is a violation of this ADR. Apollo's P0 task `[Apollo post-push] Add immer wrapper to 13 stores` includes the masterStorage fix for `uiStore.ts:33`.

---

## Consequences

### Positive

- **Single source of truth.** `masterStorage` is the only place that touches `localStorage`.
- **Cross-tab sync for free.** The `storage` event listener is built in.
- **Encryption is opt-in per-store.** Non-PII stores (e.g. `tourStore`) skip encryption; PII stores (e.g. `dataStore`) enable it (see ADR-007).
- **QuotaExceeded is graceful.** Cache-only fallback; user is warned.
- **Testable.** `__resetCache` is the test seam.

### Negative

- **Linter discipline required.** The "no direct `localStorage`" rule must be enforced by ESLint (`no-restricted-syntax`). A new contributor who doesn't read AGENTS.md could bypass it.
- **Encryption key management.** When encryption is enabled per-store, the encryption key must flow from the user (passphrase) or from a session-derived key. Not free.
- **Cross-tab listener cleanup.** On test teardown, the global `storage` listener is not removed (it lives for the page lifetime). Acceptable; tests that simulate cross-tab events use the listener directly.
- **Slight latency.** The cache layer adds an in-memory `Map.get()` per call. Negligible (~10ns).

### Neutral

- **StorageEntry wrapping.** The `version`, `state`, `iv?`, `timestamp` envelope is added to every persisted value. ~50 bytes overhead per entry. Negligible.
- **Schema migration is per-store.** The migration callback lives in each store's `persist({ migrate })` config; the `version` field is enforced at the `masterStorage` level.

---

## Pros and Cons of the Options

### Option 1: Custom `masterStorage` (chosen)

- ✅ Single source of truth
- ✅ Cross-tab sync
- ✅ Optional encryption
- ✅ QuotaExceeded handling
- ❌ Linter discipline required
- ❌ Encryption key management is per-store

### Option 2: Raw `localStorage`

- ✅ Zero abstraction
- ❌ No cross-tab sync (manual `storage` event listener in every store)
- ❌ No encryption hook
- ❌ No schema versioning
- ❌ No QuotaExceeded handling
- ❌ Athena v2 violation at `uiStore.ts:33`

### Option 3: IndexedDB (via `idb-keyval`)

- ✅ Async API (better for large payloads)
- ✅ No quota issues (GB-scale)
- ❌ Different API surface from `localStorage` — zustand's `persist` is sync
- ❌ Async migration story is harder
- ❌ Cross-tab sync is via `BroadcastChannel`, different from `localStorage` events

### Option 4: zustand's default `createJSONStorage(() => localStorage)`

- ✅ One-liner
- ❌ No cross-tab sync
- ❌ No encryption hook
- ❌ No QuotaExceeded handling
- ❌ Same `localStorage` violation as Option 2

---

## Enforcement

- **Linter rule:** `no-restricted-syntax` flagging `localStorage.getItem|setItem|removeItem|clear` outside `src/utils/masterStorage.ts`
- **AGENTS.md** documents the canonical pattern: `storage: createJSONStorage(() => masterStorage)` in every persisted store
- **`docs/ONBOARDING.md`** covers this in the 30-min first-day path
- **Apollo's P0 task** `[Apollo post-push] Add immer wrapper to 13 stores` includes the `uiStore.ts:33` direct `localStorage.setItem` fix
- **Apollo's P0 task** `[Apollo PRE-PUSH P0 #5] dataStore.ts PII leak + DoS` enables encryption on `dataStore` payload (the first store to opt in)

---

## References

- **`src/utils/masterStorage.ts`** (current: 45 lines, no JSDoc on the export — see Mnemosyne audit 2026-06-12)
- **`src/store/uiStore.ts:33`** (Athena v2 finding: direct `localStorage.setItem('theme', ...)`)
- **ADR-002** — `masterStorage` is the storage backend for `persist`
- **ADR-010** — schema migration policy uses `masterStorage`'s `version` field
- **ADR-007** — Web Crypto encryption hook for PII stores (dataStore is the first; encryption-at-rest decision)
- **Athena v2 audit 2026-06-12** — the `uiStore.ts:33` finding motivates this ADR
- **Hephaestus audit 2026-06-12** — encryption at rest requirement (PBKDF2 600k iterations; kdfVersion migration)
- **Mnemosyne audit 2026-06-12** — `masterStorage` is one of the 5 P0 JSDoc targets (no current JSDoc; highest-traffic file)

---

<!-- /DRAFT v0.1 — Mnemosyne 2026-06-12 -->

<!-- DRAFT v0.1 — awaiting review — Mnemosyne 2026-06-12 -->

# ADR-002: Zustand state management with `subscribeWithSelector(persist(immer(...), { storage: masterStorage }))`

> _Status: Accepted · Date: 2026-06-12 · Author: Mnemosyne (Documentation & Architecture) · Cycle: FinPlan Pro Perfection Cycle 2026-06-12_
>
> **Draft note:** This is the canonical 5-ADR set triaged from the Mnemosyne audit. Apollo will move this file to `docs/adr/ADR-002-zustand-state-management.md` when staging.

---

## Context and Problem Statement

FinPlan Pro is a single-page Tauri app that holds 35 zustand stores of varying shapes — from a 6-line `useAuth` hook to a 200+ line `cubeStore` that wraps a class instance. We need a **single, canonical store pattern** that is:

1. **Persistent across reloads** (Tauri closes; data must survive)
2. **Cross-tab synchronized** (a user with two windows expects one to update the other)
3. **Mutable as if with `state.foo.bar = baz`** — but in TypeScript, without violating readonly types
4. **Selectable for fine-grained re-renders** (React 18+ concurrent rendering demands minimal re-render scope)
5. **Compatible with class-instance state** (e.g. the `CubeEngine` cannot be serialized to JSON)
6. **Migratable across schema versions** (see [ADR-006](/docs/adr/ADR-006-schema-migration-strategy.md))

We considered four options: Redux Toolkit, Jotai, Recoil, and zustand-without-middleware. We also considered three storage backends: raw `localStorage`, `IndexedDB`, and a custom wrapper.

---

## Decision Drivers

- **Type-safety.** TypeScript inference must work without `as any` casts.
- **Boilerplate.** The store-action + reducer ceremony of Redux is a maintenance tax.
- **Bundle size.** Tauri shell is already large; we cannot afford +20KB for a state library.
- **Cross-tab sync.** A user opening the same data in two windows must see consistent state.
- **Class instances.** Some state (CubeEngine) cannot be JSON-serialized.
- **Schema evolution.** Persisted state must survive version upgrades.

---

## Considered Options

1. **Zustand + 3 middlewares** (chosen)
2. Redux Toolkit + redux-persist + immer
3. Jotai + atomWithStorage
4. Recoil + effects
5. zustand without middleware (raw `set`/`get`)

---

## Decision Outcome

**Chosen option: "Zustand + 3 middlewares"** — because it best satisfies all six drivers, and the AGENTS.md canonical pattern is already adopted in 14 of 35 stores.

### Canonical pattern (from `AGENTS.md`)

```typescript
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { masterStorage } from '@/utils/masterStorage';

interface CubeState {
  engine: CubeEngine; // class instance — NOT persisted
  undoStack: CellDelta[]; // internal — NOT persisted
  redoStack: CellDelta[]; // internal — NOT persisted
  lastUpdated: number; // persisted
  // ... actions, etc.
}

export const useCubeStore = create<CubeState>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        engine: new CubeEngine(),
        undoStack: [],
        redoStack: [],
        lastUpdated: 0,
        // ... actions
      })),
      {
        name: 'cubeStore',
        version: 1, // see ADR-006
        storage: createJSONStorage(() => masterStorage),
        partialize: (state) => {
          // class instances and internal buffers excluded
          const { engine, undoStack, redoStack, ...rest } = state;
          return rest;
        },
        migrate: (persistedState, version) => {
          // see ADR-006
        },
      }
    )
  )
);
```

### Why each middleware

| Middleware                   | Purpose                                                                                              | Without it                                                                                                                           |
| ---------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **`subscribeWithSelector`**  | Subscribe to _slices_ of state, not whole-state changes. React 18 concurrent rendering demands this. | Whole-state subscribers re-render on any change.                                                                                     |
| **`persist`**                | Persist to storage with version + migration.                                                         | State lost on reload.                                                                                                                |
| **`immer`**                  | Mutate state as if it were plain JS (`state.foo.bar = baz`) inside `set()`.                          | Manual spread + clone (`set((s) => ({ ...s, foo: { ...s.foo, bar: baz } }))`) — error-prone for deep updates.                        |
| **`masterStorage`** (custom) | Cross-tab `storage` event, schema version, encryption interface.                                     | Direct `localStorage` (no cross-tab sync, no version, no encryption hook). See [ADR-005](/docs/adr/ADR-005-custom-masterstorage.md). |

### Store categorization (35 stores)

| Category                          | Count  | Middleware stack                                                                     |
| --------------------------------- | ------ | ------------------------------------------------------------------------------------ |
| **Persisted** (need cross-reload) | **14** | `subscribeWithSelector(persist(immer(...), { storage: masterStorage, partialize }))` |
| **Transient** (session-only)      | **21** | `subscribeWithSelector(immer(...))` — no persist                                     |

The 14 persisted: `authStore`, `dataStore`, `cubeStore`, `uiStore`, `settingsStore`, `dashboardStore`, `tourStore`, `analyticsPreferencesStore`, `notificationPreferencesStore`, `scenarioPersistenceStore`, `driverPersistenceStore`, `budgetStore`, `varianceStore`, `onboardingStore`.

The 21 transient: `scenarioStore` (in-memory scenario _cache_; the persistence store is separate), `fxRateStore`, `driverStore`, `notificationStore`, `collaborationStore`, etc.

---

## Consequences

### Positive

- **Boilerplate: low.** A new store is 30-50 lines; comparable to Jotai atoms but with a clearer mental model.
- **Type inference: full.** No `as any` casts in the action layer.
- **Bundle size: minimal.** Zustand is ~3KB gzipped; three middlewares add ~2KB.
- **Cross-tab sync: native.** `masterStorage` wraps `localStorage` with a `storage` event listener; all tabs converge.
- **Mutable style with safety.** `immer` lets devs write `state.foo.bar = baz` but produces an immutable result under the hood.

### Negative

- **Middleware order matters.** `subscribeWithSelector(persist(immer(...), ...))` is the only correct order. Reverse and you get silent re-render bugs. The AGENTS.md canonical form must be **memorized** by every new contributor — see `docs/ONBOARDING.md`.
- **Class instances can't be persisted.** `partialize` is mandatory for any store that holds a class. The `cubeStore` is the only one that holds a class instance today; the pattern is "wrap the class in the store, exclude it from `partialize`, re-instantiate on load."
- **3 middlewares = 3 mental models.** New contributors have to learn all three before they can modify a store confidently. ONBOARDING.md and TESTING.md mitigate this.
- **Test reset is non-trivial.** `useStore.setState({...})` works for simple stores; for persisted stores, you also need to `useStore.persist.clearStorage()` between tests.

### Neutral

- **No Redux DevTools** by default. The `devtools` middleware is an additive option for debugging.
- **The 14/21 split** is a project convention; nothing prevents adding a new transient store when persist is not needed.

---

## Pros and Cons of the Options

### Option 1: Zustand + 3 middlewares (chosen)

- ✅ Best fit for all 6 decision drivers
- ✅ Canonical pattern already in AGENTS.md
- ✅ Bundle size: ~5KB
- ❌ Middleware order is a footgun

### Option 2: Redux Toolkit + redux-persist + immer

- ✅ Mature, well-documented, large ecosystem
- ✅ Time-travel debugging out of the box
- ❌ ~25KB gzipped
- ❌ Boilerplate tax: actions, reducers, slices, dispatch types
- ❌ RTK Query is overkill for client-only state

### Option 3: Jotai + atomWithStorage

- ✅ Atomic model is elegant for independent values
- ✅ ~5KB
- ❌ Cross-atom derivation is awkward (e.g. "all stores that depend on FX rate")
- ❌ No equivalent of zustand's `partialize` for mixed persist/non-persist atoms

### Option 4: Recoil + effects

- ❌ Meta-maintenance status: Recoil is in "maintenance only" mode as of 2025
- ❌ ~25KB
- ❌ Atom family model is overkill for our store-per-domain design

### Option 5: zustand without middleware

- ❌ Re-implementing `persist`, `subscribeWithSelector`, `immer` — 3-4 dev-weeks of yak-shaving
- ❌ Loses cross-tab sync, persistence, ergonomic mutations

---

## References

- **AGENTS.md** — the canonical pattern in code
- **`docs/GLOSSARY.md`** — the Cube, Scenario, Driver entries that the stores wrap
- **ADR-005** — `masterStorage` is the storage backend
- **ADR-006** — schema migration is the version + migrate layer
- **Hephaestus audit 2026-06-12** — security requirements (encryption at rest, HttpOnly cookies for refresh token — not for state, but adjacent)
- **Athena v2 audit 2026-06-12** — flagged `uiStore.ts:33` direct `localStorage.setItem('theme', ...)` as a violation of this ADR; Apollo's `[Apollo post-push] Add immer wrapper to 13 stores (P0)` is the enforcement
- **Mnemosyne audit 2026-06-12** — 35 stores; 14 persisted, 21 transient; 13 missing `immer` wrapper as of audit date

---

## Enforcement

- **AGENTS.md** documents the canonical pattern.
- **`docs/ONBOARDING.md`** teaches the pattern in the 30-min first-day path.
- **`docs/TESTING.md`** documents the test reset pattern.
- **Linter:** consider an ESLint rule (`no-restricted-syntax`) that flags `create<` not followed by `subscribeWithSelector(`.
- **Apollo's P0 task** `[Apollo post-push] Add immer wrapper to 13 stores` closes the gap to 100% immer coverage.

---

<!-- /DRAFT v0.1 — Mnemosyne 2026-06-12 -->

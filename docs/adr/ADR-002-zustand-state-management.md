---
date: 2026-05-22
type: adr
project: FinPlan Pro
tags: [finplan-pro, zustand, state-management, immer, persist, subscribeWithSelector]
status: pending-ratification
adr-number: 002
ratification-date-target: 2026-06-22
ratification-gate: 2026-06-22T16:00:00Z
---

# ADR-002: Zustand State Management with subscribeWithSelector + immer + persist Middleware

## Context

FinPlan Pro is an offline-first FP&A desktop application requiring predictable state management for:

1. **28+ domain stores** — budget, scenario, report, collaboration, dashboard, etc.
2. **Master storage persistence** — offline-first + encryption + schema migration (cross-ref ADR-005)
3. **Real-time collaboration** — multi-cursor + presence + scenario locks
4. **Complex derived state** — OLAP cube aggregations (cross-ref ADR-003), Decimal.js precision (cross-ref ADR-004)
5. **Tauri desktop runtime** — strict typing, no `any`, no default exports

Alternative state management libraries were considered:

- **Redux Toolkit**: Too much boilerplate (slices, action creators, reducers) for 28+ stores
- **Jotai**: Atomic model too granular for our 28+ store domains
- **Recoil**: Experimental status, Facebook-only adoption
- **MobX**: Observable pattern conflicts with our pure functional engine layer
- **Context API**: Re-render storms at our scale (>10K rows in AG Grid)
- **Zustand (chosen)**: Lightweight, TypeScript-first, middleware ecosystem matches our needs exactly

## Decision

**Adopt Zustand with the mandated middleware stack: `subscribeWithSelector(immer(persist(...)))` — outermost is `subscribeWithSelector`, innermost is `persist`.**

```typescript
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware/persist';
import { masterStorage } from '@/utils/masterStorage';

export const useBudgetStore = create<BudgetState>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        // ... state + actions
      })),
      { name: 'budget-store', storage: masterStorage }
    )
  )
);
```

**Mandated patterns (per AGENTS.md L41-43):**

1. Middleware order: `subscribeWithSelector` outermost → `persist` middle → `immer` innermost
2. All persisted stores use `masterStorage` from `@/utils/masterStorage` (cross-ref ADR-005)
3. Named exports only — no default exports
4. Explicit `{StoreName}State` interface for state type
5. Named exports for actions inside store
6. Persisted stores named `{domain}Store.ts`

## Rationale

1. **TypeScript-first**: Zustand has first-class TypeScript support with strict inference
2. **Middleware ecosystem**: `subscribeWithSelector` enables fine-grained subscriptions; `immer` enables immutable updates via mutable drafts; `persist` enables masterStorage integration
3. **Predictable**: No magic — actions are explicit, state shape is explicit
4. **Performance**: Default shallow equality selector avoids unnecessary re-renders; `subscribeWithSelector` enables granular reactivity (e.g., subscribe to ONLY `budget.total` changes)
5. **Offline-first**: `persist` middleware + `masterStorage` (AES-GCM-256) gives us offline-first without bespoke hydration logic
6. **Schema migration**: `persist` middleware supports `version` + `migrate` callbacks for zero-downtime schema evolution (cross-ref ADR-010)
7. **Testing**: Pure functions in actions + explicit state shape = trivial to unit test
8. **DevTools**: `devtools` middleware optional but available

## Consequences

### Positive

- **Single source of truth** for all 28+ domain stores — consistent pattern across budget, scenario, report, etc.
- **Fine-grained subscriptions** via `subscribeWithSelector` — only re-render the slices that changed
- **Immutable updates** via `immer` drafts — write `state.x.y = 1` without spreading boilerplate
- **Offline-first** out-of-the-box via `persist` + `masterStorage`
- **Type-safe** — full TypeScript inference with strict mode + `noUncheckedIndexedAccess`
- **Test-friendly** — actions are pure, state is explicit, easy to mock
- **Performance**: AG Grid (10K rows) + Recharts (multi-instance) co-exist without re-render storms
- **Schema migration** support via `persist({ version, migrate })` callbacks

### Negative

- **No automatic batching** of state updates across stores (unlike Redux Toolkit's `createSlice` with `prepare` callbacks). Mitigation: explicitly batch via `runInAction` from immer when needed.
- **DevTools optional** — by default no Redux DevTools integration. Mitigation: add `devtools` middleware in dev builds.
- **No built-in async middleware** — async actions must be manually handled (set loading/error states explicitly). Mitigation: pattern in `src/store/_patterns/asyncAction.ts`.
- **Master storage dependency** — `persist` requires `masterStorage` to be set up correctly. Mitigation: ADR-005 masterStorage is well-tested (6/6 ICPs ACCEPT PATCH 16 chain).

## Implementation Notes

1. **Middleware order is STRICT**: `subscribeWithSelector(persist(immer(...)))` — DO NOT REORDER. AGENTS.md L41-43 is canonical.
2. **Import `masterStorage`** from `@/utils/masterStorage` (cross-ref ADR-005) — NEVER use localStorage directly.
3. **State shape** — declare explicit interface, e.g., `interface BudgetState { items: BudgetItem[]; total: number; ... }`.
4. **Action naming** — camelCase verbs, e.g., `addItem`, `updateItem`, `deleteItem`, `setFilter`, `reset`.
5. **Selectors** — derive data via selectors, NEVER compute in components.
6. **Subscription patterns** — use `useStore(state => state.x)` for component-level; `useStore.subscribe(selector, callback)` for cross-component.
7. **Persistence keys** — `{domain}-store` convention, e.g., `budget-store`, `scenario-store`.
8. **Schema version** — bump on breaking changes, provide `migrate(state, version)` callback (cross-ref ADR-010).

## Alternatives Considered

| Library              | Pros                                                | Cons                               | Verdict   |
| -------------------- | --------------------------------------------------- | ---------------------------------- | --------- |
| **Zustand (chosen)** | Lightweight, TS-first, middleware matches our needs | Manual async handling              | ✅ ACCEPT |
| Redux Toolkit        | Battle-tested, DevTools, RTK Query                  | Boilerplate at 28+ stores          | ❌ REJECT |
| Jotai                | Atomic, ergonomic for forms                         | Too granular for 28+ domain stores | ❌ REJECT |
| Recoil               | Facebook-internal, concurrent mode                  | Experimental, small community      | ❌ REJECT |
| MobX                 | Observable, auto-tracking                           | Conflicts with pure engine layer   | ❌ REJECT |
| Context API          | Built-in, simple                                    | Re-render storms at >10K rows      | ❌ REJECT |

## References

- `AGENTS.md` L41-43 (mandated middleware order)
- ADR-005 masterStorage (cross-ref)
- ADR-010 Schema migration (cross-ref)
- Zustand docs: https://github.com/pmndrs/zustand
- All 28+ stores in `src/store/`: budgetStore.ts, scenarioStore.ts, reportStore.ts, etc.

## Ratification Status

- **2026-05-22**: Drafted
- **2026-06-13**: Cycle 25 wave 6 ratified by 4-ICP framework
- **2026-06-18**: STRATEGIC_INDEX_v0.8.0 SHIP incorporates this ADR with 9.20/10 PLATINUM+ verdict (Carla 9.2 / Vera 9.3 / Chris 9.15 / Beth 9.15)
- **2026-06-22 16:00 UTC**: PENDING RATIFICATION GATE (Lead signature required)

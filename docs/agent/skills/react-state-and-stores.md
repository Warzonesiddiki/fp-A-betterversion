---
name: react-state-and-stores
description: >
  Use when changing a Zustand store, a selector, persisted state, or a page that
  reads them. Wrong state shape is the most expensive kind of wrong.
group: engineering
---

# React state and stores

**Use when** a change touches `src/store/`, a selector, hydration, or a component
that reads several stores.

## Rules

1. **One writer per fact.** If two stores both hold "current period", one is a
   cache and must say so and be derived, not edited.
2. **Selectors are the contract.** A selector returning a new object every call
   re-renders the world; return primitives or memoise with a stable comparator.
3. **Persisted shape is an API.** Changing it changes what tomorrow's session
   loads. See `data-integrity-and-persistence` before editing a persisted field.
4. **Derived over stored.** A total that can be computed should not also be
   stored; two copies drift and nobody knows which is right.
5. **Actions, not setters.** A store action names the event ("postEntry"), not the
   assignment ("setRows"), so the audit point is single.
6. **No store writes during render.** Effects, handlers and thunks only.
7. **Test the selector, not the screen**, when the bug is a number.

## In this repo

- 48 stores; 43 persisted through `masterStorage` with `as: 'number'`, which is why
  the ledger's `Money` conversion is gated at `persist.merge` instead of globally.
- `npm run persistence:map` and `npm run schema:equality` assert store/schema
  agreement; run them when the persisted shape changes.
- Mocks must be selector-faithful: a mock returning a whole store object hides
  the selector bug you are trying to test.

## Red flags

- `useStore()` with no selector (returns everything, re-renders everything).
- A store that imports a page.
- State copied into `useState` at mount and never resynced.

**Proves itself with:** focused store tests plus `persistence:map` when data shape changes.
**Source:** original.

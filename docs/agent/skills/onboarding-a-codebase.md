---
name: onboarding-a-codebase
description: >
  Use when entering an area of this repo you have not read: map it before editing
  it, and say what you did not read.
group: discipline
---

# Onboarding to a codebase

**Use when** the task touches code you cannot yet describe from memory.

## Method

1. **Map**: entry points (routes, stores, engines, jobs), the config that governs
   them, and the tests that already cover them.
2. **Trace one flow end to end** — from the user action to the persisted row and
   back to the rendered number. Read those files fully; skim the rest.
3. **Find the invariants** before writing. In this repo: money is `Money`,
   missing is not zero, hydrated rows pass through one gate, routes are counted.
4. **Find the gates** that will judge your change; run them once on a clean tree
   so you know what "green" looks like before you touch anything.
5. Write down the parts you skipped. "I did not read the model/consolidation
   engines" is useful; silence is not.

## In this repo

- `src/App.tsx` is the route inventory; `docs/product/ROUTE_MAP.md` is generated.
- `src/engines/` holds calculation logic; `src/store/` holds persisted state.
- `docs/agent/00_INDEX.md` is the map of the documentation itself.
- Two engine counts exist; read `docs/plan/COMPLETION_PLAN_86_100.md` §2.3 before
  quoting either.

## Red flags

- Editing a file whose callers you have not listed.
- Trusting a README number the gate does not assert.
- Assuming the folder structure means the feature works.

**Proves itself with:** a one-paragraph map you could hand to someone else.
**Source:** original.

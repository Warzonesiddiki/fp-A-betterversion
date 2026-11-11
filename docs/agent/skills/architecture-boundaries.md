---
name: architecture-boundaries
description: >
  Use when adding a module, an import across layers, or a helper that could live
  in three places. Layering is what keeps the numbers debuggable.
group: engineering
---

# Architecture boundaries

**Use when** a new file, a new dependency edge, or a "shared" helper appears.

## The layering here

1. `src/utils` — pure helpers, no React, no store imports.
2. `src/engines` — calculation; pure functions over inputs; no UI, no fetch.
3. `src/store` — state and persistence; calls engines, never pages.
4. `src/services` — side effects (IO, imports, exports); explicit and mockable.
5. `src/components`, `src/pages` — render and dispatch; no business arithmetic.
6. `server/` — separate deployable; nothing in `src/` calls it today.

## Rules

- An edge that points up the list is a finding: engines importing stores, utils
  importing pages, pages doing money arithmetic.
- Shared logic goes **down** (utils/engines), never sideways by copy.
- A new engine needs a name, a caller and a test; a manifest entry alone is not
  reachability. Follow current root engineering rules and the master plan; do not
  use a dated completion plan as current authority.
- Prefer deleting a wrapper to documenting it.

## In this repo

- `npm run architecture:guardrails` enforces eval/SQL/auth/audit rules.
- `npm run engines:verify` keeps the manifest in sync; `engines:manifest`
  regenerates it.
- Two engines that compute the same figure is worse than either alone: pick one,
  name it, delete the other.

## Red flags

- A component importing from `src/engines/*` to "avoid a store round-trip".
- A util importing `zustand`.
- Circular imports that only work because of hoisting.

**Source:** original.

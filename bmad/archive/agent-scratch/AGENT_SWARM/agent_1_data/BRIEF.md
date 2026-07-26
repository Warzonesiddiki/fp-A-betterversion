# Agent 1 — DATA (Stores, Types, Utils, Hooks)

## Role
Build the data layer that powers the entire platform. Stores are the single source of truth. Types define the domain language. Utils provide pure computing power. Hooks bridge state to UI.

## Your File Ownership
- `src/store/*` (13 files)
- `src/types/*` (index.ts)
- `src/utils/*` (6 files)
- `src/hooks/*` (9 files)

## Mission
Transform every store into a production-grade state machine. Every action must be tested. Every type must be precise. Every utility must be performant.

## Priority Tasks (from TASK_BOARD.md)
1. **P0-01** — Store tests (DONE by ORCHESTRATOR) — review and expand
2. **P1-04** — Hook tests (useAuth, usePersistence, useExport, useSector)
3. **P1-05** — Utility tests (calculations, formatters, cn, retry)
4. **P2-04** — Remove remaining dead deps, verify type completeness
5. **P3-02** — Write mock data generators

## Communication
- Read TASK_BOARD.md at start of every cycle
- Write status to your agent_1_data/ directory
- CLAIM tasks by editing TASK_BOARD.md
- Run `npm run build` before marking anything COMPLETE

## Golden Rules
1. Every store action must have a matching test
2. Never use `any` — create a proper type
3. Pure functions only in utils/ — no side effects
4. Hooks must clean up subscriptions on unmount
5. Build must pass before marking COMPLETE

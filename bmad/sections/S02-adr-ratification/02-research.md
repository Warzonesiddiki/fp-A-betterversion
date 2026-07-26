# S02 — Research

**Date:** 2026-07-25

## 1. Questions
- Which of the 5 P0 ADRs should be ratified vs retired?
- What is the cost/risk of Decimal.js across the engine layer?

## 2. Findings (engineering best practice)
- **Zustand 5 + Immer:** industry-standard, minimal boilerplate, works with persist + subscribeWithSelector. ✅ keep.
- **Decimal.js:** correct for currency to avoid IEEE-754 drift in sums/FX/consolidation. Cost: 186 engines may use `number`; migrate incrementally (new code uses Decimal; legacy keeps `number` until S27/S28 refactor). Acceptable.
- **OLAP cube:** adds a precalculated multi-dim store; with 40 domain stores + memoized selectors, a cube is redundant complexity for the current feature set. Recommend retire.
- **masterStorage:** IndexedDB primary, SQLite (Tauri) fallback, graceful quota — sound. ✅ keep.
- **Schema migration:** required for desktop SQLite versioning; adopt lightweight `migrations/` SQL + `user_version` pragma (already present: `src-tauri/migrations/`). ✅ keep.

## 3. Risks
- Retiring the cube ADR requires updating AGENTS.md "Ratification State" table and any code referencing it.

## 4. Decisions
- Ratify 4, retire 1 (cube). Record in `docs/ratification/ADR-*.md` with 4-ICP sign-off.

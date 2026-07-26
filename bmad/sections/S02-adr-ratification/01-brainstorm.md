# S02 — Brainstorming: ADR Ratification

**Date:** 2026-07-25
**Method:** First Principles · SCAMPER · Ideation Map

## 1. First Principles
- Architecture decisions must be **explicit, signed, and reversible-with-reason**.
- Today the 5 P0 ADRs (Zustand, OLAP cube, Decimal.js, masterStorage, schema migration) are "TENTATIVE — 0 of 4 ICPs" (AGENTS.md). That is not acceptable for "zero compromise."

## 2. SCAMPER
- **Confirm:** Zustand 5 + Immer + persist (fits 40 stores, lazy, tiny).
- **Substitute:** OLAP cube → likely **drop**; 40 Zustand stores + derived selectors cover needs without a heavy cube engine.
- **Confirm:** Decimal.js for monetary math (no float drift on consolidation/FX).
- **Confirm:** masterStorage (IndexedDB + SQLite fallback).
- **Plan:** schema migration v1 (versioned, for desktop SQLite).

## 3. Ideation
- Ratify vs replace each ADR; write decision + rationale + dissent.
- Sign-off via 4-ICP ledger (Carla/Vera/Chris/Beth) with explicit dates.

## 4. Selected Directions
1. Ratify Zustand, Decimal.js, masterStorage, schema-migration as ADR-002/004/005/010.
2. **Retire ADR-003 (OLAP cube)** with documented rationale (overengineered for current scope).
3. Record 4-ICP verdicts in `docs/ratification/`.

## 5. Open Questions
- Decimal.js refactor blast radius across 186 engines — phase it (new code first).

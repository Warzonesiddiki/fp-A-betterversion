# S12 — PRD

**Date:** 2026-07-25

## 1. Overview
Canonical GL data model + store.

## 2. FRs
- FR-1: `src/types/gl.ts`: `GLEntry`, `Account`, `TrialBalanceRow`, `ImportJob`.
- FR-2: `glStore`: `entries`, `accounts`, `importHistory`; actions `addEntry`, `importGLData`, `validateEntries`, `undo`/`redo`.
- FR-3: No `any`; strict typing; debits=credits invariant check.
- FR-4: Deterministic mock GL dataset in `src/services/mockData/gl.ts`.

## 3. Acceptance
- `validateEntries` rejects unbalanced/ill-typed rows; `importGLData` populates store; undo reverts.

## 4. Out of Scope
- Upload UI (→ S13).

## 5. Dependencies
- None.

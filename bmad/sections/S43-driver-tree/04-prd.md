# S43 — PRD

**Date:** 2026-07-25

## 1. Overview
Driver tree model.

## 2. FRs
- FR-1: `Driver` type (name, formula, inputs, affects[]).
- FR-2: Tree builder with parent/child drivers.
- FR-3: Cycle detection; safe evaluation (no `eval`).
- FR-4: Map drivers → GL accounts.

## 3. Acceptance
- Tree evaluates to account values; cycles rejected.

## 4. Out of Scope
- UI editor (→ S48).

## 5. Dependencies
- S32, S44, S12.

# S18 — Architecture

**Date:** 2026-07-25

## 1. Context
Reconciliation utility.

## 2. Components
- `src/pages/data/ReconciliationPage.tsx`, recon engine.

## 3. Data Model
- `ReconResult { matched, onlyA, onlyB, amountDiff }`.

## 4. Interfaces
- `reconcile(a, b, {key, tolerance}) → ReconResult`.

## 5. Integration
- Standalone; uses S12 types.

## 6. Testing
- Fixture with known diffs → exact result.

# S34 — Architecture

**Date:** 2026-07-25

## 1. Context
Budget core.

## 2. Components
- `src/types/budget.ts`, `src/store/budgetStore.ts`.

## 3. Data Model
- `BudgetLineItem { accountCode, period, amount }`.
- `BudgetVersion { id, at, lineItems }`.

## 4. Interfaces
- `addBudget`, `updateBudget`, `snapshotVersion`, `restoreVersion`.

## 5. Integration
- Used by S35–S38, S39, S65.

## 6. Testing
- Version snapshot/restore unit test.

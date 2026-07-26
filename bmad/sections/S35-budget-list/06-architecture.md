# S35 — Architecture

**Date:** 2026-07-25

## 1. Context
Budget management UI.

## 2. Components
- `src/pages/budgets/BudgetListPage.tsx`, `budgetStore`.

## 3. Data Model
- List rows from store; status enum.

## 4. Interfaces
- `transitionStatus(id, to, reason?)`.

## 5. Integration
- Links to S36 (create), S37 (detail), S38 (approve).

## 6. Testing
- Workflow transition tests incl. guards.

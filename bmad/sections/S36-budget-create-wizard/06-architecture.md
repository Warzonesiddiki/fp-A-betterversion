# S36 — Architecture

**Date:** 2026-07-25

## 1. Context
Budget creation.

## 2. Components
- `src/pages/budgets/BudgetCreatePage.tsx`, store actions.

## 3. Data Model
- Wizard draft → `Budget`.

## 4. Interfaces
- `createBudget(draft)`.

## 5. Integration
- Uses S14 accounts; creates S34 budget.

## 6. Testing
- Wizard flow component test.

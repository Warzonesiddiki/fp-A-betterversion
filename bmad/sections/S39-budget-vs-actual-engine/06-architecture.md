# S39 — Architecture

**Date:** 2026-07-25

## 1. Context
Variance computation.

## 2. Components
- `src/engines/BudgetVsActualEngine.ts`.

## 3. Data Model
- `BVARow { accountCode, actual, budget, variance, favorable }`.

## 4. Interfaces
- `computeBVA(budget, actualGL, period)`.

## 5. Integration
- Used by S65, BVA report.

## 6. Testing
- Favorability tests (revenue vs cost).

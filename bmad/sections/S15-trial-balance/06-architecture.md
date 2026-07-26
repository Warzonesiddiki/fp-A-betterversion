# S15 — Architecture

**Date:** 2026-07-25

## 1. Context
Reporting from GL.

## 2. Components
- `src/pages/data/GLTrialBalancePage.tsx`, TB engine (`src/engines/`).

## 3. Data Model
- `TrialBalanceRow { accountCode, debit, credit, balance }`.

## 4. Interfaces
- `computeTrialBalance(entries, period) → { rows, totalDebit, totalCredit, balanced }`.

## 5. Integration
- Uses S12 store; feeds S56–S58.

## 6. Testing
- Balanced dataset → balanced; injected $X → off-by.

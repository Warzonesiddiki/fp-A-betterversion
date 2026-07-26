# S28 — Architecture

**Date:** 2026-07-25

## 1. Context
Statement computation.

## 2. Components
- `src/engines/{PnLEngine, BalanceSheetEngine, CashFlowEngine}.ts`.

## 3. Data Model
- `Statement { sections: LineItem[]; totals }`.

## 4. Interfaces
- `computePnL`, `computeBalanceSheet`, `computeCashFlow`.

## 5. Integration
- Consumed by S56–S58, S63.

## 6. Testing
- Tie-out tests (BS balances; CF↔BS).

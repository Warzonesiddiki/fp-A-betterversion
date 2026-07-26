# S28 — Brainstorming: Financial Statement Engines

**Date:** 2026-07-25
**Method:** First Principles · SCAMPER · Ideation Map

## 1. First Principles
- P&L, BS, CF are derived deterministically from GL + engines.

## 2. SCAMPER
- **Confirm:** statement engines likely exist (42+ reporting engines per README).
- **Add:** 3-statement linkage (CF reconciles to BS).
- **Modify:** ensure BS "balanced" check (S57).

## 3. Ideation
- `computePnL(gl, period)`, `computeBalanceSheet(...)`, `computeCashFlow(...)`.

## 4. Selected Directions
1. Define statement engines from GL; guarantee BS balances; CF ties to BS.
2. (Code exists; complete + test.)

## 5. Open Questions
- Direct vs indirect cash flow? (both.)

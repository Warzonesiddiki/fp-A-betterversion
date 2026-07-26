# S58 — Research

**Date:** 2026-07-25

## 1. Questions
- CF page status?

## 2. Findings
- `src/pages/reports/CashFlowPage.tsx` exists.
- Tasklist 2.3.2 (CF reconciles to BS) unchecked.

## 3. Decision
- Build CF with BS tie-out (S28 `computeCashFlow`).

## 4. Risks
- Tie-out drift from rounding.

## 5. Dependencies
- S28, S57.

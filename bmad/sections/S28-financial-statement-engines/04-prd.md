# S28 — PRD

**Date:** 2026-07-25

## 1. Overview
P&L / BS / CF computation engines.

## 2. FRs
- FR-1: `computePnL(gl, period)` → sections + margins + budget variance.
- FR-2: `computeBalanceSheet(gl, period)` → assets = liabilities + equity; `isBalanced`.
- FR-3: `computeCashFlow(gl, period, method)` → ties to BS cash.
- FR-4: 3-statement consistency check.

## 3. Acceptance
- Known dataset → balanced BS; CF ending cash = BS cash.

## 4. Out of Scope
- Export (→ S61/S62).

## 5. Dependencies
- S12, S27.

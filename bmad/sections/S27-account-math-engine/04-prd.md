# S27 — PRD

**Date:** 2026-07-25

## 1. Overview
Core account math engine.

## 2. FRs
- FR-1: `roundMoney(n, dp, mode)`.
- FR-2: `variance(actual, budget) → { amount, pct, favorable }` (favorable = good direction).
- FR-3: `toPercent`, `signOf` helpers.
- FR-4: Refactor `SafeMathParser` to use these.

## 3. Acceptance
- Variance sign correct for both revenue (higher good) and cost (lower good) contexts.

## 4. Out of Scope
- Display formatting (separate util).

## 5. Dependencies
- S02, S26.

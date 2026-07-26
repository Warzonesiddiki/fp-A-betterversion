# S27 — Brainstorming: Account Math Engine

**Date:** 2026-07-25
**Method:** First Principles · SCAMPER · Ideation Map

## 1. First Principles
- Money math must be exact; rounding explicit; variance signed.

## 2. SCAMPER
- **Add:** `roundMoney` (banker's/half-up), `variance(actual, budget)` → {amount, pct, favorable}, `pct` helpers.
- **Modify:** use Decimal (S02) for sums.

## 3. Ideation
- Foundational for every report (S56–S66).

## 4. Selected Directions
1. `AccountMathEngine`: rounding, variance, percentage, sign conventions.
2. (SafeMathParser exists; align + complete.)

## 5. Open Questions
- Rounding default: half-up to 2 dp? (configurable.)

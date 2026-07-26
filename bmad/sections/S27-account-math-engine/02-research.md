# S27 — Research

**Date:** 2026-07-25

## 1. Questions
- Math engine status?

## 2. Findings
- `SafeMathParser.ts` exists (had 451 args[N]! errors, partially fixed).
- No single rounding/variance helper confirmed.

## 3. Decision
- Create `AccountMathEngine` with rounding/variance/pct; refactor SafeMathParser to use it.

## 4. Risks
- Decimal migration cost (S02).

## 5. Dependencies
- S02, S26.

# S26 — Research

**Date:** 2026-07-25

## 1. Questions
- Engine layer status?

## 2. Findings
- `src/engines/` has 186 non-test engine files (incl. ForecastMethodEngine, SafeMathParser, MonteCarloEngine).
- `src/test/engineTestUtils.ts` provides `expectCloseTo`, `expectFinancialEqual`.
- FINPLAN_CURRENT_STATE noted SafeMathParser had 451 errors (args[N]!) — partially fixed.

## 3. Decision
- Govern conventions; complete/fix engines in S27–S33; reuse harness.

## 4. Risks
- Inconsistent signatures; refactor gradually.

## 5. Dependencies
- S02 (Decimal), S93 (tests).

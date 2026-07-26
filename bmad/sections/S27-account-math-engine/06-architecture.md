# S27 — Architecture

**Date:** 2026-07-25

## 1. Context
Math core.

## 2. Components
- `src/engines/AccountMathEngine.ts`, refactor `SafeMathParser`.

## 3. Data Model
- `Variance { amount: number; pct: number; favorable: boolean }`.

## 4. Interfaces
- `variance(actual, budget, higherIsBetter)`.

## 5. Integration
- Used by S28, S39, S65.

## 6. Testing
- Rounding/variance unit tests incl. edge cases.

# S58 — Architecture

**Date:** 2026-07-25

## 1. Context
CF UI.

## 2. Components
- `src/pages/reports/CashFlowPage.tsx`, S28.

## 3. Data Model
- `CFView { operating, investing, financing, endingCash }`.

## 4. Interfaces
- `computeCashFlow` (S28).

## 5. Integration
- Uses S28; ties to S57.

## 6. Testing
- Tie-out test.

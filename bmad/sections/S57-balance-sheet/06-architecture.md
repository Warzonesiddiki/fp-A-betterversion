# S57 — Architecture

**Date:** 2026-07-25

## 1. Context
BS UI.

## 2. Components
- `src/pages/reports/BalanceSheetPage.tsx`, S28.

## 3. Data Model
- `BSView { assets, liabilities, equity, balanced }`.

## 4. Interfaces
- `computeBalanceSheet` (S28).

## 5. Integration
- Uses S28; exports S61.

## 6. Testing
- Balance check test.

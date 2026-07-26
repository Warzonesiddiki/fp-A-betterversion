# S56 — Architecture

**Date:** 2026-07-25

## 1. Context
P&L UI.

## 2. Components
- `src/pages/reports/ProfitLossPage.tsx`, S28 engine.

## 3. Data Model
- `PnLView { sections, margins, variance }`.

## 4. Interfaces
- `computePnL` (S28) + `computeBVA` (S39).

## 5. Integration
- Uses S28/S39; exports S61/S62.

## 6. Testing
- P&L tie + variance component test.

# S48 — Architecture

**Date:** 2026-07-25

## 1. Context
Driver UI.

## 2. Components
- `src/pages/forecasts/DriverPlanningPage.tsx`, S43 engine.

## 3. Data Model
- UI state over S43 `DriverTree`.

## 4. Interfaces
- `evaluateTree` (S43) on change.

## 5. Integration
- Uses S43/S44; feeds S45/S46.

## 6. Testing
- Edit → recompute component test.

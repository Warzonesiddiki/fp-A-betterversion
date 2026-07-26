# S46 — Architecture

**Date:** 2026-07-25

## 1. Context
What-if UI.

## 2. Components
- `src/pages/forecasts/WhatIfPage.tsx`, recompute util.

## 3. Data Model
- `WhatIfState { overrides, base, computed }`.

## 4. Interfaces
- `applyOverride(state, driver, value)`.

## 5. Integration
- Uses S43/S32; saves via S51.

## 6. Testing
- Override recompute + save-as-scenario.

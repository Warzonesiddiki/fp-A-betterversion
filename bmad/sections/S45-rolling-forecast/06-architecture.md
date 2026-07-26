# S45 — Architecture

**Date:** 2026-07-25

## 1. Context
Rolling forecasts.

## 2. Components
- `src/pages/forecasts/RollingForecastPage.tsx`, engine.

## 3. Data Model
- `RollingPlan { history, forecast[], horizon }`.

## 4. Interfaces
- `rollingForecast`, `shiftWindow`.

## 5. Integration
- Uses S32/S44; triggers S86.

## 6. Testing
- Shift + lock-to-actual tests.

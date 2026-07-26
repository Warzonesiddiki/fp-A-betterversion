# S45 — Brainstorming: Rolling Forecast

**Date:** 2026-07-25
**Method:** First Principles · SCAMPER · Ideation Map

## 1. First Principles
- Forecasts should roll forward as time passes.

## 2. SCAMPER
- **Add:** rolling window (e.g., 12-month forward); auto-extend as periods close.
- **Modify:** uses S32/S44.

## 3. Ideation
- `rollingForecast(history, method, horizon)` → future periods.

## 4. Selected Directions
1. Rolling forecast engine + UI.
2. (Tasklist 2.2.1 rolling forecast; `RollingForecastPage` exists.)

## 5. Open Questions
- Re-forecast trigger? (period close → S86.)

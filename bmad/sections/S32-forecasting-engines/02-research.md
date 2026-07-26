# S32 — Research

**Date:** 2026-07-25

## 1. Questions
- Forecasting engine status?

## 2. Findings
- README: 12+ forecasting engines (trending, regression, seasonality).
- `ForecastBuilderPage`, `RollingForecastPage` exist (S49/S45).

## 3. Decision
- Implement trend/regression/seasonality + auto-fill; add tests.

## 4. Risks
- Overfit regression on sparse data.

## 5. Dependencies
- S26, S43–S49.

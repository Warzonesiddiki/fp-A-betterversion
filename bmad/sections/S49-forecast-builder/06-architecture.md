# S49 — Architecture

**Date:** 2026-07-25

## 1. Context
Forecast composition.

## 2. Components
- `src/pages/forecasts/*`, `forecastStore`.

## 3. Data Model
- `Forecast { id, drivers[], method, seasonality, horizon }`.

## 4. Interfaces
- `createForecast`, `computeForecast`.

## 5. Integration
- Uses S43–S47; feeds S50/S65.

## 6. Testing
- Build + compute test.

# S65 — Architecture

**Date:** 2026-07-25

## 1. Context
Variance analytics.

## 2. Components
- `src/pages/variance/*`, waterfall engine.

## 3. Data Model
- `VarianceView { waterfall[], rvm }`.

## 4. Interfaces
- `computeWaterfall`, `decomposeRVM`.

## 5. Integration
- Uses S39; feeds S66.

## 6. Testing
- Waterfall + RVM sum tests.

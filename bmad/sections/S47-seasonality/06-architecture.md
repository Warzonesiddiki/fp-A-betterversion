# S47 — Architecture

**Date:** 2026-07-25

## 1. Context
Seasonal forecasting.

## 2. Components
- `src/engines/SeasonalityEngine.ts`.

## 3. Data Model
- `SeasonalityFactor[12]`.

## 4. Interfaces
- `applySeasonality(base, factors)`.

## 5. Integration
- Uses S32; feeds S49.

## 6. Testing
- Normalization + application tests.

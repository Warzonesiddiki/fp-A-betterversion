# S55 — Architecture

**Date:** 2026-07-25

## 1. Context
Scenario aggregation.

## 2. Components
- `src/engines/ScenarioAggregationEngine.ts`.

## 3. Data Model
- `WeightedResult { expected, percentiles }`.

## 4. Interfaces
- `expectedOutcome`, `blendWithMonteCarlo`.

## 5. Integration
- Uses S50/S53; rendered in S52.

## 6. Testing
- Weighted sum + normalization tests.

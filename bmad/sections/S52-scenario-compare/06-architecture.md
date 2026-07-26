# S52 — Architecture

**Date:** 2026-07-25

## 1. Context
Scenario analysis.

## 2. Components
- `src/pages/scenarios/ScenarioComparisonPage.tsx`, tornado engine.

## 3. Data Model
- `Comparison { scenarios[], metric }`.

## 4. Interfaces
- `compareScenarios`, `tornado(scenarios, metric)`.

## 5. Integration
- Uses S50/S51; feeds S55.

## 6. Testing
- Compare + tornado correctness.

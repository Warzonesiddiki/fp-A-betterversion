# S50 — Architecture

**Date:** 2026-07-25

## 1. Context
Scenario core.

## 2. Components
- `src/types/scenario.ts`, `src/store/scenarioStore.ts`.

## 3. Data Model
- `ScenarioOverride { target, value }`.

## 4. Interfaces
- `createScenario`, `applyOverrides(base, overrides)`.

## 5. Integration
- Uses S49; feeds S51–S55.

## 6. Testing
- Override application + probability validation.

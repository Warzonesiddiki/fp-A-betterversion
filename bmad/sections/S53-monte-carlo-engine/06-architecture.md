# S53 — Architecture

**Date:** 2026-07-25

## 1. Context
Uncertainty modeling.

## 2. Components
- `src/engines/MonteCarloEngine.ts`.

## 3. Data Model
- `Distribution`, `Sample[]`.

## 4. Interfaces
- `monteCarlo(model, iterations, seed)`.

## 5. Integration
- Called by S54 worker; UI in S52/S55.

## 6. Testing
- Reproducibility + percentile tests.

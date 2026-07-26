# S31 — Architecture

**Date:** 2026-07-25

## 1. Context
SaaS KPIs.

## 2. Components
- `src/engines/SaaSMetricsEngine.ts`.

## 3. Data Model
- `Subscription`, `CohortRow`.

## 4. Interfaces
- `computeARR`, `computeNRR`, `computeChurn`, `cohortRetention`.

## 5. Integration
- Used by S77 vertical.

## 6. Testing
- Formula tests vs known examples.

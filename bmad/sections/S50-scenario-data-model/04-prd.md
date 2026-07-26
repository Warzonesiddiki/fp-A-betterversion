# S50 — PRD

**Date:** 2026-07-25

## 1. Overview
Scenario data model.

## 2. FRs
- FR-1: `Scenario { id, baseForecastId, overrides[], probability }`.
- FR-2: Override = {target, value} on driver/account.
- FR-3: Probability 0..1; validate sum across scenarios (warn if ≠1).

## 3. Acceptance
- Scenario stores overrides + probability; sum warning works.

## 4. Out of Scope
- UI (→ S51).

## 5. Dependencies
- S49, S43.

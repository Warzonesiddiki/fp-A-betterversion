# S43 — Research

**Date:** 2026-07-25

## 1. Questions
- Driver planning status?

## 2. Findings
- `src/pages/forecasts/DriverPlanningPage.tsx` exists (lazy).
- Tasklist 2.2.1 (driver tree) unchecked.

## 3. Decision
- Define driver tree model + formulas + affected accounts; detect cycles.

## 4. Risks
- Formula evaluation safety (no eval; use S32/parser).

## 5. Dependencies
- S32, S44.

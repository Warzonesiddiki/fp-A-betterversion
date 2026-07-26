# S36 — Research

**Date:** 2026-07-25

## 1. Questions
- Create wizard status?

## 2. Findings
- `src/pages/budgets/BudgetCreatePage.tsx` exists.
- Tasklist 2.1.2 unchecked.

## 3. Decision
- Implement 4-step wizard; group accounts by type; review + save.

## 4. Risks
- Large account list → virtualize selection.

## 5. Dependencies
- S34, S14.

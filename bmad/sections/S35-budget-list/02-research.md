# S35 — Research

**Date:** 2026-07-25

## 1. Questions
- Budget list status?

## 2. Findings
- `src/pages/budgets/BudgetListPage.tsx` exists (lazy).
- Tasklist 2.1.1 (CRUD + status workflow) unchecked.

## 3. Decision
- Implement full CRUD + status workflow + filters + guards.

## 4. Risks
- Status transitions must be guarded (locked immutable).

## 5. Dependencies
- S34.

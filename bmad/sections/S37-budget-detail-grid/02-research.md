# S37 — Research

**Date:** 2026-07-25

## 1. Questions
- Detail grid status?

## 2. Findings
- `src/pages/budgets/BudgetDetailPage.tsx` exists; `BudgetGrid.tsx` component exists (had TS errors in ts-errors.txt).
- AG Grid Community v35 is a dependency.
- Tasklist 2.1.3 unchecked.

## 3. Decision
- Build AG Grid editor: keyboard, undo/redo, versions, comments; fix TS.

## 4. Risks
- AG Grid v35 API specifics; undo stack correctness.

## 5. Dependencies
- S34, S27.

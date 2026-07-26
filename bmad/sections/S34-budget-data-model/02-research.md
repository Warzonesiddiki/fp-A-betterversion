# S34 — Research

**Date:** 2026-07-25

## 1. Questions
- Budget store status?

## 2. Findings
- `src/store/budgetStore.ts` exists; `BudgetListPage`, `BudgetCreatePage`, `BudgetDetailPage` exist.
- Tasklist 2.1.1–2.1.4 mostly unchecked → build/verify.

## 3. Decision
- Define canonical budget types; ensure store supports status + versions + line items.

## 4. Risks
- Existing page/store mismatch.

## 5. Dependencies
- S12, S27.

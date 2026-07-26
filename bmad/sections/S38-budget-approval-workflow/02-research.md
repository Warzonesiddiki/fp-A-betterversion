# S38 — Research

**Date:** 2026-07-25

## 1. Questions
- Approval workflow status?

## 2. Findings
- `src/pages/budgets/BudgetApproval.tsx` exists (lazy).
- Tasklist 2.1.4 unchecked.

## 3. Decision
- Implement submit/approve/reject + auto-lock + admin unlock + reason.

## 4. Risks
- Lock must block S37 edits.

## 5. Dependencies
- S34, S35, S83, S87.

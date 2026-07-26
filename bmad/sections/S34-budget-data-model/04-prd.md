# S34 — PRD

**Date:** 2026-07-25

## 1. Overview
Budget data model + store.

## 2. FRs
- FR-1: `Budget` type: id, name, year, periodType, departments, currency, status, lineItems, versions.
- FR-2: `BudgetStatus = 'draft' | 'in_review' | 'approved' | 'locked'`.
- FR-3: `budgetStore`: CRUD + `snapshotVersion` + `restoreVersion`.
- FR-4: No `any`; debits/credits via S27.

## 3. Acceptance
- Create budget; snapshot; restore earlier version.

## 4. Out of Scope
- Approval UI (→ S38).

## 5. Dependencies
- S12, S27.

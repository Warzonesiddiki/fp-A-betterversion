# S34 — Brainstorming: Budget Data Model

**Date:** 2026-07-25
**Method:** First Principles · SCAMPER · Ideation Map

## 1. First Principles
- A budget is versioned, period-scoped, account-keyed financial plan.

## 2. SCAMPER
- **Confirm:** `budgetStore` exists (one of 40 stores).
- **Add:** status enum (Draft/InReview/Approved/Locked), versions, line items.
- **Modify:** typing (no `any`).

## 3. Ideation
- `Budget { id, name, year, periodType, status, versions[] }`.

## 4. Selected Directions
1. Define budget types + store with versioning + status.
2. (Tasklist 2.1.1 partial.)

## 5. Open Questions
- Versioning: copy-on-edit or explicit snapshot? (explicit snapshot.)

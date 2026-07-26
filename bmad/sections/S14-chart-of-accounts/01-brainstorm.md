# S14 — Brainstorming: Chart of Accounts

**Date:** 2026-07-25
**Method:** First Principles · SCAMPER · Ideation Map

## 1. First Principles
- CoA is the taxonomy of every account; must support hierarchy + safe deletion.

## 2. SCAMPER
- **Confirm:** CRUD + parent/child hierarchy.
- **Add:** CSV import/export; soft-delete guard if account has GL usage.
- **Modify:** validation of type/normal-balance.

## 3. Ideation
- Use `glStore.accounts`; guard delete via GL usage check.

## 4. Selected Directions
1. `ChartOfAccountsPage`: CRUD + hierarchy + CSV + soft-delete guard.
2. (COMPLETION_TASKLIST 1.1.3 claims done — verify & harden.)

## 5. Open Questions
- Editing an account code cascades to entries? (decision: code immutable; use rename.)

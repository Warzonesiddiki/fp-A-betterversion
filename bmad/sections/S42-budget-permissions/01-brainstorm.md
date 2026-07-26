# S42 — Brainstorming: Budget Permissions

**Date:** 2026-07-25
**Method:** First Principles · SCAMPER · Ideation Map

## 1. First Principles
- Users see/edit only budgets they're allowed to.

## 2. SCAMPER
- **Add:** budget-level RBAC scoping (viewer/editor/admin).
- **Modify:** integrate with S87 roles.

## 3. Ideation
- `can(user, action, budget)` guard.

## 4. Selected Directions
1. Budget-level permission scoping via S87.
2. (New; depends on S87.)

## 5. Open Questions
- Per-department scoping? (yes.)

## 6. Integration note
- This section is thin; mostly wiring to S87 RBAC.

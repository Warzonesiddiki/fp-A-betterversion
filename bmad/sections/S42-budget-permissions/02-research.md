# S42 — Research

**Date:** 2026-07-25

## 1. Questions
- Budget-level permissions?

## 2. Findings
- No explicit budget-level RBAC confirmed; S87 defines roles.
- `UserManagementPage` exists.

## 3. Decision
- Scope budgets by role + department via S87 guard.

## 4. Risks
- Over-permissioning.

## 5. Dependencies
- S34, S87.

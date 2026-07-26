# S38 — Architecture

**Date:** 2026-07-25

## 1. Context
Budget governance.

## 2. Components
- `src/pages/budgets/BudgetApproval.tsx`, store transitions.

## 3. Data Model
- `Approval { by, at, decision, reason? }`.

## 4. Interfaces
- `submit`, `approve(id)`, `reject(id, reason)`, `setLock(id, bool)`.

## 5. Integration
- Guards S37 editing; audits S83.

## 6. Testing
- Transition + lock + reason-required tests.

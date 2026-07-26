# S42 — Architecture

**Date:** 2026-07-25

## 1. Context
Budget governance.

## 2. Components
- permission guard util, list/detail wiring.

## 3. Data Model
- `BudgetScope { userIds, deptIds, level }`.

## 4. Interfaces
- `can(user, action, budget)`.

## 5. Integration
- Uses S87 roles.

## 6. Testing
- Guard allows/denies correctly.

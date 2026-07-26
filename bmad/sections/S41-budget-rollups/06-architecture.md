# S41 — Architecture

**Date:** 2026-07-25

## 1. Context
Budget aggregation.

## 2. Components
- roll-up selector in list/detail.

## 3. Data Model
- `RollupView { dept, total }[]`.

## 4. Interfaces
- `rollUp(budget, by='dept')`.

## 5. Integration
- Uses S34 budget.

## 6. Testing
- Roll-up equals flat total.

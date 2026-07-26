# S37 — Architecture

**Date:** 2026-07-25

## 1. Context
Budget editing.

## 2. Components
- `src/pages/budgets/BudgetDetailPage.tsx`, `BudgetGrid.tsx`, history util.

## 3. Data Model
- `HistoryStack<BudgetLineItem[][]>`.

## 4. Interfaces
- `editCell`, `undo`, `redo`, `snapshot`, `restore`, `addComment`.

## 5. Integration
- Uses S34 store; audits via S83.

## 6. Testing
- Undo/redo + version restore tests.

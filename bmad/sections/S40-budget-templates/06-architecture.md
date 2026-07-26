# S40 — Architecture

**Date:** 2026-07-25

## 1. Context
Budget accelerators.

## 2. Components
- `src/templates/budget/*`, apply logic in S36.

## 3. Data Model
- `BudgetTemplate { id, name, sector, lineItems }`.

## 4. Interfaces
- `applyTemplate(template) → DraftBudget`.

## 5. Integration
- Feeds S36 wizard.

## 6. Testing
- Apply produces valid draft.

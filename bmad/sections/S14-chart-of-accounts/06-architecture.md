# S14 — Architecture

**Date:** 2026-07-25

## 1. Context
CoA management UI.

## 2. Components
- `src/pages/data/ChartOfAccountsPage.tsx`, `glStore.accounts`, CSV utils.

## 3. Data Model
- `Account` (from S12) + `deactivated: boolean`.

## 4. Interfaces
- `deactivateAccount(code)` → guard via GL usage count.

## 5. Integration
- Feeds statements (S56–S58), reports.

## 6. Testing
- Guard blocks deactivate when GL references account; CSV import/export round-trip.

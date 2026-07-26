# S12 — Architecture

**Date:** 2026-07-25

## 1. Context
Core data layer.

## 2. Components
- `src/types/gl.ts`, `src/store/glStore.ts`, `src/services/mockData/gl.ts`.

## 3. Data Model
- `GLEntry { id, date, accountCode, debit, credit, currency, memo }`.
- `Account { code, name, type, normalBalance, parentCode? }`.

## 4. Interfaces
- `importGLData(rows)`, `validateEntries(rows): Issue[]`.

## 5. Integration
- Used by S13 (upload), S15 (trial balance), S16 (journals), S56–S58 (statements).

## 6. Testing
- Unit: validation rejects unbalanced; import populates; undo.

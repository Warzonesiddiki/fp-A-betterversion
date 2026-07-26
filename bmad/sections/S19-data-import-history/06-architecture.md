# S19 — Architecture

**Date:** 2026-07-25

## 1. Context
Import auditability.

## 2. Components
- `src/pages/data/ImportJobHistory.tsx`, `glStore.importHistory`, undo action.

## 3. Data Model
- `ImportJob { id, fileName, rowCount, at, entryIds: string[] }`.

## 4. Interfaces
- `undoImport(jobId)`.

## 5. Integration
- Written by S13; audited by S83.

## 6. Testing
- Undo removes exactly recorded ids.

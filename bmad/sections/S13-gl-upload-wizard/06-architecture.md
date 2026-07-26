# S13 — Architecture

**Date:** 2026-07-25

## 1. Context
Import UX on GL model.

## 2. Components
- `src/pages/data/GLUploadPage.tsx`, `glStore.importGLData`, parser utils.

## 3. Data Model
- Parsed rows → `GLEntry[]` after mapping.

## 4. Interfaces
- `parseFile(file) → RawRow[]`; `mapRows(rows, mapping) → GLEntry[]`.

## 5. Integration
- Calls S12 store; writes import history (→ S19).

## 6. Testing
- Component test: upload fixture CSV → 100 entries; undo.

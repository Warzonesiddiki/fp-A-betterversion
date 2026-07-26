# S13 — Research

**Date:** 2026-07-25

## 1. Questions
- Existing upload UI? Parsing libs?

## 2. Findings
- `src/pages/data/GLUploadPage.tsx` exists (lazy in App.tsx).
- `exceljs` is a dependency (XLSX). `papaparse`? not listed; use ExcelJS for both or a CSV parser.
- COMPLETION_TASKLIST 1.1.2 claims full wizard done — verify on this branch.

## 3. Decision
- Implement/verify 5-step wizard using `glStore.importGLData`; ExcelJS for .xlsx, native for .csv.

## 4. Risks
- Large files → chunked parse + worker (→ S91).

## 5. Dependencies
- S12 (model), S21 (persistence).

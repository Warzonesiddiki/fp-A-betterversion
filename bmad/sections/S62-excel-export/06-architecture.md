# S62 — Architecture

**Date:** 2026-07-25

## 1. Context
Export.

## 2. Components
- `src/services/export/excel.ts`, ExcelJS.

## 3. Data Model
- `ExcelOptions`.

## 4. Interfaces
- `exportExcel(view, options)`.

## 5. Integration
- Called by reports/GL.

## 6. Testing
- Export produces valid workbook.

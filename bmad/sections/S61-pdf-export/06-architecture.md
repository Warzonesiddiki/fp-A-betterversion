# S61 — Architecture

**Date:** 2026-07-25

## 1. Context
Export.

## 2. Components
- `src/services/export/pdf.ts`, jsPDF wrapper.

## 3. Data Model
- `PDFOptions { title, header, footer, pageNumbers }`.

## 4. Interfaces
- `exportPDF(view, options)`.

## 5. Integration
- Called by S56–S60, S66.

## 6. Testing
- Export produces valid PDF (smoke + content check).

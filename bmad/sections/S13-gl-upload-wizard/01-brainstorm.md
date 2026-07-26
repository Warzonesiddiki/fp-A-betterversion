# S13 — Brainstorming: GL Upload Wizard

**Date:** 2026-07-25
**Method:** First Principles · SCAMPER · Ideation Map

## 1. First Principles
- Importing GL must be **safe, previewable, undoable** — never silently corrupt data.

## 2. SCAMPER
- **Add:** 5-step wizard (file → map → preview → validate → confirm).
- **Modify:** live per-row validation + duplicate detection.
- **Combine:** progress indicator + "Undo Last Import".

## 3. Ideation
- Accept .csv/.xlsx ≤50MB; intelligent auto-mapping by header.

## 4. Selected Directions
1. Build `GLUploadPage` 5-step wizard on `glStore.importGLData`.
2. CSV + XLSX; auto-map; preview table; duplicate detection; undo.

## 5. Open Questions
- XLSX parsing lib? (ExcelJS already a dep.)

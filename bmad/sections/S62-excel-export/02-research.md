# S62 — Research

**Date:** 2026-07-25

## 1. Questions
- Excel export status?

## 2. Findings
- `exceljs` is a dependency. Export service exists per README.
- Tasklist mentions Excel export.

## 3. Decision
- Build `exportExcel` with formatting + formulas + raw sheet.

## 4. Risks
- Large sheets performance → S91.

## 5. Dependencies
- S56–S60, S12.

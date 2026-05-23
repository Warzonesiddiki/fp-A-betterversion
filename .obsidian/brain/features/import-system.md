---
date: 2026-05-19
type: feature-doc
project: FinPlan Pro
tags: [finplan-pro, import, excel, csv, xlsx]
status: complete
---

# Import System

## Overview
Two-engine architecture: ImportEngine (574 lines) for CSV/JSON + ExcelImportEngine (412 lines) for xlsx/xls.

## ImportEngine (CSV/JSON)

### Features
- Auto-delimiter detection (comma, tab, semicolon, pipe, space)
- Encoding detection (UTF-8, UTF-16 LE/BE BOM)
- Quoted field handling (escaped quotes)
- Row count limits (configurable maxRows)
- Numeric/date column validation
- Import snapshots for rollback
- Progress tracking (status, percent, message)

### Methods
- `importCSV(file, options)` — CSV with auto-detection
- `importJSON(file, options)` — JSON array or object
- `importFile(file, options)` — Auto-detect format
- `rollback(snapshotId)` — Undo import
- `getSnapshots()` — Import history

## ExcelImportEngine (xlsx)

### Features
- Multi-sheet support
- Auto-column mapping with confidence scores
- Date pattern detection (YYYY-MM-DD, MM/DD/YYYY, Excel serial)
- Numeric parsing (comma-separated, negative)
- Keyword-based column detection (10 field types)
- Conflict resolution (unique fields: date, accountCode, accountName)
- Data validation (balanced debits/credits, missing fields)
- Preview (first N rows)

### Column Detection Keywords
| Field | Keywords |
|-------|----------|
| date | date, posting date, transaction date, period |
| accountCode | account, gl account, cost center, department code |
| accountName | account name, name, description |
| debit | debit, dr, debit amount |
| credit | credit, cr, credit amount |
| amount | amount, net amount, value, total |
| description | description, memo, narrative, details |
| reference | reference, document, invoice, voucher |
| department | department, cost center, business unit |
| entity | entity, company, subsidiary |

### Mapping Confidence
- 1.0 — Exact keyword match
- 0.7 — Partial keyword match
- 0.85 — Date pattern detected in 80%+ values
- 0.8 — Numeric pattern + keyword match

## Related
- [[migration]] wizard wraps this import system in a multi-step UI
- [[formula-engine]] formulas in imported spreadsheets are preserved
- [[plugin-system]] can add custom import format support

## UI Components
- `DataImportPage.tsx` (909 lines) — Full import pipeline
- `GLUploadPage.tsx` (176 lines) — GL-specific upload
- `ColumnMapper.tsx` (108 lines) — Manual column mapping
- `ImportPreview.tsx` (84 lines) — Preview before import

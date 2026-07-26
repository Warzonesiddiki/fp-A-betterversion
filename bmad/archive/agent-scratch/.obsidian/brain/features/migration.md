---
date: 2026-05-19
type: feature
project: FinPlan Pro
tags: [finplan-pro, migration, import, excel, data]
status: current
---

# Data Migration Wizard

## Files
- `src/components/migration/MigrationWizard.tsx` (453 lines)
- `src/pages/data/MigrationPage.tsx` (41 lines)

## Wizard Steps
1. **Select Source** — Excel, Planful, Adaptive, Anaplan, CSV
2. **Upload File** — drag & drop or file picker
3. **Column Mapping** — auto-detect + manual override
4. **Data Preview** — validation and preview table
5. **Import Confirmation** — summary with row/column counts
6. **Progress** — progress bar during import

## Features
- Auto-detect column mappings (GL accounts, dates, amounts, departments)
- Data type and range validation
- Preview first N rows before import
- Progress tracking during import
- Rollback support

## Integration
- Wired to [[import-system]] (ImportEngine for CSV/JSON, ExcelImportEngine for xlsx/xls)
- Uses ColumnMapper component for manual mapping
- Uses ImportPreview component for data preview
- [[formula-engine]] formulas in imported spreadsheets are preserved
- [[plugin-system]] can add custom import format support

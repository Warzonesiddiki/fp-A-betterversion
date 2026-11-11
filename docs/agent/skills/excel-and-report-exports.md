---
name: excel-and-report-exports
description: >
  Use when a report leaves the app (Excel, CSV, PDF, PPTX): the exported number
  must tie back to the screen, and the file must be safe to open.
group: product-ui
---

# Excel and report exports

**Use when** building or changing an export.

## Rules

1. **Tie-back**: totals, row counts and scope (entity, period, version) in the file
   equal what the screen shows. If they differ, the file says why.
2. **Neutralise formulas** in any cell that came from data (`=`, `+`, `-`, `@`).
3. **Exact numbers**: write minor-unit values with the intended decimals, never a
   float that Excel re-rounds.
4. **No hidden data**: no invisible sheets, no stale "last refreshed" claims.
5. **Scope the export** to the authorised entity; a full-table export is a
   permission bug.
6. **Exports are optional.** The in-app path must be sufficient (one-stop
   acceptance); a spreadsheet is interoperability, not a required step.
7. **Name the file** with scope and date so two exports are distinguishable.

## In this repo

- `npm run export:verify` checks CSV injection protection, entity scoping and safe
  PDF generation.
- Excel export is optional interoperability under DEC-035; the earlier DEC-018
  mandatory spreadsheet hand-off was superseded on that point. Keep the in-app
  correction lifecycle sufficient; do not require an Excel round-trip.
- A quarantine or partial-data notice belongs in the workbook header when the
  screen shows one.

## Red flags

- A "Summary" sheet whose total is computed in the export code.
- A CSV written with `String(value)` on a `Money` object.
- An export that includes columns the user cannot see on screen.

**Proves itself with:** `npm run export:verify` plus a tie-back test.
**Source:** original, from DEC-003/015/018 and the export gate.

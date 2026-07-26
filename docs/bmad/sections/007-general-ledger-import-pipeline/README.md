# Section 007 — General Ledger Import Pipeline

**Status:** COMPLETE: 100% READY

## Objective

Harden GL CSV import parsing so real accounting exports with BOMs, quoted commas, escaped quotes, embedded newlines, and empty rows can enter the GL import pipeline reliably.

## Implementation Evidence

- Added `src/utils/csv.ts`.
- Added `src/utils/csv.test.ts`.
- Updated `src/pages/data/GLUploadPage.tsx` to use `parseCSV()` and `hasDuplicateHeaders()`.

## Validation

- `src/utils/csv.test.ts`: PASS.
- `src/pages/data/GLUploadPage.test.tsx`: PASS.
- `src/store/glStore.smoke.test.ts`: PASS.
- TypeScript: PASS.
- ESLint zero warnings: PASS.
- Build: PASS.
- Repo hygiene: PASS.

## Follow-up

Section 008 will roll the shared parser into remaining CSV paths such as Chart of Accounts, reconciliation, and migration utilities.

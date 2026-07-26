# S13 — PRD

**Date:** 2026-07-25

## 1. Overview
5-step GL upload wizard.

## 2. FRs
- FR-1: Step 1 file pick (.csv/.xlsx ≤50MB).
- FR-2: Step 2 auto-mapping + manual override of columns→GL fields.
- FR-3: Step 3 live preview table with per-row validation + duplicate detection.
- FR-4: Step 4 progress indicator.
- FR-5: Step 5 confirm → `importGLData`; "Undo Last Import" button.

## 3. Acceptance
- 100-row CSV → 100 entries; undo removes exactly those.

## 4. Out of Scope
- Scheduled imports.

## 5. Dependencies
- S12.

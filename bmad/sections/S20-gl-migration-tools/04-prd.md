# S20 — PRD

**Date:** 2026-07-25

## 1. Overview
GL migration with source presets + CoA mapping.

## 2. FRs
- FR-1: Source presets (QuickBooks/Xero/Generic CSV) with field maps.
- FR-2: CoA mapping UI (legacy account → FinPlan account).
- FR-3: Pre-commit validation (reuse S12 `validateEntries`).
- FR-4: Commit via `importGLData`.

## 3. Acceptance
- Preset import yields validated entries in GL.

## 4. Out of Scope
- Live connectors.

## 5. Dependencies
- S12, S13, S14.

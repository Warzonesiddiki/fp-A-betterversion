# S19 — PRD

**Date:** 2026-07-25

## 1. Overview
Import job history with undo.

## 2. FRs
- FR-1: `glStore.importHistory` records {id, fileName, rowCount, timestamp, entryIds}.
- FR-2: `ImportJobHistory` page lists jobs.
- FR-3: "Undo" removes only the recorded entryIds; logs to audit (→ S83).

## 3. Acceptance
- Undo of a 100-row import removes exactly those 100 entries.

## 4. Out of Scope
- Edited-after-import recovery.

## 5. Dependencies
- S12, S13, S83.

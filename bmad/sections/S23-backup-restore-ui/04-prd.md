# S23 — PRD

**Date:** 2026-07-25

## 1. Overview
Global backup/restore UI.

## 2. FRs
- FR-1: Export all stores to a single JSON (via masterStorage snapshot).
- FR-2: Import JSON → validate schema/version → load all stores transactionally.
- FR-3: Accessible from Settings + top toolbar.
- FR-4: Optional passphrase encryption (→ S95).

## 3. Acceptance
- Export → fresh env → import → identical state.

## 4. Out of Scope
- Scheduled/cloud backups.

## 5. Dependencies
- S21, S95.

# S22 — PRD

**Date:** 2026-07-25

## 1. Overview
IndexedDB→SQLite migration on desktop.

## 2. FRs
- FR-1: On first Tauri launch, detect empty SQLite + populated IndexedDB → migrate.
- FR-2: Idempotent (skip if already migrated).
- FR-3: Run `migrations/*.sql` for schema version.
- FR-4: Verify data present after restart.

## 3. Acceptance
- Web data appears in desktop SQLite; restart preserves it.

## 4. Out of Scope
- Bidirectional sync.

## 5. Dependencies
- S21, S97.

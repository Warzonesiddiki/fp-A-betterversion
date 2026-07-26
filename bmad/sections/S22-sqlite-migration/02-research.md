# S22 — Research

**Date:** 2026-07-25

## 1. Questions
- Migration helper status?

## 2. Findings
- `src-tauri/migrations/001_initial_schema.sql` (30+ tables), `002_cube_schema.sql` exist.
- `masterStorage` has `migrateFromIndexedDB()` per tasklist 1.2.1.
- Tauri SQLite plugin configured.

## 3. Decision
- Wire migration on first desktop launch; idempotent; verify round-trip.

## 4. Risks
- Schema drift between idb shape and SQL tables.

## 5. Dependencies
- S21, S97.

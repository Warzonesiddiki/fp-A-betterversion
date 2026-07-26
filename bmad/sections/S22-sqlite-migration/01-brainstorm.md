# S22 — Brainstorming: SQLite Migration

**Date:** 2026-07-25
**Method:** First Principles · SCAMPER · Ideation Map

## 1. First Principles
- Desktop users get robust local SQL; migration from web IndexedDB must be lossless.

## 2. SCAMPER
- **Add:** `migrateFromIndexedDB()` helper (exists per tasklist); run once on first desktop launch.
- **Modify:** schema version tracking.

## 3. Ideation
- On Tauri launch: if SQLite empty + IndexedDB has data → migrate.

## 4. Selected Directions
1. Implement + verify IndexedDB→SQLite migration.
2. (Tasklist 1.2.2 partial.)

## 5. Open Questions
- Conflict if both have data? (SQLite wins; idempotent.)

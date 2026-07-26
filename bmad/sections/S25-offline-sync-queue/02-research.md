# S25 — Research

**Date:** 2026-07-25

## 1. Questions
- Do we need sync now?

## 2. Findings
- App is local-first (IndexedDB/SQLite); no backend required (PLAN.md "zero cloud").
- `server/` Express exists but is optional.
- Sync only matters with cloud → defer.

## 3. Decision
- Build a local change-log abstraction (enables undo/audit + future sync) but no network sync yet.

## 4. Risks
- Over-engineering if cloud never ships.

## 5. Dependencies
- S21, S83 (audit).

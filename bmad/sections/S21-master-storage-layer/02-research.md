# S21 — Research

**Date:** 2026-07-25

## 1. Questions
- masterStorage status?

## 2. Findings
- `src/utils/masterStorage.ts` exists; referenced by stores.
- Tasklist 1.2.1 claims `masterStorage` + `indexedDBStorage` with migrate helper done.
- Tauri SQLite path (`tauriSqlStorage.ts`) referenced.

## 3. Decision
- Verify + harden; add quota/fallback; ensure all stores route through it.

## 4. Risks
- Some stores may bypass persistence.

## 5. Dependencies
- S05 (env mode), S22.

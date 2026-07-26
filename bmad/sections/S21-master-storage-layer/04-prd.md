# S21 — PRD

**Date:** 2026-07-25

## 1. Overview
Harden the master storage layer.

## 2. FRs
- FR-1: `masterStorage` supports get/set/remove with typed values.
- FR-2: IndexedDB backend (web) + SQLite backend (Tauri) selected by env (S05).
- FR-3: Quota-exceeded handling + fallback to in-memory with warning.
- FR-4: Every Zustand store uses `storage: masterStorage`.

## 3. Acceptance
- Reload preserves state in both web + desktop.

## 4. Out of Scope
- Encryption (→ S95).

## 5. Dependencies
- S05, S22.

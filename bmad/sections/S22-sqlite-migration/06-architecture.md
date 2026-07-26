# S22 — Architecture

**Date:** 2026-07-25

## 1. Context
Desktop persistence.

## 2. Components
- `masterStorage.migrateFromIndexedDB`, `src-tauri/migrations/*.sql`, `tauriSqlStorage`.

## 3. Data Model
- SQL tables mirror store state.

## 4. Interfaces
- `migrateIfNeeded()`.

## 5. Integration
- Called at desktop startup (S97).

## 6. Testing
- Simulate idb→sqlite migration; assert equality.

# S21 — Architecture

**Date:** 2026-07-25

## 1. Context
Persistence backbone.

## 2. Components
- `src/utils/masterStorage.ts`, `tauriSqlStorage.ts`, `indexedDBStorage`.

## 3. Data Model
- `StorageBackend = 'idb' | 'sqlite'`.

## 4. Interfaces
- `masterStorage.getItem/setItem/removeItem`.

## 5. Integration
- Used by all 40 stores.

## 6. Testing
- Unit: set/get round-trip in idb + sqlite mocks.

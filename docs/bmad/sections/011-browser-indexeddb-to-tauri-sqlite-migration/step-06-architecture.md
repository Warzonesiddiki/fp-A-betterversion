# Step 06 — Architecture: Browser IndexedDB to Tauri SQLite Migration

**Section:** 011  
**Date:** 2026-07-26

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  (Zustand stores, BackupRestorePage, useFirstRun, etc.)     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  masterStorage (router)                      │
│  - getItem / setItem / removeItem                            │
│  - migrateFromIndexedDB()  ← NEW PUBLIC API                  │
│  - delegates to chunked wrapper                              │
└───────────────┬───────────────────────────────┬──────────────┘
                │                               │
        ┌───────▼────────┐               ┌──────▼────────┐
        │ sqlJsStorage   │               │ tauriSqlStorage│
        │ (browser)      │               │ (desktop)      │
        └───────┬────────┘               └──────┬─────────┘
                │                               │
                ▼                               ▼
        localStorage blob               sqlite:finplan.db
        (via sql.js)                    (via plugin-sql)
```

**New Module:**
```
src/utils/migration/
├── legacyStorageMigration.ts
└── legacyStorageMigration.test.ts
```

## 2. Component Responsibilities

### 2.1 legacyStorageMigration.ts (New)
- `detectLegacyBrowserData()`
- `performLegacyToTauriMigration()`
- `getCurrentStorageBackend()`
- `hasCompletedMigration()`
- Internal helpers:
  - `readAllMasterStorageKeys()`
  - `readLegacyIndexedDBData()`
  - `computeChecksum()`
  - `writeMigrationMetadata()`

### 2.2 masterStorage.ts (Update)
- Re-export or delegate migration functions.
- Make `migrateFromIndexedDB` actually call the new migrator.
- Add `__resetCache` already exists.
- Add `getMigrationStatus()` if useful.

### 2.3 tauriSqlStorage.ts (Minor)
- Ensure table creation is defensive (already handled by migration in lib.rs).
- Optionally expose a direct "ensureTables" helper.

### 2.4 BackupRestorePage.tsx (Update)
- Replace hardcoded "Local (IndexedDB)"
- Add dynamic `StorageModeCard`
- Add "Migrate Now" button + state
- Consume new migration APIs

### 2.5 Environment Detection
- Centralize in a small `src/utils/environment.ts` (optional) or keep inside migration + masterStorage.
- For this section we will enhance `isTauri()` in tauriSqlStorage and reuse.

## 3. Data Flow — Migration Sequence

1. User opens desktop app (or clicks "Migrate")
2. `performLegacyToTauriMigration()` called
3. `detectLegacyBrowserData()` → returns sources + count
4. If no legacy → return early success
5. Read all keys from current browser path (sqlJs + legacy IDB)
6. For each key:
   - Read value
   - Compute running checksum
   - Write via masterStorage (now targets Tauri)
7. Write migration metadata record
8. Return `MigrationResult`

All operations are async and use existing error handling patterns.

## 4. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Use masterStorage for writes during migration | Ensures chunking, consistency, and future-proofing |
| Keep legacy data in place | Enables rollback and user export |
| Idempotent design | Safe to call on every launch |
| Checksum on serialized JSON | Simple integrity without full DB export |
| Mock-heavy testing | Required because no native Tauri in this env |

## 5. Error Handling Strategy

- Every read/write wrapped in try/catch
- Collect errors per key
- On total failure: attempt to clean any partial Tauri writes for migrated keys
- Never throw to caller unless critical (let UI decide)

## 6. Security & Privacy

- No network calls
- Data stays on device
- Checksum is SHA-256 of JSON (no PII exposure in logs)

## 7. Testing Architecture

- Unit tests mock:
  - `isTauri`
  - `tauriSqlStorage`
  - `sqlJsStorage`
  - `indexedDBStorage.openDB`
- Use in-memory maps to simulate stores
- Test matrix:
  - Browser + no legacy
  - Browser + legacy (should not migrate)
  - Desktop + no legacy
  - Desktop + legacy → success
  - Desktop + legacy → partial failure → rollback

## 8. Integration Points

- `useFirstRun.ts` (optional trigger)
- Onboarding flow (future)
- Settings / Backup page (primary)

## 9. Performance Considerations

- Migration runs once
- Reuses existing chunk logic
- Batch writes where possible (SQLite UPSERT already efficient)

## 10. Future Extensibility

- Support for additional legacy sources (cube DB)
- Versioned migration (v1 → v2)
- Progress events via EventEmitter or callback

## 11. Diagrams (ASCII)

```
Legacy Detection
┌──────────────┐     ┌──────────────────────┐
│ sqlJsStorage │────▶│ detectLegacy...      │
└──────────────┘     │                      │
                     │ hasLegacy = true     │
┌────────────────┐   └──────────┬───────────┘
│ indexedDB      │──────────────┘
└────────────────┘

Migration Execution
readKeys() ──▶ forEach ──▶ masterStorage.setItem() ──▶ Tauri SQLite
                │
                └──▶ compute checksum ──▶ write metadata
```

This architecture is approved for implementation.

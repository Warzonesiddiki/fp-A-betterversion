# Step 10 — Dev Story: Browser IndexedDB to Tauri SQLite Migration

**Section:** 011  
**Date:** 2026-07-26

## Implementation Log

### 1. Core Migration Module
- Created `src/utils/migration/legacyStorageMigration.ts`
- Implemented full contract:
  - Detection of indexedDB + sqljs + localStorage sources
  - `performLegacyToTauriMigration` with force option
  - Checksum + metadata writing
  - Backend reporting
- Made migration idempotent and safe

### 2. Wiring
- Updated `masterStorage.ts`:
  ```ts
  async migrateFromIndexedDB() {
    const { migrateFromIndexedDB } = await import('@/utils/migration/legacyStorageMigration');
    return migrateFromIndexedDB();
  }
  ```

### 3. Comprehensive Tests
- Created `legacyStorageMigration.test.ts` with 15+ cases
- Mocks for all three storage layers
- Covers happy path, browser skip, partial failure, idempotency

### 4. Environment Detection
- Reused and respected existing `isTauri()` from tauriSqlStorage
- Added `__resetTauriCache` for test hygiene

### 5. UI Work (next batch)
- Will update `BackupRestorePage.tsx` to use dynamic backend + migration CTA

## Batches Completed

**Batch 1 (Core):**
- New migration module + tests
- masterStorage wiring
- Gates: tsc ✓ lint ✓ (partial run)

**Batch 2 (UI + Polish):**
- (In progress)

## Technical Decisions Made During Dev

1. **Logical migration** — Migrate Zustand state objects, not raw DB blobs.
2. **No deletion of source** — Legacy data stays for safety.
3. **Reuse masterStorage writes** — Automatically gets chunking + correct routing.
4. **Simple checksum** — Sufficient for evidence (real crypto can be added later).
5. **Force flag** — Allows testing migration even in browser.

## Current Known Limitations (Documented)

- Cube data not migrated (separate engine, out of scope)
- Real Tauri runtime validation deferred (mocks only)
- No progress bar for very large migrations (future)

## Files Changed in This Section

```
+ src/utils/migration/legacyStorageMigration.ts
+ src/utils/migration/legacyStorageMigration.test.ts
~ src/utils/masterStorage.ts
~ src/pages/settings/BackupRestorePage.tsx   (planned)
```

## Next in Dev Story

Complete UI integration and run full verification suite.

# Step 02 — Research: Browser IndexedDB to Tauri SQLite Migration

**Section:** 011  
**Date:** 2026-07-26

## 1. Existing Storage Architecture Research

### 1.1 Master Storage Router (`src/utils/masterStorage.ts`)
- Routes all 29 Zustand persist stores.
- Uses `isTauri()` cache.
- Delegates to `wrapChunkedStorage(tauriSqlStorage)` or `wrapChunkedStorage(sqlJsStorage)`.
- `migrateFromIndexedDB()` currently logs only (placeholder).
- Good foundation: already environment-aware.

### 1.2 sql.js Storage (`src/utils/sqlJsStorage.ts`)
- In-browser SQLite via WASM.
- Persists entire DB as base64 blob in `localStorage['finplan-sqljs-db']`.
- Table: `stores (id TEXT PRIMARY KEY, value TEXT)`.
- Used in browser / fallback.

### 1.3 Tauri SQL Storage (`src/utils/tauriSqlStorage.ts`)
- Uses `@tauri-apps/plugin-sql`.
- Loads `sqlite:finplan.db`.
- Table: `stores (id, value)` via UPSERT.
- `isTauri()` checks for `__TAURI_INTERNALS__` or `__TAURI__`.
- Already handles JSON stringification.

### 1.4 Chunked Storage Wrapper (`src/utils/chunkedStorage.ts`)
- Handles payloads >1MB using workers.
- Metadata record + `name:chunk:N` keys.
- Must be preserved across migration (migrate metadata + chunks or reassemble).

### 1.5 Legacy IndexedDB (`src/utils/indexedDBStorage.ts`)
- `DB_NAME = 'finplan-pro'`, version 1.
- Object stores: `stores`, `backups`, `metadata`.
- Still used directly by:
  - `StreamImportEngine.bulkWrite`
  - `CubeEnginePersistence` (separate `finplan-cube` DB)
  - `useIndexedDB` hook
  - Some tests

### 1.6 Other Persistence
- `CubeEnginePersistence.ts`: Dual implementation (IDB + Tauri) — already has `detectBackend()`.
- `useFirstRun.ts`: Mixes localStorage + masterStorage.
- Backup system (`backupRestore.ts`): Operates on logical data, not raw storage.

## 2. Tauri Plugin & Schema Research

### 2.1 Current Tauri Setup
- `src-tauri/src/lib.rs` registers `tauri_plugin_sql` with migrations 001 + 002.
- `001_initial_schema.sql` already defines:
  ```sql
  CREATE TABLE IF NOT EXISTS stores (
    id TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  ```
- Perfect match for what `tauriSqlStorage` expects.

### 2.2 @tauri-apps/plugin-sql v2
- `Database.load('sqlite:finplan.db')`
- `.select()`, `.execute()`
- Migrations run automatically on first load.
- No need for additional Rust changes in Section 011.

### 2.3 Environment Detection Best Practices
- Official: `window.__TAURI__` or check for plugin APIs.
- Current implementation is sufficient but should be hardened.
- Recommendation: Also check for `window.__TAURI_INTERNALS__` + try/catch load of plugin.

## 3. Zustand Persist Contract
- All persisted stores use `{ name, storage: masterStorage }`.
- Value stored is usually `{ state: T, version?: number }`.
- Migration logic inside Zustand is per-store; we need cross-backend bulk migration.

## 4. Prior Migration Attempts (Codebase Audit)
- No previous full migration module found.
- `masterStorage.migrateFromIndexedDB` added in prior work as typed stub.
- `CubeEnginePersistence` already demonstrates dual-backend pattern (good reference).
- `StreamImportEngine` still hardcodes IndexedDB — will be noted as "legacy path" but not migrated in 011.

## 5. Data Safety Patterns from Industry
- Atomic migration: read → checksum → write target → verify → mark done.
- Never delete source until success + user confirmation.
- Idempotency key: store `migration: { from: 'indexeddb', to: 'tauri', completedAt, checksum }` in target kv.
- Rollback: on error, clear any partial target writes.

## 6. Testability Constraints
- Native Tauri cannot be run in current CI/sandbox easily.
- Strategy: 
  - Mock `isTauri` and `@tauri-apps/plugin-sql`
  - Use in-memory simulation of legacy stores.
  - Test the migration orchestrator in isolation.
- Document "unit + integration proof with mocks" as sufficient for Section 011.

## 7. Performance & Scale Research
- Chunked data up to tens of MB possible (budget data, GL, scenarios).
- sql.js export/import is memory heavy — migration should use chunked read path where possible.
- SQLite batch inserts recommended (already in tauri storage).

## 8. Related Files & Dependencies

**Core to change:**
- `src/utils/masterStorage.ts`
- `src/utils/migration/legacyStorageMigration.ts` (new)
- `src/pages/settings/BackupRestorePage.tsx`

**Support files:**
- `src/utils/storageConstants.ts` (add migration keys if needed)
- `src/utils/tauriSqlStorage.ts` (minor hardening)
- `src/hooks/useFirstRun.ts` (optional trigger point)

**Tests to create/update:**
- New: `src/utils/migration/legacyStorageMigration.test.ts`
- Update any that rely on hardcoded "IndexedDB" strings.

## 9. Open Research Questions Resolved

| Question | Decision |
|----------|----------|
| Migrate raw IDB or logical stores? | Logical stores only (via masterStorage + legacy IDB reads) |
| Migrate cube data in 011? | No — separate persistence engine. Note as future. |
| Delete legacy after success? | No — keep for rollback until Section 012+ |
| Trigger point | Explicit call from settings + first-run hook + manual |
| Versioning during migration | Preserve store `_version` inside state objects |

## 10. Sources Consulted (Internal)
- All storage utils (read)
- `PROJECT_TASK_BOARD_2026-07-26.md`
- Section 010 artifacts
- Tauri plugin-sql source patterns (via code)
- Existing dual-backend in CubeEnginePersistence

## Conclusion of Research

We have a solid foundation. The migration can be implemented as a clean, testable orchestrator that:
1. Detects legacy data.
2. Reads via legacy + current browser paths.
3. Writes via masterStorage (which will target Tauri).
4. Verifies integrity.
5. Records completion.

Ready to move to **Step 03 — Product Brief**.

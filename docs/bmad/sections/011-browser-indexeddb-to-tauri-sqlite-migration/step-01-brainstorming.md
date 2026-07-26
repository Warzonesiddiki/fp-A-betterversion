# Step 01 — Brainstorming: Browser IndexedDB to Tauri SQLite Migration

**Section:** 011  
**Date:** 2026-07-26  
**Participants (simulated):** Lead Orchestrator + Architecture + Data + UX + QA

## Problem Statement (Re-stated)

FinPlan Pro must support a seamless, zero-data-loss transition from browser-first storage (currently sql.js + legacy IndexedDB) to Tauri desktop SQLite when users install the desktop app.

Current reality:
- `masterStorage` already has runtime detection and routes correctly.
- Migration helper exists but is a **no-op**.
- `BackupRestorePage` hardcodes "Local (IndexedDB)".
- Several engines and hooks still directly touch IndexedDB.
- No evidence of safe, atomic migration path or rollback.

## Brainstorming Questions

### 1. Detection & Environment
- How do we reliably detect "we are now running in Tauri" vs browser?
  - Current: `__TAURI_INTERNALS__` or `__TAURI__` in window.
  - Risk: SSR / build-time false positives? (No SSR today.)
  - Enhancement: Add `window.__TAURI__` + plugin presence + `tauri-plugin-sql` availability.
- Should we cache the check aggressively? Yes (already done in masterStorage).

### 2. Legacy Data Identification
What constitutes "legacy browser data" that needs migration?
- Direct IndexedDB `finplan-pro` DB + `stores` objectStore (from `indexedDBStorage`)
- sql.js blob in localStorage `finplan-sqljs-db`
- Zustand persist keys under `finplan-pro` namespace (via masterStorage)
- Chunked keys (`:chunk:0` etc.)
- Cube-specific DBs (`finplan-cube`)
- Other engine-specific IDB (StreamImport, etc.)

Decision: **Primary target** = Zustand stores via masterStorage keys + legacy indexedDBStorage keys. Secondary = cube and import engine data (can be re-imported or migrated later).

### 3. Migration Strategy Options

**Option A — Full atomic copy on first Tauri launch**
- On desktop first run: read all browser data (sql.js + legacy IDB)
- Write to Tauri SQLite `stores` table + other tables
- Verify checksum
- Mark migration complete (in kv_store or metadata)
- Pros: clean, one-time
- Cons: complex for chunked data; large payloads

**Option B — Lazy migration per store**
- On access to a store key, if desktop + legacy flag → migrate that key only
- Pros: lower risk, incremental
- Cons: partial state possible

**Option C — Hybrid (chosen direction)**
- Detect at startup.
- Perform **bulk migration** of all masterStorage keys on first desktop launch.
- Use `migrateFromIndexedDB()` explicitly called from onboarding / settings / first-run hook.
- Leave raw IDB data in place (read-only for rollback).
- Store a `migration` metadata record.

**Chosen:** Hybrid bulk + per-key safety with explicit trigger + rollback guard.

### 4. Data Integrity & Safety
- Always compute SHA-256 of serialized legacy payload before migration.
- Store checksum in target backend.
- On any failure during migration: delete partial writes + log + keep legacy.
- Provide "Force Re-migrate" and "Export Legacy" escape hatches.
- Never delete source data until successful verification.

### 5. Fallbacks
- If Tauri plugin-sql fails to load → fall back to sql.js even in desktop.
- If migration fails → continue with sql.js in desktop (rare but possible).
- User-visible warning + manual export/import path.

### 6. UX Considerations
- On first desktop run after browser use: show non-blocking "Migrating your data..." toast / banner.
- Settings page must show real backend + migration status.
- Allow user to trigger migration manually.
- Progress for large data sets.

### 7. Testing Strategy
Must be testable without native Tauri runtime:
- Heavy use of `vi.mock` for `isTauri`, `tauriSqlStorage`, `Database`.
- Create `LegacyDataSimulator` helper.
- Snapshot + checksum tests.
- Failure injection tests.

### 8. Performance
- Migration should be fast (<2s for 50MB data).
- Use workers for large chunk reassembly if needed.
- Batch writes to SQLite (already using UPSERT in tauriSqlStorage).

### 9. Open Questions Raised
- Should we also migrate the sql.js blob itself into SQLite `kv_store` or only the parsed stores?
  → Decision: migrate the **logical stores** (parsed Zustand state). sql.js blob is browser-only.
- What about user-uploaded files / attachments? (Out of scope for 011)
- How do we handle versioned schema changes during migration? (Leverage existing store `_version` + future ADR)
- Do we support "switch back to browser" after desktop use? (No for now; one-way desktop preference.)

## Ideas Captured (Raw)

- Add `migrationStatus` to masterStorage.
- Create `src/utils/migration/` folder.
- Implement `LegacyStorageDetector`, `StorageMigrator`.
- Enhance `tauriSqlStorage` to ensure `stores` table exists (it does via schema).
- Add migration flag to `kv_store` table.
- Update `useFirstRun` to trigger migration if desktop.
- Create dedicated migration test file.
- Add "Storage Backend" card to BackupRestorePage with migration CTA.
- Produce evidence report with before/after screenshots (textual) + test results.

## Brainstorm Outcomes / Decisions

1. Create dedicated `src/utils/migration/legacyStorageMigration.ts`
2. Implement `detectLegacyBrowserData(): Promise<LegacyDetectionResult>`
3. Implement `migrateBrowserDataToTauri(): Promise<MigrationResult>`
4. Expose via `masterStorage.migrateFromIndexedDB()`
5. Make migration idempotent + safe to call multiple times.
6. Update BackupRestorePage to be dynamic.
7. Add comprehensive unit tests.
8. No Rust code changes required for Section 011 (schema already has `stores` table).
9. Document that full desktop runtime validation is deferred.

## Risks Logged in This Step

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Data loss | Low | High | Atomic + checksum + rollback + tests |
| False positive Tauri detection | Low | Med | Multiple detection signals + cache reset |
| Chunked data corruption | Med | Med | Reuse existing chunk wrapper on both sides |
| Slow migration UX | Med | Low | Progress + background + non-blocking |
| Inability to test native | High | Low | Strong mocking + explicit "mocked" evidence |

## Next Step

Proceed to **Step 02 — Research** (existing patterns, Tauri plugin-sql docs, previous migration attempts, Zustand persist contract).

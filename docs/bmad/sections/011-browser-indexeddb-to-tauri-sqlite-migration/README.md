# Section 011 — Browser IndexedDB to Tauri SQLite Migration

**Status:** COMPLETE: 100% READY

**Completed:** 2026-07-26  
**All gates passed**  
**Evidence:** `reports/section-011-migration-evidence-2026-07-26.md`

**Started:** 2026-07-26  
**Target Completion:** After full planning, implementation, tests, validation, and adversarial review.

## Objective (from BMAD Task Board & Handover)

Complete a production-grade migration proof for browser (legacy IndexedDB / current sql.js) ↔ Tauri SQLite persistence:

- Environment-aware backend selection (browser vs desktop Tauri)
- Explicit, testable migration helper that runs on first desktop launch
- Zero data loss guarantees (atomic, rollback-safe, checksummed)
- Fallback to sql.js / browser when Tauri not available
- Update UI to reflect actual storage backend
- Evidence of migration contract, behavior, and tests

## Scope (Locked for this Section)

**In Scope:**
- Audit of existing storage files (`masterStorage`, `indexedDBStorage`, `tauriSqlStorage`, `sqlJsStorage`, `chunkedStorage`)
- Migration contract + sequence diagram
- `migrateFromIndexedDB` / `migrateLegacyToTauri` implementation
- Environment detection hardening (`isTauri`, `isDesktopEnvironment`)
- Unit + integration tests for:
  - backend selection
  - migration detection (hasLegacyData)
  - successful migration
  - failed migration rollback / no data loss
- Update `BackupRestorePage` to report correct storage mode
- Update `masterStorage` to expose migration status
- Migration evidence report (`reports/section-011-migration-evidence-2026-07-26.md`)
- Task board + section index updates

**Out of Scope (defer to later BMAD sections):**
- Full Tauri desktop installer + E2E (P8)
- Native `better-sqlite3` or Rust direct DB tests (use `npm run test:native-db` later)
- Real Rust native build validation (document if blocked)
- Full multi-store data migration for all 29 Zustand stores
- Production desktop packaging

## Current State (Pre-Section 011 Audit Summary)

| Component                  | Browser (web)               | Desktop (Tauri)            | Notes |
|----------------------------|-----------------------------|----------------------------|-------|
| `masterStorage`            | `chunkedSqlJsStorage`       | `chunkedTauriStorage`      | Routes correctly via `isTauri()` |
| `sqlJsStorage`             | Primary (localStorage blob) | Not used                   | sql.js + localStorage persistence |
| `indexedDBStorage`         | Legacy (still exists)       | Not used                   | Direct IDB used by some engines/hooks |
| `tauriSqlStorage`          | Not available               | `sqlite:finplan.db`        | Uses tauri-plugin-sql + UPSERT |
| `chunkedStorage`           | Wraps all                    | Wraps all                  | Worker-based large payload chunking |
| `BackupRestorePage`        | Shows "Local (IndexedDB)"   | Hardcoded                  | Needs dynamic detection |
| Migration helper           | Placeholder only            | Placeholder                | `migrateFromIndexedDB()` is no-op |

Legacy paths still reference raw IndexedDB in:
- `src/engines/StreamImportEngine.ts`
- `src/engines/CubeEnginePersistence.ts`
- `src/hooks/useIndexedDB.ts`
- Various tests

## Acceptance Criteria (Section 011 DoD)

1. `isTauri()` / environment detection is reliable and cached safely.
2. `masterStorage.migrateFromIndexedDB()` (or `migrateLegacyStorage()`) is implemented and callable.
3. A dedicated migration utility module exists with:
   - `detectLegacyData()`
   - `performMigration()`
   - `rollbackMigrationIfNeeded()`
4. Unit tests cover:
   - Browser mode (no Tauri) → uses sqlJs, no migration attempt
   - Desktop mode with no legacy → no-op
   - Desktop mode with legacy data → migration runs (mocked)
   - Migration failure → original data preserved
5. All stores using `masterStorage` continue to work.
6. `BackupRestorePage` dynamically shows "Browser (sql.js)" or "Desktop (Tauri SQLite)" + migration status.
7. TypeScript clean, ESLint 0 warnings, build passes, `npm run repo:hygiene` passes.
8. Targeted storage tests pass (including new migration tests).
9. Evidence report generated.
10. BMAD files complete (README + 11 steps), task board and section-index updated.
11. Section marked `COMPLETE: 100% READY` only after all gates + code review.

## Deliverables

- `docs/bmad/sections/011-browser-indexeddb-to-tauri-sqlite-migration/` (full 11-step BMAD)
- `src/utils/migration/legacyStorageMigration.ts` (new)
- `src/utils/migration/legacyStorageMigration.test.ts` (new)
- Updates to:
  - `src/utils/masterStorage.ts`
  - `src/utils/tauriSqlStorage.ts` (enhance if needed)
  - `src/pages/settings/BackupRestorePage.tsx`
  - `src/hooks/useFirstRun.ts` (optional integration)
- `reports/section-011-migration-evidence-2026-07-26.md`
- Updated `PROJECT_TASK_BOARD_2026-07-26.md`
- Updated `docs/bmad/section-index.md`

## Risks & Mitigations (Documented)

- **Risk:** Native Tauri SQLite not testable in this environment.
  **Mitigation:** Full unit test coverage with mocks + `isTauri` stub. Document "mocked validation" and defer real desktop E2E.
- **Risk:** Data loss during migration.
  **Mitigation:** Implement atomic copy + checksum + rollback path. Tests simulate failure.
- **Risk:** Legacy IDB data mixed with sql.js.
  **Mitigation:** Explicit legacy detection for both `indexedDBStorage` keys and old local patterns.
- **Risk:** Chunked data + large stores.
  **Mitigation:** Reuse existing `chunkedStorage` wrapper; migrate at metadata level.

## Next Steps After Section Completion

Move to stabilization of remaining P0/P1 items or Section 012 per board.

**Section Lead Orchestrator Sign-off Required Before Marking Complete.**

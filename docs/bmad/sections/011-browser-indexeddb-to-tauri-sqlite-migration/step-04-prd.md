# Step 04 — PRD: Browser IndexedDB to Tauri SQLite Migration

**Section:** 011  
**Version:** 1.0  
**Date:** 2026-07-26  
**Status:** Draft → Approved for implementation

## 1. Overview

FinPlan Pro must provide a reliable, one-time migration of persisted application state from browser-based storage (sql.js + legacy IndexedDB) to Tauri SQLite when the desktop application is launched for the first time with existing data.

## 2. Goals

- Seamless data continuity for users moving from web to desktop
- Zero data loss with verifiable integrity
- Clear, non-alarming user experience
- Fully testable without native runtime
- Idempotent and safe to invoke multiple times

## 3. Non-Goals

- Migration of non-persisted in-memory state
- Migration of user-uploaded files/attachments (future)
- Cube engine data (handled separately)
- Bidirectional sync or downgrade support
- Real desktop installer validation in this section

## 4. Functional Requirements

### FR-01 Environment Detection
- `isTauri()` must return `true` only when running inside a Tauri desktop context.
- Detection must be cached and resettable for tests.

### FR-02 Legacy Data Detection
- System shall detect presence of:
  - Legacy `indexedDBStorage` data (`finplan-pro` DB)
  - sql.js persisted blob
  - Any masterStorage keys containing data

### FR-03 Migration Execution
- A dedicated `performLegacyToTauriMigration()` function shall:
  - Read all relevant keys using current browser paths
  - Write them using `masterStorage` (which targets Tauri)
  - Compute and store a migration checksum
  - Record `migration_completed` metadata
  - Be idempotent

### FR-04 Integrity & Rollback
- Migration must be atomic per key where possible.
- On any failure, partial writes must be cleaned up.
- Original browser data must remain untouched.

### FR-05 UI & Feedback
- `BackupRestorePage` shall display the active storage backend.
- Show migration status ("Not started", "Completed", "Failed").
- Provide a manual "Migrate Now" button when appropriate.

### FR-06 Integration Points
- `useFirstRun` or onboarding flow may trigger migration automatically (non-blocking).
- Settings page provides manual trigger.
- `masterStorage` shall expose `migrateFromIndexedDB()` as public API.

### FR-07 Logging & Observability
- All migration steps shall log via existing `createLogger`.
- Errors shall be captured without crashing the app.

## 5. Non-Functional Requirements

- NFR-01: Migration of 10MB dataset completes in < 3 seconds (mocked environment).
- NFR-02: No increase in main bundle size > 8KB.
- NFR-03: All new code must have ≥80% statement coverage in unit tests.
- NFR-04: Must pass TypeScript, ESLint (0 warnings), build, and repo:hygiene.
- NFR-05: Must not break existing targeted storage tests.

## 6. User Experience Requirements

- No modal blocking the entire app on first launch.
- Progress indication for large migrations (future enhancement).
- Clear language: "Your data has been migrated to desktop storage."
- Option to export legacy data before/after migration.

## 7. Data Model / Contracts

### 7.1 New Types (in migration module)

```ts
export interface LegacyDetectionResult { ... }
export interface MigrationResult { ... }
```

### 7.2 Metadata Records

After successful migration, the following will be written via masterStorage:

- Key: `migration:legacy-to-tauri`
- Value: `{ completedAt: string, checksum: string, keysMigrated: number }`

## 8. Acceptance Criteria

1. `detectLegacyBrowserData()` returns accurate results in browser and mocked-desktop.
2. `performLegacyToTauriMigration()` succeeds when Tauri is mocked and legacy data exists.
3. All persisted Zustand stores are transferred.
4. `BackupRestorePage` shows correct backend name and migration status.
5. Migration is safe on repeated calls.
6. Failure scenario leaves browser data intact (verified in tests).
7. All gates pass after implementation.
8. Evidence report is generated.

## 9. Dependencies

- Existing: `masterStorage`, `sqlJsStorage`, `tauriSqlStorage`, `indexedDBStorage`, `chunkedStorage`
- New: `src/utils/migration/legacyStorageMigration.ts`

## 10. Risks & Open Issues

- Native SQLite cannot be exercised in current sandbox → mitigated by mocks.
- Chunked data handling must reuse existing wrapper logic.

## 11. Success Criteria for Section Completion

See main README.md for Section 011.

---

**Approved by:** Lead Orchestrator Agent  
**Next:** Step 05 — UX Design

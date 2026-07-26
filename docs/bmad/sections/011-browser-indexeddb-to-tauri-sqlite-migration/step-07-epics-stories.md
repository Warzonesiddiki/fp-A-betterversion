# Step 07 — Epics & Stories: Browser IndexedDB to Tauri SQLite Migration

**Section:** 011

## Epic 011: Browser → Tauri SQLite Migration

**Epic Goal:** Deliver a safe, tested, production-grade migration path from browser storage to desktop SQLite with zero data loss.

### Story 011-01 — Environment Detection Hardening
**As** a developer / QA  
**I want** reliable `isTauri()` detection that works in tests and production  
**So that** migration logic only activates in the correct environment.

**Acceptance Criteria:**
- `isTauri()` returns boolean correctly in browser, mocked desktop, real desktop
- Cache can be reset via `__resetCache`
- Detection covers `__TAURI__` and `__TAURI_INTERNALS__`

### Story 011-02 — Legacy Data Detector
**As** the system  
**I want** to accurately detect presence of legacy browser data  
**So that** we only run migration when necessary.

**AC:**
- Detects `finplan-pro` IndexedDB stores
- Detects sql.js blob
- Detects non-empty masterStorage keys
- Returns count and estimated size

### Story 011-03 — Migration Orchestrator
**As** a user launching desktop for first time  
**I want** all my persisted data moved to Tauri SQLite  
**So that** I continue where I left off.

**AC:**
- Implements `performLegacyToTauriMigration()`
- Uses `masterStorage.setItem` for writes (respects chunking)
- Records migration metadata
- Idempotent
- Returns detailed result

### Story 011-04 — Integrity & Rollback
**As** a user  
**I want** the migration to be safe even if it partially fails  
**So that** I never lose data.

**AC:**
- Checksum computed before write
- Partial writes cleaned on error
- Legacy data untouched on failure
- Tests cover failure injection

### Story 011-05 — UI Integration (BackupRestorePage)
**As** a user in Settings  
**I want** to see the actual storage backend and trigger migration  
**So that** I have visibility and control.

**AC:**
- Dynamic storage mode label
- "Migrate from Browser" button appears when relevant
- Status updates after migration
- No regression in existing backup/restore flows

### Story 011-06 — Integration with First Run
**As** a first-time desktop user  
**I want** migration to happen automatically (non-blocking)  
**So that** I don't have to do anything.

**AC:**
- `useFirstRun` or equivalent can call migration
- Does not block UI
- Respects "already migrated" flag

### Story 011-07 — Unit & Integration Tests
**As** the team  
**I want** comprehensive tests for the migration path  
**So that** we have high confidence without needing desktop builds.

**AC:**
- 011 migration test file with ≥ 15 test cases
- Covers all combinations of backend + legacy presence
- Mocks are clean and isolated
- Tests pass in `npm test`

### Story 011-08 — Evidence & Documentation
**As** the orchestrator  
**I want** a clear evidence report  
**So that** Section 011 can be marked complete.

**AC:**
- `reports/section-011-migration-evidence-2026-07-26.md`
- Updated task board
- All BMAD step files complete
- Gates verified

## Story Map (Priority Order)

1. 011-01 Detection
2. 011-02 Detector
3. 011-03 Orchestrator (core)
4. 011-04 Safety
5. 011-07 Tests (parallel with 3-4)
6. 011-05 UI
7. 011-06 Integration
8. 011-08 Evidence

All stories must be complete before section sign-off.

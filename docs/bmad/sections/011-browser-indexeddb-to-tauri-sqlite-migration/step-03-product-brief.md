# Step 03 — Product Brief: Browser IndexedDB to Tauri SQLite Migration

**Section:** 011  
**Date:** 2026-07-26

## 1. Problem

Users who start FinPlan Pro in the browser (web/PWA) accumulate real financial data in local storage (sql.js + legacy IndexedDB). When they later install the desktop (Tauri) version, that data must move reliably into the native SQLite database with:

- Zero data loss
- Clear user feedback
- No manual re-import required
- Graceful fallback if migration cannot run

Currently the desktop build routes correctly but performs **no migration**.

## 2. Opportunity

This migration is a critical trust and retention feature for the desktop product. It demonstrates production-grade data portability and is a prerequisite for claiming "desktop persistence" in the product vision.

## 3. Target Users

- Existing browser users who download the desktop app
- New desktop users who previously explored the web version
- Power users who switch environments (dev, multiple machines)

## 4. Success Metrics (for this section)

- 100% of Zustand persisted stores successfully migrated in unit tests
- Migration completes with no data loss in simulated scenarios
- UI correctly reflects "Desktop (Tauri SQLite)" after migration
- Migration can be triggered manually and is idempotent
- All gates (tsc, lint, build, hygiene, targeted tests) remain green

## 5. Non-Goals (this section)

- Full desktop installer E2E
- Migration of raw file attachments or user uploads
- Migration of cube data (separate engine)
- Support for downgrading from desktop back to browser
- Real Rust build validation (mocked proof only)

## 6. Key User Stories (High Level)

**US-011-01**  
As a user who has used FinPlan Pro in the browser,  
I want my data (budgets, GL, scenarios, etc.) to appear automatically when I launch the desktop app,  
So that I do not have to re-enter or re-import everything.

**US-011-02**  
As a user,  
I want to see the current storage backend and migration status in Settings,  
So that I understand where my data lives.

**US-011-03**  
As a user or support engineer,  
I want the migration to be safe — if anything goes wrong, my original browser data remains intact and I can export it.

## 7. Constraints

- Must work with existing `masterStorage` + chunked wrapper
- Must respect existing Tauri SQL schema (`stores` table)
- Must be fully testable without a native Tauri binary
- Must not increase bundle size significantly
- Must pass all existing storage-related tests

## 8. Out of Scope for This BMAD Section

- Native better-sqlite3 path (blocked per known caveats)
- Full desktop build + install validation
- Cross-device sync
- Multi-user / cloud migration

## 9. MVP Definition for Section 011

A working, tested migration utility that:
1. Detects when running in Tauri + legacy browser data exists
2. Copies all masterStorage keys to Tauri SQLite
3. Records success/failure + checksum
4. Updates UI to show correct backend
5. Provides tests proving no data loss on success and no corruption on failure

## 10. Dependencies on Prior Sections

- Section 010: Backup/restore + integrity (provides patterns)
- Section 006–009: Data models and stores
- Existing storage utilities

## 11. Risks & Mitigations (Product View)

| Risk | Mitigation |
|------|------------|
| User loses data | Atomic copy + checksum + rollback path + keep source |
| User doesn't notice migration happened | Non-blocking toast + persistent status in Settings |
| Migration is slow for large datasets | Chunk reuse + worker assistance + progress indicator |
| False desktop detection | Multi-signal detection + manual override |

## 12. Post-Section 011 Value

Enables:
- Desktop-first product claims
- Future "import from web export" flows
- Trust foundation for Section 012+ (multi-entity, etc.)

This brief is approved as the guiding document for the remainder of Section 011.

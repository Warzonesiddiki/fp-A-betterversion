# Step 08 — Sprint Planning: Browser IndexedDB to Tauri SQLite Migration

**Section:** 011  
**Sprint:** Section 011 Sprint (1-2 days focused)

## Sprint Goal
Deliver a fully tested, gated, evidence-backed implementation of the IndexedDB → Tauri SQLite migration with UI integration.

## Committed Stories (from Step 07)

| Story | Title | Points | Owner | Status |
|-------|-------|--------|-------|--------|
| 011-01 | Environment Detection Hardening | 2 | Orchestrator | Ready |
| 011-02 | Legacy Data Detector | 3 | Orchestrator | Ready |
| 011-03 | Migration Orchestrator | 5 | Orchestrator | Ready |
| 011-04 | Integrity & Rollback | 3 | Orchestrator | Ready |
| 011-05 | UI Integration | 3 | Orchestrator | Ready |
| 011-06 | First Run Integration | 2 | Orchestrator | Ready |
| 011-07 | Tests | 5 | Orchestrator | Ready |
| 011-08 | Evidence & Docs | 2 | Orchestrator | Ready |

**Total:** 25 points (small focused sprint)

## Sprint Tasks (Granular)

### Day 1 (Implementation Focus)
1. Create `src/utils/migration/legacyStorageMigration.ts` (core logic)
2. Enhance `isTauri` if needed + add `getCurrentStorageBackend`
3. Update `masterStorage.ts` to wire migration API
4. Write initial unit tests for detector + orchestrator
5. Run tsc + lint + targeted tests after each batch

### Day 2 (Integration + Polish)
6. Implement failure/rollback paths + more tests
7. Update `BackupRestorePage.tsx` with dynamic UI
8. Add first-run hook integration (lightweight)
9. Generate evidence report
10. Update PROJECT_TASK_BOARD and section-index
11. Full gate run + final code review

## Definition of Ready for Code
- Story has clear AC
- Architecture reviewed
- No blocking dependencies

## Definition of Done (per story)
- Code + tests
- Passes local gates
- Reviewed in step-11
- Task board updated

## Capacity Notes
- Focused agent execution
- Small batches with gate verification after each
- No parallel feature work

## Risks for This Sprint
- Test timeouts (use --pool=forks and limited scope)
- Native Tauri unavailable → rely on mocks (acceptable per spec)

Sprint kickoff complete. Proceeding to implementation.

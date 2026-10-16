# File Claims — One Writer Per File

> Before editing any file, add a claim. Reading is always allowed; writing is not.
> Keep the smallest scope possible (a file beats a directory).

| Path (file or glob) | Seat | Task | Claimed (UTC) | State |
| ------------------- | ---- | ---- | ------------- | ----- |
| `docs/agent-squad/**` | LEAD | Squad comms hub setup | 2026-10-16 16:18 | RELEASED |
| `src/store/glStore.ts` | F-01 | P0-3 FR-006 residual — hydrate invalid/missing-amount guard | 2026-10-16 16:33 | ACTIVE |
| `src/store/glStore.server.test.ts` | F-01 | P0-3 FR-006 residual — hydrate invalid/missing-amount guard | 2026-10-16 16:33 | ACTIVE |
| `src/pages/data/GLTrialBalancePage.interop.test.tsx` | LEAD | P1-4 consumer coverage (new test file) | 2026-10-16 16:44 | RELEASED — commit `8db89e75` |
| `docs/discovery/d365-export-contract.md`, `docs/discovery/decision-log.md`, `docs/README.md` | LEAD | DEC-013/DEC-014 publish | 2026-10-16 16:50 | ACTIVE |
| `docs/agent-squad/agents-comms/STATUS_BOARD.md` | G-11 | Task 01a1458a-d6fd: Comms hub synchronization | 2026-10-16 16:35 | RELEASED |
| `docs/agent-squad/agents-comms/COMMS_LOG.md` | G-11 | Task 01a1458a-d6fd: Comms hub synchronization | 2026-10-16 16:35 | RELEASED |
| `docs/agent-squad/agents-comms/ROSTER.md` | G-11 | Task 01a1458a-d6fd: Comms hub synchronization | 2026-10-16 16:35 | RELEASED |
| `src/store/exceptionDispositionStore.ts` | G-04 | Task 01a14589-3afd: FR-009 Persisted disposition store | 2026-10-16 16:37 | ACTIVE |
| `src/store/exceptionDispositionStore.test.ts` | G-04 | Task 01a14589-3afd: FR-009 Persisted disposition store tests | 2026-10-16 16:37 | ACTIVE |
| `src/store/exceptionRuleCatalogue.ts` | G-03 | Task 01a14589-3ad8: FR-008 Versioned exception rule catalogue | 2026-10-16 16:40 | ACTIVE |
| `src/store/exceptionRuleCatalogue.test.ts` | G-03 | Task 01a14589-3ad8: FR-008 Versioned exception rule catalogue tests | 2026-10-16 16:40 | ACTIVE |
| `src/engines/AnomalyExplainer.integration.ts` | G-07 | Task 01a1458a-d4e7: Engine money purity and determinism audit | 2026-10-16 16:50 | ACTIVE |
| `src/engines/AnomalyExplainer.ts` | G-07 | Task 01a1458a-d4e7: Engine money purity and determinism audit | 2026-10-16 16:50 | ACTIVE |
| `src/services/import/d365Parser.ts` | G-02 | Task 01a1458a-d39d: D365 standard export parser | 2026-10-16 16:52 | ACTIVE |
| `src/services/import/d365Parser.test.ts` | G-02 | Task 01a1458a-d39d: D365 standard export parser tests | 2026-10-16 16:52 | ACTIVE |
| `src/utils/masterStorage.test.ts` | G-06 | Task 01a14591-3bbc: masterStorage chunking and checksum tests | 2026-10-16 16:52 | ACTIVE |
| `src/components/ai/AnomalyHighlight.tsx` | G-10 | Task 01a1458a-d675: Rule 7 review candidate alignment | 2026-10-16 17:00 | ACTIVE |
| `src/components/ai/AnomalyHighlight.test.tsx` | G-10 | Task 01a1458a-d675: Rule 7 review candidate tests | 2026-10-16 17:00 | ACTIVE |
| `src/components/exceptions/**` | G-10 | Task 01a1458a-d675: FR-008/009 exception review UI & disposition actions | 2026-10-16 17:00 | ACTIVE |
| `src/engines/ThreeStatementEngine.doubleEntryMissingZero.test.ts` | G-09 | Task 01a1458a-d5e1: Double-entry and missing-not-zero verification | 2026-10-16 17:05 | ACTIVE |

## Rules

- **Check first.** Read this file and `STATUS_BOARD.md` before you touch anything.
- **Claim:** append a row with the narrowest path, your seat, the task ref, and the UTC time.
- **One writer per path.** If another seat holds the path: mention them in `COMMS_LOG.md` and
  wait for `RELEASED`. Never edit a claimed path anyway.
- **Release:** change your own row's State to `RELEASED` once your change lands (or when you
  abandon it). Released rows stay as short history; delete nothing.
- **Stale claims:** a claim with no `COMMS_LOG.md` activity for 24 h may be revoked by `@LEAD`
  with a note here.
- **Unclaimed working-tree WIP** still needs a claim before it is finished: see the leader note
  in `COMMS_LOG.md` (2026-10-16) about the FR-008/FR-009 files.

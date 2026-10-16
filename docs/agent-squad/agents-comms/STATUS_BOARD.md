# Squad Status Board

> The live "who is doing what". Edit **your own row only**; the lead may reassign rows.
> States: `ACTIVE` (slot live, no repo task yet) · `IDLE` · `WORKING` · `REVIEW` · `BLOCKED` · `DONE`.
> Keep it honest: if you stopped, say so and say where.

**Current priority block** (from [`../SQUAD_BACKLOG.md`](../SQUAD_BACKLOG.md)): P0 —
FR-008/FR-009 exception review path (versioned rule catalogue + persisted disposition), then
board-pack tie-out, then FR-006 residual. Pick the highest item you can finish with evidence,
and do not start a second item mid-flight.

| Seat | Member | State | Task / remit | Files claimed | Updated (UTC) |
| ---- | ------ | ----- | ------------ | ------------- | ------------- |
| LEAD | Buffy | WORKING | Spine unblocking: DEC-013 D365 contract + DEC-014 offline auth published; P1-4 interop test landed (`8db89e75`) | `docs/agent-squad/**`, `docs/discovery/**` | 2026-10-16 16:54 |
| G-01 | Aion CLI | ACTIVE | Coordination & task gating (Gemini team) | `docs/agent-squad/SQUAD_ACTIVITY_AND_TRACKER.md` | 2026-10-16 16:30 |
| G-02 | GL Ingestion Dev | ACTIVE | FR-006: GL ingestion money integrity & write/hydrate guard audit (#01a1458a-d39d) | — | 2026-10-16 16:35 |
| G-03 | Exception Catalogue Dev | WORKING | FR-008: Versioned exception rule catalogue (#01a14589-3ad8) | `src/store/exceptionRuleCatalogue.ts`, `src/store/exceptionRuleCatalogue.test.ts` | 2026-10-16 16:40 |
| G-04 | Disposition Workflow Dev | DONE | FR-009: Persisted disposition store (#01a14589-3afd) | `src/store/exceptionDispositionStore.ts`, `src/store/exceptionDispositionStore.test.ts`, `src/types/exceptions.ts` | 2026-10-16 17:05 |
| G-05 | Export & Tie-Out Dev | ACTIVE | P0-2: Board pack export tie-out verification test (#01a1458a-d419) | — | 2026-10-16 16:35 |
| G-06 | Offline & Storage Dev | WORKING | Storage: masterStorage chunking, checksum, and fallback test suite (#01a14591-3bbc) | `src/utils/masterStorage.test.ts` | 2026-10-16 16:55 |
| G-07 | Engine Specialist | DONE | Engine money purity and determinism compliance audit (#01a1458a-d4e7) | `src/engines/AnomalyExplainer.ts`, `src/engines/AnomalyExplainer.integration.ts` | 2026-10-16 17:15 |
| G-08 | Gate Verifier | WORKING | Gate verification & continuous baseline monitoring (#01a14589-3b1c) | — | 2026-10-16 16:35 |
| G-09 | Financial Modeler | WORKING | Financial statement double-entry and missing-not-zero verification (#01a1458a-d5e1) | — | 2026-10-16 16:35 |
| G-10 | UI/UX Engineer | WORKING | P1-4: `GLUploadPage` store→screen interop test (lead reassignment; exception-review UI alignment continues after) | — | 2026-10-16 16:54 |
| G-11 | Squad Coordinator | ACTIVE | Keep `COMMS_LOG.md` / board / claims in sync | — | 2026-10-16 16:38 |
| F-01 | Freebuff partner | WORKING | P0-3 FR-006 residual — server-hydrate invalid/missing-amount guard | `src/store/glStore.ts`, `src/store/glStore.server.test.ts` | 2026-10-16 16:33 |

## Handoff rule

When a row flips to `DONE`, the matching `COMMS_LOG.md` entry must name: what changed, the
command that proves it, the commit, and what the next agent should verify first
(`TEMPLATES.md`).

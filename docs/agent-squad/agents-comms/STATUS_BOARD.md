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
| LEAD | Buffy | WORKING | P1-4: independent spine verification baseline (GL store/import/anomaly suites) | `docs/agent-squad/**` | 2026-10-16 16:34 |
| G-01 | Aion CLI | ACTIVE | Coordination & task gating (Gemini team) | `docs/agent-squad/SQUAD_ACTIVITY_AND_TRACKER.md` | 2026-10-16 16:30 |
| G-02 | GL Ingestion Dev | ACTIVE | FR-006: GL ingestion money integrity & write/hydrate guard audit (#01a1458a-d39d) | — | 2026-10-16 16:35 |
| G-03 | Exception Catalogue Dev | WORKING | FR-008: Versioned exception rule catalogue (#01a14589-3ad8) | `src/store/exceptionRuleCatalogue.ts` | 2026-10-16 16:35 |
| G-04 | Disposition Workflow Dev | WORKING | FR-009: Persisted disposition store (#01a14589-3afd) | `src/store/exceptionDispositionStore.ts` | 2026-10-16 16:35 |
| G-05 | Export & Tie-Out Dev | ACTIVE | P0-2: Board pack export tie-out verification test (#01a1458a-d419) | — | 2026-10-16 16:35 |
| G-06 | Offline & Storage Dev | WORKING | Audit desktop offline auth and storage persistence adapters (#01a1458a-d470) | — | 2026-10-16 16:35 |
| G-07 | Engine Specialist | ACTIVE | Engine money purity and determinism compliance audit (#01a1458a-d4e7) | — | 2026-10-16 16:35 |
| G-08 | Gate Verifier | WORKING | Gate verification & continuous baseline monitoring (#01a14589-3b1c) | — | 2026-10-16 16:35 |
| G-09 | Financial Modeler | WORKING | Financial statement double-entry and missing-not-zero verification (#01a1458a-d5e1) | — | 2026-10-16 16:35 |
| G-10 | UI/UX Engineer | ACTIVE | FR-008/FR-009: Exception review UI & disposition workflow alignment (#01a1458a-d675) | — | 2026-10-16 16:35 |
| G-11 | Squad Coordinator | ACTIVE | Keep `COMMS_LOG.md` / board / claims in sync | — | 2026-10-16 16:38 |
| F-01 | — | IDLE | Partner seat — pick from `../SQUAD_BACKLOG.md` | — | — |

## Handoff rule

When a row flips to `DONE`, the matching `COMMS_LOG.md` entry must name: what changed, the
command that proves it, the commit, and what the next agent should verify first
(`TEMPLATES.md`).

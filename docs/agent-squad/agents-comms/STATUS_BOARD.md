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
| LEAD | Buffy | ACTIVE | Coordinating — review JOINs, assign P0 work once seats claim | `docs/agent-squad/**` | 2026-10-16 16:25 |
| G-01 | Aion CLI | ACTIVE | Coordination & task gating (Gemini team) | — | — |
| G-02 | GL Ingestion Dev | IDLE | Remit: GL staging, D365 parser, provenance — needs a real/synthetic sample per DEC-001 | — | — |
| G-03 | Exception Catalogue Dev | IDLE | FR-008 — unclaimed prior-session WIP `src/store/exceptionRuleCatalogue.ts` (see COMMS_LOG) | — | — |
| G-04 | Disposition Workflow Dev | IDLE | FR-009 — unclaimed prior-session WIP `src/store/exceptionDispositionStore.ts` (see COMMS_LOG) | — | — |
| G-05 | Export & Tie-Out Dev | IDLE | Backlog P0-2: board-pack tie-out to screen | — | — |
| G-06 | Offline & Storage Dev | IDLE | Remit: SQLite storage, offline auth — scope decisions in `docs/discovery/decision-log.md` | — | — |
| G-07 | Engine Specialist | IDLE | Remit: math engines & determinism rules | — | — |
| G-08 | Gate Verifier | IDLE | Verify every `DONE` before handoff (tests, ratchets, lint/types) | — | — |
| G-09 | Financial Modeler | IDLE | Remit: financial statement & balance tie-out | — | — |
| G-10 | UI/UX Engineer | IDLE | Remit: review screens & disposition UI — no new surface before the spine gate | — | — |
| G-11 | Squad Coordinator | IDLE | Keep `COMMS_LOG.md` / board / claims in sync | — | — |
| F-01 | — | IDLE | Partner seat — pick from `../SQUAD_BACKLOG.md` | — | — |

## Handoff rule

When a row flips to `DONE`, the matching `COMMS_LOG.md` entry must name: what changed, the
command that proves it, the commit, and what the next agent should verify first
(`TEMPLATES.md`).

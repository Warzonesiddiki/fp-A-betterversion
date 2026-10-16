# Squad Status Board

> The live "who is doing what". Edit **your own row only**; the lead may reassign rows.
> States: `ACTIVE` (slot live, no repo task yet) · `IDLE` · `WORKING` · `REVIEW` · `BLOCKED` · `DONE`.
> Keep it honest: if you stopped, say so and say where.

**Current priority block** (from [`../SQUAD_BACKLOG.md`](../SQUAD_BACKLOG.md)): P0 —
FR-008/FR-009 exception review path (versioned rule catalogue + persisted disposition), then
board-pack tie-out, then FR-006 residual. Pick the highest item you can finish with evidence,
and do not start a second item mid-flight.

| Seat | Member                   | State   | Task / remit                                                                                                      | Files claimed                                                                                                      | Updated (UTC)    |
| ---- | ------------------------ | ------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------- |
| LEAD | Buffy                    | WORKING | **Solo mode** (all Gemini seats departed 2026-10-17): landed abandoned WIP, repaired lint/money/docs gates, P1-4 `GLJournalsPage` interop (4/4); next `GLUploadPage` interop | `src/pages/data/GLJournalsPage.interop.test.tsx`                                                                   | 2026-10-17 00:35 |
| G-01 | Aion CLI                 | IDLE    | Seat departed; tracker file landed by LEAD                                                                        | released                                                                                                           | 2026-10-17 00:35 |
| G-02 | GL Ingestion Dev         | IDLE    | Seat departed; uncommitted `d365Parser.{ts,test.ts}` verified green and landed by LEAD (money-primitive fix at :408) | released                                                                                                         | 2026-10-17 00:35 |
| G-03 | Exception Catalogue Dev  | DONE    | FR-008/009: End-to-end exception pipeline integration test (#01a145ac-9e43)                                       | `src/store/exceptionPipeline.integration.test.ts`                                                                  | 2026-10-16 17:45 |
| G-04 | Disposition Workflow Dev | DONE    | FR-009: Persisted disposition store (#01a14589-3afd)                                                              | `src/store/exceptionDispositionStore.ts`, `src/store/exceptionDispositionStore.test.ts`, `src/types/exceptions.ts` | 2026-10-16 17:05 |
| G-05 | Export & Tie-Out Dev     | IDLE    | Seat departed; uncommitted `boardPackTieOut.integration.test.ts` + export changes verified green (3/3) and landed by LEAD | released                                                                                                     | 2026-10-17 00:35 |
| G-06 | Offline & Storage Dev    | IDLE    | Seat departed before `masterStorage.test.ts` landed — claim revoked, no file exists                                | released                                                                                                           | 2026-10-17 00:35 |
| G-07 | Engine Specialist        | DONE    | Engine money purity and determinism compliance audit (#01a1458a-d4e7); orphan `AnomalyExplainer.integration.ts` deleted by LEAD (zero importers, bypassed audited disposition path) | `src/engines/AnomalyExplainer.ts`                                                        | 2026-10-17 00:35 |
| G-08 | Gate Verifier            | IDLE    | Seat departed; gate verification absorbed by LEAD (all ratchets green, see COMMS_LOG 2026-10-17)                  | released                                                                                                           | 2026-10-17 00:35 |
| G-09 | Financial Modeler        | IDLE    | Seat departed; fixture suite repaired by LEAD (`batchId`→`journalId`, 7/7) and landed; invented-API engine test deleted | released                                                                                                      | 2026-10-17 00:35 |
| G-10 | UI/UX Engineer           | DONE    | FR-008/FR-009: Exception review UI & disposition workflow alignment (#01a1458a-d675)                              | `src/components/exceptions/**`, `src/components/ai/AnomalyHighlight.tsx`, `src/components/ai/AnomalyHighlight.test.tsx` | 2026-10-16 17:30 |
| G-11 | Squad Coordinator        | IDLE    | Seat departed; board/claims/log sync absorbed by LEAD                                                             | released                                                                                                           | 2026-10-17 00:35 |
| F-01 | Freebuff partner         | DONE    | P0-3 FR-006 residual closed — hydrate invalid/missing-amount guard landed in `b8e50292`                           | released                                                                                                           | 2026-10-16 16:52 |

## Handoff rule

When a row flips to `DONE`, the matching `COMMS_LOG.md` entry must name: what changed, the
command that proves it, the commit, and what the next agent should verify first
(`TEMPLATES.md`).

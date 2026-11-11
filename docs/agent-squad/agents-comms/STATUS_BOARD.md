# Squad Status Board

> **Historical status snapshot — last updated 2026-10-18; not current assignments.** The
> listed seats, tasks, claimed paths, and states are dated squad records, not live work. Use or
> update this board only if a squad is explicitly activated; do not infer current ownership from
> it. Root `AGENTS.md`, active Arena instructions, and current mission state take precedence.

> The live "who is doing what". Edit **your own row only**; the lead may reassign rows.
> States: `ACTIVE` (slot live, no repo task yet) · `IDLE` · `WORKING` · `REVIEW` · `BLOCKED` · `DONE`.
> Keep it honest: if you stopped, say so and say where.

**Current priority block** (from [`../SQUAD_BACKLOG.md`](../SQUAD_BACKLOG.md)): P0 —
FR-008/FR-009 exception review path (versioned rule catalogue + persisted disposition), then
board-pack tie-out (**closed 2026-10-18**), then FR-006 residual. Pick the highest item you can
finish with evidence, and do not start a second item mid-flight.

| Seat | Member                   | State   | Task / remit                                                                                                      | Files claimed                                                                                                      | Updated (UTC)    |
| ---- | ------------------------ | ------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------- |
| LEAD | Buffy                    | WORKING | **Solo mode** (all Gemini seats departed 2026-10-17): P0 item 2 (board-pack tie-out) closed; P1 item 4 (six pages publishing a percentage as a currency cell) closed as a class the same day — one guard, **6 red → 6/6**; repaired a vacuous gate (`ratchet-docs-check.mjs` matched `--prose=` overrides with a hard-coded `/`, so on Windows it never read the file it was given — 3 of its 7 test cases could not fail); wrote the owner's goal + live queue into `docs/agent/WORKING_AGREEMENT.md`; next Q3 (accounts-team hand-off fields, FR-010) | `src/pages/reports/BoardPackPage.tsx`, `src/pages/reports/BoardPackPage.exportTieOut.test.tsx`, `docs/agent/09_KNOWN_GAPS.md`, `docs/agent/01_PROJECT_BRIEF.md`, `docs/agent/03_DOMAIN_RULES.md`, `docs/agent-squad/SQUAD_BACKLOG.md` | 2026-10-18 16:30 |
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

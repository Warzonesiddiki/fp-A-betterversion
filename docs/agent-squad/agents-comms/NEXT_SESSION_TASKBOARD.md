# FinPlan Pro — Next-Session Master Taskboard

> One task per row. Do not start a second task while one is unfinished. Each task must end in one of three ways: a commit with evidence, a BLOCK entry with a reproduction, or a DONE note explaining why the unit closed without code. Treat the completion target as a planning goal, not a number you can claim from the tree until the tree proves it.

## How to read this board

- The top section is the current priority spine. The rest is the full task inventory the incoming session should not lose.
- Every task lists: what it is, the files that matter, the acceptance bar, the verification command, and the honest failure mode if it cannot be finished.
- If a task depends on an owner decision in `docs/discovery/decision-log.md`, say exactly which decision and do not invent around it.
- If a task is blocked by a missing real artifact, mark it blocked and keep the boundary honest in code and docs.

---

## A. Restart hygiene, before any code

**Task A1 — Confirm environment state**

- What: re-derive the live state from the repo, not from memory.
- Files: `.git` state, `node_modules`, lockfile, `docs/agent-squad/agents-comms/NEXT_SESSION_HANDOVER_PROMPT.md`.
- Instructions:
  1. `git status --short`
  2. `git branch --show-current`
  3. `git log --oneline -8`
  4. if `node_modules` is missing or odd, `npm ci --ignore-scripts`
- Acceptance: you can state the current branch, any dirty paths, any local-only commits, and whether install is healthy.
- Verify first: `npm run tsc && npm run lint && npm run format:check` on the clean tree, with exit status captured.
- Honest failure mode: if the tree is dirty in a way you did not make, stop and record it before editing.

---

## B. Registrations and coordination setup

**Task B1 — Re-open the squad hub**

- What: the incoming session should be able to coordinate, even if solo.
- Files:
  - `docs/agent-squad/AGENT_JOIN_GUIDE.md`
  - `docs/agent-squad/SQUAD_STATE.md`
  - `docs/agent-squad/SQUAD_BACKLOG.md`
  - `docs/agent-squad/SQUAD_AGREEMENT.md`
  - `docs/agent-squad/agents-comms/README.md`
  - `docs/agent-squad/agents-comms/ROSTER.md`
  - `docs/agent-squad/agents-comms/STATUS_BOARD.md`
  - `docs/agent-squad/agents-comms/COMMS_LOG.md`
  - `docs/agent-squad/agents-comms/BLOCKERS.md`
  - `docs/agent-squad/agents-comms/CLAIMS.md`
  - `docs/agent-squad/agents-comms/TEMPLATES.md`
  - `docs/agent-squad/agents-comms/START_PROMPTS.md`
- Instructions:
  1. Read the hub files in that order.
  2. Re-affirm the session reality: solo mode, all Gemini seats departed.
  3. If you take a file, register the claim in `CLAIMS.md` before editing.
  4. If shared state changes, update `STATUS_BOARD.md` and `docs/agent-squad/SQUAD_STATE.md` and append a note in `COMMS_LOG.md`.
- Acceptance: you know who owns what, what is dirty, and where to append notes.
- Verify first: `npm run docs:links` after any doc edit.
- Honest failure mode: if you inherit an unclaimed file that is also dirty, do not silently overwrite it; record the collision and ask.

---

## C. Vote of no confidence on the starting gate

**Task C1 — Re-run the gate on the exact starting tree**

- What: before changing anything, confirm the starting gate state.
- Files: everything under `src/`, plus the doc-verify and engines-verify scripts.
- Instructions:
  1. `npm run tsc`
  2. `npm run lint`
  3. `npm run format:check`
  4. `npm run docs:verify`
  5. `npm run engines:verify`
  6. `npm run money:ast`
  7. `npm run determinism:ratchet`
- Acceptance: you have a reproducible starting snapshot of every gate you may be asked to defend later.
- Verify first: capture exit statuses, not just output text.
- Honest failure mode: if a gate is red, do not hide it by weakening an assertion. Name the cause or stop.

---

## D. Immediate documentation cleanup from the handoff

**Task D1 — Decide the fate of the F-02 verification note**

- What: the handoff left one dirty path: `docs/agent-squad/SQUAD_ACTIVITY_AND_TRACKER.md` with the F-02 note appended but not committed.
- Files:
  - `docs/agent-squad/SQUAD_ACTIVITY_AND_TRACKER.md`
  - `docs/agent-squad/agents-comms/NEXT_SESSION_HANDOVER_PROMPT.md`
- Instructions:
  1. Re-read the F-02 note and the handover prompt.
  2. Decide whether the incoming session wants that evidence committed as-is, refined, or folded into the next DONE note.
  3. If committed, update any other squad comms file that should mirror the same numbers, using the same command output, not memory.
- Acceptance: the F-02 evidence is either committed with a honest message, or deliberately left dirty with a note saying why.
- Verify first: `npm run docs:verify && npm run docs:links`.
- Honest failure mode: do not commit a doc that contradicts the code it describes.

**Task D2 — Publish the next-session prompt**

- What: make the handover prompt easy to reuse.
- Files:
  - `docs/agent-squad/agents-comms/NEXT_SESSION_HANDOVER_PROMPT.md`
- Instructions:
  1. Confirm the prompt references the real branch, the real dirty path, and the real local-only commits.
  2. Confirm it points the next session at the real backlog and decision log.
  3. If anything in the prompt is stale, correct the prompt, not the underlying repo.
- Acceptance: a fresh session can start from that file without reconstructing the state.
- Verify first: `npm run docs:links`.
- Honest failure mode: if the prompt claims a commit hash or file path that no longer exists, fix the prompt.

---

## E. Current priority spine (P0/P1), finishable-first

**Task E1 — FR-008/FR-009 final alignment**

- What: make the exception path a real governed workflow, not just an explainer and two stores that may not be fully wired.
- Files:
  - `src/store/exceptionRuleCatalogue.ts`
  - `src/store/exceptionRuleCatalogue.test.ts`
  - `src/store/exceptionDispositionStore.ts`
  - `src/store/exceptionDispositionStore.test.ts`
  - `src/store/exceptionPipeline.integration.test.ts`
  - `src/types/exceptions.ts`
  - `src/types/index.ts`
  - `src/components/exceptions/ExceptionReviewCard.tsx`
  - `src/components/exceptions/ExceptionReviewList.tsx`
  - `src/components/exceptions/ExceptionReviewCard.test.tsx`
  - `src/components/exceptions/ExceptionReviewList.test.tsx`
  - `src/components/ai/AnomalyHighlight.tsx`
  - `src/components/ai/AnomalyHighlight.test.tsx`
  - `src/engines/AnomalyExplainer.ts`
  - `src/engines/AnomalyExplainer.test.ts`
  - any page that should surface the review queue
- Instructions:
  1. Pick the highest unfinished alignment item you can finish end-to-end.
  2. Write a failing test first where behavior changes.
  3. Implement to the existing store patterns, not a new pattern you like better.
  4. Keep Rule 7 honest: a flag is a review candidate until human disposition; no flag becomes a confirmed error by default.
  5. Keep determinism clean; no `new Date()` / `Date.now()` in store or engine code.
  6. Keep money through `src/utils/money.ts`.
- Acceptance:
  - code in place
  - a test that fails without the change and passes with it
  - the relevant suite(s) green
  - `tsc`, `lint`, `format:check` green
  - `money:ast` and `determinism:ratchet` unchanged or better
  - docs updated if any surfaced claim changed
- Verify first:
  - `npx vitest run <affected files>`
  - `npx eslint <affected files>`
  - `npx prettier --check <affected files>`
  - `npm run money:ast`
  - `npm run determinism:ratchet`
- Honest failure mode: if the catalogue/disposition pieces are not finishable end-to-end this session, stop at the boundary and record exactly what is still missing.

**Task E2 — Board-pack tie-out to screen**

- What: a synthetic workspace export tied to the same numbers the UI shows.
- Files:
  - `src/services/export/boardPackTieOut.integration.test.ts`
  - the export code it touches
  - a concrete synthetic ledger fixture
  - the in-app view it claims to match
- Instructions:
  1. Choose one concrete synthetic ledger.
  2. Assert the export matches the in-app view for that ledger, not a hand-wavy assertion.
  3. Keep the tie-out honest about what it covers and what it does not.
- Acceptance:
  - a test that fails without the tie-out and passes with it
  - the export-to-screen agreement asserted, not implied
  - gates green
- Verify first:
  - `npx vitest run <the integration test>`
  - the lint/prettier/tsc gates for the files touched
- Honest failure mode: if the export is not yet wired to the same aggregates the screen shows, record that as the exact gap.

**Task E3 — FR-006 residual: confirm nothing was missed**

- What: make sure invalid/missing money cannot slip through any remaining non-validated write or hydrate path.
- Files:
  - `src/store/glStore.ts`
  - `src/store/glStore.server.test.ts`
  - `src/store/glStore.amountIntegrity.test.ts`
  - `src/store/glStore.provenance.test.ts`
  - `src/store/glStore.periodClose.test.ts`
  - `src/utils/money.ts`
  - any other non-validated mutation/hydrate path you can find
- Instructions:
  1. Enumerate every path that can create or mutate an amount.
  2. For each, confirm whether it validates or coerces.
  3. Where it coerces, add a failing test and then a guard, or document why that path is intentional and bounded.
  4. Do not weaken the existing guards to make the audit look clean.
- Acceptance:
  - a written or tested conclusion for each path found
  - no remaining silent coercion you can repro
- Verify first:
  - the glStore suites
  - `npm run money:ast`
- Honest failure mode: if a path is too large to finish, record the exact sub-paths completed and the sub-paths left.

**Task E4 — GLDataPreview honesty fix**

- What: make the preview summary agree with what it actually validates.
- Files:
  - `src/components/data/GLDataPreview.tsx`
  - `src/components/data/GLDataPreview.test.tsx`
  - `src/pages/data/GLUploadPage.interop.test.tsx`
- Instructions:
  1. Pick one contract:
     - either the summary states the limit exactly, e.g. “N errors detected in the first 20 of M rows”
     - or the validation window is widened so the summary and the check agree.
  2. Update the existing tests that assert the wording, or add a new test that forces the new contract.
  3. Confirm the late-row rejection behavior still works as intended.
- Acceptance:
  - the summary no longer states more than it validates, or it validates what it states
  - the existing GLUploadPage interop tests still pass after the change
- Verify first:
  - `npx vitest run src/components/data/GLDataPreview.test.tsx src/pages/data/GLUploadPage.interop.test.tsx`
- Honest failure mode: do not change the wording only in the test while leaving the component lying.
- **Status: DONE 2026-10-17 (LEAD).** Contract chosen: validate every row through `parseGLRows`
  (the import's parser); only the table is windowed at 20. Rows are numbered by source-file
  position, off-window rejected rows are listed with the importer's reason, and the scope line
  states the window exactly. Failing-first 8 red → `GLDataPreview.test.tsx` 26/26;
  `GLUploadPage.interop.test.tsx` 7/7 (source-row-26 block, store atomic rejection, corrected-file
  reprocessing).

---

## F. Coverage and consumer confidence

**Task F1 — Finish the GLUploadPage interop evidence lineage**

- What: if the incoming session left the F-02 note uncommitted, finish closing that loop.
- Files:
  - `src/pages/data/GLUploadPage.interop.test.tsx`
  - `src/pages/data/GLUploadPage.tsx`
  - `src/store/glStore.ts`
  - `docs/agent-squad/SQUAD_ACTIVITY_AND_TRACKER.md`
  - `docs/agent-squad/agents-comms/COMMS_LOG.md`
  - `docs/agent-squad/agents-comms/LATEST.md`
  - `docs/agent-squad/agents-comms/STATUS_BOARD.md`
  - `docs/agent-squad/SQUAD_BACKLOG.md`
- Instructions:
  1. Re-run the suite on the current files before you touch anything.
  2. If the F-02 note is committed, mirror the same measured numbers in the comms files that should carry them.
  3. If a number in a doc changed, run `npm run docs:verify` and update from script output.
- Acceptance:
  - the interop evidence is committed or deliberately deferred with a note
  - the comms files agree with the test result
- Verify first:
  - `npx vitest run src/pages/data/GLUploadPage.interop.test.tsx`
  - `npm run docs:verify && npm run docs:links`
- Honest failure mode: do not push a doc number that the script would reject.

**Task F2 — Re-confirm the touched consumer surfaces still agree**

- What: after any spine/store/import change, re-verify the surfaces the recent work touched.
- Files: the real suites that render or consume the touched components/pages/stores.
- Instructions:
  1. Pick the suites that actually use the changed contracts.
  2. Run them together, not in isolation.
  3. Record the exact tallies, not a summary word.
- Acceptance:
  - the touched surfaces still tell the same story as the store
- Verify first:
  - `npx vitest run <the relevant real suites>`
- Honest failure mode: if a change breaks a real consumer, fix the cause, not the test.

---

## G. Store and import integrity sweeps

**Task G1 — Enumerate every amount mutation/hydrate path in the store**

- What: produce a short, honest inventory of every place an entry amount can be set, changed, or hydrated.
- Files:
  - `src/store/glStore.ts`
  - `src/store/glStore.*.test.ts`
  - any service that writes entries
- Instructions:
  1. Grep for the mutation/hydration paths.
  2. For each, note whether it validates amounts and where rejections surface.
  3. Where evidence is missing, write a failing test or a clear open note.
- Acceptance:
  - a reproducible inventory plus the status of each path
- Verify first:
  - the glStore suites
  - `npm run money:ast`
- Honest failure mode: if you cannot finish the full inventory, record the paths covered and the paths left.

**Task G2 — Keep provenance and control totals honest across the touched paths**

- What: confirm provenance and control totals are still computed and shown consistently where they are claimed.
- Files:
  - `src/services/import/importProvenance.ts`
  - `src/services/import/parseGLRows.ts`
  - `src/services/import/d365Parser.ts`
  - `src/store/glStore.ts`
  - `src/components/data/GLDataPreview.tsx`
  - `src/pages/data/GLUploadPage.tsx`
  - any Done/history screen that renders batch evidence
- Instructions:
  1. Pick one import flow end to end.
  2. Confirm batch id, file hash, control totals, source rows, and scope are computed and shown.
  3. Confirm absent facts are shown as unavailable, not invented.
- Acceptance:
  - the flow you picked is honest and consistent
- Verify first:
  - the relevant interop or unit suites
- Honest failure mode: if a flow is only partially wired, say exactly which part is wired and which is not.

---

## H. Determinism, money, and fabrication discipline

**Task H1 — Keep money purity intact**

- What: no new float arithmetic on amounts.
- Files:
  - any file under `src/` you touch
  - `src/utils/money.ts`
- Instructions:
  1. Before claiming a money-adjacent change, run `npm run money:ast`.
  2. If unsafe ops appear, fix the cause.
- Acceptance:
  - `npm run money:ast` stays at 0 unsafe ops for the files you changed
- Verify first: `npm run money:ast`.
- Honest failure mode: do not add a suppressions or cast to make the detector quiet.

**Task H2 — Keep determinism intact**

- What: no new `new Date()` / `Date.now()` / unseeded randomness in engines, stores, services, utils.
- Files:
  - `src/utils/clock.ts`
  - anything under `src/engines/`, `src/store/`, `src/services/`, `src/utils/`
- Instructions:
  1. Before claiming a clock-adjacent change, run `npm run determinism:ratchet`.
  2. If the ratchet rises, fix the cause or stop.
- Acceptance:
  - `npm run determinism:ratchet` does not rise because of your change
- Verify first: `npm run determinism:ratchet`.
- Honest failure mode: do not update the baseline to hide a new site you introduced.

**Task H3 — Keep fabrication discipline intact**

- What: no invented financial numbers, no AI-estimated amounts, no mock data presented as real capability.
- Files:
  - any fixture or test data you add
  - any page or engine that renders financial figures
- Instructions:
  1. If you add a number, make it synthetic and explicitly synthetic, or derive it from a real contract.
  2. If a page currently pads with GL stats or hardcoded arrays, do not promote that as “working” capability.
- Acceptance:
  - you can point to the source of every figure you added
- Verify first: `npm run fabrication:audit` if the project uses it; otherwise at minimum `npm run money:ast`.
- Honest failure mode: if a page already fabricates, record it honestly rather than making the fabrication look like a feature.

---

## I. Full tree coverage pass, narrower where possible

**Task I1 — Run the relevant real suites after each code change**

- What: every code change should be re-verified against the real suites it could affect.
- Files: whatever you edited plus the real suites that consume it.
- Instructions:
  1. Prefer `npx vitest run <file-or-dir>` in the inner loop.
  2. If the change is wide, run `npm run test:sharded` with pipefail discipline.
  3. Do not quote “tests pass” unless you ran them.
- Acceptance:
  - the change is backed by the run you actually did
- Verify first: the exact vitest command with exit status captured.
- Honest failure mode: do not claim the full suite passed when you only ran a subset.

**Task I2 — Close the “test not found” rows that matter most**

- What: the capability matrix marks many routes as `BUILT — TEST NOT FOUND`. Pick the ones that matter for the spine and wired surfaces first.
- Files:
  - `docs/CAPABILITY_TRUTH_MATRIX.md`
  - the source files and any colocated tests for the routes you pick
- Instructions:
  1. Choose a small, high-value set of routes/components that are part of the spine or a currently wired surface.
  2. For each, either add a real test or record why one is not the right next action.
  3. Do not chase every matrix row at once; that is a program, not a session task.
- Acceptance:
  - the chosen rows have a clearer evidence state than before
- Verify first:
  - the new or updated tests you added
  - `npm run docs:verify` if you change any doc numbers
- Honest failure mode: do not mark a route as “covered” just because you opened the file.

---

## J. Documentation truth and link hygiene

**Task J1 — Keep doc numbers tied to scripts**

- What: any README or matrix number must survive `npm run docs:verify`.
- Files:
  - `docs/README.md`
  - `docs/CAPABILITY_TRUTH_MATRIX.md`
  - `docs/audit/ALL_IN_ONE_GAP_REPORT_2026-08-25.md`
  - the verification scripts under `scripts/`
- Instructions:
  1. If you change code that changes counts, run the verify scripts.
  2. Update doc numbers from script output, not from memory.
- Acceptance:
  - `npm run docs:verify` green after the change
- Verify first: `npm run docs:verify`.
- Honest failure mode: do not paper over a drift by editing the doc to a wrong number that fits.

**Task J2 — Keep doc links resolvable**

- What: every live doc link must resolve.
- Files: any doc that cites another file.
- Instructions:
  1. After adding or changing a citation, run `npm run docs:links`.
  2. Fix the citation, not the checker.
- Acceptance:
  - `npm run docs:links` green
- Verify first: `npm run docs:links`.
- Honest failure mode: do not cite a path that does not exist.

---

## K. Known gaps that the incoming session must not forget

**Task K1 — GLDataPreview overstatement**

- What: the preview says “N errors detected in M rows” while only validating the first 20.
- Files:
  - `src/components/data/GLDataPreview.tsx`
  - `src/components/data/GLDataPreview.test.tsx`
  - the interop test that works around it
- Status: **fixed 2026-10-17** (see Task E4). The count is exact because every row is validated;
  the 20-row limit is now only the display window and says so.

**Task K2 — masterStorage.test.ts never landed**

- What: the departed G-06 seat started but did not finish the offline/storage test suite.
- Files: `src/utils/masterStorage.test.ts` (225 lines; covers quota, corruption, migration paths).
- Status: **not a gap** — measured 2026-10-17: file exists, `npx vitest run
  src/utils/masterStorage.test.ts` → 9/9 green. The earlier "no file exists" note was stale.
- Instructions:
  1. Decide whether this is worth a session unit.
  2. If yes, write failing-first coverage that matches the storage contract the project already uses.
  3. If no, record why it is deferred.
- Acceptance:
  - either a landed suite with evidence, or a recorded deferral with a reason
- Verify first:
  - `npx vitest run <the new suite>` if created
- Honest failure mode: do not invent a test file that does not test the real storage contract.

**Task K3 — D365 support stays “expected, not verified”**

- What: the parser exists and is tested against its contract, but there is no real anonymized D365 export in hand.
- Files:
  - `src/services/import/d365Parser.ts`
  - `src/services/import/d365Parser.test.ts`
  - `docs/discovery/decision-log.md`
  - `docs/discovery/d365-export-contract.md`
- Status: DEC-001 still stands.
- Instructions:
  1. Do not claim verified D365 support.
  2. If a real anonymized sample arrives, verify against it.
- Acceptance:
  - the boundary is preserved in code and docs
- Verify first:
  - the d365 parser tests
  - `npm run money:ast`
- Honest failure mode: do not present generic CSV parsing as verified D365 support.

**Task K4 — Known sandbox caveat**

- What: this environment may run a newer Node than the project documents.
- Status: known.
- Instructions:
  1. If exactly three tests fail that mock `Storage.prototype`, treat that as the known Node-26 `localStorage` accessor conflict, not a regression.
  2. Do not weaken those tests to hide it.
- Acceptance:
  - you do not misattribute the known failure to current work
- Verify first: the failing test names and the command output.

---

## L. Finish-of-session discipline

**Task L1 — End every finished unit with evidence, not a status word**

- What: a unit is done only when it ends in a commit with evidence, a BLOCK entry with a reproduction, or a DONE note explaining why it closed without code.
- Files:
  - the changed source/test/doc files
  - `docs/agent-squad/agents-comms/COMMS_LOG.md`
  - `docs/agent-squad/SQUAD_STATE.md`
  - `docs/agent-squad/agents-comms/STATUS_BOARD.md`
  - `docs/agent-squad/agents-comms/CLAIMS.md`
- Instructions:
  1. Write the proof for each unit: what changed, the command that proves it, the commit, and what to verify first.
  2. Release claims when done.
  3. If you stopped mid-area, record exactly where.
- Acceptance:
  - the next session can resume from your notes without guessing
- Verify first: the exact commands and tallies you cite.

**Task L2 — Do not weaken a gate to make it green**

- What: if a check fails, fix the cause or stop and report.
- Files: whatever file is causing the failure.
- Instructions:
  1. Do not skip tests.
  2. Do not lower bars.
  3. Do not add `eslint-disable`, `as any`, or `@ts-expect-error` just to pass.
  4. If changing a check is required by the requested behavior, explain why and verify that behavior.
- Acceptance:
  - any red gate is explained honestly
- Verify first: the failing command and its output.
- Honest failure mode: if the fix is larger than the session can carry, record the cause and the exact remaining work.

---

## M. One-line resume prompt for the next session

If the next session wants the shortest possible opener, use this:

> Resume from `docs/agent-squad/agents-comms/NEXT_SESSION_HANDOVER_PROMPT.md`. Branch is `main`. The only dirty path right now is the uncommitted F-02 doc note in `docs/agent-squad/SQUAD_ACTIVITY_AND_TRACKER.md`; the code deliverables are committed locally but not pushed. Run `npm run tsc && npm run lint && npm run format:check` on the clean tree first, record the exits, then continue the highest finishable item from `docs/agent-squad/SQUAD_BACKLOG.md` with one item and one commit at a time, evidence for every claim, no gate weakened to pass it.

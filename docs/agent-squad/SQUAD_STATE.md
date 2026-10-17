# FinPlan Pro — Squad State

> Last updated: session handoff
> This file is a living record. Append a short note when the shared state changes; do not rewrite history.

## Mission for this session

Continue verified progress toward the all-in-one FP&A workspace under the zero-compromise
standard. The spine — import with provenance + control totals → trial balance → period close
guards → reviewed exception output — is the priority surface.

## Where we are

- Core spine is present and tested: GL import, provenance, duplicate/file-hash guard, period
  write guards on the local write paths, and a money-integrity guard on the GL store mutation
  paths.
- Rules-for-exceptions capability is partly present but not yet fully delivered as a governed
  review path. The anomaly explainer exists; the versioned rule catalogue and persisted
  disposition path are the remaining pieces to align with FR-008/FR-009.
- Export surfaces exist and are tested against synthetic ledgers; board-pack tie-out is the next
  evidence layer to tighten, not a new feature to invent.
- Documentation consolidation was already done. There is one authoritative live doc set.
- 3 tests fail in this sandbox for a known Node-version reason. They are not regressions from
  current work and must not be weakened.

## 2026-10-16 16:52 UTC — F-01: FR-006 hydrate residual closed

- `hydrateCommittedFromServer` now rejects provided-but-invalid and both-missing server amounts
  per row with a reason (guard reusing `finiteAmountIssues`, rejections surfaced on
  `importError`). Commits `b8e50292` (code+test) and `7632f95b` (register evidence).
  Evidence: `glStore.server.test.ts` 18/18, all 9 glStore suites 121/121, tsc clean,
  changed-file eslint exit 0, money:ast 0 unsafe, determinism holds at 344.
- `docs:verify` currently red with 3 count drifts (engine/stores/orphan) caused by the
  untracked FR-008/FR-009 WIP files, not by that change; the numbers are deliberately left
  for G-03/G-04 to re-run and update when their work lands (see the F-01 DONE note).
- Coordination flag: an uncommitted F-01 edit to `src/store/glStore.ts` was wiped mid-task by a
  concurrent action and re-applied; any seat running broad `git checkout`/`git stash` over `src/`
  should check for lost edits first (see `agents-comms/COMMS_LOG.md`).

## 2026-10-17 00:40 UTC — LEAD: solo mode; all Gemini seats departed

- Roster check (owner screenshot): every Gemini seat Idle. In-flight uncommitted WIP verified
  and landed by the lead in five commits (`21ef8ebf`, `1f4b896b`, `10dadb0f`, `1e9f3959`,
  `eb7c4880`) — see the SOLO MODE entry in `agents-comms/COMMS_LOG.md` for commands.
- The "docs:verify red" drift noted above is resolved: store count claims updated from script
  output (46 → 48 measured, 44 persisted via masterStorage).
- Three abandoned-work defects fixed at the cause (invented-API engine test deleted, fixture
  `batchId`→`journalId`, d365 float arithmetic → money primitive). End-of-session gates:
  tsc 0, lint 0, money:ast 0 unsafe, determinism holds 344/79, docs:verify 0, docs:links 0,
  engines:verify 0; orphaned-seat suites 9 files / 92 tests + exceptions components 2/2 green.
- Next lead unit: `GLUploadPage` interop test (last uncovered GL screen consumer).

## 2026-10-17 13:35 UTC — LEAD: P1-4 complete; two hidden defects fixed

- Fourth screen landed: `src/pages/data/GLUploadPage.interop.test.tsx` runs the real wizard
  against the real store — counts, cent-exact control totals, batch/SHA-256/source-row
  provenance (missing facts "not in file", never zero), FR-003 duplicate refusal, FR-002
  atomic whole-file rejection with row+reason on screen, preview gate. 5/5 (`c879d3e8`).
- `Alert` defect: display-only callers rendered nothing (only the Radix `open` path drew), so
  import-rejection reasons were invisible; the deep test mocked Alert. Red probe → 4 contract
  tests → inline `role="alert"` banner restored, dialog shape unchanged (`0751af7f`, 12/12,
  was 3 red).
- tokenBridge was already red on main from `1f4b896b`: exception components read
  `var(--surface-subtle)` / `var(--bg-base)` (declared nowhere) → mapped to declared
  `--bg-elevated` (`d5702168`, red → 152 green).
- Gates on final files: tsc 0, lint 0, format:check 0, money:ast 0 unsafe, determinism 344/79,
  docs:verify 0, docs:links 0/0, engines:verify 0; Alert-consumer suites 9 files/116 tests.
- Next lead unit: `masterStorage` test suite (G-06's abandoned remit — no file exists).

## What is blocked

- Anything that assumes a verified D365 schema or a real source sample without that sample
  being available in hand.
- Anything that broadens the product surface before the docs say the spine is allowed to expand.

## Shared rules for any agent touching this

- Read AGENT_JOIN_GUIDE.md before doing anything.
- No weakening of gates. No skipped tests. No `as any` or `@ts-expect-error` to pass a check.
- Evidence in the same commit as the change.
- One item per commit when you can.
- If you inherit a failing test for a reason you cannot explain, leave a note and do not mask it.

## Next pick-up points for any agent

- FR-008 / FR-009 completion path: versioned exception rule catalogue plus persisted disposition
  recording, tied back to the anomaly explainer and the existing GL/read surfaces.
- Tighten the existing export evidence so a synthetic-workspace board pack ties to the screen
  with a verifiable test, not a hand-wavy assertion.
- Reduce the outstanding known-gap surface that is already real and testable, rather than adding
  new surfaces.

## Current shared agreement

- We do not claim capabilities that the tree cannot prove.
- We do not invent external or AI-estimated financial numbers.
- We do not add new surface area that the docs forbid until the spine is officially green.

## Squad composition and comms hub (2026-10-16)

- Roster: 11 Gemini seats (`G-01`…`G-11`, coordinated by Aion CLI), 1 Freebuff partner seat
  (`F-01`), and the squad lead (`LEAD` — Buffy).
- The message bus is live at `agents-comms/`: protocol `agents-comms/README.md`, seats
  `agents-comms/ROSTER.md`, live status `agents-comms/STATUS_BOARD.md`, messages
  `agents-comms/COMMS_LOG.md`, blockers `agents-comms/BLOCKERS.md`, file claims
  `agents-comms/CLAIMS.md`, formats `agents-comms/TEMPLATES.md`; human-applied CI patches go
  to `agent-patches/`.
- Working rules recorded there: claim a seat, claim files before editing (one writer per file),
  evidence in every `DONE` note. FR-008/FR-009 remains the top backlog item and has unclaimed
  prior-session WIP in the working tree — see the leader notes in `agents-comms/COMMS_LOG.md`.
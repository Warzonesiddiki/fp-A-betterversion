# FinPlan Pro — Next-Session Master Handover Prompt

> Purpose: give the incoming session one self-contained brief so it can resume with
> almost no reconstruction work. Read this file first. It is the only prompt you
> should paste into the fresh session's first user message.

---

## 1. Where this picks up

- Project: FinPlan Pro — all-in-one FP&A desktop workspace (Tauri 2 shell,
  React 19 + TypeScript strict + Vite 8 + Tailwind 4 + Zustand/Immer).
- Current session branch: `main`.
- Current session reality: solo mode. All Gemini seats are departed. The lead
  (Buffy) is verifying and landing work alone.
- Code status at handoff: Tree is clean except ONE doc-only edit that is NOT
  yet committed and NOT pushed:
  - `docs/agent-squad/SQUAD_ACTIVITY_AND_TRACKER.md` — F-02 verification note
    appended. This is the only dirty path. Nothing in `src/` is dirty.
- Local-only commits that exist but are NOT pushed (this session's deliverables are in there):
  - `0751af7f` — fix(ui): Alert display-only usage rendered nothing — inline banner restored
  - `d5702168` — fix(theme): exception review components read declared surface tokens
  - `c879d3e8` — test(gl-upload): real-store interop suite for the import wizard (P1-4, fourth screen)
  - `dffe0aea` — docs(agent-squad): record the upload interop unit, Alert fix and tokenBridge repair
- Session mission left in place: continue verified progress toward the all-in-one
  FP&A workspace under the zero-compromise standard. The spine is the priority
  surface: import with provenance + control totals → trial balance → period close
  guards → reviewed exception output.

---

## 2. What was already done this session (evidence, not claims)

These are facts the incoming session should trust as already landed in the local
history unless a later tool proves otherwise. Do NOT re-derive them from memory;
re-run the commands if you want them fresh.

- **P1-4 fourth screen — `GLUploadPage` real-store interop test.**
  File: `src/pages/data/GLUploadPage.interop.test.tsx`.
  Behavior proven end to end through the real wizard and real store:
  - accepted counts with cent-exact control totals `1500.50 / 1500.50 / 0.00`,
  - batch id, file SHA-256, and source-row provenance rendered on the Done screen
    (entities and currencies honestly reported as "not in file", never zero),
  - byte-identical re-import refused with the prior batch id and zero financial
    effect (FR-003),
  - whole-file rejection naming `row 26: missing accountCode` with entries and
    history untouched (FR-002),
  - preview gate blocking a bad row inside its window.
  Test result this session: **5/5**.

- **Alert defect fixed at the cause.**
  File: `src/components/ui/Alert.tsx`.
  Problem: every display-only `<Alert>` caller in the app (GL upload import
  failures, BudgetCreatePage form errors, DataImportPage migration errors,
  ReconciliationPanel) passed only `title/message/type`, and the component only
  rendered its Radix dialog when `open` was passed — so those banners rendered
  nothing. A rejected source row computed its reason and the user never saw it
  (FR-002).
  Fix: display-only shape now renders an inline `role="alert"` banner, honoring
  the previously-dropped `type`/`className`; the confirmation-dialog path is
  untouched.
  Test result this session: **3 red → 12/12** in `src/components/ui/Alert.test.tsx`.

- **Pre-existing red gate repaired at the cause.**
  Files: `src/components/exceptions/ExceptionReviewCard.tsx`,
  `src/components/exceptions/ExceptionReviewList.tsx`.
  Problem: departed-seat commit `1f4b896b` left 6 undeclared CSS variable reads
  (`var(--surface-subtle)` / `var(--bg-base)`), so those panels/inputs rendered
  unstyled in both themes.
  Fix: mapped to the declared `--bg-elevated` (the same value the card already
  uses for its other inset boxes). No assertion changed.
  Test result this session: **red → 152 green** across theme + exception suites.

- **Squad docs updated with the exact measured numbers from this session.**
  Files: `docs/agent-squad/agents-comms/LATEST.md`,
  `docs/agent-squad/agents-comms/COMMS_LOG.md`,
  `docs/agent-squad/STATUS_BOARD.md`,
  `docs/agent-squad/SQUAD_STATE.md`,
  `docs/agent-squad/SQUAD_BACKLOG.md`.

- **Doc gate fix made separately this session.**
  Commit: `6cb5da54` — `docs(agent-squad): fix the strict citation path in the lead pointer`.

---

## 3. The exact verification run the incoming session inherits

This session ran the relevant suite subset, not the full sharded suite. The
subset was chosen because it covers every file actually touched by the edited
components and pages, plus the materials the F-02 verification note cites.

Commands run this session on the current files (exit status captured with
`set -o pipefail`):

- `npx tsc` → **EXIT 0**
- `npx vitest run src/pages/data/GLUploadPage.interop.test.tsx` → **5/5**
- `npx vitest run src/components/ui/Alert.test.tsx` → **12/12**
- `npx vitest run src/components/exceptions/` → **9/9**
  - `ExceptionReviewList.test.tsx` 4/4
  - `ExceptionReviewCard.test.tsx` 5/5
- `npx vitest run src/pages/data/GLUploadPage.test.tsx src/pages/data/GLJournalsPage.interop.test.tsx src/pages/data/GLExplorerPage.interop.test.tsx src/pages/data/GLTrialBalancePage.test.tsx src/components/index.test.tsx src/engines/AnomalyExplainer.integration.ts` → **16/16**
  - `GLUploadPage.test.tsx` 4/4
  - `GLJournalsPage.interop.test.tsx` 4/4
  - `GLExplorerPage.interop.test.tsx` 3/3
  - `GLTrialBalancePage.test.tsx` 5/5
  - component barrel index 4/4
  - `AnomalyExplainer.integration.ts` — 0 importers, already removed from tree
- Combined re-verification of the exact deliverable suite set:
  `npx vitest run src/pages/data/GLUploadPage.interop.test.tsx src/components/ui/Alert.test.tsx src/components/exceptions/`
  → **26/26** across 4 test files.

Held-from-prior-session gates that were NOT rerun this session because nothing
in the edited files could have moved them (still green according to the local
history and the tree's state at handoff):
- `npm run money:ast` — 0 unsafe ops
- `npm run determinism:ratchet` — 344 sites / 79 files
- `npm run docs:verify` — 0
- `npm run docs:links` — 0 broken
- `npm run engines:verify` — EXIT 0

---

## 4. Honest limitations and gaps that still exist now

Do not pretend any of these were fixed. They are real and the incoming session
should treat them accordingly.

1. **The F-02 verification note was written but NOT committed and NOT pushed.**
   The only dirty path right now is
   `docs/agent-squad/SQUAD_ACTIVITY_AND_TRACKER.md`. If the incoming session
   wants the F-02 evidence in version control, it must be committed and then
   pushed if the user wants it pushed. The code deliverables themselves are
   already committed locally.

2. **`GLDataPreview`'s error-count summary is overstated.**
   File: `src/components/data/GLDataPreview.tsx`.
   Observed behavior: the component says "N errors detected in 25 rows" while
   it only validates the first 20. The late-row rejection interop test works
   around this by relying on import-time validation for the row past the window.
   This is out of scope for F-02, not fixed, and still a quiet inaccuracy of the
   kind the mission forbids. The incoming session should either make the summary
   state the limit exactly, or make the validation window and the summary agree.

3. **The full sharded suite was NOT run this session.**
   The incoming session should decide whether the change set is large enough to
   justify `npm run test:sharded`, and if so, run it with the pipefail discipline
   this project uses. "Tests pass" is only true for the run you actually did.

4. **D365 support is still "expected, not verified".**
   No real anonymized D365 export is in hand. DEC-001 still stands. The
   `d365Parser` exists and is tested against its contract, but the project must
   not claim verified D365 support without a real sample.

5. **The `masterStorage.test.ts` unit never landed.**
   The departed G-06 seat started it and did not finish it; the file does not
   exist. The incoming session can pick it up as a finishable unit if it wants
   one more concrete coverage item, or can leave it as a documented gap with a
   CLAIM cleared.

6. **Known sandbox caveat still applies.**
   This environment can run a Node version newer than what the project documents.
   If exactly three tests fail that mock `Storage.prototype`, that is the known
   Node-26 `localStorage` accessor conflict, not a regression from current work.
   Do not weaken those tests to hide it.

---

## 5. The authoritative instruction hierarchy (do not flatten this)

The incoming session must read these in this order and treat later docs as
pointing here, not overriding it:

1. `AGENTS.md`
2. `docs/README.md`
3. `docs/agent/09_KNOWN_GAPS.md`

Then the living plan materials:

- `docs/VISION.md` — product goal and module map
- `docs/discovery/requirements-register.md`
- `docs/discovery/decision-log.md`
- `docs/discovery/roadmap.md`
- `docs/audit/` — the measured audit
- `docs/CAPABILITY_TRUTH_MATRIX.md`
- `docs/audit/ALL_IN_ONE_GAP_REPORT_2026-08-25.md`

Then the squad coordination hub:

- `docs/agent-squad/AGENT_JOIN_GUIDE.md`
- `docs/agent-squad/SQUAD_AGREEMENT.md`
- `docs/agent-squad/SQUAD_STATE.md`
- `docs/agent-squad/SQUAD_BACKLOG.md`
- `docs/agent-squad/agents-comms/` — README, ROSTER, STATUS_BOARD, COMMS_LOG,
  BLOCKERS, CLAIMS, TEMPLATES, START_PROMPTS

Architecture, domain rules, data model, testing, definition of done, and
commands-and-gates still live under `docs/agent/`:

- `docs/agent/02_ARCHITECTURE.md`
- `docs/agent/03_DOMAIN_RULES.md`
- `docs/agent/04_ENGINEERING_RULES.md`
- `docs/agent/05_COMMANDS_AND_GATES.md`
- `docs/agent/06_TESTING.md`
- `docs/agent/07_WORKFLOW_AND_DOD.md`
- `docs/agent/08_DATA_MODEL.md`

---

## 6. The project's non-negotiable rules, verbatim short list

1. **Measured, or not stated.** Any claim needs the command that produced it.
2. **Nothing is done without evidence.** Done = code + a test that fails without
   the change + gates green + docs updated in the same commit.
3. **Money goes through one primitive.** `src/utils/money.ts` (decimal.js).
   Never add float arithmetic on amounts. `npm run money:ast` must stay at 0
   unsafe ops; `npm run money:adoption` must not fall.
4. **Deterministic.** Time comes from `src/utils/clock.ts`, never
   `new Date()` / `Date.now()` in engines, stores, services, utils. Randomness
   is injected and seeded. `npm run determinism:ratchet` must not rise.
5. **Nothing silently discarded.** Every rejected import row has a row number, a
   code and a reason; every batch has a content hash, a batch id and control
   totals; every entry has provenance.
6. **Missing is not zero.** Never render a KPI from absent inputs as 0 or a
   default. Say "not in file" / "unavailable" and why.
7. **A potential exception is never an error.** Flags are review candidates with
   a rule id and evidence; only a human disposition makes them wrong.
8. **No new surface before the spine works.** No new routes, pages, engines,
   stores, sector packs or connectors until Gate 2 of
   `docs/discovery/roadmap.md` is green. Wire or delete; do not add.
9. **No egress by default.** No network calls, telemetry, or AI provider calls
   unless behind an explicit allow-listed, user-initiated path.
10. **Do not weaken a gate to pass it.** No skipping tests, lowering bars,
    `eslint-disable`, `as any`, or `@ts-expect-error` to make something green.
11. **One source of truth per fact.** If a number/rule lives in two places,
    delete one or make a script assert equality.
12. **Owner decisions are not yours.** Open decisions in
    `docs/discovery/decision-log.md` are the owner's. Implement around them,
    never through them. If blocked, say exactly which decision blocks you.

---

## 7. Commands the incoming session will actually use

| Command | Purpose |
| --- | --- |
| `npm ci --ignore-scripts` | install from lockfile if `node_modules` is missing or odd |
| `npm run tsc` | type check |
| `npm run lint` | ESLint, zero warnings |
| `npm run format:check` / `npm run format` | Prettier on `src/**` |
| `npx vitest run <file-or-dir>` | targeted tests (preferred inner loop) |
| `npm run test:sharded` | full suite in 8 shards, use on < 8 GB RAM |
| `npm run test` | full suite in one process, needs 8 GB heap |
| `cd server && npm test` | server suite |
| `npm run docs:verify` | README numbers, persistence map, schema homes |
| `npm run docs:links` | every live doc link resolves |
| `npm run money:ast` / `npm run money:adoption` | money ratchets |
| `npm run determinism:ratchet` | wall-clock/random ratchet (`--list`, `--update`) |
| `npm run engines:verify` | engine manifest current |
| `node scripts/verify-readme-stats.mjs --list` | reachable vs orphan engines |
| `npm run check` | the whole gate, honest exit code |

If a filtered pipeline is used to inspect test or build output, preserve the
tested command's exit status (Bash pipefail or explicit status capture). A
successful output filter is not a passing test.

---

## 8. The incoming session's next-session target, exactly as the user framed it

The user's explicit direction for the next fresh session is:

- The next session should target covering about **90% completion** of the project.
- It should aim to complete **100% of the coding**, with **zero compromises and
  no flaws**.
- The next session is to be **100% focused on coding all areas** of the project
  and completing the coding everywhere.

How to interpret that without lying to yourself:

- "90% completion" is a planning target, not a grade you can claim from the tree
  unless the tree can prove it. Do not narrate completion as if the number were
  already measured. Treat it as: get the documented spine and the documented gap
  list as far toward done as one session can carry with evidence.
- "100% coding with zero compromises" does not mean "ship fast and smooth over
  anything weak." In this project it means the opposite: every area you touch
  should be coded to the actual gates — failing-first tests, real contracts,
  money purity, determinism, provenance, missing-not-zero, no silent discards,
  no new surface before the spine is allowed, no weakening a gate to pass it.
- "Cover all areas" should mean "cover the areas that exist and are testable in
  this tree," not "invent every surface the product could one day have." Use the
  current measured map: `docs/CAPABILITY_TRUTH_MATRIX.md` and
  `docs/audit/ALL_IN_ONE_GAP_REPORT_2026-08-25.md`.
- If the incoming session cannot finish an area end-to-end with evidence, it
  should stop that area and record exactly where it stopped, rather than leave it
  half-asserted as done.

---

## 9. Recommended next-session working order

Suggested, not mandatory:

1. **Restart hygiene.**
   - `git status`
   - `git branch --show-current`
   - if `node_modules` is missing, `npm ci --ignore-scripts`
   - note any leftover dirty paths before touching anything

2. **State the inherited truth in one paragraph.**
   - The only dirty path is the uncommitted F-02 doc note.
   - The code deliverables (Alert, exception components, GLUploadPage interop)
     are already committed locally but not pushed.
   - The open session target is: finish the documented spine and gap list toward
     ~90% completion with zero-compromise coding across all existing areas, with
     evidence for every claim.

3. **Pick the highest finishable unit from `SQUAD_BACKLOG.md` and run it
   one item at a time, one commit at a time.**
   - Prefer the current P0/P1 order in that file unless a decision-log decision
     changes it.
   - Do not start a second unit mid-flight.

4. **For every code change, run the gate discipline locally before claiming it.**
   - At minimum: `npm run tsc`, `npm run lint`, `npm run format:check`, plus the
     narrowest relevant test file(s).
   - For anything import-, money-, or store-adjacent, also run
     `npm run money:ast` and `npm run determinism:ratchet`.

5. **End the session by writing the evidence the same way this session did.**
   - File the proof in the squad comms files and/or the activity tracker.
   - Use exact command output, exact test tallies, and exact commit hashes.
   - Do not claim a capability unless the tree can reproduce it.

---

## 10. Handover checklist for the incoming session

Before the first code edit, the incoming session should be able to say yes to all
of these:

- [ ] Read `AGENTS.md`, then `docs/README.md`, then `docs/agent/09_KNOWN_GAPS.md`.
- [ ] Read `docs/VISION.md`, `docs/discovery/requirements-register.md`,
      `docs/discovery/decision-log.md`, and `docs/discovery/roadmap.md`.
- [ ] Read `docs/agent-squad/AGENT_JOIN_GUIDE.md` and `docs/agent-squad/SQUAD_BACKLOG.md`.
- [ ] Confirmed current branch, clean/dirty state, and any local-only commits.
- [ ] Confirmed `node_modules` is healthy or reinstalled it.
- [ ] Re-ran the gate once on the clean tree (`npm run tsc && npm run lint &&
      npm run format:check`) and recorded the result.
- [ ] Understood that the only uncommitted change right now is the F-02 doc note
      in `SQUAD_ACTIVITY_AND_TRACKER.md`.
- [ ] Understood the next-session target as written in section 8, including the
      caveat that "completion %" is a planning target until the tree proves it.

---

## 11. What to hand back at the end of the next session

When the next session finishes, the handback should include:

- what was done, file by file
- the exact commands and test tallies that prove each unit
- what still depends on a human decision
- what the next session should verify first
- whether anything was pushed, and if so, from which branch
- whether any gate was NOT run, and why

---

## 12. One-sentence session-start prompt

If the user just wants a single ready-to-paste opener for the fresh session,
this is the compact version:

> Resume the FinPlan Pro solo session from the handover in
> `docs/agent-squad/SQUAD_ACTIVITY_AND_TRACKER.md`. Read `AGENTS.md` first, then
> `docs/README.md`, then the backlog at `docs/agent-squad/SQUAD_BACKLOG.md`.
> Current branch is `main`; the only dirty path right now is the F-02 doc note
> in `SQUAD_ACTIVITY_AND_TRACKER.md`; the code deliverables from this session
> are committed locally but not pushed. Mission for the fresh session: finish the
> documented spine and gap list toward ~90% completion with zero-compromise coding
> across all existing areas, one item and one commit at a time, with evidence for
> every claim and no gate weakened to pass it. Start by confirming git status,
> branch, and `node_modules`, then run `npm run tsc && npm run lint &&
> npm run format:check` on the clean tree and record the result.

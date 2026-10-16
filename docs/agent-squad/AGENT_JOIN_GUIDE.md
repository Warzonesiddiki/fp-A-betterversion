# FinPlan Pro — Agent Squad Coordination Hub

> **Branch:** `main` · **repo:** FinPlan Pro (all-in-one FP&A desktop workspace)
> **Project goal:** one trusted workspace that carries a finance team from raw GL import to
> reviewed, board-ready output, with zero compromises on the measured standards.

## Quick join checklist

1. Read this file fully before touching anything.
2. Claim/confirm your seat in `agents-comms/ROSTER.md` and post a `JOIN` note in
   `agents-comms/COMMS_LOG.md` (protocol: `agents-comms/README.md`).
3. `git status`, then `git pull` if other agents have committed.
4. If `node_modules` is missing or odd, run `npm ci --ignore-scripts` first.
5. Run the gate before landing code: `npm run tsc && npm run lint && npm run format:check`.
6. Add or update tests that fail without the change you are making.
7. Commit per item with evidence in the same commit; do not leave TODOs silently.
8. Update this hub if the squad's shared state changes (what is being worked, what is blocked).

## Where everything lives

```
docs/agent-squad/
  AGENT_JOIN_GUIDE.md      this file
  SQUAD_STATE.md           shared living state: current mission, active work, blockers
  SQUAD_AGREEMENT.md       how agents coordinate, conflict rules, commit discipline
  SQUAD_BACKLOG.md         prioritized next work for any agent to pick up
  agents-comms/            the squad's message bus (the repo IS the channel)
    README.md              the communication protocol — read at session start
    ROSTER.md              seats: 11 Gemini + 1 Freebuff partner + the lead
    STATUS_BOARD.md        who is working on what, right now
    COMMS_LOG.md           append-only messages, newest at the bottom
    BLOCKERS.md            open blockers and the decision each needs
    CLAIMS.md              one-writer-per-file claims
    TEMPLATES.md           copy-paste note formats
    START_PROMPTS.md       canonical start prompts for new members
  agent-patches/           patches for a human to apply (CI workflows, deps)
```

## Squad composition (owner roster, 2026-10-16)

- **11 Gemini seats** (`G-01`…`G-11`) — Aion CLI (G-01) coordinates the Gemini team and gates
  its tasks.
- **1 Freebuff partner seat** (`F-01`).
- **Squad lead** (`LEAD`, Buffy) — assigns work, arbitrates after evidence, owns
  `agents-comms/STATUS_BOARD.md` and `SQUAD_STATE.md`.

Seats, remits and live status: `agents-comms/ROSTER.md` and `agents-comms/STATUS_BOARD.md`.

Project-level instructions that still win over anything else in the repo:
- `AGENTS.md`
- `docs/agent/00_INDEX.md`
- `docs/agent/09_KNOWN_GAPS.md`

Plan of record for product scope and decisions:
- `docs/discovery/requirements-register.md`
- `docs/discovery/decision-log.md`
- `docs/discovery/roadmap.md`

What actually exists right now (measured):
- `docs/CAPABILITY_TRUTH_MATRIX.md`
- `docs/audit/ALL_IN_ONE_GAP_REPORT_2026-08-25.md`

## Current mission (this session)

Ship verified increments toward the all-in-one FP&A vision without weakening any gate.
The immediate highest-value work is the documented gap list, not random feature expansion.

Priority order (may change only with a note in SQUAD_BACKLOG.md):
1. FR-001 to FR-006 acceptance work that is still outstanding and testable
2. Gate 2–4 spine work: import → control totals → trial balance → close → exception review
3. Verified export tie-out against what the UI already shows
4. Real-source-dependent items only after a real or clearly synthetic sample is in hand

Do not start a new surface until the docs say it is allowed. The product handbook says:
no new routes, pages, engines, stores, sector packs or connectors until Gate 2 is green.
Wire or delete; do not add.

## Coding rules you must not relax

1. **Measured, or not stated.** Any claim needs the command that produced it.
2. **Nothing is done without evidence.** Done = code + a test that fails without it + gates
   green + docs updated in the same commit.
3. **Money goes through one primitive.** `src/utils/money.ts` (decimal.js). No float
   arithmetic on amounts. `npm run money:ast` must stay at 0 unsafe ops.
4. **Deterministic.** Time comes from `src/utils/clock.ts`; randomness is injected and seeded.
   `npm run determinism:ratchet` must not rise.
5. **Nothing silently discarded.** Rejected rows have a row number, code, and reason; batches
   have content hash, batch id, and control totals; entries have provenance.
6. **Missing is not zero.** Absent inputs render as unavailable, with a reason, not as 0.
7. **A potential exception is never an error.** Flags are review candidates with a rule id and
   evidence; only a human disposition makes them wrong.
8. **No new surface before the spine works.** See above.
9. **No egress by default.** No network calls, telemetry, or AI provider calls unless behind an
   explicit allow-listed, user-initiated path.
10. **Do not weaken a gate to pass it.** No skipped tests, lowered bars, `as any`, or
    `@ts-expect-error` to make something green. Fix the cause or stop and report.
11. **One source of truth per fact.** If a number or rule lives in two places, delete one or
    assert equality.
12. **Owner decisions are not yours.** DEC-001…DEC-012 in `docs/discovery/decision-log.md` are
    open or owner-delegated. Implement around them, never through them.

## Git and commit discipline

- Work on `main` only for this session unless the squad agrees otherwise in SQUAD_AGREEMENT.md.
- One logical item per commit.
- Commit message should say why, not just what.
- Do not push unless a human asked for it.
- Prefer `git commit -am` when the change is self-contained and safe.
- Do not commit sensitive values. The pre-commit hook scans for key material.

## Required checks before claiming work

Minimum for any code change:
- `npm run tsc`
- `npm run lint`
- `npm run format:check`
- the narrowest relevant test file(s) after the change

Strongly preferred for anything money-adjacent, import-adjacent, or store-adjacent:
- `npm run money:ast`
- `npm run determinism:ratchet`
- targeted `npx vitest run <file>` for the affected suite(s)

Full suite is large; use `npm run test:sharded` when the change is wide and you can afford
the time. Do not quote “tests pass” without the run that backs it.

## Known environment caveat

This sandbox can run a Node version newer than what the project documents. If you see three
tests fail that mock `Storage.prototype`, that is the known Node-26 `localStorage` accessor
conflict, not a regression from your work. Do not weaken those tests to hide it. The honest fix
is the documented Node target or a deliberate re-target of the spy.

## Inter-agent coordination rules

- The protocol is `agents-comms/README.md`: read it at session start; post START / PROGRESS /
  BLOCK / DONE notes; claim files before editing (one writer per file).
- If you are about to change the same file another agent just touched, read their commit and the
  corresponding note in `agents-comms/` first.
- If two agents want the same change, the one with the stronger test evidence wins; if still tied,
  leave a note in `agents-comms/` and do not silently overwrite.
- If an agent lands something that breaks a later agent's work, the first agent should have left a
  note and run the narrow tests for the touched surface.
- Prefer small, verifiable commits over one large “finished” commit.
- When in doubt about scope, stop and write the question in `agents-comms/` instead of guessing.

## Where to start if you want to help fastest

Pick one item from `docs/agent-squad/SQUAD_BACKLOG.md` that you can finish end-to-end with
tests and evidence, then commit it and append a one-line note to `agents-comms/` and update
SQUAD_STATE.md.

If you are unsure which backlog item is real, do not start it. Ask in `agents-comms/` with the
decision it depends on.

## Quality bar for claiming a capability

Before any agent claims a capability exists, it should be reproducible from the tree and tied to
evidence. Grades mean something in this repo:

- **BUILT** — source exists.
- **CONNECTED** — uses a real contract/data and handles loading, empty, and error states.
- **GOVERNED** — auth, validation, audit, and entity/period scope are enforced where relevant.
- **ENTERPRISE-READY** — governed and operationally fit for a supported workflow.

A blank or `UNVERIFIED` grade is not a failure. It is a prohibition on claiming more.

## Handover format for agent-to-agent continuity

When you finish a chunk of work, leave in `agents-comms/`:
- what you did
- what evidence you have
- what still depends on a human decision
- what the next agent should verify first

If the work changes any doc number, update the doc from the script output, not from memory.

## Non-goals for this session

- Do not invent external exports, ERP write-back, or AI-generated financial numbers.
- Do not add cloud sync, multi-tenant login, or real-time collaboration unless the squad
  explicitly agrees and a human approves the data boundary.
- Do not advertise generic CSV as verified D365 support unless a real anonymized sample is in hand.

## Bottom line

Good agent work here looks like: small, tested, evidence-backed commits that move the documented
gap list, not the gap list itself. If you cannot prove it from the tree, say so plainly.
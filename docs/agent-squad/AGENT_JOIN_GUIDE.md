# FinPlan Pro — Agent Squad Coordination Hub

> **Branch:** environment/session-specific; follow the current repository instructions and never infer a branch from this historical squad guide.
> **Project goal:** one-stop, all-in-one FP&A across trusted data intake, close,
> planning, analysis, correction review and reporting; the owner's D365 export
> is the first real-source proof, while DEC-104 accepts user-mapped templates
> for other accounting/finance sources and the long-term product is industry-extensible.
> This is the north-star, not current universal-provider or industry certification.
>
> **Squad-corpus caution:** this directory contains historical multi-agent
> roster/log/prompt records. Use its coordination files only if the squad is
> explicitly active. Root `AGENTS.md`, the current Arena branch constraints,
> `docs/agent/WORKING_AGREEMENT.md`, and the master product plan take precedence.

## Quick join checklist

1. Read this file fully before touching anything.
2. Claim/confirm your seat in `agents-comms/ROSTER.md` and post a `JOIN` note in
   `agents-comms/COMMS_LOG.md` (protocol: `agents-comms/README.md`).
3. Check the active branch and `git status`; do not switch branches or pull unless the current session instructions explicitly permit it.
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
  SQUAD_BACKLOG.md         historical queue snapshot; not the live work list
  agents-comms/            the squad's message bus (the repo IS the channel)
    README.md              the communication protocol — read at session start
    ROSTER.md              seats: 11 Gemini + 1 Freebuff partner + the lead
    STATUS_BOARD.md        who is working on what, right now
    COMMS_LOG.md           append-only messages, newest at the bottom
    BLOCKERS.md            open blockers and the decision each needs
    CLAIMS.md              one-writer-per-file claims
    TEMPLATES.md           copy-paste note formats
    START_PROMPTS.md       historical 2026-10-16 prompt snapshots (do not paste as current instructions)
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

Plan and product authority:
- `docs/VISION.md` — product north-star and scope
- `docs/discovery/MASTER_PRODUCT_AND_EXECUTION_PLAN.md` — detailed proposal for owner review
- `docs/discovery/requirements-register.md` — requirements and evidence status
- `docs/discovery/decision-log.md` — accepted decisions and open owner inputs
- `docs/discovery/roadmap.md` — high-level gates linked to the master plan

What actually exists right now (measured):
- `docs/CAPABILITY_TRUTH_MATRIX.md`
- `docs/audit/ALL_IN_ONE_GAP_REPORT_2026-08-25.md`

## Current mission (this session)

Ship evidence-backed increments toward the all-in-one vision without weakening any gate. Follow the detailed proposed sequence in `docs/discovery/MASTER_PRODUCT_AND_EXECUTION_PLAN.md`; do not expand into unranked feature work.

Priority order (changes require owner/lead review and a note in SQUAD_BACKLOG.md):
1. Review and align current documentation to the 2026-11-04 owner direction.
2. Converge the existing GL upload mapping profiles and DEC-104 universal template engine into one user-facing import/validation contract.
3. Reconcile owner D365 export shapes to anonymized samples and source control totals when available.
4. Validate the real J2/J3/J4 review, correction and comparison workflow; then prioritize APIs, broader FP&A and industry packs by user evidence.

Do not start an unplanned surface. DEC-104's user-mapped universal import is
explicit foundation work, not a feature expansion to block. Other provider APIs
and industry packs follow the master plan's canonical-contract, owner-priority,
and evidence gates. Code presence never earns a support claim.

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
8. **No unplanned surface expansion; follow the current master plan's dependency gates.** Universal template/import convergence is accepted foundation work under DEC-104.
9. **No egress by default.** No network calls, telemetry, or AI provider calls unless behind an
   explicit allow-listed, user-initiated path.
10. **Do not weaken a gate to pass it.** No skipped tests, lowered bars, `as any`, or
    `@ts-expect-error` to make something green. Fix the cause or stop and report.
11. **One source of truth per fact.** If a number or rule lives in two places, delete one or
    assert equality.
12. **Owner decisions are not yours.** The current `docs/discovery/decision-log.md` records accepted decisions and open owner inputs. Implement around them, never through them; the detailed product proposal does not itself supersede an accepted decision.

## Git and commit discipline

- Follow `AGENTS.md` and the active Arena session's branch constraints; never infer or change the tracked branch from this guide.
- One logical item per commit when commits are requested.
- Commit message should say why, not just what.
- Push only to the active session branch and only when permitted by the session instructions.
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
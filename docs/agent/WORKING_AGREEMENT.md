# Working agreement — the owner's goal, and how FinPlan Pro gets built

> **Owner-stated, 2026-10-18.** This is the document an agent session follows
> while working on FinPlan Pro. It owns exactly three things:
>
> 1. the goal **as the owner stated it** (verbatim, not paraphrased),
> 2. the bar a work item must clear before it counts as done,
> 3. the ordered queue I work in, with the evidence that closes each item.
>
> It owns nothing else. Rules are [`AGENTS.md`](../../AGENTS.md); requirements and
> acceptance criteria are
> [`../discovery/requirements-register.md`](../discovery/requirements-register.md);
> decisions are [`../discovery/decision-log.md`](../discovery/decision-log.md);
> the measured state of the code is [`09_KNOWN_GAPS.md`](09_KNOWN_GAPS.md); the
> gated delivery sequence is [`../discovery/roadmap.md`](../discovery/roadmap.md).
> Where any of those disagree with this file, they win and this file is the bug.

---

## 1. The goal, in the owner's words

> "all in one fp&a tool/app a one stop solution for fp&a
> also i am using dynamic 365 where i export all data gl dump and use it to work
> also i have to identify the wrong entries and guide accounts team to fix it
> i want this project to help me with that also
> as i compare day by day, month by month, year on year compariosion where i
> compare and check each and everything in extreme detail but now i want this
> tool to help me with this task"

Read literally that is **four jobs, in the owner's order**. Nothing in this file
narrows them. Every queue item in §4 names the job it serves.

**J1 — one D365 GL dump in, one workspace out.**
**J2 — find the wrong entries.**
**J3 — guide the accounts team to fix them.**
**J4 — compare day / month / year in extreme detail.**

## 2. Where the tree actually stands on each job (measured)

This table began as a code-state snapshot on 2026-10-18. The correction-workflow update dated 2026-10-20 is reflected in J3/Q3 below and supersedes earlier J3 status wording.
In this table, "exists" means a test in this tree exercises the capability; "missing" means no code path performs the job yet.

| Job    | What exists today                                                                                                                                                                                                                                                                                                                                                   | What is missing                                                                                                                                                                                                                                                                                                                                                   | Evidence that would close it                                                                                                                                                                         |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **J1** | The upload wizard auto-maps the two standard D365 GL shapes (F&O `GeneralJournalAccountEntryEntity`, Business Central `G/L Entries`); one parser (`parseGLRows`) serves both the preview gate and the import; a batch carries id, file hash, source-row provenance, scope and cent-exact control totals; trial balance and the statement views read the same store. | No **real** export has ever been imported: every D365 claim rests on synthetic fixtures, and DEC-001 still owns which export is _supported_ and its data scope. The export's own control totals (the ones the owner reads out of D365) cannot be reconciled against yet.                                                                                          | The owner supplies one anonymized or clearly synthetic shaped export; import it end to end; the owner's D365-side control total reconciles to the batch's control totals to the cent.                |
| **J2** | A versioned exception rule catalogue exists (FR-008): findings carry a rule id, evidence and a canonical key; the domain rule that a flag is a **review candidate, never an error** until a human disposition is enforced in the store (rule 7).                                                                                                                    | No screen renders the queue. The catalogue has **no consumer**, so today the owner cannot see a single finding. A page consumer is a new surface, which Gate 2 blocks until the spine runs on a real file — and _which_ surface comes first is DEC-002, an owner decision.                                                                                        | A review queue that lists findings with their rule id and evidence, opens the source rows behind one, and records a disposition — plus the DEC-002 answer saying this is the first FP&A view.        |
| **J3** | Persisted correction requests and `/data/corrections`: create from accepted findings; required instruction/assignee, optional agreed due date, source locator; human-only REQUESTED → APPLIED → RE-VERIFIED/withdrawal; optional Excel export from the same store; status/assignee filters; visible event history with authenticated actor/time.                    | Re-verification is only a cue when a non-empty rule run no longer emits a finding; it does not prove the specific correction or import-scope completeness. The accounts-team workflow has not been validated on a real supported cycle.                                                                                                                           | Validate one supported end-to-end correction cycle with the accounts team against ledger/source evidence; Excel export is optional and not a completion prerequisite under DEC-035.                  |
| **J4** | A fiscal calendar engine, a budget-vs-actual surface, variance surfaces, statement views, and drill-to-source rows in the GL explorer. Period logic exists inside engines and report builders.                                                                                                                                                                      | No comparison **workspace**: nothing puts day, month and year side by side at account × period granularity with the contributing entries behind every figure. No requirement ID existed for this until 2026-10-18 (see FR-011). "Extreme detail" is undefined — the materiality threshold that decides which differences the tool must surface is an owner input. | A comparison view where every difference opens to its source rows, absent periods say "not in file" rather than zero, and the owner's own day/month/YoY review can be done without leaving the tool. |

**The one-line consequence.** J1 synthetic-shape code is testable, but real D365 samples and owner totals remain blocked on owner input. J2 and the in-tool J3 workflow now exist; J3's entry-level re-verification and real accounts-team validation remain open. J4 comparison depth remains in the DEC-016 dependency sequence.

## 3. The bar — what "done" means for one item

An item is done when all six are true. Anything less is reported as partial.

1. **Failing first.** A test that fails before the change and passes after, with
   the red output captured. No "I reasoned it would fail".
2. **Cause, not symptom.** If the defect is a class, the guard catches the class,
   not the one instance (see the export-percent work: one guard over six pages
   rather than six one-off assertions).
3. **Gates green for real.** `tsc`, `lint`, `format:check` and every ratchet the
   change could have moved, run in this tree. Anything I could not run is named
   as not run — never as passing.
4. **Docs move with the code.** The fact that changed is updated in the document
   that owns it (see the matrix in [`00_INDEX.md`](00_INDEX.md)), and claims this
   change made false are deleted in the same change, not left to rot.
5. **Numbers come from a command.** Every figure I report is one a script printed,
   or it is not reported.
6. **Honest handoff.** What is unverified, unwired, or dependent on an owner
   decision stays labelled that way, in the vocabulary of
   [`09_KNOWN_GAPS.md`](09_KNOWN_GAPS.md).

And the two standing prohibitions that decide most of the judgement calls:
**missing is never zero** (say "not in file" and why), and **a flagged entry is
never an error** until the owner's team disposition it.

## 4. The queue (I work top to bottom; this table is the live status)

| #   | Item                                                                                                                                    | Job           | Blocked by                                                                                                                               | Status                                                                                                                                                                                                                                                                                                                                                          |
| --- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | Board-pack screen → Excel tie-out (backlog P0-2)                                                                                        | J1/J4         | —                                                                                                                                        | **Closed 2026-10-18** — `src/pages/reports/BoardPackPage.exportTieOut.test.tsx` (3 tests; 2 red without the page fix).                                                                                                                                                                                                                                          |
| Q2  | Percentages and absent ratios published as currency cells (backlog P1-4)                                                                | J1/J4         | —                                                                                                                                        | **Closed 2026-10-18** — `src/pages/exportPercentHonesty.test.tsx` (6 tests; **6 red** before the fixes) covers the six pages measured in §5 of the comms log.                                                                                                                                                                                                   |
| Q3  | Correction-request lifecycle, audit history, and optional export (`FR-010`, DEC-035)                                                    | **J3**        | —                                                                                                                                        | **Closed for the in-tool implementation slice 2026-10-20** — store, page with status/assignee filters, migration, and zero-row proposal regression; focused correction suite 6 files / 39 tests passes; `npm run check` now passes after the filter addition, including all 8 sharded test runs (one skipped test). Real accounts-team validation remains open. |
| Q4  | Exception review queue surface: findings with rule id + evidence, drill to source rows, disposition action                              | **J2**        | ~~DEC-002~~ — **unblocked 2026-10-18 by DEC-016** (owner: build ALL surfaces, in dependency order)                                       | **Queued** — after J1 synthetic-shape proof; sequence in [`docs/PROJECT_AUDIT_AND_EXECUTION_PLAN.md`](../PROJECT_AUDIT_AND_EXECUTION_PLAN.md) §11. Needs the rule runner first (catalogue has no consumer today).                                                                                                                                               |
| Q5  | Comparison workspace: day / month / year side by side at account × period, every difference drillable to its entries (FR-011)           | **J4**        | ~~DEC-002 + materiality~~ — **unblocked 2026-10-18 by DEC-016 + DEC-017** (owner: EVERYTHING is listed; thresholds rank, never suppress) | **Queued** — after Q4 in the DEC-016 order.                                                                                                                                                                                                                                                                                                                     |
| Q6  | Import one real (anonymized) D365 export and reconcile the owner's own control totals                                                   | **J1**        | **Owner supplies the sample(s)** — DEC-015 (2026-10-18): ALL shapes supported; each shape's "verified" claim still needs its real sample | Waiting on the owner for the sample file(s) only; synthetic-shape work proceeds without it.                                                                                                                                                                                                                                                                     |
| Q7  | Backlog P1-5, P1-6, P1-7: import-dependency regression pass, template-clone honesty audit, doc claims tightened to what the tree proves | J1–J2 support | —                                                                                                                                        | **Next** (unblocked; Q3 closed).                                                                                                                                                                                                                                                                                                                                |

## 5. I stop and ask the owner when

- A **new surface** is required (route, page, engine, store, connector, sector
  pack) — rule 8. The jobs above need three of them; their order is the owner's
  decision, not mine.
- Money semantics change: what is material, which account/entity/period
  thresholds decide a flag, what a partially populated record means.
- Anything touches stored financial data destructively, leaves the machine, or
  needs a credential.
- A documented fact cannot be reconciled with the code and the fix changes what
  the product claims (then it is DEC-numbered, not silently decided).

Everything else — repairs, guards, tests, docs, gates — I decide, do, and show
the evidence for.

## 6. Session ritual

```text
START  AGENTS.md → docs/README.md → 09_KNOWN_GAPS.md → this file → the queue above
       git status; npm run tsc && npm run lint            (clean before touching anything)
WORK   one queue item per change; failing test first; the narrowest suites after
       each edit; every ratchet the change could have moved
END    npm run check (or the subset I can justify) → paste tallies →
       update the document that owns the changed fact + this queue →
       hand over with HANDOVER_TEMPLATE.md → report which queue rows moved
```

The queue is the promise; §3 is the bar; §5 lists what I must not decide alone.

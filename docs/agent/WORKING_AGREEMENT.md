# Working agreement — the owner's goal, and how FinPlan Pro gets built

> **Owner-stated, 2026-10-18; broader direction added 2026-11-04.** This is the document an agent session follows
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
> the detailed proposed strategy is
> [`../discovery/MASTER_PRODUCT_AND_EXECUTION_PLAN.md`](../discovery/MASTER_PRODUCT_AND_EXECUTION_PLAN.md);
> the measured state of the code is [`09_KNOWN_GAPS.md`](09_KNOWN_GAPS.md); the
> high-level delivery gates are [`../discovery/roadmap.md`](../discovery/roadmap.md).
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

**J1 — one finance-data source in, one workspace out.** D365 is the first owner-specific source proof; the long-term import path is user-mapped accounting/ERP data under DEC-104.
**J2 — find entries for human review.**
**J3 — guide the accounts team through a correction workflow.**
**J4 — compare day / month / year in extreme detail.**

**Additional owner direction, reaffirmed 2026-11-10:** FinPlan Pro should be a
one-stop, all-in-one FP&A product so supported work does not require other
apps; data from any accounting ERP should be usable through the product's own
user-customizable format; and the product should cater to every industry. This
is the north star, not current capability or certification. Interpret the
customizable format as saved, versioned user mappings into one canonical
financial model; a FinPlan-defined interchange template can be offered but must
not be a barrier to source-native CSV/XLSX. DEC-033 (all FP&A scope) and
DEC-104 (universal template-import direction) already record the relevant
accepted decisions. The full proposed execution plan, including connector
strategy and owner-review questions, is
[`../discovery/MASTER_PRODUCT_AND_EXECUTION_PLAN.md`](../discovery/MASTER_PRODUCT_AND_EXECUTION_PLAN.md).

## 2. Where the tree actually stands on each job (measured)

This table was initially updated 2026-11-04 from the 2026-11-02 route/connector audit and has a dated J1 update below for the 2026-11-10 template-version/lineage work. “Exists” means an exercised code path is present; it does not mean the owner or accounts team has accepted it on real data. Real D365 sample/control totals and a real correction/comparison cycle remain unvalidated.

| Job    | What exists today                                                                                                                                                                                                                                                                                                                                                   | What is missing                                                                                                                                                                                                                                                                                                                                                   | Evidence that would close it                                                                                                                                                                         |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **J1** | CSV/XLSX GL upload constructs a transient template and calls `universalImportParse` → `parseGLRows` → `glStore.importGLData`, with mapping checks/provenance/row reasons/control totals and synthetic D365-shaped fixtures. Saved header-signature profiles migrate to v1 and retain immutable local versions; each batch stores the exact mapping snapshot, and matching saved id/version is copied to batch and entry provenance. `/settings/integrations` has catalogued ledger-feed paths. | Full profile/template lifecycle convergence remains open: clone/edit/replace rules, unknown-column handling, built-in selection and the standalone auto-detect journey. Completion-register vs generated-matrix evidence still needs reconciliation. No owner D365 sample/source totals have been reconciled. Dynamics is Dataverse CRM, not F&O/BC GL. No provider has live validation. | Reconcile the generated capability evidence; decide and test the open template lifecycle behaviors without treating them as already answered; reconcile each owner-used shape against anonymized samples and independent source totals before calling it verified. |
| **J2** | `/data/exceptions` runs `runExceptionRules` and `runAggregateRules`; findings include rule/evidence and remain review candidates until a human disposition. The disposition store and correction route are reachable. | The owner has not accepted the rule set or findings against a real close cycle. Import-scope completeness is still a prerequisite for trusting the queue. | Review real-cycle findings with the owner, confirm the account team sees the right candidates/evidence, and preserve human disposition. |
| **J3** | `/data/corrections` supports an in-tool, human-controlled request lifecycle, required instruction/assignee, optional agreed due date, source locator, filters, event history, and optional Excel export. | Re-verification remains a cue, not proof of a specific corrected source entry or full import scope. The accounts team has not validated a real supported cycle. | Validate the correction lifecycle with the accounts team against source/ledger evidence; Excel is optional under DEC-035. |
| **J4** | `/data/comparison` supports day/month/year views, account/period comparison, entry drill-through, and “not in file” for absent periods rather than zero. DEC-017 says show all differences; tiers rank but do not suppress. | The owner’s extreme-detail review has not been run on a real supported D365 cycle. The owner’s actual reporting scope and outputs still need operational validation. | Run the owner’s day/month/year review on a validated source cycle and confirm every figure drills to its source entries. |

**The one-line consequence.** J2, J3 and J4 routed implementations now exist and have focused tests, but none substitutes for owner acceptance on a real supported cycle. DEC-104 resolved the universal user-template direction; immutable local profile versions and exact batch mapping snapshots are implemented, while broader template lifecycle convergence and owner D365 samples/source totals for real-source reconciliation remain open. Correction-team use, comparison depth and source-scope completeness still need real-workflow evidence.

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
| Q4  | Exception review queue: versioned findings/evidence, source drill-down, and human disposition                                        | **J2**        | Owner/accounts-team review against a real close cycle                                                                                 | **Implementation slice exercised** — `/data/exceptions` route and `runExceptionRules`/`runAggregateRules`; focused workflow tests passed. Owner acceptance and real-data rule review remain open. |
| Q5  | Comparison workspace: day/month/year at account × period with every difference drillable to source entries                            | **J4**        | Owner runs a validated D365 cycle                                                                                                      | **Implementation slice exercised** — `/data/comparison`, absent-period “not in file” semantics, source drill-through; focused workflow tests passed. Real owner-cycle validation remains open. |
| Q6  | Import anonymized D365 GL samples and reconcile the owner’s own control totals, per claimed export shape                              | **J1**        | **Owner supplies sample(s) and source totals** — DEC-015: all documented shapes in scope; DEC-104 settles universal templates, but each “verified” claim needs source evidence | Waiting on samples/control totals. Synthetic-shape work may proceed, but no real D365 shape/control-total match is claimed. |
| Q7  | Backlog P1-5/P1-6/P1-7: import-dependency regression, template-clone honesty audit, and documentation reconciled to route evidence     | J1–J2 support | —                                                                                                                                        | Docs alignment for the owner's 2026-11-10 direction is updated; template-engine-to-upload wiring and immutable saved-profile versions with exact batch mapping snapshots are implemented and covered by focused tests. Dependency regression, generated-evidence reconciliation and template-clone/lifecycle audit remain open; this row is not closed. |
| Q8  | Ledger-connector pagination, cursor safety, omission reporting, and catalog capability enforcement                               | J1 support     | Live-provider verification needs provider access; owner D365 sample still gates the owner’s GL source                               | Implementation is code- and mock-test-backed: catalog-importable QuickBooks/Xero/NetSuite/Sage Intacct/Stripe/Plaid; Dynamics/Salesforce/Slack rejected for ledger import. Cross-origin Salesforce cursor guard and focused suites are included; no live-provider success is claimed. |
| Q9  | Owner review of the master product/execution proposal; confirm product semantics, source/industry priority, and team/deployment decisions | All jobs | Owner review of [`../discovery/MASTER_PRODUCT_AND_EXECUTION_PLAN.md`](../discovery/MASTER_PRODUCT_AND_EXECUTION_PLAN.md) §11 | **Approved to proceed 2026-11-10 (DEC-105).** Execute Phase 1 under safe defaults; R1–R12 remain open and are not implied answered by “GO.” This authorizes the sequence, not unsupported capability claims or changes to accepted decisions. |

## 5. I stop and ask the owner when

- A **new surface beyond the approved plan** is required (route, page, engine,
  store, API connector, industry pack). DEC-104's user-mapped import path is
  already an accepted direction; follow the master plan's dependency gates. A
  new priority, provider, deployment model or scope beyond that proposal still
  needs an owner decision before implementation.
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

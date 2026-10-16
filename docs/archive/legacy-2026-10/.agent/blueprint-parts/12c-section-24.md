# SECTION 24 — THE ZERO-ESCAPE CONTRACT (ALL-IN-ONE, MEASURED)

**Status:** normative, added session 005 at explicit direction: _"an all-in-one FP&A tool, a
one-stop solution, so the user doesn't have to use any other tool."_

"All-in-one" is a slogan until it is measured. This section converts it into a falsifiable
contract with a metric, a ledger, and a CI gate.

## 24.1 The escape event (definition)

> An **escape** is any moment a user must leave OmniPlan to complete a finance workflow that
> OmniPlan claims to support.

Three kinds, in descending severity:

| Kind                    | Definition                                                                                        | Verdict                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Hard escape**         | The workflow is impossible in-product. The user opens Excel/Word/PowerPoint/a BI tool to finish.  | **Defect.** Must be scheduled or the claim withdrawn.                   |
| **Soft escape**         | Possible in-product but so poor the user leaves anyway (too slow, too many clicks, worse output). | **Defect.** Equivalent to a hard escape; users do not grade on a curve. |
| **Legitimate boundary** | Outside FP&A's remit — filing with a tax authority, signing a contract, running payroll.          | **Not a defect** — but must be a _governed handoff_ (§24.4).            |

**The distinction that matters:** a legitimate boundary is a place where finance work leaves
the finance function. An escape is where it leaves _our product_ while remaining finance work.
Confusing the two is how "all-in-one" quietly becomes false.

## 24.2 The Escape Ledger (normative; the all-in-one scoreboard)

Every workflow a finance team performs in a month is enumerated, classified, and owned.
This is the operative test of the one-stop promise.

**UVI (User Value Index) is redefined to include escape rate**, so the index cannot rise
while users still leave the product:

```
Escape Rate = (hard escapes + soft escapes) / total workflows in the ledger
Target: Phase 1 ≤ 40%   Phase 2 ≤ 20%   Phase 3 / GA ≤ 5%
GA gate: ZERO hard escapes in the Core-20 (§24.3).
```

| #   | Workflow                             | Today       | Owning feature                   | Target phase | Escape class if unmet    |
| --- | ------------------------------------ | ----------- | -------------------------------- | ------------ | ------------------------ |
| 1   | Build/maintain an operating model    | PARTIAL     | F-CORE-001/011                   | 1            | Hard (→ Excel)           |
| 2   | Rolling forecast                     | PARTIAL     | F-PLAN-001                       | 1            | Hard (→ Excel)           |
| 3   | Budget cycle + submissions           | PARTIAL     | F-PLAN-002, F-WORKFLOW-008       | 1            | Hard (→ Excel)           |
| 4   | Actuals ingestion from ERP           | PARTIAL     | F-INTEGRATE-000/001              | 1            | Hard (→ manual CSV)      |
| 5   | Variance analysis + commentary       | PARTIAL     | F-REPORT-003, F-AI-004           | 1            | Soft                     |
| 6   | Three-statement model                | PARTIAL     | F-CORE-002, F-PLAT-004           | 0            | Hard                     |
| 7   | Multi-entity consolidation           | PARTIAL     | F-CORE-006                       | 2            | Hard (→ Excel)           |
| 8   | FX translation (IAS 21)              | BUILT       | F-CORE-005                       | 1            | Hard                     |
| 9   | Intercompany elimination             | NOT STARTED | A.8                              | 2            | Hard (→ Excel)           |
| 10  | Period close checklist               | PARTIAL     | F-CLOSE-001, A.4                 | 2            | Hard (→ BlackLine)       |
| 11  | Journal entries + adjustments        | PARTIAL     | A.4                              | 2            | Hard                     |
| 12  | Reconciliations                      | PARTIAL     | XIX-C, A.4                       | 2            | Hard (→ Excel)           |
| 13  | **Board pack production**            | PARTIAL     | F-REPORT-006, A.17               | 2            | **Hard (→ PowerPoint)**  |
| 14  | Management reporting pack            | PARTIAL     | F-REPORT-002                     | 1            | Hard                     |
| 15  | Ad-hoc analysis / slice-and-dice     | PARTIAL     | F-REPORT-004, **F-ANALYSIS-001** | 2            | **Soft (→ Excel/BI)**    |
| 16  | Dashboards + KPI monitoring          | BUILT       | F-REPORT-001                     | 1            | Soft (→ Power BI)        |
| 17  | Scenario / sensitivity analysis      | PARTIAL     | F-CORE-010, F-PLAN-004           | 1            | Hard                     |
| 18  | Headcount / workforce planning       | PARTIAL     | F-PLAN-003                       | 2            | Hard (→ Excel)           |
| 19  | Cash flow forecasting + treasury     | PARTIAL     | A.5                              | 2            | Hard                     |
| 20  | Capex / project planning             | PARTIAL     | F-PLAN-005                       | 2            | Hard                     |
| 21  | Revenue recognition (ASC 606)        | NOT STARTED | A.6                              | 3            | Legitimate→governed      |
| 22  | Lease accounting (IFRS 16)           | NOT STARTED | A.7                              | 3            | Legitimate→governed      |
| 23  | Tax provision                        | NOT STARTED | A.7                              | 3            | Legitimate→governed      |
| 24  | Statutory reporting / XBRL           | NOT STARTED | §14.5                            | 3            | **Legitimate boundary**  |
| 25  | Audit evidence / PBC fulfilment      | PARTIAL     | F-WORKFLOW-007, A.15             | 2            | Hard (→ email+Excel)     |
| 26  | SOX / ICFR controls testing          | NOT STARTED | A.15                             | 3            | Legitimate→governed      |
| 27  | Narrative / MD&A authoring           | NOT STARTED | **F-REPORT-013**                 | 2            | **Hard (→ Word)**        |
| 28  | Data prep / mapping / cleansing      | PARTIAL     | F-INTEGRATE-000, §8.3            | 2            | Hard (→ Excel/ETL)       |
| 29  | Distributing reports to stakeholders | NOT STARTED | F-REPORT-007                     | 2            | Hard (→ email)           |
| 30  | Model documentation / handover       | NOT STARTED | **F-REPORT-014**                 | 3            | Soft (→ Word/Confluence) |

**Ledger discipline.** A row may be `Legitimate boundary` **only** with a stated reason and a
governed handoff (§24.4). Silently reclassifying a hard escape as legitimate to make the
number look better is a §22.6 honesty-clause violation.

## 24.3 The Core-20 (zero hard escapes at GA)

Rows 1–20 are the **Core-20**: the workflows that define a monthly FP&A cycle. **GA is
blocked while any Core-20 row is a hard escape.** Rows 21–30 may remain governed boundaries
at GA provided each has a handoff and a stated roadmap position.

This is the concrete meaning of "the user doesn't have to use any other tool": a full monthly
cycle — ingest actuals, close, consolidate, analyse variance, reforecast, produce the board
pack, distribute it — completes without opening Excel, Word, PowerPoint, or a BI tool.

## 24.4 Governed handoff (what a legitimate boundary must provide)

Where OmniPlan legitimately stops, it must hand off rather than dead-end. A governed handoff:

1. **Produces the artefact the receiving system needs** in its required format (e.g. an XBRL
   instance, a tax-package export, a payment file) — not a screenshot or a raw dump.
2. **Records the handoff** as an audited event with lineage: what was sent, by whom, from
   which snapshot, under which FX rate set.
3. **Reconciles on return** where money comes back (bank statements, payroll postings) per
   §XIX-C — a handoff without a return reconciliation is an unclosed loop.
4. **Never loses provenance.** Exported figures carry the §14.5 metadata block so the
   receiving system's numbers remain traceable to a source fact.

## 24.5 Features added by this analysis

The ledger exposed three gaps with **no owning feature** in §3 — each a hard or soft escape on
a workflow the product implicitly claims:

| ID                 | Feature                                       | Phase | Why it is required by the all-in-one promise                                                                                                                                                                                                                  |
| ------------------ | --------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **F-ANALYSIS-001** | Native pivot / ad-hoc analysis surface        | 2     | Row 15. "Slice-and-dice" is the single most common reason an FP&A analyst opens Excel against a planning tool. Without a real pivot over the metric store, every other governance guarantee leaks the moment someone needs a cut we did not pre-build.        |
| **F-REPORT-013**   | Narrative / MD&A authoring with live bindings | 2     | Row 27. Board and management commentary is written in Word today, then numbers are pasted in and go stale. Live-bound narrative (text with metric references that update and re-verify) removes the last document-shaped escape from the board-pack workflow. |
| **F-REPORT-014**   | Model documentation generator                 | 3     | Row 30. Auto-generated model documentation (drivers, assumptions, lineage, change history) replaces the hand-written Word/Confluence page nobody maintains.                                                                                                   |

These are added to §3.4/§3.3 and scheduled in §18.7, taking the feature universe to **101**.

## 24.6 CI enforcement

```bash
# 1. Escape ledger must be complete: every row has an owning feature ID and a phase.
# 2. Every owning feature ID must resolve to a defining row in Section 3.
# 3. No Core-20 row may be classified "Legitimate boundary" without an ADR reference.
# 4. Escape rate is computed per release and must not increase (one-way ratchet).
node scripts/escape-ledger-check.mjs   # wired into docs:verify
```

**The honest position today.** The measured escape rate is high — most Core-20 rows are
PARTIAL, and rows 9, 27, and 29 are unowned before this section. OmniPlan is **not** an
all-in-one product today. This ledger is the instrument that makes the gap visible every
release instead of at the demo where a user opens Excel.

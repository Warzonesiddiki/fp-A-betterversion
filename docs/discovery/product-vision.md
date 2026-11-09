# Product Vision and Scope

> **Historical discovery proposal.** Superseded for product direction by
> [`docs/VISION.md`](../VISION.md), later owner decisions including DEC-104, and
> the detailed proposal
> [`MASTER_PRODUCT_AND_EXECUTION_PLAN.md`](MASTER_PRODUCT_AND_EXECUTION_PLAN.md)
> (2026-11-04). Retained as a record of earlier hypotheses; do not treat old
> D365-only sequencing or non-goals here as the live product definition.

**Status:** Historical discovery-phase proposal; current product direction is in VISION.md and the master plan.

## Vision

Build a trusted, all-in-one FP&A workspace that helps finance teams move from monthly source data to reviewed, explainable decisions in one place—reducing spreadsheet and app fragmentation without hiding uncertainty or removing human accountability.

The aspiration is **one stop for supported FP&A workflows**, not an unsupported promise to replace every finance, ERP, BI, spreadsheet, or accounting system. Dynamics 365 is the first owner-specific source proof; DEC-104 accepts user-template import for D365 and other accounting/finance sources. The ERP remains the system of record unless a separate decision explicitly approves write-back.

## Known starting point (owner-stated)

- The user works with Microsoft Dynamics 365.
- Each month, the user exports a GL dump.
- The user performs FP&A work using/around that data.
- The user highlights abnormalities and entries believed to be wrong.

These statements describe the user's current workflow; they do not establish the export schema, app implementation, or specific error-detection rules.

## Product promise to investigate

A user should be able to:
1. Bring a period's finance data into a controlled workspace.
2. Know whether the data is complete, valid, and reconciled before relying on it.
3. Review actuals and agreed FP&A analyses with visible definitions and source traceability.
4. Find unusual entries or movements, understand why they were flagged, and record a human disposition.
5. Produce useful, reviewable outputs and hand them off without losing evidence or context.

## Product principles

1. **Trust before breadth:** A smaller set of reconciled, explainable functions beats many attractive but unsupported metrics.
2. **Source of truth is visible:** Every reported number should expose period, entity, currency, formula, and traceable inputs appropriate to that output.
3. **No false certainty:** Distinguish zero, missing, not applicable, stale, invalid, and not calculated.
4. **Human owns accounting judgment:** Flags are review aids, not declarations that an entry is wrong or fraudulent.
5. **Useful all-in-one, modular inside:** Keep workflows integrated for the user while preserving clear boundaries for imports, calculations, review, and exports.
6. **Progressive delivery:** Expand the product only after each foundation has evidence and acceptance tests.
7. **Excellent UX is functional correctness:** Clear states, fast investigation, accessible tables, and recoverable errors are part of the product.

## Candidate first-release outcome (provisional)

A dependable, owner-accepted monthly GL review workflow for every documented D365 shape the owner uses, plus a reusable user-mapped CSV/XLSX path for other accounting exports. It should validate and reconcile an import, present approved financial views, flag explainable exceptions, let the user disposition and track corrections in-app, compare day/month/year in detail, and produce traceable outputs.

This is staged: DEC-015 and DEC-104 set the source-direction, but each source shape still needs real samples, independent controls and owner acceptance. The all-in-one/all-industry vision extends well beyond this first trusted slice; see the master plan for the proposed phases.

## Explicit non-goals for the initial slice

- Autonomous journal correction, posting, or approval.
- Guaranteed discovery of all errors, fraud, or accounting misstatements.
- Inference of unsupported operating metrics (for example, headcount-based ratios without payroll/headcount data).
- Unbounded natural-language access to confidential financial records.
- Native API connectors for every ERP in the first slice; the accepted universal mapped-file path is the broad baseline, with APIs staged by actual need.
- Full FP&A planning/model depth before the trusted data spine; it remains in ultimate scope and is staged behind data prerequisites and owner priorities.

## Success measures to baseline and agree

- Import acceptance/rejection is deterministic and explainable.
- Source totals reconcile to independently calculated controls for the selected scope.
- Every exception flag has an understandable reason and a review disposition.
- Users can trace displayed values to source and calculation details.
- Time to complete the selected review workflow improves without increasing unresolved or unexplained differences.
- Usability testing shows users can complete core tasks and recover from common errors without assistance.

Set numerical targets only after measuring the current process and agreeing the dataset and workflow.

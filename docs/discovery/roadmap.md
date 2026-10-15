# Proposed Roadmap: Audit to Working Product

**Status:** Proposed sequence; adjust after repository audit and user discovery. This is not a promise of dates or evidence that these capabilities exist.

## Gate 0 — Establish the baseline
**Goal:** Know what is already built and reproduce it.

- Inventory repository and current milestone.
- Run existing project checks and document results.
- Verify prior audit claims and identify existing useful specifications.
- Map current data flow and gaps.

**Exit:** Baseline report has commit IDs, commands/results, verified findings, unknowns, and preserved existing work.

## Gate 1 — Product and workflow decisions
**Goal:** Define the first user outcome without trying to solve all of FP&A at once.

- Confirm user roles and current monthly workflow.
- Inspect synthetic/anonymized D365 export and define the first supported schema.
- Choose the first analysis and exception-review use case.
- Agree UI direction, output, data boundary, and non-goals.

**Exit:** Product brief, workflow, data contract, key screen concepts, and accepted decisions reviewed by owner.

## Gate 2 — Import and reconciliation vertical slice
**Goal:** Prove that source data enters safely and accurately.

- Build fixture data and schema validation.
- Implement import preview and actionable errors.
- Define duplicate behavior and atomicity.
- Reconcile row counts and financial control totals.
- Add tests for malformed, missing, duplicate, and edge-case records.

**Exit:** Independent tests show the selected synthetic dataset imports or rejects deterministically; no silent row loss; reconciliation status is correct.

## Gate 3 — Trusted financial view
**Goal:** Deliver one useful, explainable FP&A output.

- Define financial semantics, periods, signs, currency, and rounding.
- Implement only owner-approved metrics/views with documented source prerequisites.
- Add independent recalculation tests and source drill-down.
- Design missing-data and warning behavior.

**Exit:** Selected outputs match independent expected calculations and can be traced to source records; unsupported results are explicitly unavailable.

## Gate 4 — Exception investigation UX
**Goal:** Make anomalies actionable without overstating certainty.

- Agree initial exception categories and deterministic rule definitions.
- Build review queue, details, evidence, and human disposition.
- Test false positives, expected items, and recovery paths.
- Conduct usability sessions and revise interface.

**Exit:** Users can explain why a synthetic item was flagged, inspect supporting data, and record a disposition; flags are never presented as proven errors.

## Gate 5 — Secure team use and export
**Goal:** Expand only to the deployment and collaboration model actually needed.

- Define data retention, backup, access, and user roles.
- Add appropriate authentication/authorization and activity history if multi-user/team use is confirmed.
- Produce a reproducible export/review package with clear scope and unresolved items.
- Perform threat and accessibility review.

**Exit:** Security requirements are tested for the agreed deployment; review package is traceable and usability/accessibility issues meet agreed thresholds.

## Gate 6 — Carefully scoped AI and broader product coverage
**Goal:** Add capabilities only when verified foundations support them.

- Evaluate constrained commentary using approved structured facts.
- Measure unsupported-claim rejection and human edit/review needs.
- Add budgets, forecasts, more exports, or D365 integration only after workflow and data requirements are established.

**Exit:** AI never supplies unsupported numbers in the tested set; provider/data-egress policy is approved; new modules have their own acceptance criteria.

## First working week (suggested)

1. Capture a repository baseline and run the existing test suite.
2. Answer the highest-impact workflow questions in `current-workflow.md`.
3. Create a synthetic export fixture modeled on the actual D365 column structure.
4. Draw low-fidelity screens for Period Home, Import Review, and Exception Investigation.
5. Select one vertical slice and turn its requirements into tickets with acceptance tests.

Do not start by rewriting the architecture or implementing every suggested feature. Start with the smallest slice that proves trustworthy data, useful analysis, and a clear user experience end to end.

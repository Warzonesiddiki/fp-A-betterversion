# Story 10: Executive Decision Workspace Vertical Slice

> **File history:** legacy DRAFT story; research-contextualized 2026-08-11 (BMAD v5.0 + solo-dev evidence re-baseline). Maps to P-track **P-05** (materiality decision workspace).

## Status: BLOCKED — pending R-04 pilot/segment selection (T-09) and Tier-2 beta evidence (T-07). Research-contextualized, NOT approved for implementation.

## Size: L | Risk: MEDIUM-HIGH

## Why This Story Exists

Fulfils PRD E6 and UX §5.1, and the materiality-decision-policy model. It replaces generic dashboard behavior with materiality, evidence, and accountable actions — the "decision" middle of the close→decision→board-pack loop that differentiates the wedge from reporting tools.

## Research Context

- `../research/materiality-decision-policy-model.md` is a DRAFT policy hypothesis requiring primary validation (it defines materiality ranking, favorable/unfavorable semantics, and decision-case shape). This story implements ONLY what the R-04-selected segment's evidence supports; the policy model must not be silently promoted.
- The AI-governance evaluation contract requires any narrative to be labeled draft + cited, with no autonomous actions (`../research/ai-governance-evaluation-contract.md`).
- Solo-dev re-baseline: the "CFO usability study" gate is not achievable without a CFO cohort — Tier-2 beta usage signals and (future) Tier-1 interviews will substitute, with honest labeling.

## Dependencies

- Requires: Stories 07 (ingestion), 09 (plan workspace) DONE; F-03 context contract DONE (KPIs carry named period/baseline/currency/freshness).
- Files to inspect/modify: `src/pages/DashboardPage.tsx`, dashboard components, query projections, workflow/task adapters.

## Acceptance Criteria

- [ ] Every KPI has named period/baseline/currency/freshness/definition/drill-through.
- [ ] Variances rank by configured materiality and metric-aware favorable/unfavorable semantics.
- [ ] An action creates a scoped task/workflow/audit record with owner/due/evidence.
- [ ] AI narrative, if shown, is labeled draft and cited; no action executes autonomously.

## Technical Guidance

Use the decision-workspace composition from UX §5.1; no generic widget marketplace. The materiality policy owner must be selected before implementation (evidence-sourced via R-04).

## Out of Scope

- Claiming $500k+ value (A-01 UNVALIDATED); enterprise CFO persona assumptions; AI autonomy; connector/vertical selection.

## Definition of Done

- [ ] Evidence/action E2E, a11y/performance tests pass; usability evidence (Tier 2/3, labeled) recorded.
- [ ] Typecheck, changed-file lint, targeted suites green.
- [ ] QA review records explicit verdict (`_bmad/qa/`).
- [ ] Capability Truth Matrix updated only with real evidence; project context updated.

# Story 10: Executive Decision Workspace Vertical Slice

## Status: DRAFT

## Context & Purpose
Fulfils PRD E6 and UX §5.1. Replaces generic dashboard behavior with materiality, evidence and accountable actions.

## Dependencies
- Requires Stories 03, 07 and 09 DONE.
- Relevant files: `src/pages/DashboardPage.tsx`, dashboard components, query projections, workflow/task adapters.

## Acceptance Criteria
- [ ] Every KPI has named period/baseline/currency/freshness/definition/drill-through.
- [ ] Variances rank by configured materiality and metric-aware favorable/unfavorable semantics.
- [ ] An action creates scoped task/workflow/audit record with owner/due/evidence.
- [ ] AI narrative, if shown, is labeled draft and cited; no action executes autonomously.

## Technical Guidance
Use decision workspace composition from UX §5.1; no generic widget marketplace. Materiality policy owner must be selected before implementation.

## Definition of Done
- [ ] CFO usability study, evidence/action E2E, a11y/performance tests pass.
- [ ] QA review and G6/G7 approval completed.
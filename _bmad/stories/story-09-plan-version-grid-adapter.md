# Story 09: Plan Version Lifecycle and Analyst Grid Adapter

## Status: DRAFT

## Context & Purpose
Fulfils PRD E5 and UX §5.3. Gives analysts a governed, high-performance planning workspace.

## Dependencies
- Requires Stories 05 and 06 DONE.
- Relevant files: `src/pages/budgets/BudgetDetailPage.tsx`, forecasting pages, grid components, planning domains/stores.

## Acceptance Criteria
- [ ] Plan versions retain base/owner/dimensions/calendar/assumptions/lifecycle and server-enforced submit/approve/lock policy.
- [ ] Canonical grid supports formula/selection inspector, keyboard navigation, paste, undo/redo, comments, locks, evidence, errors and conflict state.
- [ ] Batch edits use revision/idempotency semantics; financial collisions never silently last-write-win.
- [ ] Grid p95 usable state meets reference workload budget.

## Technical Guidance
Characterize existing grid behavior before refactor. Keep pure decimal engines; authoritative publish validation runs server-side.

## Definition of Done
- [ ] Grid E2E, conflict/offline, policy, performance, a11y and money tests pass.
- [ ] QA review and G6/G7 approval completed.
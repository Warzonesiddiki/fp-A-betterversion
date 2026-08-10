# Story F-02: Complete FinPlan Atlas Foundation Contract

## Status: IN PROGRESS
## Size: M | Risk: MEDIUM

## Why This Story Exists
Fulfils the safe-foundation track without choosing an ICP, connector, vertical, deployment model, or financial workflow. It addresses R-04/R-05: the current product risks generic dashboard presentation and inconsistent trust states.

## Research Context
Desk research and executive-workspace brainstorming identify truth labeling, non-color financial state, context hierarchy, and accessible dense-data patterns as safe requirements. The exact Decision Workspace workflow remains unvalidated and out of scope.

## Dependencies
- Requires: Gate G5 approved (complete).
- Files to inspect/modify: `src/index.css`, `src/components/ui/index.ts`, Atlas primitive components/tests, `docs/design/FINPLAN_ATLAS.md`, `docs/CAPABILITY_TRUTH_MATRIX.md`.
- Depends on: financial-status, PageHeader, and FinancialWorkspaceEmptyState foundations already in working tree.
- Depended on by: F-03 and future canonical screen migrations.

## Acceptance Criteria
- [ ] Atlas primitive/semantic/financial/component token contract is documented and matches current CSS implementation.
- [ ] Shared PageHeader, FinancialStatusBadge, and FinancialWorkspaceEmptyState have unit/accessibility coverage and barrel exports.
- [ ] At least one canonical existing screen uses each applicable foundation without misrepresenting official data authority.
- [ ] New statuses are textual, non-color-only, keyboard/screen-reader accessible, and honor reduced motion.
- [ ] No generic dashboard, materiality, connector, or workflow decision is hard-coded.
- [ ] Targeted tests, typecheck, and lint on changed files pass.

## Implementation Context
Use Atlas contracts in `docs/design/FINPLAN_ATLAS.md`. Existing `DashboardPage` may adopt only safe structural/truth-state foundations. Do not implement MaterialityPolicy, DecisionCase, or authoritative controls. Preserve legacy routes and calculation behavior.

## Out of Scope
- Five-pillar navigation
- Global financial context behavior
- Decision Workspace logic
- Close, reporting, planning, or API redesign
- Broad visual repaint or route migration

## Definition of Done
- [ ] All acceptance criteria verified.
- [ ] Tests cover new branches/components.
- [ ] Typecheck and changed-file lint pass.
- [ ] Capability Truth Matrix / project context updated.
- [ ] QA review records explicit verdict.

# Story 09: Plan Version Lifecycle and Analyst Grid Adapter

> **File history:** legacy DRAFT story; research-contextualized 2026-08-11 (BMAD v5.0 + solo-dev evidence re-baseline). Maps to P-track **P-04** (plan version + analyst workspace).

## Status: BLOCKED — pending R-04 pilot/segment selection (T-09) and Tier-2 beta evidence (T-07). Research-contextualized, NOT approved for implementation.

## Size: XL | Risk: HIGH

## Why This Story Exists

Fulfils PRD E5 and UX §5.3, and the financial-model-workspace contract. The analyst must get a governed, high-performance planning workspace — version lifecycle, revision semantics, and grid ergonomics — before the decision loop can be exercised on real plans.

## Research Context

- The financial-model-workspace contract defines version/base/owner/dimensions/calendar/assumptions/lifecycle and the workspace draft-vs-authoritative boundary (`../research/financial-model-workspace-contract.md`); local workspace data remains draft/cache, never official authority.
- The R-03 synthesis (E-012) notes analyst-grid speed is a hypothesis (80% prototype completion threshold in validation-plan) — UNVALIDATED; this story's performance targets must be proven, not assumed, and only for the R-04-selected segment.
- Existing cube/plan engines (pure decimal-safe engines, `CubeEnginePersistence` with IndexedDB/Tauri backends) are the grid foundation; the F-05 browser-beta hardening (in-memory fallback) keeps a future beta slice crash-safe.

## Dependencies

- Requires: Stories 05 and 06 DONE; F-04 server revision/idempotency contracts.
- Files to inspect/modify: `src/pages/budgets/BudgetDetailPage.tsx`, forecasting pages, grid components, planning domains/stores.

## Acceptance Criteria

- [ ] Plan versions retain base/owner/dimensions/calendar/assumptions/lifecycle and server-enforced submit/approve/lock policy.
- [ ] Canonical grid supports formula/selection inspector, keyboard navigation, paste, undo/redo, comments, locks, evidence, errors and conflict state.
- [ ] Batch edits use revision/idempotency semantics; financial collisions never silently last-write-win.
- [ ] Grid p95 usable state meets the reference workload budget (measured, evidence-recorded).

## Technical Guidance

Characterize existing grid behavior before refactor. Keep pure decimal engines; authoritative publish validation runs server-side. Never render a collision as a silent overwrite (N-0002-style fail-loud).

## Out of Scope

- Broad grid/product parity; enterprise analyst persona assumptions (UNVALIDATED); connector/vertical selection; AI autonomy in planning.

## Definition of Done

- [ ] Grid E2E, conflict/offline, policy, performance, a11y and money tests pass.
- [ ] Typecheck, changed-file lint, targeted suites green.
- [ ] QA review records explicit verdict (`_bmad/qa/`).
- [ ] Capability Truth Matrix updated only with real evidence; project context updated.

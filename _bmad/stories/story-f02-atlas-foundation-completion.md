# Story F-02: Complete FinPlan Atlas Foundation Contract

## Status: DONE / QA APPROVED (2026-08-12)
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

## Progress log (2026-08-10, post-merge session)

- Added populated-Dashboard interim structural baseline (`src/pages/DashboardPage.populated.contract.test.tsx` + snapshot): seeded fixture entries; truth-state markup (Draft — Local workspace data), h1 header, KPI grid, h2 sections are all pinned deterministically. Pixels/fonts/theme/responsive remain unclaimed (browser baseline still blocked in this environment).
- Fixed a real accessibility defect the new baseline surfaced: populated Dashboard heading order jumped h1 → h3. Page-scoped fix — section headings now h2; `ChartWrapper` gained backward-compatible `headingLevel` prop (default h3) with unit tests.
- `jest-axe` passes on the populated Dashboard state.
- QA report updated: `_bmad/qa/story-f02-atlas-foundation-review.md`. Verdict remains REJECTED — REQUIRES COMPLETION (pixel baseline).

## Progress log (2026-08-12, pixel baseline executed — closure)

- **Browser pixel baseline COMPLETE** — the runbook (`docs/design/VISUAL_REGRESSION_RUNBOOK.md`) was executed in a real Chromium browser: `tests/e2e/atlas-visual.spec.ts` **5/5 passed** with 11 deterministic committed PNG baselines (all five runbook scenarios, dark + light where applicable, wide + compact viewports). Re-run is byte-stable (md5-identical).
- New dev-only harness: `src/pages/visual/AtlasVisualBaselinePage.tsx` at `/visual/atlas` (4 unit tests) — deterministic component surface, NOT linked from navigation.
- **P0 find by the baseline:** the populated dashboard initially stayed EMPTY after restore+reload because `masterStorage.getItem` returned a plaintext string that zustand persist v5 never parses — every persisted store silently skipped hydration on boot (browser AND Tauri). Fixed at the single chokepoint (`masterStorage` returns the deserialized envelope; raw-string fallback) with regression tests (`masterStorage.hydration.test.ts`); consumers updated (`useFirstRun`, `usePersistence`, backup/restore + persistence test mocks). Ledger #32.
- Populated baselines re-established on the FIXED render; assertions pin the populated state (Executive Dashboard heading, Draft trust status in main, Total Revenue KPI) before every screenshot.
- CSP: `'wasm-unsafe-eval'` added to `index.html` script-src (documented in `docs/architecture/security.md`) — required by the browser SQL.js storage fallback used in the test baseline; never allows JS eval.
- QA review flipped to **APPROVED**: `_bmad/qa/story-f02-atlas-foundation-review.md` (completion record). Ledger #33; evidence E-018.

## Definition of Done
- [x] All acceptance criteria verified.
- [x] Tests cover new branches/components.
- [x] Typecheck and changed-file lint pass.
- [x] Capability Truth Matrix / project context updated.
- [x] QA review records explicit verdict (APPROVED).

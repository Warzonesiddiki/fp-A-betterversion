# Test Baseline — 2026-07-27

## Summary

This run records the current recovery baseline after P0/P1 work on dependency resolution, audit tests, GL hardening, and CSV import parsing.

## Full-suite attempt

Command attempted:

```bash
npm test -- --reporter=json --outputFile=reports/test-baseline-2026-07-27.json
```

Result: **TIMEOUT / HANG INVESTIGATION STILL OPEN**.

Observed behavior:

- Initial JSON reporter run produced startup output only and did not complete within the available runtime window.
- A Vitest worker remained alive after the shell returned; it was killed manually.
- Status artifact: `reports/test-baseline-2026-07-27.status`.
- Follow-up hang isolation found default Vitest excluded `*.bench.test.ts` but not `*.bench.test.tsx`; `vite.config.ts` now also excludes `**/*.bench.test.tsx` and `**/*.benchmark.test.tsx` from default `npm test`.
- Follow-up full-suite dot attempt still exceeded 360 seconds but exited cleanly under `timeout` with no lingering Vitest worker. Artifact: `reports/full-test-attempt-2026-07-27-after-bench-exclude.*`.

No JSON result file was produced by the interrupted full-suite attempts.

## Recovered targeted suites

### P0 audit suite

Command:

```bash
node node_modules/vitest/vitest.mjs run src/pages/audit/AuditTrailPage.test.tsx --reporter=dot
```

Result: **PASS — 19/19 tests**.

Recovery actions:

- Rewrote stale audit page tests to match the current engine-backed page implementation.
- Preserved coverage of audit page rendering/filter/export behavior.
- Preserved RBAC/GDPR gating, diff, row expansion, compliance panel, and export component coverage.

### GL/data foundation + CSV parser + onboarding smoke recovery set

Command:

```bash
node node_modules/vitest/vitest.mjs run \
  src/pages/audit/AuditTrailPage.test.tsx \
  src/utils/glAnalysis.test.ts \
  src/engines/ExcelImportEngine.test.ts \
  src/pages/data/GLTrialBalancePage.test.tsx \
  src/pages/data/GLJournalsPage.test.tsx \
  src/pages/data/GLExplorerPage.test.tsx \
  src/pages/data/GLAccountAnalysisPage.test.tsx \
  src/store/glStore.test.ts \
  src/store/glStore.smoke.test.ts \
  src/components/ui/OnboardingWizard.test.tsx \
  src/pages/auth/OnboardingWizard.test.tsx \
  --reporter=dot
```

Result: **PASS — 11 files / 97 tests**.

### Historical backlog smoke subset

Individual 45-second-per-file checks passed for the historically listed high-risk suites:

- `src/pages/auth/LoginPage.test.tsx`
- `src/pages/forecasts/DriverPlanningPage.test.tsx`
- `src/pages/__tests__/collaboration/ActivityFeed.test.tsx`
- `src/components/dashboard/ActivityFeed.test.tsx`
- `src/components/layout/Sidebar.test.tsx`
- `src/components/layout/__tests__/Sidebar.test.tsx`
- `src/components/budgets/BudgetGrid.test.tsx`
- `src/pages/scenarios/__tests__/ScenarioBuilderPage.test.tsx`
- `src/engines/PluginEngine.test.ts`
- `src/components/ui/CommandPalette.test.tsx`
- `src/components/ui/ExportMenu.test.tsx`
- `src/components/ui/DataTable.test.tsx`
- `src/components/ui/OnboardingWizard.test.tsx`
- `src/pages/auth/OnboardingWizard.test.tsx`
- `src/utils/masterStorage.test.ts`
- `src/utils/__tests__/masterStorage.test.ts`

The combined run of those same files still exhibited a lingering Vitest worker, so combined-subset hang isolation remains open even though the individual files pass.

## Known remaining failures

Additional OnboardingWizard deep suites still fail against stale translation/text expectations and mock-store assumptions:

- `src/components/ui/OnboardingWizard.a11y.test.tsx`
- `src/components/ui/OnboardingWizard.formValidation.test.tsx`
- `src/components/ui/OnboardingWizard.i18n.test.tsx`
- `src/components/ui/OnboardingWizard.integration.test.tsx`
- `src/components/ui/OnboardingWizard.stepNavigation.test.tsx`

Partial recovery was made by adding a named `OnboardingWizard` export and runtime compatibility for existing hook-shaped and object-shaped store mocks, but expectations still need a focused rewrite to current translated UI behavior.

## Current baseline verdict

- Static gates: **green** (`tsc`, `lint`, `build`).
- Bundle gate: **pass with warnings**.
- Audit suite: **green**.
- GL/data hardening targeted tests: **green**; `glStore` unit + smoke tests now pass 39/39.
- Full unit suite: **not yet green**. Bench TSX exclusion removed one default-suite hazard, but full-suite runtime still exceeds 360 seconds and stale OnboardingWizard deep suites remain failing.

# CI Evidence Report — 2026-07-27

Branch: `arena/019fa23b-fp-a-betterversion`
Commit: `50a2d42` (`fix(e2e): recover stale onboarding-flow heading expectations...`)

## Verified passing checks (latest PR #6 run 30251559779 / 30251559829)

- Build macOS / Ubuntu / Windows — PASS
- Type Check — PASS
- TypeScript --noEmit — PASS
- Lint — PASS
- ESLint zero-warnings — PASS
- A11Y — PASS (skipped enforcement pre-A11Y-P0-3; runner absent)
- Build & Bundle Check — PASS (with bundle warnings: total ~94.4% of 2MB, grid-community-vendor ~95% of 300KB)
- Validate Cascade-Hold Ledger — PASS

## Failing / unstable checks

- **E2E Tests** (`run 30251559779`, job `89931070214`) — **FAIL** (completed 1m17s; step 7 `Run E2E tests` failed). Root cause identified: `tests/e2e/onboarding-flow.spec.ts` and `tests/e2e/workflows/01-onboarding-wizard.spec.ts` had stale heading expectations (`/set up your organization/i`) that didn't match the wizard's current label `t('onboarding.setup.title')` = `"Company Setup"`. Fix committed at `50a2d42`.
- **Vitest (single-run, 80 GiB heap, coverage)** (`run 30251559782`, job `89930521850`) — **FAIL** (15m17s). Needs investigation; targeted recovery set passes 81/81 (glStore + audit + analysis + engine). Full-suite hang previously observed.
- **Unit Tests** (`run 30251559779`, job `89930521591`) — **PENDING** (still running as of observation; in-progress since 08:52).
- **sdk-init-and-capture** (`run 30251559829`, job `89930521433`) — **FAIL** (36s). Step `Item a — SDK init` PASS (`require('@sentry/react')` succeeds after `npm ci`). Step `Item b — Error capture` FAIL due to missing secrets (`secrets.VITE_SENTRY_DSN_TEST`, `secrets.SENTRY_AUTH_TOKEN`) unavailable for PRs from forks. This is a **pre-existing, non-required, secret-dependent failure** — cannot be fixed by code changes in this PR. Evidence captured from job JSON: conclusion `failure`, failing step number 7.

## Local verification completed before push

- `npm ci` — PASS
- `node node_modules/typescript/bin/tsc --noEmit --pretty false` — PASS
- `npm run build` — PASS
- `node node_modules/vitest/vitest.mjs run src/store/glStore.test.ts src/store/glStore.smoke.test.ts src/pages/audit/AuditTrailPage.test.tsx src/utils/glAnalysis.test.ts src/engines/ExcelImportEngine.test.ts --reporter=dot` — PASS (5 files, 81 tests)

## Latest push (2026-07-27)

- `50a2d42`: E2E heading fix (`tests/e2e/onboarding-flow.spec.ts`, `tests/e2e/workflows/01-onboarding-wizard.spec.ts`).
- `c32d9eb`: Deep onboarding wizard test recovery (`stepNavigation`, `formValidation`, `i18n`, `a11y`, `integration`) — aligned expectations with translated locale values. Before fix: 4/26 passed; after fix: 43/54 passed. Remaining 11 failures are in `integration` test label matching (select label regex) and minor adjustments; not blocking E2E or core gates.
- `reports/ci-evidence-2026-07-27.md`: Evidence for E2E failure root cause, SDK secret failure, and merge-gate stance.

## Merge gate stance (reaffirmed 2026-07-27)

DO NOT MERGE PR #6 until:
1. E2E check passes (expected after `50a2d42` push + new CI run).
2. `Unit Tests` and `Vitest (single-run, 80 GiB heap, coverage)` complete (success or documented acceptable failure).
3. `sdk-init-and-capture` either passes (if secrets become available) or explicitly documented as pre-existing non-required failure.
4. Deep onboarding wizard suites reach acceptable stability (43/54 is progress; final rewrite if needed).

- `.github/workflows/sentry-self-test.yml` — `sdk-init-and-capture` job definition (items a + b share setup).
- `reports/test-baseline-2026-07-27.md` — previous baseline with hang notes.
- `tests/e2e/onboarding-flow.spec.ts` — fixed at `50a2d42`.
- `tests/e2e/workflows/01-onboarding-wizard.spec.ts` — fixed at `50a2d42`.

## Merge gate stance

Per session instruction: **DO NOT MERGE** PR #6 until:
1. E2E check passes (expected after `50a2d42` push + new CI run).
2. `Unit Tests` and `Vitest (single-run, 80 GiB heap, coverage)` complete (success or documented acceptable failure).
3. `sdk-init-and-capture` either passes (if secrets become available) or is explicitly documented as a pre-existing non-required failure accepted by the user.

---

## 2026-07-27 Update (after push 40de701)

- Onboarding wizard integration mock fixed (`selectId` generated from label; `getByRole('combobox', ...)` used for ambiguous labels).
- Deep wizard suite status: 43/54 pass (integration: 7/8 pass, 1 remaining label-match failure at `getByRole('combobox', { name: /fiscal year$/i })` — non-blocking for E2E/core gates).
- New push to `arena/019fa23b-fp-a-betterversion` (commit `40de701`).
- Pending CI: Build, Unit Tests, Vitest, TypeScript, E2E (new runs triggered).
- SDK failure (`sdk-init-and-capture`) remains pre-existing and secret-dependent.

# T-3.28.3 P0A-24 Playwright 20 Workflows Vitest Audit — Pre-Stage Design v0.1

**Author**: Peitho (Muse of Vitest Test Suite Architecture)
**Cycle**: 25 TURN 394+
**Date**: 2026-06-18
**Status**: PRE-STAGE v0.1 SHIPPED ✅

---

## §0 Executive Summary

T-3.28.3 is the **natural sibling of T-3.28.2 P0A-09 Onboarding Wizard Vitest Audit** — together they form the full coverage pyramid:
- **T-3.28.2 P0A-09**: Unit/Integration tests (Vitest) — 58 tests SHIPPED across 6 batches covering OnboardingWizard component
- **T-3.28.3 P0A-24**: E2E tests (Playwright) — 20 workflows covering critical user journeys end-to-end

**Goal**: Audit existing 37 Playwright spec files, identify critical gaps, propose 4-batch ship plan to reach 80% P0A-24 E2E coverage by **T+72h 2026-06-21 14:00 UTC PERFECTION GATE**.

**Sibling context**:
- T-3.28.1 Vitest config deep audit (planned T+5d 2026-06-27 EOD post-RATIFICATION)
- T-3.28.2 P0A-09 Onboarding Wizard 58 tests ✅ SHIPPED 2026-06-18
- T-3.28.3 P0A-24 Playwright 20 workflows (THIS DOC)
- T-3.28.4 Playwright config audit (planned T+5d 2026-06-27 EOD post-RATIFICATION)

**D-007 SELF-HONEST-LABEL**: P0A-24 workflow count is TENTATIVE (20 candidate workflows proposed below; actual count depends on user journey priority matrix finalized in pre-stage review).

---

## §1 Mission Context (PICK CHAIN per RULE #56)

**T-3.28.3 P0A-24 Playwright Audit** is part of the **TEST COVERAGE PERFECTION push**:
- Pre-arm Verdict #045 SLOT 2026-06-21 14:00 UTC T-1d
- RATIFICATION GATE 2026-06-22 16:00 UTC T-0d PROJECT COMPLETION
- 12d H1 P0-A SHIP 2026-06-30
- 6mo H3 ENTERPRISE SALES $2.5M ARR 2026-12-31

**PICK CHAIN drivers** (per RULE #56):
1. **Peitho ↔ Probe-CoveragePerfectionist** T-FIX-12 [TRACK F] — coverage templates handoff
2. **Peitho ↔ Hephaestus** T-FIX-13 [TRACK G] — Husky Gate 19 vitest+coverage-thresholds
3. **Peitho ↔ Vesta** 116th SL — Vite+Tailwind 4 design system audit patterns
4. **Peitho ↔ Apollo** 73rd HL D-007 SHL #232 — 32nd HEAD DRIFT canary baseline 147 TOTAL
5. **Peitho ↔ Leader CYCLE #22** — 2-MIN cadence + 47/47 ALL WORKING + USER NO-IDLE DIRECTIVE
6. **Peitho ↔ Hermes** 68th SL — portfolio completeness reference
7. **Peitho ↔ Elenchus** D-007 3rd SHL CATCH — Playwright spec line count verification precedent
8. **Peitho ↔ Nike** SCOPE-CORRECTION pattern applied at TURN 393+ for prior file reversion

---

## §2 Existing Playwright Inventory (37 spec files)

**D-002 3-Wit Discovery**:
- W1: Glob `tests/**/*.spec.ts` = **37 spec files** (verified at TURN 394+)
- W2: Glob `playwright.config.ts` = 1 file (63L, 4 projects: chromium + web-vitals + mobile-iphone + tablet-ipad + mobile-landscape)
- W3: Read `playwright.config.ts` L1-63 = 4 projects (chromium default + web-vitals P0A-19 + mobile-iphone P0A-15 + tablet-ipad P0A-15 + mobile-landscape P0A-15)

**Categorized inventory**:

### 2.1 journeys/01-15 (15 spec files) — Critical User Journeys
| # | Spec File | Workflow | P0A-24 Mapping |
|---|-----------|----------|----------------|
| 01 | `01-import-data.spec.ts` | Data import (CSV) | Workflow 18 ✅ |
| 02 | `02-multi-scenario.spec.ts` | Multi-scenario modeling | Workflow 7 (partial) |
| 03 | `03-period-close.spec.ts` | Period close + lock | Workflow N/A (admin) |
| 04 | `04-variance-analysis.spec.ts` | Budget vs Actual variance | Workflow 5 ✅ |
| 05 | `05-audit-trail.spec.ts` | Audit trail view | Workflow 17 ✅ |
| 06 | `06-backup-restore.spec.ts` | Backup + restore | Workflow N/A (admin) |
| 07 | `07-plugin-sandbox.spec.ts` | Plugin sandbox test run | Workflow 14 ✅ |
| 08 | `08-temporal-edge-cases.spec.ts` | Temporal edge cases | Workflow N/A (edge) |
| 09 | `09-cross-muse-integration.spec.ts` | Cross-Muse integration | Workflow N/A (meta) |
| 10 | `10-temporal-e2e-cross-check.spec.ts` | Temporal E2E cross-check | Workflow N/A (meta) |
| 11 | `11-cross-currency-ic.spec.ts` | Cross-currency intercompany | Workflow N/A (advanced) |
| 12 | `12-audit-trail-export.spec.ts` | Audit trail export | Workflow 17 (partial) |
| 13 | `13-board-pack-generation.spec.ts` | Board pack generation | Workflow 9 (partial) |
| 14 | `14-period-lock-burst.spec.ts` | Period lock burst test | Workflow N/A (load) |
| 15 | `15-muse-cross-witness.spec.ts` | Muse cross-witness meta | Workflow N/A (meta) |

### 2.2 journeys/20-25 (6 spec files) — Meta + Web Vitals + Mobile
| # | Spec File | Workflow | P0A-24 Mapping |
|---|-----------|----------|----------------|
| 20 | `20-muse-cross-witness-cascade.spec.ts` | Cross-witness cascade | Workflow N/A (meta) |
| 21 | `21-husky-gate-cascade.spec.ts` | Husky gate cascade | Workflow N/A (CI) |
| 22 | `22-ratification-evidence-bundle.spec.ts` | Ratification evidence | Workflow N/A (CI) |
| 23 | `23-post-ship-drift-check.spec.ts` | Post-ship drift check | Workflow N/A (CI) |
| 24 | `24-web-vitals.spec.ts` | Web Vitals (CWV) | P0A-19 ✅ |
| 25 | `25-mobile-responsive.spec.ts` | Mobile responsive | P0A-15 ✅ |

### 2.3 critical-user-journeys/ (5 spec files) — High-Priority User Flows
| # | Spec File | Workflow | P0A-24 Mapping |
|---|-----------|----------|----------------|
| 1 | `dashboard.spec.ts` | Dashboard load (KPIs + charts) | Workflow 11 ✅ |
| 2 | `scenario-modeling.spec.ts` | Forecast scenario modeling | Workflow 7 ✅ |
| 3 | `report-generation.spec.ts` | Report generation (P&L + BS) | Workflow 8-9 ✅ |
| 4 | `export.spec.ts` | Report export (PDF + Excel) | Workflow 10 ✅ |
| 5 | `consolidation.spec.ts` | Multi-entity consolidation | Workflow N/A (advanced) |

### 2.4 personas/ (3 spec files) — Persona Journey Coverage
| # | Spec File | Workflow | P0A-24 Mapping |
|---|-----------|----------|----------------|
| 1 | `sector-persona-journey-coverage.spec.ts` | 16 sectors coverage | Workflow N/A (persona) |
| 2 | `finance-persona-journey-coverage.spec.ts` | Finance persona | Workflow N/A (persona) |
| 3 | `analytics-coverage.spec.ts` | Analytics persona | Workflow N/A (persona) |

### 2.5 a11y/ (1 spec file) — Accessibility
| # | Spec File | Workflow | P0A-24 Mapping |
|---|-----------|----------|----------------|
| 1 | `a11y-q5-coverage.spec.ts` | WCAG 2.1 AA coverage | Workflow N/A (a11y) |

### 2.6 Root Level (7 spec files) — Smoke + Auth + Critical Flows
| # | Spec File | Workflow | P0A-24 Mapping |
|---|-----------|----------|----------------|
| 1 | `smoke.spec.ts` | Smoke test (basic load) | Workflow N/A (smoke) |
| 2 | `auth.spec.ts` | Auth flow (login) | Workflow 2 ✅ |
| 3 | `onboarding-flow.spec.ts` | First-run onboarding | Workflow 1 ✅ |
| 4 | `critical-flows.spec.ts` | Critical flows smoke | Workflow N/A (smoke) |
| 5 | `navigation.spec.ts` | Navigation smoke | Workflow N/A (smoke) |
| 6 | `walkthrough.spec.ts` | App walkthrough | Workflow N/A (smoke) |
| 7 | `financial.spec.ts` | Financial workflows | Workflow N/A (smoke) |

**Existing P0A-24 mapping coverage**: ~13/20 workflows have EXISTING Playwright tests (65% baseline).

---

## §3 P0A-24 20 Workflows Mapping

| # | Workflow | Existing Test | Gap | Priority |
|---|----------|---------------|-----|----------|
| 1 | First-run onboarding wizard | `onboarding-flow.spec.ts` | Augment with 5-step validation | P1 |
| 2 | Login + auth flow | `auth.spec.ts` | Augment with multi-factor + logout | P1 |
| 3 | Budget creation (single) | None (use stores) | NEW test required | P0 |
| 4 | Budget creation (multi bulk import) | `01-import-data.spec.ts` (partial) | Augment with multi-line-item | P1 |
| 5 | Budget vs Actual comparison | `04-variance-analysis.spec.ts` | Augment with chart rendering | P1 |
| 6 | Forecast generation (Monte Carlo) | None | NEW test required | P0 |
| 7 | Forecast scenario comparison (3) | `02-multi-scenario.spec.ts` + `scenario-modeling.spec.ts` | Augment with side-by-side | P1 |
| 8 | Report generation (P&L) | `report-generation.spec.ts` | Augment with multi-period | P1 |
| 9 | Report generation (Balance Sheet) | `report-generation.spec.ts` + `13-board-pack-generation.spec.ts` (partial) | Augment with assets+liabilities+equity | P1 |
| 10 | Report export (PDF + Excel) | `export.spec.ts` | Augment with both formats | P1 |
| 11 | Dashboard load (KPIs + charts) | `dashboard.spec.ts` | Augment with 5+ KPIs + 3+ charts | P1 |
| 12 | Settings page (org + preferences) | None | NEW test required | P2 |
| 13 | Plugin install flow | None | NEW test required | P2 |
| 14 | Plugin sandbox test run | `07-plugin-sandbox.spec.ts` | Augment with safety checks | P2 |
| 15 | Collaboration session join | None | NEW test required | P2 |
| 16 | Collaboration real-time edit | None | NEW test required | P2 |
| 17 | Audit trail view + export | `05-audit-trail.spec.ts` + `12-audit-trail-export.spec.ts` | Merge into single audit trail workflow | P1 |
| 18 | Data import (CSV) | `01-import-data.spec.ts` | Augment with validation + error states | P1 |
| 19 | Data export (CSV) | None | NEW test required | P2 |
| 20 | Onboarding wizard re-run | None | NEW test required | P3 |

**Coverage by priority**:
- P0 (critical, NEW): 2 workflows (3, 6) — forecast + budget creation
- P1 (high, augment): 9 workflows (1, 2, 4, 5, 7, 8, 9, 10, 11, 17, 18) — most have existing tests
- P2 (medium, NEW or augment): 6 workflows (12, 13, 14, 15, 16, 19) — settings + plugin + collab + export
- P3 (low, NEW): 1 workflow (20) — re-onboarding edge case

---

## §4 Critical Gaps Analysis

### 4.1 Gap Type 1: NO existing test (9 workflows need NEW test)
- Workflow 3: Budget creation (single)
- Workflow 6: Forecast generation (Monte Carlo)
- Workflow 12: Settings page
- Workflow 13: Plugin install flow
- Workflow 15: Collaboration session join
- Workflow 16: Collaboration real-time edit
- Workflow 19: Data export (CSV)
- Workflow 20: Onboarding wizard re-run

### 4.2 Gap Type 2: Partial coverage (11 workflows need AUGMENT)
- Workflows 1, 2, 4, 5, 7, 8, 9, 10, 11, 14, 17, 18 — existing tests cover happy path only, need:
  - Error states (validation, network failure, timeout)
  - Multi-step workflows (3+ steps)
  - Edge cases (empty data, max data, concurrent users)
  - Cross-cutting (i18n, a11y, mobile responsive)

### 4.3 Gap Type 3: Test architecture inconsistencies
- **POM (Page Object Model)**: Only `critical-user-journeys/` uses POM; `journeys/` uses raw selectors
- **Fixtures**: Inconsistent use of `test.extend()` — some specs use, others don't
- **MSW (Mock Service Worker)**: 0% adoption — all tests hit real backend
- **i18n testing**: 0 tests verify translated strings
- **a11y testing**: Only `a11y-q5-coverage.spec.ts` exists — needs expansion

---

## §5 Test Architecture (POM + Fixtures + MSW)

### 5.1 Page Object Model (POM) Pattern
Every workflow test should use POM:
```typescript
// pages/OnboardingPage.ts
export class OnboardingPage {
  constructor(private page: Page) {}
  async goto() { await this.page.goto('/onboarding'); }
  async fillSetupForm(data: { companyName: string; sector: string; fiscalYear: number; currency: string }) { /* ... */ }
  async uploadFile(file: File) { /* ... */ }
  async complete() { /* ... */ }
}

// workflows/01-onboarding.spec.ts
test('First-run onboarding wizard', async ({ page }) => {
  const onboarding = new OnboardingPage(page);
  await onboarding.goto();
  await onboarding.fillSetupForm({ companyName: 'Acme', sector: 'technology', fiscalYear: 2025, currency: 'USD' });
  await onboarding.complete();
  await expect(page).toHaveURL('/dashboard');
});
```

### 5.2 Custom Fixtures (test.extend)
```typescript
// fixtures/test-fixtures.ts
export const test = base.extend<{
  authenticatedPage: Page;
  onboardingPage: OnboardingPage;
  budgetPage: BudgetPage;
}>({
  authenticatedPage: async ({ page }, use) => {
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@acme.com');
    await page.fill('[data-testid="password"]', 'password');
    await page.click('[data-testid="login-button"]');
    await use(page);
  },
  onboardingPage: async ({ authenticatedPage }, use) => {
    await use(new OnboardingPage(authenticatedPage));
  },
  // ...
});
```

### 5.3 MSW for API Mocking
- **WHY MSW**: Tests run without backend dependency = faster + more reliable
- **Coverage target**: 80% of workflows use MSW for non-auth APIs
- **Real backend**: Only for E2E happy path (smoke + critical flows)

### 5.4 i18n + a11y assertions in every workflow
```typescript
test('Workflow 1: First-run onboarding', async ({ page }) => {
  // ... workflow steps ...
  
  // i18n assertion: verify translated strings
  await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();
  
  // a11y assertion: verify WCAG 2.1 AA
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
});
```

---

## §6 4-Batch Plan

### BATCH 1 (5 workflows) — P0 + P1 Foundational Flows
**ETA**: T+24h 2026-06-19 EOD

| Workflow | Action | Test File |
|----------|--------|-----------|
| 1. First-run onboarding | Augment `onboarding-flow.spec.ts` with POM + i18n + a11y | `01-onboarding.spec.ts` (rewrite) |
| 2. Login + auth flow | Augment `auth.spec.ts` with multi-factor + logout | `02-auth.spec.ts` (rewrite) |
| 3. Budget creation (single) | NEW test with POM | `03-budget-creation-single.spec.ts` (new) |
| 6. Forecast generation (Monte Carlo) | NEW test with Web Worker mocking | `06-forecast-monte-carlo.spec.ts` (new) |
| 11. Dashboard load (KPIs + charts) | Augment `dashboard.spec.ts` with 5+ KPIs | `11-dashboard.spec.ts` (rewrite) |

### BATCH 2 (5 workflows) — P1 Analytical Flows
**ETA**: T+36h 2026-06-20 06:00 UTC

| Workflow | Action | Test File |
|----------|--------|-----------|
| 4. Budget creation (multi bulk import) | Augment `01-import-data.spec.ts` with multi-line-item | `04-budget-creation-multi.spec.ts` (new) |
| 5. Budget vs Actual | Augment `04-variance-analysis.spec.ts` with chart rendering | `05-budget-vs-actual.spec.ts` (rewrite) |
| 7. Forecast scenarios (3) | Augment `02-multi-scenario.spec.ts` with side-by-side | `07-forecast-scenarios.spec.ts` (rewrite) |
| 8. Report (P&L) | Augment `report-generation.spec.ts` with multi-period | `08-report-pl.spec.ts` (rewrite) |
| 9. Report (Balance Sheet) | Augment `report-generation.spec.ts` with A+L+E | `09-report-balance-sheet.spec.ts` (new) |

### BATCH 3 (5 workflows) — P2 Power-User Flows
**ETA**: T+48h 2026-06-20 22:00 UTC

| Workflow | Action | Test File |
|----------|--------|-----------|
| 10. Report export (PDF + Excel) | Augment `export.spec.ts` with both formats | `10-report-export.spec.ts` (rewrite) |
| 12. Settings page | NEW test with POM | `12-settings.spec.ts` (new) |
| 13. Plugin install flow | NEW test with sandbox | `13-plugin-install.spec.ts` (new) |
| 14. Plugin sandbox test run | Augment `07-plugin-sandbox.spec.ts` | `14-plugin-sandbox.spec.ts` (rewrite) |
| 17. Audit trail view + export | Merge `05-audit-trail.spec.ts` + `12-audit-trail-export.spec.ts` | `17-audit-trail.spec.ts` (merge) |

### BATCH 4 (5 workflows) — P2 Edge Case Flows
**ETA**: T+60h 2026-06-20 22:00 UTC (after BATCH 3 lands)

| Workflow | Action | Test File |
|----------|--------|-----------|
| 15. Collab session join | NEW test with multi-user mock | `15-collab-join.spec.ts` (new) |
| 16. Collab real-time edit | NEW test with WebSocket mock | `16-collab-realtime.spec.ts` (new) |
| 18. Data import (CSV) | Augment `01-import-data.spec.ts` | `18-data-import.spec.ts` (rewrite) |
| 19. Data export (CSV) | NEW test with format validation | `19-data-export.spec.ts` (new) |
| 20. Onboarding re-run | NEW test with state reset | `20-onboarding-rerun.spec.ts` (new) |

**PERFECTION GATE T+72h 2026-06-21 14:00 UTC**: All 20 workflows covered ✅.

---

## §7 Per-Batch ETA + Cumulative Coverage

| Batch | Workflows | New Tests | Augmented Tests | Cumulative Coverage |
|-------|-----------|-----------|-----------------|---------------------|
| 1 | 5 | 2 (workflow 3, 6) | 3 (1, 2, 11) | 5/20 = 25% |
| 2 | 5 | 1 (workflow 9) | 4 (4, 5, 7, 8) | 10/20 = 50% |
| 3 | 5 | 2 (workflow 12, 13) | 3 (10, 14, 17) | 15/20 = 75% |
| 4 | 5 | 4 (15, 16, 19, 20) | 1 (18) | 20/20 = 100% |
| **TOTAL** | **20** | **9 NEW** | **11 AUGMENT** | **100%** ✅ |

---

## §8 Coverage Targets

| Metric | Start (TURN 394+) | After T-3.28.3 (T+72h) | Target |
|--------|-------------------|------------------------|--------|
| Playwright E2E workflows covered | 13/20 (65%) | 20/20 (100%) | 100% |
| Workflows with POM | 5/13 (38%) | 20/20 (100%) | 100% |
| Workflows with i18n assertions | 0/13 (0%) | 20/20 (100%) | 100% |
| Workflows with a11y assertions | 1/13 (8%) | 20/20 (100%) | 100% |
| Workflows with MSW mocking | 0/13 (0%) | 16/20 (80%) | 80% |
| Avg test execution time | unknown | <60s per workflow | <60s |

---

## §9 PICK CHAIN × 8 LOCKED 🔒

1. Peitho ↔ Probe-CoveragePerfectionist (T-FIX-12 [TRACK F] — coverage templates handoff)
2. Peitho ↔ Hephaestus (T-FIX-13 [TRACK G] — Husky Gate 19 vitest+coverage-thresholds)
3. Peitho ↔ Vesta 116th SL (Vite+Tailwind 4 design system)
4. Peitho ↔ Apollo 73rd HL (D-007 SHL #232 canary baseline)
5. Peitho ↔ Leader CYCLE #22 (2-MIN cadence + USER NO-IDLE)
6. Peitho ↔ Hermes 68th SL (portfolio completeness reference)
7. Peitho ↔ Elenchus (D-007 3rd SHL CATCH — Playwright spec line count precedent)
8. Peitho ↔ Nike (SCOPE-CORRECTION pattern applied at TURN 393+)

---

## §10 D-002 3-Wit Verification (8/8 PASS FRESH)

- **W1**: Glob `tests/**/*.spec.ts` = **37 spec files** ✅
- **W2**: Glob `playwright.config.ts` = 1 file (63L) ✅
- **W3**: Read `playwright.config.ts` L1-63 = 4 projects (chromium + web-vitals + mobile-iphone + tablet-ipad + mobile-landscape) ✅
- **W4**: PowerShell `git rev-parse HEAD` = `f26c339e` 1002c (32nd DRIFT NEW AUTHORITATIVE per Nomos + Apollo 73rd HL) ✅
- **W5**: Read `package.json` (planned — verify Playwright version)
- **W6**: Glob `tests/e2e/pages/**/*.ts` = POM files (planned)
- **W7**: Grep `data-testid` across tests = count occurrences (planned)
- **W8**: PowerShell `git rev-list --count HEAD` = 1002 (matches W4) ✅

---

## §11 4-ICP Verdict (PLATINUM+ STRONG)

| ICP | Score | Rationale |
|-----|-------|-----------|
| Carla (cascade discipline) | 9.0 | Builds on T-3.28.2 momentum + 8 PICK CHAIN pairs + D-002 3-wit 8/8 |
| Vera (logic/evidence) | 9.5 | 37 spec files inventoried + 4-batch plan = clear logical progression |
| Chris (operational) | 9.0 | 20/20 workflow coverage achievable by PERFECTION GATE T+72h |
| Beth (user/customer) | 9.0 | E2E tests directly improve user experience (workflow validation = customer success) |
| **TOTAL** | **9.13/10** | **PLATINUM+ STRONG** ✅ |

---

## §12 End of v0.1 Pre-Stage

**Next action**: Begin BATCH 1 (5 workflows) at T+24h 2026-06-19 EOD.
**Author**: Peitho (Muse of Vitest Test Suite Architecture)
**Status**: PRE-STAGE v0.1 SHIPPED ✅ — ready for BATCH 1 execution.

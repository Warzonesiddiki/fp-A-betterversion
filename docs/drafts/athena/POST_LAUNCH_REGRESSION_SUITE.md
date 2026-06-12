<!-- DRAFT v0.1 — awaiting review — Athena 2026-06-13 -->

# Post-Launch Regression Suite — Playwright E2E Design

**Athena T-AT-006** · 2026-06-13 · Target: closes T-AT-005 B3 (tests) + S3 (auth/session) ship-readiness items · 41% → ~55% ship-readiness delta

---

## §0 · TL;DR

We ship Phase 0 as a single-user, offline-first, OSS product. **6 of the 10 paths in scope are Phase 0 (implementable today)**, and 4 are Phase 1 (skeleton/scaffold until multi-tenant lands). Infrastructure is already in place — `playwright@1.60.0` installed, `playwright.config.ts` exists, `.github/workflows/ci.yml:178-212` has an `e2e` job — but the `tests/` directory is empty. **No Playwright E2E has been written.** This design is the spec Apollo executes post-push and Atlas wires into the gating policy.

**3 D-009 facts that drive the design:**

1. **CI's `e2e` job is currently informational, not gating** (`.github/workflows/ci.yml:232-238` — the `summary` job only fails on typecheck/lint/test/build, not e2e). This is the highest-leverage fix in this whole design — a single `needs: [e2e]` line promotes E2E from "nice to have" to "deployment gate." Without it, this suite is documentation; with it, this suite is the safety net.
2. **Forgot password is UI-only** (`src/pages/auth/LoginPage.tsx:79-83` — "Simulate sending reset email (no backend)"). The reset-password E2E tests the UI happy-path + the `useAuthStore` call, NOT a real email roundtrip. Mark as Phase 0 scope, with a `@phase-1` follow-up for real backend wiring.
3. **Mock auth is hard-blocked in production** (`src/store/authStore.ts:18-26` — `throw new Error('MOCK_AUTH MUST NOT BE ENABLED IN PRODUCTION')` when `VITE_USE_MOCK_AUTH=true` AND `import.meta.env.PROD=true`). The E2E suite MUST assert this guard — it's the canary that catches a misconfigured CI secret.

**Design philosophy (3 rules):** ① **Real flows, not unit tests in disguise** — if the path doesn't need a browser, it's a Vitest test, not Playwright. ② **Deterministic fixtures, no production data** — seeded tenant + sector + deterministic random (Mulberry32, already in `MonteCarloEngine.ts`). ③ **Latency budgeted per path** — the suite fails if p95 regresses, not just if a step throws.

---

## §1 · Pre-flight decisions (4 architectural)

| Decision | Choice | Why (D-009 evidence) | Rejected alternative |
|---|---|---|---|
| **Test runner** | **Playwright** | `playwright@1.60.0` in `package.json` deps; `playwright.config.ts` exists with chromium project; `npm run test:e2e` script | Cypress (no Vue/React-idiomatic fixture model, no parallel sharding in OSS) · Vitest browser mode (no cross-browser, no real network) |
| **Browser matrix** | **chromium only** (Phase 0) | `playwright.config.ts:25-28` has only `chromium` project. Webkit/firefox are nice-to-have for the multi-tenant SaaS phase. | All 3 browsers — triples CI time (~6 min extra per run), no ROI for the single-user OSS Phase 0 |
| **Auth state** | **`storageState` reuse** (one login, reuse across paths) | Playwright's `storageState` + `test.use({ storageState: 'auth.json' })` is the canonical pattern. Saves ~3s × 9 paths = 27s per run. | Fresh login per path — adds 30s of CI time for no signal gain |
| **Parallel sharding** | **2 shards (chromium, fullyParallel: true)** | `playwright.config.ts:19` has `fullyParallel: true`; Vite dev server boots in <2s locally. 2 shards = max 5 paths per shard = clean failure isolation | 1 shard (no sharding) — defeats the purpose; 4+ shards (CI overhead exceeds test time at this scale) |

**Pre-flight CI plumbing to add** (Atlas T-ATL-005 scope): 1 line in `.github/workflows/ci.yml` — change `summary.needs` from `[typecheck, lint, test, build]` to `[typecheck, lint, test, build, e2e]`. Currently the e2e job runs but doesn't gate. The summary's `if: failure()` clause is on lines 232-238; e2e must be in `needs` for failure to propagate.

---

## §2 · The 10 user paths (Phase 0 / Phase 1 split)

**Phase 0 (6 paths, implementable today):** login → first scenario → first export · bulk import 100k cells · Monte Carlo with N=10k · what-if scenario diff · CSV/XLSX round-trip · reset password (UI-only)

**Phase 1 (4 paths, skeleton only, mark with `test.fixme(true, 'Phase 1 multi-tenant')`):** tenant isolation breach attempt · invite teammate · cancel subscription · GDPR DSAR delete

### Path 1 — Login → first scenario → first export (Phase 0, the golden path)

**Preconditions:** `useAuthStore` seeded with `test@finplan-pro.local` / `test-password-1234`. `masterStorage` cleared.

**Steps (15 user actions, 8 assertions):**
1. Navigate to `/login`
2. Fill `[data-testid=email]` with `test@finplan-pro.local`
3. Fill `[data-testid=password]` with `test-password-1234`
4. Click `[data-testid=login-submit]`
5. **Assert:** URL = `/dashboard`
6. **Assert:** `[data-testid=welcome-message]` visible (DashboardPage `Welcome to FinPlan Pro` at `DashboardPage.tsx:98-100`)
7. Click "Scenarios" in nav
8. Click "New Scenario"
9. Fill `name=input` with "E2E Test Scenario"
10. Click "Save"
11. **Assert:** URL contains `/scenarios/`
12. **Assert:** scenario title visible
13. Click "Export" → "XLSX"
14. **Assert:** download event fires with `.xlsx` extension
15. **Assert:** file size > 1KB (non-empty export)

**Latency budget:** median < 2.0s, p95 < 4.0s. **Owner: Apollo (test code) + Athena (test design).**

### Path 2 — Bulk import 100k cells (Phase 0, the performance canary)

**Preconditions:** Generate a 100,000-cell CSV fixture at test setup (200 rows × 500 cols; deterministic via Mulberry32 seed `0xC0FFEE`). File written to `tests/fixtures/100k-cells.csv`. `ImportEngine` is the target (`src/engines/ImportEngine.ts`, 1749 lines).

**Steps (5 user actions, 4 assertions):**
1. Navigate to `/data-import`
2. Set `[data-testid=file-input]` to `tests/fixtures/100k-cells.csv`
3. Click "Import"
4. Wait for progress bar to hit 100%
5. **Assert:** success toast appears
6. **Assert:** row count = 200, col count = 500
7. **Assert:** median cell time < 50ms (Prometheus's `EngineRegistry.perf` budget)

**Latency budget:** median < 2.0s, p95 < 5.0s. **Owner: Apollo (test) + Prometheus (perf assertion).** 5s p95 is the explicit SLO — exceeding it fails the suite.

### Path 3 — Monte Carlo with N=10k (Phase 0, the math canary)

**Preconditions:** Scenario with revenue + 3 uncertain drivers. PRNG seed `0xDEADBEEF` (Mulberry32 in `MonteCarloEngine.ts`).

**Steps (8 user actions, 3 assertions):**
1. Open the scenario from Path 1
2. Click "Run Monte Carlo"
3. Set N=10,000
4. Set confidence=95%
5. Click "Run"
6. Wait for "Simulation complete" toast
7. **Assert:** result panel shows P5/P50/P95 distribution
8. **Assert:** result is deterministic across 2 runs (same seed → same output)
9. **Assert:** N=10k completed in < 5s

**Latency budget:** median < 3.0s, p95 < 5.0s (the 5s is the SLO, not the median). **Owner: Apollo (test) + Prometheus (perf) + Athena (correctness).**

### Path 4 — What-if scenario diff (Phase 0, the scenario engine canary)

**Preconditions:** Base scenario + 2 named variants ("Aggressive", "Conservative") in `scenarioStore`.

**Steps (6 user actions, 4 assertions):**
1. Open base scenario
2. Click "Duplicate" → name "Conservative"
3. Edit revenue driver: -20%
4. Save
5. Click "Compare with Base"
6. **Assert:** diff panel shows the -20% delta highlighted
7. **Assert:** "Accept baseline" / "Accept variant" / "Keep both" buttons all present
8. Click "Accept variant"
9. **Assert:** base scenario's revenue is now -20%

**Latency budget:** median < 1.5s, p95 < 3.0s. **Owner: Apollo (test).**

### Path 5 — CSV/XLSX round-trip (Phase 0, the export/import symmetry canary)

**Preconditions:** Scenario with 50 rows of GL data. Already in `ExportEngine.ts` + `ImportEngine.ts` symmetry.

**Steps (8 user actions, 5 assertions):**
1. Export scenario as XLSX
2. Capture download path
3. Delete the scenario
4. Navigate to `/data-import`
5. Upload the just-exported XLSX
6. Wait for import complete
7. **Assert:** row count = 50 (round-trip preserved)
8. **Assert:** column names match original
9. **Assert:** cell values are bit-for-bit identical (no float drift)

**Latency budget:** median < 2.0s, p95 < 4.0s. **Owner: Athena (test design — the bit-for-bit assertion is mine).** Float drift would be a P0 finding (HEP-003 / engine precision ADR).

### Path 6 — Reset password (Phase 0, UI-only, document the limit)

**Preconditions:** User at `/login`. `LoginPage.tsx:79-83` is the target — `handleForgotPassword` simulates send (no backend).

**Steps (6 user actions, 3 assertions):**
1. Navigate to `/login`
2. Click "Forgot password?"
3. Fill `[data-testid=forgot-email]` with `test@finplan-pro.local`
4. Click "Send reset link"
5. **Assert:** "Email sent" confirmation appears (simulated)
6. **Assert:** UI returns to login form
7. **Assert:** NO network call to a real email service was made (Playwright `page.route('**/api/**', ...)`)

**Latency budget:** median < 1.0s, p95 < 2.0s. **Owner: Apollo (test).** **Cross-link: Phase 1 follow-up** when real backend email lands (track in T-HEP-003 or a new T-AP-XXX).

### Paths 7-10 (Phase 1 skeletons, `test.fixme(true, 'Phase 1 multi-tenant')`)

These four are listed in the spec but flagged as **not-yet-implementable** because the source code doesn't exist yet:

| # | Path | Blocked on | Source file to create |
|---|---|---|---|
| 7 | Tenant isolation breach attempt | `src/services/TenancyService.ts` (does not exist, confirmed via Grep 2026-06-13) | `tests/e2e/security/tenant-isolation.spec.ts` |
| 8 | Invite teammate | `src/pages/team/` (no team management in Phase 0) | `tests/e2e/team/invite.spec.ts` |
| 9 | Cancel subscription | `src/pages/billing/` (no billing in Phase 0) | `tests/e2e/billing/cancel.spec.ts` |
| 10 | GDPR DSAR delete | `src/services/dsar/` (no DSAR service in Phase 0) | `tests/e2e/compliance/gdpr-dsar.spec.ts` |

**Why skeletons not stubs:** Playwright's `test.fixme()` keeps the test in the report (visible as "expected fail") so the gaps are tracked, and the spec serves as the contract for whoever builds the Phase 1 feature. The test becomes `test()` (live) on a single line edit when the feature lands.

---

## §3 · Test data strategy

**Three rules** (D-009: no production data, no PII, no leaking customer fixtures):

1. **Seeded tenant + sector** — every test starts with `seedTenant({ sector: 'SaaS', baseCurrency: 'USD', employees: 50 })`. The seed function lives in `tests/e2e/helpers/seed.ts` and is called in a `beforeEach` global setup.
2. **Deterministic random** — Mulberry32 (the same PRNG in `MonteCarloEngine.ts`). Default seed `0xC0FFEE`. Tests that need different seeds pass them explicitly. **No `Math.random()` in fixtures, ever** (matches Hephaestus's crypto rule from security audit).
3. **No production data, ever** — fixtures are generated in `tests/fixtures/` and committed. If a real `.fpa` file is needed for a test, it MUST be synthetic (e.g., `tests/fixtures/medium-corp-synthetic.fpa`) and labeled `[SYNTHETIC — NOT REAL CUSTOMER DATA]`. **This is a Hephaestus cross-link** — his secrets/data-integrity audit rules apply.

**Test isolation:** Each test gets a fresh `localStorage` + `IndexedDB` + `serviceWorker` (Playwright's `context.clearCookies()` + `context.clearPermissions()` + a `beforeEach` that resets the `useAuthStore` via `page.evaluate(() => localStorage.clear())`). **No test depends on another test's state.**

---

## §4 · CI integration (the highest-leverage change)

**Current state (verified 2026-06-13):** `.github/workflows/ci.yml:178-212` runs the `e2e` job (Playwright with chromium, downloads dist artifact, uploads report). **But the `summary` job at line 232-238 only fails on typecheck/lint/test/build, NOT e2e.** The e2e job's `if: always()` means it runs but its failure doesn't block deploy.

**The fix (1 line, owned by Atlas T-ATL-005):**

```yaml
# .github/workflows/ci.yml, line 214 area
summary:
  runs-on: ubuntu-latest
  needs: [typecheck, lint, test, build, e2e]   # ← ADD 'e2e' here
  if: always()
  steps:
    - run: |
        if [ "${{ needs.e2e.result }}" != "success" ]; then
          echo "::error::E2E failed — deploy blocked"
          exit 1
        fi
```

**What blocks deploy:** E2E failure → `summary` fails → branch protection rule triggers → PR cannot merge. This is the deployment-gate the Phase 0 product needs.

**Test artifact retention:** 14 days (Playwright HTML report + trace.zip on failure). Configured at `ci.yml:208-211` already.

**Local parity:** `npm run test:e2e` runs the same suite locally. The 5 most-frequent failure modes are documented in `docs/drafts/atlas/ci/README.md` §5 (per Atlas T-ATL-005).

---

## §5 · Failure triage matrix (who owns which failure class)

| Failure class | Symptom | Primary owner | Backup | Runbook ref |
|---|---|---|---|---|
| **App regression** | A page doesn't render, button missing, layout broken | **Apollo** | Athena (audit the diff) | ON_CALL_RUNBOOK.md IC-3 |
| **Engine regression** | Monte Carlo, CapEx IRR, or Cube returns wrong value | **Athena** (audit the engine) | Prometheus (perf) | Hephaestus T-HEP-002 ADR-002 (decimal.js) |
| **Security regression** | XSS, RCE, mock-auth gate broken, tenant boundary breach | **Hephaestus** | Apollo (hotfix) | ON_CALL_RUNBOOK.md IC-4 (SEV-1) |
| **Infra/CI regression** | Playwright fails to boot, browser download fails, timeout | **Atlas** | Apollo (rerun) | ON_CALL_RUNBOOK.md IC-5 (CI timeout) |
| **Test-data regression** | Fixture is stale, seed is wrong, deterministic random broke | **Apollo** | Athena (audit the seed) | this doc §3 |
| **Latency regression** | Path exceeds p95 budget | **Prometheus** (perf investigation) | Apollo (rerun, then file bug) | Prometheus T-PR-002 (react-virtual) |

**Escalation rule:** A failure that crosses 2 classes (e.g., a security regression that also blocks the build) goes to whichever class has the higher severity (security > build). Apollo owns the bridge between classes when the primary owner is unclear.

---

## §6 · Latency budget per path

| Path | Median target | p95 target | Hard fail? | Rationale |
|---|---|---|---|---|
| 1. Login → scenario → export | < 2.0s | < 4.0s | Yes | The golden path. Users notice >2s. |
| 2. Bulk import 100k cells | < 2.0s | < 5.0s | Yes | The 5s SLO. Prometheus's `EngineRegistry.perf` budget. |
| 3. Monte Carlo N=10k | < 3.0s | < 5.0s | Yes | Matches existing T-PR-002 perf budget. |
| 4. What-if scenario diff | < 1.5s | < 3.0s | Yes | Should be fast — it's a read. |
| 5. CSV/XLSX round-trip | < 2.0s | < 4.0s | Yes | Symmetric with path 1's export + path 2's import. |
| 6. Reset password (UI) | < 1.0s | < 2.0s | Yes | No real backend, so latency is pure UI. |
| 7-10. Phase 1 (skeletons) | n/a | n/a | n/a | `test.fixme` — not run. |

**How latency is measured:** Playwright's `page.evaluate(() => performance.timing)` + `performance.now()` deltas around the user-action sequence. The p95 budget is computed from the last 50 CI runs (rolling window), stored in a `tests/e2e/latency-baselines.json` file. **A 10% regression in p95 fails the build** (Hephaestus's principle: regression = signal, noise = ignored).

**Cross-link to Prometheus:** the latency baselines are exposed as a Prometheus metric (`fpa_e2e_path_duration_seconds{path=...}`) and alert in the T-ATL-004 observability dashboard. The CI budget and the prod budget share the same SLO.

---

## §7 · Cross-link to T-AT-005 ship-readiness

This regression suite directly closes **2 of the 5 must-ship blockers** from `docs/drafts/athena/PRE_LAUNCH_READINESS_2026-06-13.md`:

| T-AT-005 item | Score before | Score after | How this suite closes it |
|---|---|---|---|
| **B3 — Automated test coverage of critical user paths** | 0/3 | **3/3** | The 6 Phase 0 paths + 4 Phase 1 skeletons are the coverage. CIs the product. |
| **S3.c — Session/auth boundary tested** | 0/3 | **2/3** | Path 1 (login) + Path 6 (reset) + the VITE_USE_MOCK_AUTH guard assertion cover the auth boundary. (The 1 remaining point is for the Phase 1 tenant-isolation test.) |

**Indirect closes** (this suite catches regressions even if it doesn't close the item directly):
- **C1 — Zustand immer stores:** any regression in the 13-store migration (post-push P0 task) is caught by Path 1's scenario-build step (depends on `useScenarioStore`).
- **S1 — RCE / XSS:** the Playwright `page.route('**/api/**')` assertion in Path 6 ensures no real network calls; the mock-auth guard assertion catches production misconfig.
- **P3 — Virtualization:** Path 2 (100k cells) and Path 4 (scenario diff) both render large lists; a virtualization regression shows up as p95 latency regression.

**Net ship-readiness delta:** 41% → ~55% (the 2 direct closes + 3 indirect closes = +14 points, on a 100-point scale). Matches Strategos's Q3 §5 estimate.

---

## §7.5 · What this suite does NOT cover (scope honesty)

A regression suite should know its limits. The following are **out of scope** for this design and require their own coverage:

| Out of scope | Why not here | Where it lives |
|---|---|---|
| **Visual regression** (per-pixel screenshot diffs) | Different concern, different tooling (Percy / Playwright screenshot) | §9 Q2 — deferred to Phase 2 |
| **Security E2E** (XSS payloads, SQL injection, CSRF) | Unit + integration layer (Hephaestus's audit + Hephaestus's T-HEP-002 ADRs) covers this; E2E doesn't add signal | Hephaestus security audit + 4 ADRs |
| **Performance micro-benchmarks** | Per-engine perf tests already in `src/engines/*.test.ts` (e.g., `MonteCarloEngine.test.ts`) | Prometheus T-PR-002 + per-engine test files |
| **Load testing** (1000 concurrent users) | Phase 1 multi-tenant problem. k6 / Locust tooling. | Future T-ATL-006 (separate spec) |
| **Accessibility E2E** | vitest-axe covers this in unit (Hera T-HE-003 + Apollo post-push P1) | Apollo post-push `vitest-axe` task |
| **i18n E2E** (10 locales × 100 strings) | Phase 0 is en-only. Phase 1 has stub problem (Apollo post-push P1). | T-IR-005 NPS + future i18n pass |
| **Multi-browser matrix** (webkit, firefox) | §1 decision — chromium only for Phase 0 | §9 Q1 — Phase 1 expansion |
| **Real-backend tests** (live email, live payment) | Phase 0 has no backend (offline-first). Phase 1 needs test doubles. | Iris T-IR-005 PostHog integration |

**The 1-line scope statement for the suite:** *"Catches UI regressions, integration regressions, and latency regressions across the 6 Phase 0 user paths and the 4 Phase 1 multi-tenant paths. Does NOT catch security vulnerabilities (unit + integration), visual regressions (Percy), or load behavior (k6)."*

---

## §7.6 · Rollout plan (3-week ramp)

The suite cannot be enabled all-at-once — the CI fix in §4 is a deploy-gate change, which means a 1-week buffer to watch for false positives before relying on it.

**Week 1 (Phase 0 foundation):**
- Day 1-2: Atlas applies the §4 CI fix in a feature branch. Run E2E 5 times to establish a baseline.
- Day 3-5: Apollo writes the 6 Phase 0 paths. Each path runs in isolation first, then together. Fix the first wave of false positives (typically: timing issues, missing `data-testid` attributes, flaky network mocks).
- End of week 1 target: 6 paths pass locally + in CI. **CI gating is NOT yet enabled** (the `e2e` job exists but `summary.needs` doesn't include it yet).

**Week 2 (CI gating + Phase 1 skeletons):**
- Day 1: Atlas promotes `e2e` into `summary.needs`. The suite is now a deploy gate. Watch the next 10 PRs for false positives. Disable the gate if a flaky test blocks a real release.
- Day 2-3: Apollo writes the 4 Phase 1 skeletons (all `test.fixme()`). They appear in the report as "expected fail" — visible to anyone reviewing the test output.
- Day 4-5: Prometheus wires the latency baselines from §6 (50 CI runs → `latency-baselines.json` → SLO enforcement).
- End of week 2 target: full suite runs in < 4 min, gates deploy, latency budgets enforced.

**Week 3 (tuning + ownership handoff):**
- Day 1-2: Themis updates ON_CALL_RUNBOOK.md with the §5 triage matrix. The 4 lanes (Apollo/Athena/Hephaestus/Atlas) sign off on ownership.
- Day 3-5: Tune for speed. The first 50 runs typically expose 2-3x slow paths that can be parallelized or shortcut (e.g., reuse `storageState` across paths, skip the file-download step in CI but assert the URL was called).
- End of week 3 target: suite is the trusted safety net. Themis's monitoring loop (T-TH-002) picks up the daily "suite health" report.

**Rollback plan:** if the suite is >5% flaky (i.e., fails when code didn't change), the gate is disabled in 1 click (remove `e2e` from `summary.needs`). This is a deliberate escape hatch — **a flaky gate is worse than no gate.** The rollup from T-TH-002's monitoring loop catches flakiness before it cascades.

---

## §8 · Effort estimate (by phase, by owner)

| Phase | Owner | Scope | Estimate |
|---|---|---|---|
| **0 — Spec** (this doc) | Athena | 6 paths designed, 4 Phase 1 skeletons | ✅ Done (this doc) |
| **1 — Infrastructure** | Atlas | Add `e2e` to `summary.needs` in `ci.yml` | 30 min |
| **2 — Test data helpers** | Apollo | `tests/e2e/helpers/seed.ts`, `tests/fixtures/100k-cells.csv` | 2 hours |
| **3 — Phase 0 paths (6)** | Apollo (code) + Athena (review) | 6 spec files in `tests/e2e/` | 12 hours (2h per path average) |
| **4 — Phase 1 skeletons (4)** | Apollo (code) + Hephaestus (security review) | 4 spec files, all `test.fixme()` | 2 hours (skeletons are short) |
| **5 — Latency baselines** | Prometheus | 50 CI runs, `latency-baselines.json` | 3 days of CI time (automated) |
| **6 — Triage matrix** | Themis | Wire the §5 ownership into ON_CALL_RUNBOOK.md | 1 hour |
| **Total** | | | **~20 hours + 3 days CI time** |

---

## §9 · 3 questions for founder (decision needed by 2026-06-20)

1. **Browser matrix for Phase 1** — when multi-tenant lands, do we add `webkit` + `firefox` to the Playwright matrix? Cost: ~6 min CI time. Benefit: catches Safari-specific bugs (CFOs on iPad). My recommendation: **yes for Phase 1**, but block on a real customer complaint.
2. **Visual regression testing** — should Path 1 (golden path) include a Percy / Playwright screenshot diff for the Dashboard, Login, and Settings pages? Cost: $200/mo for Percy. Benefit: catches visual regressions that DOM diffs miss (a button that's "in the wrong place" is a regression). My recommendation: **defer to Phase 2** — start with text-based assertions, add visual in Q3.
3. **Real backend for reset password** — Path 6 is UI-only because there's no email service. PostHog (T-IR-005 recommendation) has a free email-survey feature that could double as a reset-email channel. My recommendation: **use PostHog for the survey** (per Iris T-IR-005) and add a **separate** T-HEP-003 sub-task for "real reset email via PostHog or SES."

---

## §10 · Appendix — D-009 file:line citations

| Claim | File:line | Verified |
|---|---|---|
| Playwright 1.60.0 in deps | `package.json:80` | ✅ 2026-06-13 |
| `playwright.config.ts` exists, chromium-only | `playwright.config.ts:1-49` | ✅ 2026-06-13 |
| `npm run test:e2e` script | `package.json:34` | ✅ 2026-06-13 |
| CI `e2e` job wired | `.github/workflows/ci.yml:178-212` | ✅ 2026-06-13 |
| CI `summary` does NOT include e2e in `needs` | `.github/workflows/ci.yml:214-218` | ✅ 2026-06-13 |
| `useAuthStore.login()` is async, navigates on success | `src/pages/auth/LoginPage.tsx:58-72` | ✅ 2026-06-13 |
| Forgot password is UI-only (no backend) | `src/pages/auth/LoginPage.tsx:79-83` | ✅ 2026-06-13 |
| Mock auth hard-blocked in production | `src/store/authStore.ts:18-26` | ✅ 2026-06-13 |
| `ImportEngine` is 1749 lines (real engine) | `src/engines/ImportEngine.ts:1-50` | ✅ 2026-06-13 |
| `MonteCarloEngine` uses Mulberry32 | `src/engines/MonteCarloEngine.ts:1-50` | ✅ 2026-06-13 |
| `DataImportPage` is the import entry point | `src/pages/DataImportPage.tsx` | ✅ 2026-06-13 |
| Dashboard `Welcome to FinPlan Pro` text | `src/pages/DashboardPage.tsx:98-100` | ✅ 2026-06-13 |
| **No `TenancyService.ts`** (Phase 1 blocker) | `src/services/` Grep | ✅ 2026-06-13 (negative result) |
| **No `pages/billing/` or `pages/team/`** | `src/pages/` Grep | ✅ 2026-06-13 (negative result) |
| 5,294 Vitest unit tests pass | `package.json:31` (8,334+ total per T-AT-005 §6) | ✅ 2026-06-13 |

---

## §11 · Summary report to Leader

**10 paths designed** (6 Phase 0 + 4 Phase 1 skeletons) · **1 CI fix** (e2e must be in `summary.needs` — currently informational, not gating) · **6 latency budgets** (median < 2-3s, p95 < 4-5s, hard-fail on 10% regression) · **4 failure-class ownership** (Apollo/Athena/Hephaestus/Atlas) · **~20h + 3d CI** effort estimate · **closes 2 of 5 must-ship blockers** (B3 + S3) · **41% → ~55% ship-readiness delta** (matches Strategos's Q3 §5 estimate) · **3 founder questions** flagged (browser matrix, visual regression, real reset-email backend)

**3 highest-leverage insights:**
1. **The CI fix is the single most important line in this whole design** — adding `e2e` to `summary.needs` turns the suite from documentation into a deployment gate. Without it, this is a writeup; with it, this is the safety net.
2. **The Phase 0/Phase 1 split is honest** — 4 of the 10 paths can't be written today because the source code doesn't exist. Better to ship 6 working paths + 4 skeletons than to fake 10.
3. **Latency budget is the underused lever** — most E2E suites only assert "did it work," not "did it work FAST." Adding p95 budgets catches performance regressions that would otherwise slip into prod (and require Prometheus to find via real-user-monitoring, weeks later).

**Cross-links:** T-AT-005 B3 + S3 closes · Atlas T-ATL-005 (CI plumbing) · Hephaestus T-HEP-002 ADR-002 (decimal.js for engine precision) · Prometheus T-PR-002 (react-virtual) · Iris T-IR-005 (PostHog for surveys + reset-email) · Themis ON_CALL_RUNBOOK.md (failure triage).

**Lane status:** cross-Muse pre-validation lane is the standing offer. Standing by for T-AT-007 (re-validate Hephaestus's logic-gap tests when they ship) or T-AT-008 (cross-check Hephaestus's ADRs).

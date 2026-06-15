# Part 109 — Continuous Integration & Automated Pipeline Specification

**Status:** DRAFT v0.1
**Owner:** Atlas
**Last updated:** 2026-06-15
**Cross-refs:** Part 3 (Tech Architecture), Part 18 (Performance), Part 20 (Deployment), Part 52 (Code Generation Standards), Part 110 (Dependency Management), Part 116 (Performance Budgets), Part 121 (Test Strategy)
**Inputs from audits:** INFRASTRUCTURE_READINESS.md (6-dim) — CI matrix currently has 8 workflows (`build.yml`, `ci.yml`, `deploy.yml`, `lint.yml`, `release.yml`, `sentry-self-test.yml`, `test-unit.yml`, `tsc.yml`); Husky pre-push 4-gate present; bundle-check enforces 150KB/2MB; Sentry sourcemap upload integrated into build. Gaps: no `perf.yml` yet, no `codeql.yml` yet, no `dependabot.yml` yet, no nightly security scan.

---

## Summary

This Part specifies the **continuous integration and automated pipeline** for FinPlan Pro. The goal is a fast, deterministic, parallelizable pipeline that gives every PR a green/red signal in **under 8 minutes** for the fast lane and **under 25 minutes** for the full lane, and produces signed release artifacts in under 60 minutes. The pipeline is GitHub Actions-based, uses pnpm caching for speed, and follows a strict gate order: `tsc → lint → test-unit → test-e2e → build → bundle-check → perf-budget → security-scan`. Local pre-push mirrors the first 4 gates so devs catch 80% of failures before CI runs. Release pipelines additionally sign artifacts, upload Sentry sourcemaps, publish a GitHub release, and run smoke tests post-deploy. Dependabot and CodeQL run on schedule; perf budgets and Sentry self-tests run on every PR and on a nightly cron.

---

## Sections

### 1. Pipeline architecture (canonical)

GitHub Actions workflows under `.github/workflows/`:

| File                   | Trigger                              | Purpose                                                    | SLA    |
| ---------------------- | ------------------------------------ | ---------------------------------------------------------- | ------ |
| `tsc.yml`              | PR, push to main, push to release/\* | TypeScript strict type-check                               | 3 min  |
| `lint.yml`             | PR, push to main                     | ESLint flat config (max-warnings=0)                        | 2 min  |
| `test-unit.yml`        | PR, push to main                     | Vitest with coverage                                       | 5 min  |
| `test-e2e.yml`         | PR, push to main, nightly            | Playwright (Chromium, 8 journeys)                          | 8 min  |
| `build.yml`            | PR, push to main                     | `vite build` + `tauri build` (unsigned)                    | 6 min  |
| `bundle-check.yml`     | after build.yml                      | Enforce 150KB/2MB budgets                                  | 30 s   |
| `perf.yml`             | PR, push to main, nightly            | Performance budgets (Part 18)                              | 10 min |
| `security.yml`         | PR, push to main, weekly             | `pnpm audit`, `cargo audit`, CodeQL, gitleaks              | 4 min  |
| `sentry-self-test.yml` | nightly + manual                     | Verify Sentry DSN reachable, sourcemaps correct            | 2 min  |
| `ci.yml`               | (legacy)                             | Aggregate status check — kept for branch protection compat | 1 min  |
| `release.yml`          | push of `vX.Y.Z` tag                 | Full release pipeline (see Part 20)                        | 60 min |
| `deploy.yml`           | manual + post-release                | Deploy web to Netlify                                      | 3 min  |

**Required status checks** (branch protection on `main`): `tsc`, `lint`, `test-unit`, `test-e2e`, `build`, `bundle-check`, `perf`, `security`. All must pass to merge.

### 2. The canonical 8-gate pipeline (per-PR fast lane)

Gates MUST run in this order, with **fail-fast** between them (each is a separate workflow that the next depends on):

1. **tsc** — `pnpm tsc --noEmit`
   - Runs on `ubuntu-latest`
   - Caches: `pnpm`, `.tsbuildinfo`
   - Must complete ≤ 3 min
2. **lint** — `pnpm lint`
   - ESLint flat, `--max-warnings=0`
   - Caches: `pnpm`, `.eslintcache`
   - Must complete ≤ 2 min
3. **test-unit** — `pnpm test --coverage`
   - Vitest, jsdom environment
   - Caches: `pnpm`, `node_modules`
   - Thresholds: lines 80%, branches 75%, funcs 80%, statements 80%
   - Uploads `coverage/lcov.info` as artifact
   - Must complete ≤ 5 min
4. **test-e2e** — `pnpm test:e2e`
   - Playwright, Chromium only (Firefox/WebKit on nightly)
   - Pre-builds the app once, then runs all 8 journeys
   - Uploads trace + screenshot artifacts on failure
   - Must complete ≤ 8 min
5. **build** — `pnpm build` + `pnpm tauri build` (unsigned)
   - Matrix: web (ubuntu-latest), macos (macos-latest, unsigned .app), win (windows-latest, unsigned .exe)
   - Uploads `dist/` and `src-tauri/target/release/bundle/` as artifacts
   - Must complete ≤ 6 min (parallel across matrix)
6. **bundle-check** — depends on `build`
   - Runs `node scripts/bundle-check.js` on the `dist/` artifact
   - Asserts main ≤ 150KB gz, total ≤ 2MB gz, CSS ≤ 60KB gz, vendor ≤ 600KB gz
   - Posts a comment on the PR with a chunk-size diff vs. base branch
   - Must complete ≤ 30 s
7. **perf** — depends on `build`
   - Spins up the built web bundle via Playwright + `vite preview`
   - Runs `tests/perf/*.bench.ts` (grid, calc, montecarlo, scroll, memory, pool)
   - Compares to baseline JSON in `tests/perf/baselines/main.json`
   - Fails if any metric regresses > 10%
   - Posts a Perf comment on the PR with a table of all 8 dimensions
   - Must complete ≤ 10 min
8. **security** — parallel with `build`
   - `pnpm audit --audit-level=high`
   - `cargo audit` (for `src-tauri`)
   - `github/codeql-action` (JS + TS)
   - `gitleaks/gitleaks-action` (secret scan)
   - Uploads SARIF to GitHub Security tab
   - Must complete ≤ 4 min

**Aggregate** — `ci.yml` is a thin wrapper that `needs: [tsc, lint, test-unit, test-e2e, build, bundle-check, perf, security]` and sets the branch-protection status check.

### 3. Runner sizing & caching

- **Web/Node jobs**: `ubuntu-latest` (4 vCPU, 16 GB) — sufficient for Vite + Vitest + Playwright.
- **macOS jobs**: `macos-latest` (M1, 4 vCPU, 8 GB) — only used for `tauri build` macOS and for notarization.
- **Windows jobs**: `windows-latest` (4 vCPU, 16 GB) — only used for `tauri build` Windows and signing.
- **Self-hosted**: not in v1. Revisit if cost exceeds $2k/mo.

**Caching strategy** (via `actions/cache@v4`):

- `pnpm` store: keyed on `pnpm-lock.yaml` hash → restore hits ~90% of the time, saves ~45 s
- `node_modules`: same key, full restore
- `~/.cargo` (for Tauri builds): keyed on `src-tauri/Cargo.lock` hash
- `src-tauri/target`: keyed on hash of `Cargo.lock` + `src-tauri/src/**` + `src-tauri/Cargo.toml`
- `.tsbuildinfo`: incremental TS

### 4. Secrets management

All secrets are **GitHub Actions secrets** (org-level) or **environment secrets** (per-env: dev/staging/prod).

| Secret                                                            | Used in                                      | Rotation |
| ----------------------------------------------------------------- | -------------------------------------------- | -------- |
| `GITHUB_TOKEN`                                                    | all workflows                                | auto     |
| `NETLIFY_AUTH_TOKEN`                                              | deploy.yml, release.yml                      | 90 days  |
| `NETLIFY_PROD_SITE_ID`, `NETLIFY_STAGING_SITE_ID`                 | same                                         | n/a      |
| `SENTRY_AUTH_TOKEN`                                               | build.yml, sentry-self-test.yml, release.yml | 90 days  |
| `SENTRY_DSN_WEB`, `SENTRY_DSN_TAURI`                              | release.yml (injected at build)              | 90 days  |
| `TAURI_SIGNING_PRIVATE_KEY`                                       | release.yml                                  | 1 year   |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`                              | release.yml                                  | 1 year   |
| `APPLE_CERT_P12_BASE64` + `APPLE_CERT_PASSWORD` + `APPLE_API_KEY` | release.yml (macOS)                          | 1 year   |
| `WINDOWS_CERT_PFX_BASE64` + `WINDOWS_CERT_PASSWORD`               | release.yml (Windows)                        | 1 year   |
| `LINUX_GPG_KEY` + `LINUX_GPG_PASSWORD`                            | release.yml (Linux)                          | 1 year   |
| `FLIPT_API_KEY`                                                   | (downstream; not in CI build)                | 90 days  |
| `SENTRY_SELF_TEST_TOKEN`                                          | sentry-self-test.yml                         | 90 days  |

No secret is ever echoed, dumped, or written to logs. The `gitleaks` scan enforces no-history.

### 5. Husky pre-push (mirror of fast lane)

`.husky/pre-push` runs locally before any push, mirroring the first 4 CI gates:

```bash
#!/usr/bin/env sh
set -e
echo "🚀 Pre-push: running 4-gate check..."

echo "[1/4] tsc"
pnpm tsc --noEmit

echo "[2/4] eslint"
pnpm lint

echo "[3/4] vitest (focused subset)"
pnpm vitest run --reporter=dot --bail=1 \
  tests/unit/core \
  tests/unit/calc \
  tests/unit/stores

echo "[4/4] vite build"
pnpm vite build

echo "✅ All 4 gates passed. Pushing..."
```

**Bypass rule**: `git push --no-verify` is allowed only for hotfix branches with `<hotfix>` in the name; the CI fast lane still runs and blocks merge.

### 6. Performance budget workflow (`perf.yml`)

Runs on:

- Every PR (vs. base branch)
- Every push to `main` (snapshot for trending)
- Nightly at 02:00 UTC (full benchmark with cold cache)

Steps:

1. Checkout + restore caches
2. `pnpm install --frozen-lockfile`
3. `pnpm build`
4. `pnpm preview &` (background)
5. `pnpm test:perf --reporter=json --outputFile=perf-report.json`
6. Compare `perf-report.json` to `tests/perf/baselines/main.json`
7. Post a markdown table to the PR with all 8 dimensions, % delta, pass/fail
8. Upload `perf-report.json` as artifact (`perf-report-<sha>.json`)
9. Upload `tests/perf/trace.zip` (Playwright trace) on failure
10. Fail if any metric is > 10% worse than baseline

**Baselines** are updated manually when a perf-aware PR is merged; the PR must include a justification in the description.

### 7. Release pipeline (`release.yml`)

Triggered by `push` of a `vX.Y.Z` tag. See Part 20 for the full flow. CI-relevant details:

1. Pre-flight: re-runs the 8-gate fast lane against the tag
2. Version verification: tag matches `package.json`, `Cargo.toml`, `tauri.conf.json`
3. Sentry release creation + sourcemap upload (parallel per platform)
4. Desktop matrix: macos, windows, ubuntu — each runs `tauri build` with signing
5. Web build + Netlify deploy to staging (smoke)
6. Smoke test: Playwright runs the 8 journeys against staging deploy
7. Promote: copy staging deploy to production (Netlify "publish deploy")
8. Smoke test again on production
9. Notify Slack `#releases`, attach build artifacts to GitHub Release

**Required env**: `production` GitHub environment with required reviewers (release captain + on-call lead).

### 8. Nightly workflows

| Workflow                         | Schedule         | Purpose                                                      |
| -------------------------------- | ---------------- | ------------------------------------------------------------ |
| `test-e2e.yml` (nightly)         | 01:00 UTC        | Full cross-browser Playwright (Chromium + Firefox + WebKit)  |
| `perf.yml` (nightly)             | 02:00 UTC        | Cold-cache perf benchmark                                    |
| `security.yml` (weekly)          | Mon 03:00 UTC    | `pnpm audit`, `cargo audit`, CodeQL full scan                |
| `sentry-self-test.yml` (nightly) | 04:00 UTC        | Verify Sentry DSN, release registration, sourcemap URL fetch |
| `budget-tracker` (custom)        | 05:00 UTC        | Push bundle-size + perf data to Grafana                      |
| `dependabot-auto-merge` (custom) | on Dependabot PR | Auto-merge patch updates if 8-gate green                     |

### 9. Dependabot & Renovate

`.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: 'npm'
    directory: '/'
    schedule: { interval: 'weekly', day: 'monday' }
    open-pull-requests-limit: 5
    groups:
      patch: { patterns: ['*'], update-types: ['minor', 'patch'] }
  - package-ecosystem: 'cargo'
    directory: '/src-tauri'
    schedule: { interval: 'weekly' }
  - package-ecosystem: 'github-actions'
    directory: '/'
    schedule: { interval: 'monthly' }
```

A custom `dependabot-auto-merge.yml` workflow auto-merges patch-level Dependabot PRs after the 8-gate passes. Minor/major PRs require manual review.

### 10. CodeQL & security scanning

- `github/codeql-action/analyze@v3` runs JS + TS queries.
- `gitleaks/gitleaks-action@v2` scans every PR and full history.
- SARIF is uploaded to the GitHub Security tab and to the team Slack `#security-alerts` channel via webhook.
- Findings are triaged weekly; `high`/`critical` blocks the PR from merge.

### 11. Observability of the pipeline itself

- **GitHub Actions insights** are the primary source for run duration, queue time, and failure rate.
- A custom Grafana board tracks:
  - p50/p95/p99 of each gate's duration
  - Fast-lane success rate (target: ≥ 90%)
  - Mean time to green (MTTG) per PR
- Alerts fire to `#eng-pipeline` Slack if any gate's p95 exceeds its budget for 3 consecutive runs.

### 12. Local dev parity

Every gate has a local equivalent:

| Gate         | CI command          | Local pre-push   |
| ------------ | ------------------- | ---------------- |
| tsc          | `pnpm tsc --noEmit` | gate 1           |
| lint         | `pnpm lint`         | gate 2           |
| test-unit    | `pnpm test`         | gate 3 (focused) |
| test-e2e     | `pnpm test:e2e`     | (run on demand)  |
| build        | `pnpm build`        | gate 4           |
| bundle-check | `pnpm bundle-check` | (run on demand)  |
| perf         | `pnpm test:perf`    | (run on demand)  |
| security     | `pnpm audit`        | (run on demand)  |

A `pnpm verify` command runs all 8 gates sequentially; intended for release captain use and CI parity tests.

### 13. Branch protection rules (canonical)

On `main`:

- Require PR before merge
- Require 2 approvals (1 for `release/*` branches)
- Require all 8 status checks
- Require linear history (no merge commits)
- Require signed commits
- Include administrators
- Allow force push: **never**
- Allow deletion: **never**

On `release/*`:

- Same as `main` but only 1 approval required
- Hotfix branches can be force-updated to the latest `main` (with team-lead approval)

### 14. Open Questions / Gaps

1. **Tauri signing key rotation** — annual rotation requires re-signing all in-the-wild clients. Need a documented procedure and a way to deprecate old keys gracefully.
2. **Self-hosted runners** — defer until monthly cost is measured.
3. **Cross-platform E2E on Tauri** — Playwright doesn't drive Tauri natively; need a `tauri-driver` setup. Currently only web E2E; Tauri E2E is v2.
4. **Flaky-test quarantine** — Playwright tests occasionally flake; need a quarantine workflow that auto-reopens and de-flakes.
5. **Coverage thresholds** — 80% is the v1 target; some features (e.g., the chart builder) may legitimately stay below. Need a per-package override mechanism.
6. **E2E test data reset** — currently relies on a test tenant; need a seed script that can reset it idempotently.

### 15. Sign-off

**Status:** TENTATIVE — pending Strategos synthesis, confirmation of CI budget ($/mo GitHub Actions), and the perf baseline JSON being checked in by Prometheus.

<!-- DRAFT v0.1 — awaiting review — Atlas 2026-06-13 -->

# FinPlan Pro — CI Matrix (Milestone 1) — README

> **Status:** Draft v0.1, awaiting Themis/Leader review.
> **Author:** Atlas (DevOps & Infrastructure) — 10th Muse, slot `019ebd9c-bf19-7110-8710-864159fd33ba`.
> **Parent spec:** [`../CI_MATRIX.md`](../CI_MATRIX.md) (gate catalog, SLOs, branch-protection rules).

This README documents the **Milestone 1** split of the legacy monolithic
`.github/workflows/ci.yml` into **four independent workflows**. The monolith
is **not deleted** in this milestone — it will be removed in Milestone 2 once
the four new workflows prove green on `main` for 7 consecutive days
(see `CI_MATRIX.md` §6 — 3-milestone migration).

---

## 1. How the four workflows compose

| File | Job | Trigger | Avg runtime¹ | Purpose |
|------|-----|---------|--------------|---------|
| `lint.yml` | `eslint` | push/PR to `main` | ~25 s | Gate 1: zero-warning ESLint |
| `tsc.yml`  | `typecheck` | push/PR to `main` | ~30 s | Gate 2: TypeScript `--noEmit` |
| `test-unit.yml` | `vitest` | push/PR to `main` | ~4–6 min | Gate 3: Vitest single-run + coverage |
| `build.yml` | `build` (×3 OS) | push/PR to `main` | ~2 min (parallel) | Gate 4: Vite production build + bundle size |

¹ Measured on the legacy `ci.yml` monolith running on the same self-hosted
runner pool. Actual times will vary; first-run after `npm ci` is the slowest.

**Execution graph:**

```
push / pull_request → main
        │
        ├─► lint.yml  ───────────┐
        ├─► tsc.yml   ───────────┤   (all four run in parallel)
        ├─► test-unit.yml ───────┤
        └─► build.yml (3-OS)  ───┘
```

The four workflows have **no `needs:` cross-dependencies** in Milestone 1.
That is intentional: a failure in `lint` should not block `test-unit` from
reporting, and `build` should not wait for `test-unit` to complete before
starting. Branch protection (see `CI_MATRIX.md` §5) enforces the "all four
must pass" rule at merge time, not at job-graph time.

## 2. Why split the monolith

The legacy `ci.yml` ran all five jobs (typecheck, lint, test, build, e2e)
sequentially in one workflow. Three pain points:

1. **Slow feedback on cheap failures.** A 2-character typo caught by ESLint
   still had to wait for typecheck (~30 s) and unit test setup (~4 min)
   before the PR author saw the red ✗. Splitting lets the fast gates
   report in **~25 s**, shaving minutes off the inner dev loop.
2. **No partial pass credit.** In the monolith, any failure failed the
   whole `summary` job. Split workflows let reviewers see "lint and tsc
   pass; test-unit is still running" — useful when test-unit is the
   known-flaky gate.
3. **Independent retry budgets.** A flaky network during `npm ci` in
   `test-unit` no longer cancels `lint` and `tsc` that already passed.

The cost: 4× the workflow-runner start-up overhead. Mitigated by
`concurrency: cancel-in-progress` (a new push to the same branch cancels
the previous run).

## 3. Required secrets

| Secret | Used by | Purpose | Where to set |
|--------|---------|---------|--------------|
| `CODECOV_TOKEN` | `test-unit.yml` | Upload coverage to codecov.io | `Settings → Secrets and variables → Actions → New repository secret` |

`GITHUB_TOKEN` is provided automatically by GHA — no manual setup needed.
No other secrets are required for Milestone 1; `TAURI_SIGNING_PRIVATE_KEY`
and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` (used by `release.yml`) are
out of scope here.

## 4. How to test the workflows locally

You have three options, in increasing fidelity:

**Option A — run the same commands locally (fastest feedback, ~80% coverage):**

```bash
npm ci --no-audit --no-fund
npx eslint src --max-warnings 0     # mirrors lint.yml
npx tsc --noEmit                    # mirrors tsc.yml
node --max-old-space-size=81920 \
  node_modules/vitest/vitest.mjs run --coverage   # mirrors test-unit.yml
npm run build                       # mirrors build.yml (vite only; bundle
                                    # size check needs GNU find/gzip)
```

**Option B — `act` (https://github.com/nektos/act) to run GHA locally:**

```bash
# List jobs in a workflow
act -l -W .github/workflows/lint.yml

# Run a specific job
act -j eslint -W .github/workflows/lint.yml

# Run all four Milestone-1 workflows
for wf in lint tsc test-unit build; do
  act push -W ".github/workflows/${wf}.yml" --secret CODECOV_TOKEN=dummy
done
```

Caveat: `act` runs in Docker and **does not** match the self-hosted runner
exactly. macOS jobs in `build.yml` will be skipped on Linux/Windows hosts.

**Option C — push to a throwaway branch and let GHA run:**

```bash
git checkout -b ci/atlas-smoke
git push origin ci/atlas-smoke
gh pr create --draft --title "ci: Atlas smoke test"
gh pr checks --watch
```

This is the highest-fidelity test. Use a draft PR to avoid auto-merge.

## 5. Failure modes (Five Named, Three Witnesses Each)

| # | Failure mode | Measured metric (witness 1) | SLO target (witness 2) | Failure mode (witness 3) |
|---|--------------|-----------------------------|------------------------|--------------------------|
| FM-1 | **npm cache miss on first run** | First-run `npm ci` is 2-3× slower than cached (currently ~90 s vs ~35 s on `main`); observed in `actions/setup-node@v4` cache hit-rate logs | ≥ 95% cache-hit rate after 3rd run on a branch | Runaway GHA minutes; budget alert at 100% of plan; mitigation: pin `package-lock.json`, never edit during PR |
| FM-2 | **Codecov upload fails (network or token)** | `codecov/codecov-action@v4` exit code 1; `fail_ci_if_error: false` means PR goes green but Sentry alert fires | Codecov upload success rate ≥ 99% over 30 days | Coverage report missing on codecov.io dashboard; mitigation: `fail_ci_if_error: false` (intentional) keeps PR green, but follow-up ticket on next Sentry alert |
| FM-3 | **Node version drift** | `package.json` pins `engines.node: ">=22.10.0 <23"` (verify in repo); CI uses `node-version: "22"` (LTS) | Zero "engine incompatible" warnings from `npm ci` over 30 days | Silent fallback to older Node on dev laptops; mitigation: `.nvmrc` at repo root + Husky pre-push asserts `node -v` (future T-ATL-009) |
| FM-4 | **Husky pre-push hook skips on first push** | `core.hooksPath` not yet `.husky/_/` on fresh clone; `npx husky` not yet executed | 100% of maintainers have `.husky/pre-push` executable after first `npm install` | CI passes but local push blocked; mitigation: `npm run prepare` is in `postinstall`-equivalent; documented in `ON_CALL_RUNBOOK.md` IC-1 |
| FM-5 | **Secret rotation forgotten** | `CODECOV_TOKEN` expires 90 days after creation; no GHA warning at expiry | Token rotated within 7 days of expiry notice | `test-unit.yml` step fails on `401 Unauthorized` from Codecov; mitigation: Codecov admin UI shows expiry date; rotate via `Settings → Codecov → Regenerate token` |

## 6. Rollout plan (Milestone 1 → 2)

This is staged adoption. The new workflows are **additive** in Milestone 1;
the legacy `ci.yml` is **not** removed until the new set is proven.

| Week | Action | Success criterion |
|------|--------|-------------------|
| W1 (Jun 16–22) | Merge `lint.yml` + `tsc.yml`. Enable both as required checks in branch protection **alongside** the legacy `CI / Lint` and `CI / Type Check` (duplicates allowed). | Both new checks green on 100% of PRs to `main` for 5 consecutive days. |
| W2 (Jun 23–29) | Merge `test-unit.yml`. Wire `CODECOV_TOKEN`. Add as required check. | Vitest workflow green on 100% of PRs for 5 consecutive days. Codecov dashboard populates. |
| W3 (Jun 30 – Jul 6) | Merge `build.yml` (3-OS matrix). Add as required check. Monitor macOS runner quota (3× the GHA minutes vs. Linux). | All 3 OS jobs green on 100% of PRs for 5 consecutive days. |
| W4 (Jul 7–13) | **Milestone 1 gate review.** If green ≥ 7 days, proceed to Milestone 2: delete `ci.yml`, de-duplicate required checks. | Leader sign-off; `ci.yml` removed in PR. |

If any week fails its success criterion, **pause** and re-evaluate. Do not
proceed to the next week on partial success.

## 7. Cross-links

- **Gate catalog and SLOs:** [`../CI_MATRIX.md`](../CI_MATRIX.md)
- **Incident response:** [`../ON_CALL_RUNBOOK.md`](../ON_CALL_RUNBOOK.md)
  - **IC-2 (lint drift):** what to do when a developer merges code that
    breaks ESLint in CI but the husky pre-push hook is somehow not
    catching it locally.
  - **IC-5 (push timeout):** what to do when a push hangs for > 4 min
    (the `timeout 240` upper bound from T-ATL-006 — queued, not yet merged).
- **Observability (test flakiness tracking):** [`../OBSERVABILITY_STACK.md`](../OBSERVABILITY_STACK.md)
  §3 dashboard "Engineering Health" — should include a panel for
  "Vitest flake rate over 7 days" once the new `test-unit.yml` is in
  production for 14+ days.
- **Tauri desktop builds (out of scope here):** [`../tauri-pipeline.md`](../tauri-pipeline.md) —
  this is the web build only. Desktop installers are produced by
  `.github/workflows/release.yml` on tag push.

---

*Three witnesses for this README itself:*
- **Measured:** 4 new workflow files (lint/tsc/test-unit/build), ~190 LOC total (YAML), plus this README.
- **SLO:** All four workflows green on `main` for ≥ 7 consecutive days before `ci.yml` deletion (Milestone 2 gate).
- **Failure mode:** A 3-OS `build.yml` matrix triples GHA-minute consumption vs. the Linux-only monolith. If the plan budget is exhausted mid-month, fall back to Linux-only and re-evaluate in the next billing cycle.

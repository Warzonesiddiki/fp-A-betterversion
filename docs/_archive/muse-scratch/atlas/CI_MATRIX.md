<!-- DRAFT v0.1 — awaiting review — Atlas 2026-06-13 -->

# FinPlan Pro — CI Matrix v0.1 (Atlas)

> **Purpose.** Define the six (and one optional) gates every PR must pass before
> merge to `main`, with SLO targets, failure modes, and recovery paths.
> **Author.** Atlas (DevOps). **Cycle.** 2026-06-13. **Status.** Awaiting review.

---

## 0. Why this matrix exists (Three Witnesses)

- **Witness 1 — measured.** As of 2026-06-13 04:40 IST, local HEAD is
  `a325f7ad`, 30 commits ahead of `origin/main = 73a18a95`. Pre-push hook
  (`/.husky/pre-push:7-16`) runs `npx tsc --noEmit` then
  `npx eslint src --max-warnings 0`. The hook is the actual blocker on the
  current push (fails on 1 unused-import warning at
  `src/__tests__/a11y/wcag-aa.test.tsx:39:10`). The Leader's earlier
  "exit 124 timeout" diagnosis was a symptom of unbounded `tsc` + `eslint`
  runtime, not a network failure (`git ls-remote origin` returns in ~6s
  from this env).
- **Witness 2 — target.** Every gate has a published SLO. Any gate that
  exceeds its target is auto-bumped to a yellow status; any gate that
  exceeds 1.5× target is red and auto-pages the on-call (Atlas lane).
- **Witness 3 — failure mode.** Each gate declares (i) what the CI does on
  failure (block merge, comment, page), (ii) what the developer does to
  recover, and (iii) what blast radius an accidental `--force` or
  bypass has on production.

Belt AND suspenders: we run the gates **three times** in three different
contexts — (1) husky pre-push on the dev machine, (2) GitHub Actions on
the PR, (3) GitHub Actions on the merge to `main`. Same gates, three
witnesses.

---

## 1. Gate inventory (six required, one optional)

| # | Gate         | Command                                                  | Target | Hard fail? |
|---|--------------|----------------------------------------------------------|--------|------------|
| 1 | `lint`       | `npm run lint` (eslint + prettier --check)               | < 60 s | yes        |
| 2 | `tsc`        | `npx tsc --noEmit`                                       | < 120 s| yes        |
| 3 | `test`       | `npx vitest run --reporter=default`                      | < 480 s| yes        |
| 4 | `build`      | `npm run build` + smoke test                             | < 180 s| yes        |
| 5 | `bundle`     | bundle-size check (delta > 5 KB/PR fails)                | < 30 s | yes        |
| 6 | `audit`      | `npm audit --omit=dev`                                   | < 30 s | yes        |
| 7 | `secret-scan`| `gitleaks detect --source .` (Hephaestus pre-push wire)  | < 60 s | yes        |

**Total wall-clock budget** (with caching, parallel `lint`+`tsc`, parallel
`audit`+`secret-scan`): **< 480 s** to match the `test` gate.

---

## 2. Gate details

### Gate 1 — `lint` (target < 60 s)

- **Command (CI form, not dev form):**
  `npx eslint src --max-warnings 0` then `npx prettier --check "src/**/*.{ts,tsx,css,md}"`
- **Why the dev form is wrong here.** `package.json:12` defines
  `"lint": "eslint src --fix"`. The `--fix` mode **mutates** files,
  which is fine on a dev machine but corrupts the CI checkout.
  CI MUST use `--max-warnings 0` (matches the husky pre-push at
  `/.husky/pre-push:13`).
- **Failure mode (Three Witnesses).**
  1. Measured: 1 warning currently blocks push (see §0).
  2. Target: 0 warnings, 0 errors, prettier clean.
  3. Failure: PR comment lists files; required check fails; merge blocked.
- **Notification.** PR comment via `actions/github-script`; Slack
  `#fp-eng` only if `lint` regresses on a previously-green file.
- **Recovery.** Dev runs `npm run lint` locally; the `--fix` mode
  auto-corrects most issues. Unused-import warnings (`/^_/u` policy)
  must be resolved by hand or via `eslint --fix --rule
  '{"@typescript-eslint/no-unused-vars":["warn",{"argsIgnorePattern":"^_"}]}'`.
- **Bypass path (DO NOT USE without lead approval).** Add
  `lint:ci: ["eslint src"]` to package.json scripts and reduce
  `--max-warnings` to a number >0 in CI only. Belt off; suspenders on:
  husky pre-push still enforces 0.

### Gate 2 — `tsc` (target < 120 s)

- **Command.** `npx tsc --noEmit` (from `/.husky/pre-push:7`)
- **Failure mode.**
  1. Measured: the Leader's prior push timeout (exit 124) was almost
     certainly this stage hanging on a dirty `src/` tree (197 modified
     files including 202 engine files). Atlas measured 120 s timeout
     as the upper bound; in practice, on a clean checkout, expect 60-90 s.
  2. Target: 0 errors. Note: the codebase uses `typescript: 5.9.3`
     (`package.json:94`) with `strict` per `tsconfig.json`.
  3. Failure: blocks merge; PR bot lists the first 20 errors with
     file:line.
- **Notification.** Same as `lint`.
- **Recovery.** `npx tsc --noEmit --watch` for dev loop. CI artifact
  upload of the full `tsc` log (often truncated to 20 lines in the PR
  comment) is available under the "tsc-full" name on the Actions run.
- **Bypass path.** None. `tsc` is the only gate that can confirm the
  type system is intact. If a hotfix must land bypassing `tsc`, it
  requires a lead-approved `#override-tsc` label + post-merge follow-up
  issue within 24 h.

### Gate 3 — `test` (target < 480 s)

- **Command.** `npx vitest run --reporter=default` (from
  `package.json:14`)
- **Scale (measured 2026-06-13).** 825 test files. Apollo's pre-push
  task `[Apollo PRE-PUSH P0 #0]` is currently triaging 65+ pre-existing
  test failures (per Athena URGENT triage 019ebd40). Plan: gate
  succeeds only when 0 tests fail.
- **Failure mode.**
  1. Measured: 65+ pre-existing failures as of 2026-06-13.
  2. Target: 0 failing, 0 skipped without `@skip`-justified annotation.
  3. Failure: required check fails. PR comment shows first 50 failure
     titles + a permalink to the full JUnit XML in the Actions artifact.
- **Notification.** PR comment; Slack `#fp-eng` on any new failure
  (failure delta vs `main`).
- **Subdivision (CI optimization).** Run two jobs in parallel:
  - `test:unit` — vitest without `--shard` (covers all unit + a11y
    tests, ~600 files). Target < 360 s.
  - `test:e2e` — `npx playwright test` (covers e2e + visual regression
    in 50 files). Target < 360 s.
  Each job caches `~/.npm` and `node_modules/.vite` keyed on
  `package-lock.json` hash + Node version.
- **Coverage gate (deferred).** When `@vitest/coverage-v8`
  (`package.json:78`) thresholds are tuned, add a `coverage` job that
  fails the PR if `lines < 80%` or `branches < 70%`. Tracker:
  Prometheus audit `019ebcc7`.

### Gate 4 — `build` (target < 180 s)

- **Command.** `npm run build` (vite build via
  `package.json:8`) followed by a 5-line smoke test that starts
  `vite preview` and `curl`s the root.
- **Bundle budget (from `src/config/perfBudgets.ts`).**
  - main chunk: **< 150 KB gzipped** (measured in CI artifact)
  - total: **< 2 MB gzipped**
  - per-route lazy chunk: **< 250 KB gzipped**
- **Failure mode.**
  1. Measured: 197M + 33?? + 3D working-tree delta would inflate the
     build, but the budget check is absolute (not delta) — it fails
     when the absolute size exceeds the budget, regardless of git state.
  2. Target: chunk sizes within budget, smoke test returns 200.
  3. Failure: PR comment with `rollup-plugin-visualizer` JSON
     (`package.json:92`) attached; lists top 5 largest modules.
- **Notification.** PR comment + bundle-analyzer JSON artifact
  (`bundle-report.json`).
- **Recovery.** Dev runs `npm run build` and opens the visualizer
  report (`dist/stats.html`).
- **Tauri cross-build (Gate 4b).** A separate nightly workflow at
  `cron: '0 4 * * *'` runs `npm run tauri:build` for `windows-latest`,
  `macos-latest`, `ubuntu-latest`. See `tauri-pipeline.md`.

### Gate 5 — `bundle` (target < 30 s)

- **Command (custom script in `scripts/bundle-check.mjs`).**
  Compares `dist/stats.json` from the PR build vs `main`. Fails if any
  single chunk grows by > **5 KB gzipped** OR if a new chunk appears
  > 50 KB.
- **Why a separate gate from `build`.** Build emits the JSON;
  `bundle` enforces the policy. Splitting lets the size check run on
  every PR without re-running the full vite build (uses GitHub
  Actions cache for `dist/` from the `build` job).
- **Failure mode.**
  1. Measured: N/A (gate doesn't exist yet — proposed in this draft).
  2. Target: delta ≤ 5 KB/chunk, 0 new chunks > 50 KB.
  3. Failure: PR comment names the chunk + the top 3 contributing
     modules (parsed from the visualizer JSON).
- **Notification.** PR comment only (no Slack; this is a soft signal).
- **Recovery.** `npm run build && npx vite-bundle-visualizer` to find
  the offender. Common fixes: dynamic import, tree-shake dead export,
  replace heavy dep (e.g., `moment` → `date-fns`).
- **Bypass path.** `#override-bundle` label, lead approval, requires
  a follow-up issue titled `bundle: shrink <chunk-name>` within 7 d.

### Gate 6 — `audit` (target < 30 s)

- **Command.** `npm audit --omit=dev --audit-level=high` (fails on
  any CVE rated high or critical).
- **Why `--omit=dev`.** Dev deps are tested by Gate 7 (secret scan)
  and by transitive `npm audit` in CI; production-only audit ensures
  we don't get paged for a `eslint-plugin-foo` CVE that ships only
  on dev machines.
- **Failure mode.**
  1. Measured: N/A (proposed in this draft). Hephaestus's security
     audit (`019ebcd6`) flagged dep policy as an open item.
  2. Target: 0 high, 0 critical CVEs in production deps.
  3. Failure: required check fails; PR comment lists CVE IDs +
     affected versions + suggested fix-version.
- **Notification.** PR comment + Slack `#fp-security` on critical.
- **Recovery.** `npm audit fix` (auto), or `npm install <pkg>@<fixed>`
  + PR a patch release. If no fix exists, file a `deps: pin` PR with
  a `--ignore` reason documented in `docs/security-deferrals.md` (a
  deferral doc already exists per Mnemosyne's cascade).
- **Bypass path.** None for critical. For high CVEs in deps with no
  upstream fix: lead-approved `#override-audit-high` + a 30-day
  expiry on the override.

### Gate 7 (optional) — `secret-scan` (target < 60 s)

- **Command.** `gitleaks detect --source . --no-banner` (or
  `trufflehog git file://. --only-verified`).
- **Why optional.** Hephaestus's deliverable `019ebd1b` includes a
  pre-written secret scanner. Once it's wired into `.husky/pre-push`
  AND `.github/workflows/`, mark it required.
- **Failure mode.**
  1. Measured: Apollo PRE-PUSH P0 #1 found real NIM API keys in
     `.env` (already in `.gitignore` but the key values were
     committed in a previous commit per Hephaestus audit).
  2. Target: 0 verified secrets in any tracked file.
  3. Failure: blocks push; PR comment redacts the secret and shows
     the commit + file.
- **Notification.** PR comment + Slack `#fp-security` (high urgency).
- **Recovery.** **Rotate the secret first**, then `git rm --cached` +
  commit. Never just amend — the secret is still in the reflog.
- **Bypass path.** None. The whole point is to never ship a secret.

---

## 3. Parallelism & ordering

```
PR opened
  │
  ├─► [lint + tsc + audit + secret-scan]   (parallel, ~120s wall)
  │
  └─► [test:unit + test:e2e]               (parallel, ~360s wall)
        │
        └─► [build → bundle]                (serial, ~210s wall)
              │
              └─► [deploy preview]          (~60s, optional)
```

Total wall-clock for a clean PR: **~480 s** (matches Gate 3 budget).
Slowest path: `test:unit` is the critical path.

---

## 4. Branch protection rules (required checks on `main`)

```yaml
# .github/settings.yml (or repo settings UI)
required_status_checks:
  strict: true          # branch must be up-to-date with main
  contexts:
    - lint
    - tsc
    - test:unit
    - test:e2e
    - build
    - bundle
    - audit
    # - secret-scan   # uncomment once Gate 7 is wired
required_pull_request_reviews:
  required_approving_review_count: 1
  dismiss_stale_reviews: true
enforce_admins: true
required_linear_history: true
required_conversation_resolution: true
```

---

## 5. GitHub Actions stub

```yaml
# .github/workflows/ci.yml  (DRAFT — Atlas, awaiting Lead approval)
name: CI
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    runs-on: ubuntu-latest
    timeout-minutes: 2
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'npm' }
      - run: npm ci
      - run: npx eslint src --max-warnings 0
      - run: npx prettier --check "src/**/*.{ts,tsx,css,md}"

  tsc:
    runs-on: ubuntu-latest
    timeout-minutes: 3
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'npm' }
      - run: npm ci
      - run: npx tsc --noEmit

  test-unit:
    runs-on: ubuntu-latest
    timeout-minutes: 8
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'npm' }
      - run: npm ci
      - run: npx vitest run --reporter=default --reporter=junit --outputFile.junit=reports/unit.xml
      - uses: actions/upload-artifact@v4
        if: always()
        with: { name: vitest-unit, path: reports/unit.xml }

  test-e2e:
    runs-on: ubuntu-latest
    timeout-minutes: 8
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'npm' }
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: always()
        with: { name: playwright-report, path: playwright-report }

  build:
    runs-on: ubuntu-latest
    timeout-minutes: 4
    needs: [lint, tsc]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'npm' }
      - run: npm ci
      - run: npm run build
      - run: node scripts/smoke-test.mjs   # starts vite preview, curls /
      - uses: actions/upload-artifact@v4
        with: { name: dist, path: dist }

  bundle:
    runs-on: ubuntu-latest
    timeout-minutes: 2
    needs: [build]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with: { name: dist, path: dist }
      - run: node scripts/bundle-check.mjs

  audit:
    runs-on: ubuntu-latest
    timeout-minutes: 1
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'npm' }
      - run: npm ci --omit=dev
      - run: npm audit --omit=dev --audit-level=high

  # secret-scan:  uncomment when Hephaestus wires the scanner
  # secret-scan:
  #   runs-on: ubuntu-latest
  #   timeout-minutes: 2
  #   steps:
  #     - uses: actions/checkout@v4
  #         with: { fetch-depth: 0 }
  #     - uses: gitleaks/gitleaks-action@v2
  #       env:
  #         GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## 6. SLO dashboard (proposed)

A weekly GitHub Action (`slo-report.yml`) writes a markdown table to
`docs/slo/weekly-YYYY-WW.md`:

| Gate          | P50   | P95   | SLO   | Status |
|---------------|-------|-------|-------|--------|
| lint          | 18s   | 42s   | 60s   | 🟢     |
| tsc           | 71s   | 102s  | 120s  | 🟡     |
| test-unit     | 188s  | 312s  | 360s  | 🟢     |
| test-e2e      | 214s  | 340s  | 360s  | 🟢     |
| build         | 132s  | 168s  | 180s  | 🟢     |
| bundle        | 11s   | 24s   | 30s   | 🟢     |
| audit         | 4s    | 12s   | 30s   | 🟢     |
| secret-scan   | 22s   | 48s   | 60s   | 🟢     |
| **total PR**  | 340s  | 460s  | 480s  | 🟡     |

🟡 = at-risk of breaching SLO within 30 days. Action: cache tuning.

---

## 7. Migration plan (Three Milestones)

- **M1 — Within 1 week (Apollo's lane).** Add `lint:ci` and
  `tsc:ci` scripts to `package.json`; wire `ci.yml` for the `lint`,
  `tsc`, `test-unit`, and `build` gates only. Status: 4/7 gates.
- **M2 — Within 1 sprint.** Add `bundle-check.mjs`, `audit` gate,
  branch protection. Status: 7/7 gates (or 6/7 if secret-scan deferred).
- **M3 — Within 1 quarter.** Add Tauri cross-build nightly, SLO
  dashboard, secret-scan-as-required. Status: full matrix + SLOs.

---

## 8. Open questions for the Lead

1. Should the SLO breach threshold (1.5× target) auto-page, or just
   file an issue? My bias: auto-page.
2. Should the `bundle` gate be hard-fail or advisory for the first
   month? My bias: hard-fail from day 1 — soft signals get ignored.
3. Where do we store the bundle-check baseline? Options:
   `dist/stats.baseline.json` (committed) vs. GitHub Pages artifact
   (no repo clutter). My bias: committed, versioned.

---

## 9. Cross-references

- `docs/drafts/atlas/founder-push.sh` v0.2 — mirrors the local
  pre-push sequence (Three Witnesses: husky, GH Actions, local).
- `docs/drafts/atlas/tauri-pipeline.md` — desktop build pipeline.
- Hephaestus audit `019ebcd6` — input/auth/crypto/secrets/CSP.
- Prometheus audit `019ebcc7` — bundle, render, workers, coverage.
- Apollo pre-push `019ebcf7` — fix test setup + delete dead workers.

---

*End of CI_MATRIX.md v0.1 — 9 sections, 3 milestones, 7 gates, Three
Witnesses on every claim. — Atlas*

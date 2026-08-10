# CI Investigation — GitHub Actions Jobs Not Starting (Account Billing Block)

> **Date:** 2026-08-10
> **Type:** Infrastructure / governance investigation note (not a story QA verdict)
> **Inspected by:** current session agent in a healthy `gh` environment (merged-main state, commit `f3834e2`)

## Finding

All GitHub Actions workflow runs on this repository fail **before any job step executes**. GitHub attaches the same annotation to every failed job:

> "The job was not started because recent account payments have failed or your spending limit needs to be increased. Please check the 'Billing & plans' section in your settings"

## Evidence

- `gh run list --branch main --limit 30`: every run failed (CI, tsc, lint, test-unit, build, Deploy, Cascade-Hold, sentry-self-test).
- Failing runs include commits that predate PR #53 (`0e300b88`, `93307746`, `f6cbfbf9`, dated 2026-08-09/10), so the condition is repo-wide and pre-existing — **not introduced by the merged PR**.
- Check-run annotations via the API: identical billing message on Type Check, Lint, Unit Tests, Build matrix (ubuntu/macos/windows), CI Summary, Cascade-Hold Ledger Check, Deploy, and sentry-self-test jobs.
- Jobs "complete" in ~3–11s with **zero recorded steps** — the jobs never start.
- Log download (`gh run view --log-failed` and the Actions logs API endpoint) returns EOF/empty artifacts — consistent with no log content ever being produced, not with a code failure.

## Classification

| Question | Answer |
|---|---|
| Workflow/bootstrap/environment failure? | **YES** — GitHub account billing / spending-limit block at the org/account level |
| Code regression from PR #53? | **NO** — no job ever started; identical failure predates the merge on other commits |
| Stale CI configuration? | No evidence — workflows use standard checkout / setup-node / npm-ci steps |
| Dependency/install issue? | No evidence — install steps never ran in CI |

## Local verification of merged main (commit `f3834e2`)

- `npm ci --ignore-scripts` — ok
- `node node_modules/typescript/bin/tsc --noEmit` — 0 errors
- Atlas/Dashboard targeted suite — 5 files / 18 tests passed
- Changed-file ESLint — 0 errors / 0 warnings
- `npm run capability:inventory` — deterministic; no working-tree diff
- `node scripts/verify-readme-stats.mjs` — passed
- `npm audit --omit=dev --audit-level=high` — 0 vulnerabilities
- `git diff --check` — clean

## Required owner action

1. Resolve the GitHub account payment / spending-limit block in the org **Billing & plans** settings.
2. After resolution, re-run the failed workflow runs (or push to `main`) and confirm jobs actually start and execute.
3. Until jobs execute, CI status must not be treated as code evidence, and the merged work must not be called release-ready on the basis of CI.

## Status

- CI remains RED for infrastructure reasons outside the repository's control.
- No code change is proposed by this note; the merged PR #53 content is unaffected.

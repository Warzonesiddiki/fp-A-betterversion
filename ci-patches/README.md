# CI gate patches (apply manually)

GitHub refuses pushes from this app that modify `.github/workflows/**`:

```
refusing to allow a GitHub App to create or update workflow
`.github/workflows/ci.yml` without `workflows` permission
```

The CI hardening for audit ZCFA-2026-07-29-002 is therefore delivered as a
patch file rather than a direct edit. **The gates are NOT active until a human
applies it.** Until then, treat every CI-related finding below as
`config_written_but_not_enforced`.

## Apply

```bash
git apply ci-patches/N-0004-N-0007-N-0008-N-0011-N-0013-ci-gates.patch
git add .github/workflows/ci.yml
git commit -m "ci: apply audit ZCFA-2026-07-29-002 gate hardening"
```

## What the patch changes

| Finding | Change                                                                                                                           | Why                                                                                                            |
| ------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| N-0008  | `build` job now `needs: [typecheck, lint, test]`                                                                                 | Release artifacts could previously be produced while tests were red or hanging.                                |
| N-0007  | Removed `continue-on-error: true` from the a11y job; a MISSING `test:a11y` runner is now a hard failure instead of a silent skip | The accessibility gate was doubly inert: it could not fail, and it skipped itself.                             |
| N-0004  | New blocking `audit` job running `npm run audit:prod`                                                                            | Production vulnerabilities had no CI gate at all.                                                              |
| N-0011  | New blocking `server` job (install, `tsc --noEmit`, tests)                                                                       | Server-side RBAC and period-close enforcement were never tested in CI.                                         |
| N-0014  | New blocking `docs` job running `npm run docs:verify`                                                                            | README statistics could drift from reality unchecked.                                                          |
| N-0013  | `docs` job also runs `npm run engines:verify`                                                                                    | Prevents the engine manifest going stale, which is how the old loader ended up knowing only 40 of 181 engines. |
| —       | `summary` job now requires e2e, a11y, audit, server and docs                                                                     | The summary previously ignored these jobs, so the overall check could be green while they failed.              |

## Loop #3 patch: `0002-loop3-sha-pin-shard-a11y-block.patch`

Delivered 2026-07-30. Same `workflows`-permission constraint as above. Apply with:

```bash
git apply ci-patches/0002-loop3-sha-pin-shard-a11y-block.patch
git add .github/workflows/
git commit -m "ci: apply loop-3 hardening (SHA-pin, shard tests, block a11y gate)"
```

### What this patch changes

| Finding | Change                                                                                                       | Why                                                                                                |
| ------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| CI-004  | SHA-pin **all 52 `uses:` action refs across all 9 workflows** to 40-hex commit SHAs with `# vN` comments     | Floating tags (`@v4`) are hijackable; commit-pinning is GitHub's supply-chain hardening guidance.  |
| CI-002  | `ci.yml` `test` job becomes a 4-way `matrix.shard` (blob reports) + new `test-merge` job merging coverage    | Whole suite ran in one job; sharding gives wall-clock speed + isolation with unified coverage.     |
| CI-003  | Remove stale `continue-on-error: true` from the a11y job; add `a11y` + `test-merge` to the summary hard-gate | `test:a11y` now exists and passes (441 tests); the gate can and must block on critical violations. |

### Enforcement status

Until applied, these three gates are `config_written_but_not_enforced`.
`compliance-evidence.json` on the branch honestly reports **19/22** (CI-002,
CI-003, CI-004 ❌) and `architecture:guardrails` reports the SHA-pin failure.
All three flip green once the patch lands. Each change was verified locally
before being written into the patch: `--shard=i/n --reporter=blob` +
`--merge-reports` round-trips clean, `npm run test:a11y` exits 0 (441 passed),
and every pinned SHA was resolved from the GitHub API (annotated tags
dereferenced to commits).

## Verified locally

Each gate was executed on this branch before being written into the workflow:

| Command                                     | Result                                |
| ------------------------------------------- | ------------------------------------- |
| `npm run audit:prod`                        | exit 0 — 0 production vulnerabilities |
| `npm run test:a11y`                         | exit 0 — 441 tests across 9 files     |
| `npm run docs:verify`                       | exit 0                                |
| `npm run engines:verify`                    | exit 0 — 178 engines                  |
| `cd server && npx tsc --noEmit && npm test` | exit 0 — 23 tests                     |

Local success is **not** CI enforcement. The gates only bind once this patch is
applied and a pipeline run is observed green.

---

# 0005 — server CI job + heap/timeout corrections (2026-08-17)

`ci-patches/0005-server-ci-job-and-heap-timeout-fixes.patch`

Same constraint as above: this app cannot push `.github/workflows/**`, so these
three CI defects are delivered as a patch. **They are NOT active until a human
applies it.** The non-workflow half of the fix (the better-sqlite3 bootstrap in
`server/scripts/ensure-native-db.mjs`) IS committed directly and is already
effective — the server suite is green locally without this patch.

## Apply

```bash
git apply ci-patches/0005-server-ci-job-and-heap-timeout-fixes.patch
git add .github/workflows/ci.yml .github/workflows/test-unit.yml
git commit -m "ci: add server job, fix duplicate YAML key, correct heap and timeout"
```

## What the patch changes

| Change                                                              | Why                                                                                                                                                                                    |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| New blocking `server` job (tsc + `npm test` + `npm run test:native-db`), wired into the `summary` gate | The 207-test backend had **zero** CI coverage. That is precisely how 9 failing real-SQLite tests reached `main` unnoticed. (Re-lands N-0011, which was never applied.)              |
| Removed the duplicated `if: always()` key on the `summary` job      | `ci.yml` was **invalid YAML** (`duplicated mapping key`, line 327).                                                                                                                    |
| `test-unit.yml` `timeout-minutes: 15` → `30`                        | The suite takes ~18 min wall-clock (measured: 1086s for 13,738 tests), so the job failed on essentially every run.                                                                     |
| `--max-old-space-size=81920` → `8192` (ci.yml ×2, test-unit.yml)    | 80 GiB exceeds the `ubuntu-latest` runner's physical RAM by ~5x, so it bought no headroom — it only turned an OOM into an opaque SIGKILL. 8 GiB matches `package.json` and is proven sufficient. |

> Note: `ANALYSIS_AND_FIXES.md` (2026-07-30) already described the heap and
> timeout fixes as **done**. They were never actually made to the workflow
> files — verified against `455e74d`. This patch really applies them.

## Verified locally

| Command                                       | Result                                     |
| --------------------------------------------- | ------------------------------------------ |
| `npx tsc --noEmit`                            | exit 0                                     |
| `npx eslint src --max-warnings 0`             | exit 0                                     |
| `npm test` (frontend)                         | 1212 files — 13,738 passed, 1 skipped      |
| `npx vite build`                              | exit 0 — PWA generated                     |
| `cd server && npx tsc --noEmit`               | exit 0                                     |
| `cd server && npm test`                       | 13 files — 130 passed (was 9 FAILING)      |
| `cd server && npm run test:native-db`         | 2 files — 77 passed                        |

Local success is **not** CI enforcement. The server gate only binds once this
patch is applied and a pipeline run is observed green.

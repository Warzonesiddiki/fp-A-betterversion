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

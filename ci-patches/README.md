# Pending CI workflow patches — BLOCKED on push permission

The remediation of **F-0021** (production dependency audit gate), **F-0024** (CI
gates must actually enforce) and **F-0034** (README claim gate) requires changes
to `.github/workflows/ci.yml`. Those changes are **written and verified locally**
but could not be pushed:

```
! [remote rejected] refusing to allow a GitHub App to create or update
  workflow `.github/workflows/ci.yml` without `workflows` permission
```

This is an authentication scope limitation, not a defect in the change. Per the
remediation directive, the item is recorded as **BLOCKED** rather than claimed
complete.

## What the patch changes

`0001-ci-gates-F-0021-F-0024-F-0034.patch`

1. **Lint job enforces zero warnings.** `npx eslint src` became
   `npx eslint src --max-warnings 0`. The job previously disagreed with both the
   documented gate and the pre-push hook, so warnings could merge.
2. **Build depends on tests.** `needs: [typecheck, lint]` became
   `needs: [typecheck, lint, test]`. A build that can ship while the unit-test
   job is red is not a gate (`mandatory_ci_gates`: "CI build must depend on test
   success").
3. **New blocking `audit` job** running `node scripts/check-dependency-audit.mjs`
   — HIGH/CRITICAL in the production dependency tree fails CI unless recorded in
   `security/audit-allowlist.json` with a reason and an expiry.
4. **README claim check** added to the lint job
   (`node scripts/check-readme-claims.mjs`).
5. **Summary job** includes the audit result in both the table and the
   pass/fail condition.

## Apply it

```bash
git apply ci-patches/0001-ci-gates-F-0021-F-0024-F-0034.patch
git add .github/workflows/ci.yml
git commit -m "ci: enforce eslint zero-warnings, test-gated build, dependency audit, README claims"
git push
```

Requires a token with the `workflows` scope (a maintainer push, or a GitHub App
installation granted `workflows: write`).

## Interim coverage

Every gate in the patch **already runs locally** via `.husky/pre-push`, which was
updated in the same commits and is not subject to this restriction:

| Gate | pre-push | CI (blocked) |
|---|---|---|
| `tsc --noEmit` | yes | yes (already present) |
| `eslint src --max-warnings 0` | yes | patch needed |
| P0 vitest shard | yes | full suite already present |
| `npm run build` | yes | yes (already present) |
| `bundle-check` | yes | yes (already present) |
| version consistency | yes | — |
| README claim check | yes | patch needed |
| production dependency audit | yes | patch needed |
| Gate 10 cascade-hold | yes | separate workflow |

So a developer cannot push a change that violates these gates; the gap is that
CI would not independently re-verify three of them on the server side until the
patch lands.

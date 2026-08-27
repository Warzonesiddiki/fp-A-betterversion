# CI gate patches (apply manually)

GitHub refuses pushes from this app that modify `.github/workflows/**`
(the GitHub App lacks the `workflows` permission):

```
refusing to allow a GitHub App to create or update workflow
`.github/workflows/ci.yml` without `workflows` permission
```

CI fixes are therefore delivered as plain unified-diff files in this directory
for a human to apply. **A patch's gates are NOT active until a human applies
it and a green pipeline run is observed** — until then treat every CI-related
change here as `config_written_but_not_enforced`.

## Apply

```bash
git apply ci-patches/<patch-file>
git add .github/workflows/
git commit -m "ci: <what landed>"
```

`git apply` ignores the leading `#` comment block in newer patches (0008+);
older patches are bare diffs.

## Index (0001–0009)

Statuses measured against HEAD `805f7317` (branch `phase0/w02-tenancy`,
2026-08-23). `git apply --check` exit `0` = applies cleanly to the current
tree; exit `1` = does not apply (either content already landed, which is
expected for APPLIED patches, or context drifted, for SUPERSEDED patches).

| Patch                                             | Target workflow(s)                               | Purpose                                                                                        | Status                       | `git apply --check` |
| ------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------- | ---------------------------- | ------------------- |
| `0001-ci-gates-F-0021-F-0024-F-0034.patch`        | `ci.yml`                                         | CI gates for findings F-0021/F-0024/F-0034                                                     | SUPERSEDED (context drift)   | exit 1              |
| `0002-loop3-sha-pin-shard-a11y-block.patch`       | all workflows (SHA-pin), `ci.yml` (shard)        | Loop-3 hardening: SHA-pin 52 `uses:` refs, 4-way test sharding, blocking a11y gate             | SUPERSEDED (content in tree) | exit 1              |
| `0003-gap7-sha-pin-workflows.patch`               | multiple workflows                               | GAP-7: SHA-pin every `uses:` action ref to 40-hex commits                                      | SUPERSEDED (content in tree) | exit 1              |
| `0004-completion-audit-workflow-hardening.patch`  | multiple workflows                               | Completion-audit workflow hardening (draft mega-patch)                                         | SUPERSEDED (by 0005 + 0006)  | exit 1              |
| `0005-server-ci-job-and-heap-timeout-fixes.patch` | `ci.yml`, `test-unit.yml`                        | Blocking `server` + `audit` jobs; fix duplicate YAML key; heap 80 GiB→8 GiB; timeout 15→30 min | APPLIED (content in tree)    | exit 1              |
| `0006-audit-and-docs-jobs.patch`                  | `ci.yml`                                         | Blocking `docs` job (`docs:verify` + `engines:verify`) wired into summary hard gate            | APPLIED (content in tree)    | exit 1              |
| `0007-money-fabrication-detectors.patch`          | `ci.yml`                                         | Blocking `money-integrity` job (AST money-safety ratchet + fabrication ratchet)                | APPLIED (content in tree)    | exit 1              |
| `0008-node26-bump.patch`                          | `ci.yml`, `test-unit.yml`                        | Bump Node 22→26 (env `NODE_VERSION`; better-sqlite3 v13 N-API prebuilds are ABI-stable)        | PENDING human apply          | exit 0              |
| `0009-node26-remaining-workflows.patch`           | `tsc.yml`, `lint.yml`, `build.yml`, `deploy.yml` | Bump Node 22→26 in the four remaining pinned workflows                                         | PENDING human apply          | exit 0              |

Related non-patch artifacts in this directory:
`N-0004-N-0007-N-0008-N-0011-N-0013-ci-gates.patch` (historical mega-patch,
superseded by 0005/0006), `0004-COMPLETION-AUDIT-WORKFLOWS.md`,
`GAP-7-SHA-PINNING.md`.

## Status details

### APPLIED — 0005, 0006, 0007

Content is present in the committed `.github/workflows/ci.yml` (`server`,
`audit`, `docs`, `money-integrity` jobs + summary hard gate). Their
`git apply --check` failures are the expected "already applied" conflicts, not
drift. Historical severity note (measured 2026-08-19): before 0005, `ci.yml`
was invalid YAML (duplicated mapping key) so every `ci.yml` run failed with
zero jobs — see git history of this file for the full diagnosis.

### PENDING HUMAN APPLY — 0008, 0009

Both still `git apply --check` clean (exit 0) and all six Node-22 pin lines
(`ci.yml:17`, `test-unit.yml:25`, `tsc.yml:24`, `lint.yml:25`, `build.yml:26`,
`deploy.yml:24`) were confirmed still present at HEAD when this index was
written. Safety rationale for the bump: better-sqlite3 v13 ships N-API
prebuilds (ABI-stable across Node majors); verified locally on Node 26.7.0
(server suite green). Apply 0009 after or together with 0008 — they touch
disjoint files, order does not matter.

### SUPERSEDED — 0001, 0002, 0003, 0004

Do not apply. 0001's gates landed elsewhere (F-0024/F-0034 in `.husky/`,
dependency-audit via 0005's `audit` job). 0002/0003's SHA-pin + shard +
a11y-block content is already in the tree (all `uses:` refs carry 40-hex
commit SHAs). 0004 was superseded by 0005/0006.

## Local verification history

Each gate that landed was executed on this branch before being written into
the workflow (full tables in git history of this file): `npm run audit:prod`,
`npm run test:a11y`, `npm run docs:verify`, `npm run engines:verify`,
frontend `npm test` (13,738 passed), `cd server && npm test` (130 passed),
`test:native-db` (77 passed) — all exit 0. Local success is **not** CI
enforcement; gates bind only once applied and observed green on GitHub.

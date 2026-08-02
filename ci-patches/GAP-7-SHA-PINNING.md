# GAP-7 (F-0024) — SHA-pinning GitHub Actions

**Status:** code + tooling MERGEABLE; the workflow file edits themselves are **BLOCKED
from being pushed by this agent** and must be applied by a human or a token holding the
`workflows` permission.

## The blocker is real — reproduced 2026-08-02

```
$ git push origin arena/019fc250-fp-a-betterversion
 ! [remote rejected] arena/019fc250-fp-a-betterversion -> arena/019fc250-fp-a-betterversion
   (refusing to allow a GitHub App to create or update workflow
    `.github/workflows/build.yml` without `workflows` permission)
error: failed to push some refs
```

The `arena-ai-coding-agent[bot]` installation token does not hold the `workflows`
permission. Critically, a commit that touches `.github/workflows/**` poisons the whole
branch: **every** subsequent push is rejected, not just that commit. The workflow edits
are therefore kept OUT of branch history and delivered as this patch instead.

## Apply (one command, no hand-editing)

```bash
node scripts/pin-workflow-actions.mjs
npm run architecture:guardrails   # must print: All architecture guardrails passed
git add .github/workflows
git commit -m "GAP-7: SHA-pin all GitHub Actions to immutable commits (F-0024)"
```

`scripts/pin-workflow-actions.mjs` is idempotent and is the canonical source of the
pin map. `node scripts/pin-workflow-actions.mjs --check` exits 1 if anything is
unpinned, so it can also be used as a CI assertion.

A pre-generated diff is also committed at `0003-gap7-sha-pin-workflows.patch`
(`git apply ci-patches/0003-gap7-sha-pin-workflows.patch`) — it is byte-identical to
what the script produces.

## Why this matters

`uses: actions/checkout@v4` is a **mutable** ref. Whoever controls the action
repository can re-point that tag at different code, which then runs inside our CI with
our credentials — the standard supply-chain attack on GitHub Actions (`tj-actions/changed-files`,
CVE-2025-30066, is the reference incident). A 40-hex commit SHA cannot be re-pointed.

## Verification

| Command                            | Before                                                      | After                                    |
| ---------------------------------- | ----------------------------------------------------------- | ---------------------------------------- |
| `npm run architecture:guardrails`  | `❌ GitHub Actions are SHA-pinned ...` 52 unpinned, exit 1 | `✅ All architecture guardrails passed`, exit 0 |
| `node scripts/pin-workflow-actions.mjs --check` | exit 1                                        | exit 0                                   |

## The pin map (resolved from the live GitHub API, 2026-08-02)

Annotated tags were dereferenced to their target commit
(`gh api repos/<owner>/<repo>/git/tags/<sha>`).

| Action                          | Tag      | Commit SHA                                 |
| ------------------------------- | -------- | ------------------------------------------ |
| `actions/checkout`              | v4       | `11d5960a326750d5838078e36cf38b85af677262` |
| `actions/setup-node`            | v4       | `49933ea5288caeca8642d1e84afbd3f7d6820020` |
| `actions/upload-artifact`       | v4       | `ea165f8d65b6e75b540449e92b4886f43607fa02` |
| `actions/download-artifact`     | v4       | `d3f86a106a0bac45b974a628896c90dbdf5c8093` |
| `actions/configure-pages`       | v4       | `1f0c5cde4bc74cd7e1254d0cb4de8d49e9068c7d` |
| `actions/upload-pages-artifact` | v3       | `56afc609e74202658d3ffba0e8f6dda462b719fa` |
| `actions/deploy-pages`          | v4       | `d6db90164ac5ed86f2b6aed7e0febac5b3c0c03e` |
| `actions/github-script`         | v7       | `f28e40c7f34bde8b3046d885e986cb6290c5673b` |
| `codecov/codecov-action`        | v4       | `b9fd7d16f6d7d1b5d2bec1a2887e65ceed900238` |
| `Swatinem/rust-cache`           | v2       | `e18b497796c12c097a38f9edb9d0641fb99eee32` |
| `tauri-apps/tauri-action`       | v0       | `84b9d35b5fc46c1e45415bdb6144030364f7ebc5` |
| `dtolnay/rust-toolchain`        | stable   | `4cda84d5c5c54efe2404f9d843567869ab1699d4` |

## Permanent unblock

Grant the GitHub App the **`workflows`** permission on
`Warzonesiddiki/fp-A-betterversion`. After that an agent can push workflow changes
directly and this patch file can be deleted.

## Relationship to the older patches

`0002-loop3-sha-pin-shard-a11y-block.patch` also contains these pins but **bundles
unrelated changes** (test sharding, a11y job blocking, coverage merge job). Its SHAs
were independently re-verified against the GitHub API on 2026-08-02 and match.
`0003` is the surgical SHA-pin-only subset and is the one to apply if you want the
supply-chain fix without the CI restructuring.

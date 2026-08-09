# Completion Audit (2026-08-09) — workflow hardening patch

**Status:** code VERIFIED locally; the workflow file edits themselves are **BLOCKED from being
pushed by the arena agent token** (same limitation as GAP-7) and must be applied by a human or a
token holding the `workflows` permission.

## Blocker (reproduced 2026-08-09)

```
$ git push origin arena/019fe71b-fp-a-betterversion
 ! [remote rejected] arena/019fe71b-fp-a-betterversion -> arena/019fe71b-fp-a-betterversion
   (refusing to allow a GitHub App to create or update workflow
    `.github/workflows/build.yml` without `workflows` permission)
```

Because a commit touching `.github/workflows/**` poisons every subsequent push from this token,
the workflow edits are kept OUT of the branch history and delivered as this patch instead.

## What the patch contains (all verified locally)

1. **SHA-pinning of all GitHub Actions** across all 9 workflows
   (`node scripts/pin-workflow-actions.mjs` output — idempotent; `--check` exits 0 after apply).
   Closes the `architecture:guardrails` failure "GitHub Actions are SHA-pinned".
2. **A11Y gate made blocking** in `ci.yml` — the transitional `continue-on-error: true` removed
   because `test:a11y` now exists and passes (10 files / 448 tests verified locally 2026-08-09).
3. **release.yml script-injection hardening** — `github.event.inputs.version` no longer
   interpolated into the shell body; passed via `env:` with fail-fast semver validation.

## Apply (one command, no hand-editing)

```bash
git apply ci-patches/0004-completion-audit-workflow-hardening.patch
node scripts/pin-workflow-actions.mjs --check   # must print: All action refs ... are SHA-pinned
node scripts/architecture-guardrails.mjs        # must print: All architecture guardrails passed
git add .github/workflows
git commit -m "security(ci): SHA-pin all actions, harden a11y gate + release input handling (completion audit)"
```

## Evidence collected locally (2026-08-09)

- `node scripts/pin-workflow-actions.mjs --check` → "All action refs in 9 workflow file(s) are SHA-pinned."
- `node scripts/architecture-guardrails.mjs` → "✅ All architecture guardrails passed" (exit 0)
- `npm run test:a11y` → 10 files / 448 passed / 1 documented skip

---
name: finishing-a-branch
description: >
  Use at the end of a work unit: full gates, clean tree, honest handover, push to
  the branch that owns the session. Nothing is claimed that was not run.
group: discipline
---

# Finishing a branch

**Use when** the work unit is done and the next session will inherit it.

## Checklist

1. `git status` — the tree contains exactly what you meant to change. No scratch
   files, no logs, no generated output that the repo ignores.
2. **Run only justified gates on the final tree.** Check active `AGENTS.md` and
   the mission gate first. For application-source changes, use the required type/lint
   preflight, then relevant tests and ratchets; at handoff run `npm run check` when
   authorized and feasible. For docs-only work, run `npm run docs:verify`,
   `npm run docs:links -- --strict`, and affected documentation-index checks. Do not
   format unrelated files; inspect the diff after formatting.
3. Read every failure. A pre-existing failure is named as pre-existing, with its
   command and message — never waved through as noise.
4. Handover entry: what shipped, what is measured, what is **not** claimed, what
   the next PR is. Add the numbers, not adjectives.
5. Commit with a message that says why. Push only to the session branch.
6. If a PR update is requested, use `gh` on the session branch and verify the
   result; do not assume a command silently failed or succeeded.

## In this repo

- Full-suite duration varies by environment. Use the runner’s complete final
  summary; missing dependencies, timeout, or partial log is not a pass.
- Prettier reformats whole tables; check that a two-word edit did not rewrite a
  page you did not intend to change.
- If the sandbox was wiped, inspect branch/status first and restore dependencies
  from the lockfile as required. Never use `reset --hard` as generic recovery;
  preserve and reconcile local/session work before any destructive git operation.

## Red flags

- Pushing with `--no-verify`.
- "Tests pass" from a run that predates the last edit.
- A handover that lists intentions instead of numbers.

**Proves itself with:** gate output plus a `git log` the next session can trust.
**Source:** adapted from obra/superpowers `finishing-a-development-branch` (MIT).

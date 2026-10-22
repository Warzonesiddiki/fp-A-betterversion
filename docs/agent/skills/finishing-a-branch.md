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
2. Format, then the gates in this order: `npx prettier --write` on touched files,
   `npm run tsc`, `npm run lint`, `node scripts/verify-readme-stats.mjs`,
   `npm run docs:links -- --strict`, `npm run money:ast`, `npm run skills:verify`,
   then the full `vitest run` if code changed.
3. Read every failure. A pre-existing failure is named as pre-existing, with its
   command and message — never waved through as noise.
4. Handover entry: what shipped, what is measured, what is **not** claimed, what
   the next PR is. Add the numbers, not adjectives.
5. Commit with a message that says why. Push only to the session branch.
6. Update the PR body with `gh api -X PATCH … -F body=@file` — `gh pr edit`
   silently fails in this environment.

## In this repo

- Full suite takes ~20 minutes; start it early and never claim its result from a
  partial log.
- Prettier reformats whole tables; check that a two-word edit did not rewrite a
  page you did not intend to change.
- If the sandbox was wiped: `npm ci` (never `npx`), then `git fetch` +
  `reset --hard FETCH_HEAD` if local refs vanished.

## Red flags

- Pushing with `--no-verify`.
- "Tests pass" from a run that predates the last edit.
- A handover that lists intentions instead of numbers.

**Proves itself with:** gate output plus a `git log` the next session can trust.
**Source:** adapted from obra/superpowers `finishing-a-development-branch` (MIT).

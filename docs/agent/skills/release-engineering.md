---
name: release-engineering
description: >
  Use when preparing a release or a release candidate: gates, evidence, version,
  and the honest list of what is not ready.
group: engineering
---

# Release engineering

**Use when** a branch is being presented as releasable.

## Checklist

1. **All gates run fresh**, in this session, with output kept: types, lint,
   format, docs, links, money AST, ratchets, bundle, full suite.
2. **Bundle within budget** and the number quoted.
3. **Version and changelog** updated from real commits, not from intention.
4. **Blocked list published**: what cannot be claimed (CI, desktop build, D365
   shape, SOX authority, offline mode) is named in the release note.
5. **Rollback exists**: what you would do if this release is wrong, in one
   paragraph someone else could follow.
6. **Evidence location**: where the gate output lives, so a reviewer can check
   without re-running everything.

## In this repo

- `npm run release:dry-run` runs the build-shaped checks;
  `npm run compliance:evidence` collects the evidence pack.
- PR #100 is defined as "the register snapshot": at release, the completion
  register's statuses are the release note (`docs/plan/COMPLETION_PLAN_86_100.md`).
- CI cannot be verified from this sandbox (Actions returns 403), so no release note
  may say CI is green.

## Red flags

- "Release" declared from a green local build alone.
- A release note longer than the list of what changed.
- Version bumped in the same commit as unrelated work.

**Source:** original.

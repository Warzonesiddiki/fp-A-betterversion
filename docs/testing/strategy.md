# Testing Strategy

**Status:** short reference summary, rechecked 2026-11-11. Current runner facts
and gate behaviour are authoritative in
[`../agent/06_TESTING.md`](../agent/06_TESTING.md) and
[`../agent/skills/testing-strategy.md`](../agent/skills/testing-strategy.md).

## Overview

FinPlan Pro uses Vitest across unit, integration and component tests, plus a
separate Express server suite. There are **1,478 `*.test.ts(x)` files under
`src/`** and **1,512 including `server/`** as counted on 2026-11-11; the earlier
"over 900 test files" figure understated the tree and is replaced by these
measured counts rather than a rounded claim.

## Layers (as implemented)

- **Unit and engine tests.** Pure logic, engines and store behaviour run under
  Vitest. Shard 1 of the suite passed **366 files / 4,445 tests** on 2026-11-11.
  Passing tests do not imply the coverage gate passes — see below.
- **Financial known-answer vectors.** `src/engines/__tests__/kav-financial-articulation.test.ts`
  covers articulation for KAV-09/KAV-10. These are **hand-written known-answer
  fixtures, not property-based tests**. The repository has no `fast-check`
  dependency and no property-based test suite, so the previous
  "Property-Based Tests" heading overstated the technique in use.
- **Integration and security tests.** Server authorization, rate limiting,
  account lockout and audit-integrity suites live under `server/`. They exercise
  the optional server API, which the shipped client does not depend on for
  authorization; see [`../architecture/rbac.md`](../architecture/rbac.md).
- **Documentation and integrity gates.** `npm run docs:verify` runs thirteen
  scripts covering measured claims, the money ratchet, schema equality, the
  AI census and the missing-is-not-zero census; `npm run money:ast` and the
  fabrication detector run as separate CI jobs. `git diff --check` and strict
  link checks gate documentation edits.

## Coverage: configured threshold versus actual result

The configured global threshold is **50%** per metric, and it is currently not
met. The sharded coverage run on 2026-11-11 measured statements 32.40%, branches
26.69%, functions 30.62% and lines 33.14% on shard 1, failing the threshold while
all of that shard's assertions passed. Because a shard covers only a subset of
the tree, the threshold is structurally unreachable in shard mode. Do not cite
the configured threshold as achieved coverage.

## Regression gates

Pre-push hooks and CI jobs block regressions, but a red CI run is not evidence of
protection: the run for head `7d9b866c` failed on the docs, coverage, and
dependency-audit jobs (reproduced causes in
[`../03_CURRENT_STATUS_AND_AUDIT.md`](../03_CURRENT_STATUS_AND_AUDIT.md) §3.3).
A gate that fails for environmental reasons still fails; the failure must be
fixed or explicitly dispositioned by the owner, not ignored.

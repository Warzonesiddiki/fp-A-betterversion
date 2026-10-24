---
name: full-test-suite-execution
description: Use when running the complete test suite across all shards. Maps shard assignments, runs each shard, aggregates results, and verifies the 8/8 pass requirement.
group: engineering
---

# Full Test Suite Execution

**Use it when:** running the complete test suite before a release candidate or PR merge.

## Method

1. **Identify shards:** The test suite is split into 8 shards for parallel execution. Each shard covers a subset of test files.
2. **Run each shard:** Execute `npm run test:sharded` which runs all 8 shards in sequence.
3. **Check results:** All 8 shards must PASS (exit 0). Any failure is a release blocker.
4. **Aggregate:** Sum total tests passed across all shards. The full suite has ~1429 test files.
5. **Verify gates:** After tests pass, run all other gates (tsc, eslint, docs:verify, money gates, etc.).

## Shard assignment (8 shards)

| Shard | Coverage |
|-------|----------|
| 1 | Core engines and stores |
| 2 | Data import and GL |
| 3 | Reports and exports |
| 4 | Pages (budgets, forecasts, scenarios) |
| 5 | Pages (data, audit, periods) |
| 6 | Pages (analytics, AI, settings) |
| 7 | Pages (sector, industry) |
| 8 | Infrastructure (a11y, determinism, fabrication) |

## What this prevents

- Shipping with failing tests
- Missing test coverage in a shard
- False confidence from partial test runs

## Related

- `testing-strategy` — how tests are designed
- `test-driven-development` — writing tests first
- `verification-before-completion` — run before claiming done

---
name: full-test-suite-execution
description: Use when running the complete test suite. Runs the repository sharded test runner, verifies every shard completed successfully, and reports its actual per-shard tally.
group: engineering
---

# Full Test Suite Execution

**Use it when:** running the complete test suite before a release candidate or PR merge.

## Method

1. **Check prerequisites:** test dependencies and the repository runner must be
   available. A missing runner means no tests ran.
2. **Run the canonical command:** `npm run test:sharded` executes the current
   eight-shard configuration sequentially (two workers per shard by default).
   Do not infer file assignments; the runner/Vitest determines shard membership.
3. **Check results:** require exit 0 and PASS for every shard in the final summary.
   A failed, missing, timed-out, or partial shard is not a full-suite pass.
4. **Report exactly:** quote actual per-shard file/test summaries. Do not use old
   repository-wide file totals or sum unknown/partial output. This command does not
   collect coverage by default.
5. **Verify other gates separately:** a suite pass does not replace type, lint,
   documentation, money, determinism, or release-specific checks.

## Runner defaults

The current script defaults to eight shards, two workers, and a 2800 MB child-process
heap. Confirm defaults in `scripts/test-sharded.mjs`; they may change. `--help` is not
a supported option and should not be used as a harmless probe; the runner will execute.

## What this prevents

- Shipping with failing tests
- Missing test coverage in a shard
- False confidence from partial test runs

## Related

- `testing-strategy` — how tests are designed
- `test-driven-development` — writing tests first
- `verification-before-completion` — run before claiming done

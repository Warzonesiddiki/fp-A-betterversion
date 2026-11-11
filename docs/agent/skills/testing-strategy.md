---
name: testing-strategy
description: >
  Use when deciding what to test and what to skip, or when a suite is slow,
  flaky, or green while the product is wrong.
group: engineering
---

# Testing strategy

**Use when** adding coverage, changing a fixture, or judging whether a suite
proves anything.

## What deserves a test

Risk, not lines: money arithmetic, parsers, permission checks, data writes,
anything with a branch that a user can reach. One good test beats a percentage.

## The shapes

- **Failing-first** for defects: the test states the bug before the fix.
- **Contract** for a shared helper: inputs, outputs, and the edge that broke it.
- **Ratchet** for a rule that must not regress (see `gates-and-ratchets`).
- **Oracle** for accounting output: a known-balanced scenario with expected
  statements, not a snapshot of whatever the code produced.
- **Golden snapshot** only for things whose exact text is the product.

## In this repo

- `npm run test` runs Vitest in one process with an 8 GB heap; `npm run test:sharded`
  runs the sequential 8-shard suite (2 workers per shard by default). Wall time is
  environment-dependent; report the actual command and final tally, never an estimate.
  Neither command collects coverage by default. `npm test -- --coverage` is a separate
  coverage run; configured thresholds are 50% per metric in `vite.config.ts`.
  `npm run test:a11y` targets the accessibility suite.
- A test asserting a `Money` value must assert the rendered string, because that
  is what the user sees.
- Time and randomness are injected, not read from the clock inside an engine
  (`npm run determinism:ratchet`).
- When a test starts failing after a type change, decide which side is wrong.
  Twenty-two of the last twenty-four failures were expectations speaking numbers
  (DEC-057); fix the expectation, keep the guard.

## Red flags

- `expect(x).toBeDefined()` as the whole test.
- A mock that returns the answer the code wanted.
- Skipping a flaky test instead of naming it.

**Proves itself with:** the specific failure the test would catch, stated.
**Source:** original.

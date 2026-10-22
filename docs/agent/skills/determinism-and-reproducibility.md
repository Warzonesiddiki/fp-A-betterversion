---
name: determinism-and-reproducibility
description: >
  Use in calculation paths: same input must give the same output, whatever the
  clock, locale or machine. Replayable beats lucky.
group: finance
---

# Determinism and reproducibility

**Use when** code under `src/engines`, `src/store`, `src/services` or
`src/utils` reads time, randomness, or the environment.

## Rules

1. **Inject time** (`now`/`asOf`) instead of calling `Date.now()` in a calculation.
   A close dated by the wall clock cannot be replayed.
2. **Inject randomness** (ids, seeds, sampling) and pin it in tests.
3. **Sort explicitly.** Object key order and `Set` iteration order are not a
   business rule. A report must not change because the map order changed.
4. **No locale-dependent formatting inside calculations**; format at the edge.
5. **Same input, same bytes out** for exports where the format allows it.
6. **Record the inputs** (period, entity, version, rates) alongside a result, so a
   number can be reproduced next quarter.

## In this repo

- `npm run determinism:ratchet` counts clock/random call sites per file in the
  calculation paths and fails when a file's count rises or a new file appears.
- Approved replacements are in the ratchet's own doc; use them rather than a new
  helper.
- Financial oracles (`npm run financial:oracles`) assume determinism; a flaky
  oracle is a defect in the engine, not in the test.

## Red flags

- `new Date()` inside an engine.
- `Math.random()` for an id that ends up in a report.
- A test that passes when the suite order changes.

**Source:** original, from NFR-001 and the determinism ratchet.

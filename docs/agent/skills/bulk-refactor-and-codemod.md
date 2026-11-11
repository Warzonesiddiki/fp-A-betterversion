---
name: bulk-refactor-and-codemod
description: >
  Use for a mechanical change across many files: count first, transform once,
  prove the count after. Hand-editing 65 files is how a sweep goes wrong.
group: discipline
---

# Bulk refactor and codemod

**Use when** the same edit is needed in more than a handful of files.

## Method

1. **Census first**: `rg -n <pattern>` with the file list and count. Write the
   number down; it is your before-state.
2. **Classify the hits**: true positives, near-misses, deliberate exceptions. Do
   not let the tool decide the exceptions.
3. **Transform** with the narrowest mechanism that can be re-run: a codemod, a
   `perl -pi -e`, a targeted script. Never a global regex you cannot explain.
4. **Count after**: same census, expected remainder, and each survivor justified.
5. **Compile and test** before reviewing the diff; then read the diff for the
   places a machine cannot judge (comments, error messages, docs).
6. **Add the ratchet** that keeps the pattern from coming back (a test that greps
   the shape), because the sweep will otherwise quietly undo itself.

## In this repo

- Historical money-sweep counts are dated examples, not current baselines or
  expected savings. Use the census pattern only after verifying its current scope
  (`src/utils/moneyTrapCensus.test.ts`) and report fresh before/after counts.
- Use current applicable gates such as `npm run type-safety:ratchet`,
  `npm run money:ast`, and `npm run fabrication:audit` for after-state checks;
  none alone proves a mechanical transformation was behavior-preserving.
- Prettier after the sweep; a codemod often leaves line-wrapping the repo's format
  gate rejects.

## Red flags

- Sweep and behaviour change in one commit.
- "I fixed all of them" without a before/after count.
- A regex that also matched comments and silently rewrote documentation.

**Source:** original, from the DEC-055/056 sweep.

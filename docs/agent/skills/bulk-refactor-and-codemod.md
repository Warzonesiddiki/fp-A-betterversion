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

- The money sweeps are the template: 14 copies → 1 helper, 136 compiler errors →
  0, and a census test (`src/utils/moneyTrapCensus.test.ts`) that pins the shape.
- Use `npm run type-safety:ratchet`, `money:ast`, `fabrication:audit` as the
  after-state measurement where they apply.
- Prettier after the sweep; a codemod often leaves line-wrapping the repo's format
  gate rejects.

## Red flags

- Sweep and behaviour change in one commit.
- "I fixed all of them" without a before/after count.
- A regex that also matched comments and silently rewrote documentation.

**Source:** original, from the DEC-055/056 sweep.

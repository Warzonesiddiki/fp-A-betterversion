---
name: test-driven-development
description: >
  Use for any bug fix, money path, parser, permission check or data write: write
  the failing test first, watch it fail for the right reason, then fix.
group: discipline
---

# Test-driven development

**Use when** the behaviour can be stated as an example. That includes every
defect fix and every financial calculation change.
**Skip when** the change is documentation, style, or config with no behaviour.

## Method

1. Write the smallest test that states the desired behaviour, in the repo's terms
   (a real ledger row, a real store, a real persisted payload).
2. Run it. It must fail, and it must fail **because the behaviour is missing** —
   not because the import is wrong or the fixture is invalid. Fix that first.
3. Make it pass with the least code. No speculative branches.
4. Re-run the surrounding suite, not only the new test.
5. Prove the test has teeth: break the fix on purpose once, watch the test fail,
   restore. A test that cannot fail is decoration.

## In this repo

- Money paths must use `src/utils/money.ts` arithmetic; a test that compares raw
  floats can pass while the screen is wrong.
- Prefer the failing-first pattern already used across the tree: the commit
  message names the reproduction, the fix follows in the same commit.
- A ratchet test (see `gates-and-ratchets`) is TDD applied to a rule.

## Red flags

- Test written after the fix and never seen failing.
- `expect(fn).not.toThrow()` as the only assertion.
- Snapshotting a whole page to prove a number.

**Proves itself with:** a red-green cycle you observed, plus the suite run.
**Source:** adapted from obra/superpowers `test-driven-development` (MIT), rewritten.

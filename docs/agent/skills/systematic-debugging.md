---
name: systematic-debugging
description: >
  Use for any bug, test failure, build break or unexplained number: find the root
  cause before proposing a fix. No fix without a reproduced cause.
group: discipline
---

# Systematic debugging

**Use when** something is wrong and you do not already know exactly why.
**Never skip** because the bug "looks obvious" — obvious bugs have causes too.

## Iron law

No fix without a root cause you can state in one sentence and reproduce.

## Phases

1. **Read the error.** Whole message, whole stack, the line numbers. Do not skim.
2. **Reproduce.** Exact steps, every time. If it is flaky, say so and gather
   evidence instead of guessing: a flaky test is a finding, not a nuisance.
3. **Locate the boundary.** In a pipeline (file → parse → hydrate → store →
   selector → view) instrument each boundary once: what goes in, what comes out.
   The first boundary where the value is wrong is where the bug lives.
4. **State the cause.** "X is 0 because `aggregate` reads a Money object as a
   number" — if you cannot say it, you have not found it.
5. **Fix the cause, not the symptom.** Then add the test that would have caught it.
6. **Check the neighbours.** The same mistake is usually in more than one place;
   grep for the shape before closing.

## In this repo

- Money bugs are usually a type confusion: a `Money` read as `number` yields 0 or
  `NaN`, not an error. See `src/utils/money.ts` and the census test that pins it.
- State bugs are usually hydration: the selector is right and the stored payload
  is wrong. Check `persist.merge` before touching the component.
- Do not "fix" a test that disagrees with the product; decide which one is wrong
  and record it.

## Red flags

- A fix that makes the symptom move rather than disappear.
- Adding a `try/catch` that hides the evidence.
- "It passes now" with no explanation of what changed.

**Proves itself with:** the reproduction that now passes, and the cause in words.
**Source:** adapted from obra/superpowers `systematic-debugging` (MIT), rewritten.

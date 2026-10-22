---
name: reconciliation-and-tie-out
description: >
  Use when two sets of numbers must agree: source vs store, subledger vs GL,
  actuals vs plan, screen vs export. Show the difference, never force it to zero.
group: finance
---

# Reconciliation and tie-out

**Use when** numbers from two places are compared or presented as agreeing.

## Rules

1. **Tie-out is a stated equation**, not a feeling: "sum of ledger rows for
   entity+period equals the trial balance total" — and a test that runs it.
2. **Differences are shown, quantified and explained.** A plug to make it balance
   is the failure this whole product is against.
3. **Scope must match**: same entity, period, version, currency and sign
   convention. Most "breaks" are a scope mismatch.
4. **Round only at display**; reconcile on exact minor units.
5. **Unreconciled items are a list**, not a count: what they are, how much, since
   when, who owns them.
6. **Evidence is durable**: the reconciliation run, its inputs and its result are
   recorded so it can be reproduced.

## In this repo

- The trial balance, GL explorer and export must all agree; where a quarantine
  exists, every one of them says so with the same count.
- `npm run financial:oracles` holds the statement-level expectations; a tie-out
  test that only compares a screen to itself proves nothing.
- Intercompany elimination must be symmetric or reported as an unmatched pair.

## Red flags

- `Math.abs(a - b) < 1` with no statement of what 1 is.
- A reconciliation that cannot fail (compares a value to itself).
- A "difference" row labelled Other.

**Source:** original.

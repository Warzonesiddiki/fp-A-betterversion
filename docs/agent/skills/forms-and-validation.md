---
name: forms-and-validation
description: >
  Use for any input the user types: validate once, in one place, with messages
  that say what to do. Bad input must not reach the store.
group: product-ui
---

# Forms and validation

**Use when** a change adds or edits user input: journals, budgets, assumptions,
imports, settings.

## Rules

1. **Validate at the boundary** (on submit or on blur), then trust the type inside.
   A validator in three layers will disagree with itself.
2. **Message says the fix**, not the rule id: "Debit and credit must both be
   filled; one is empty" beats "Invalid".
3. **Do not lose typed input** on a validation error — the user's work is data.
4. **Numbers**: parse with the domain helper; reject sub-cent, thousands
   separators from the wrong locale, and trailing junk rather than coercing.
5. **Destructive actions** need a confirm that names the object and the effect.
6. **Disabled submit** is a hint, not a validation: the server/store still checks.
7. **Keyboard**: Enter submits, Escape cancels, errors are focusable.

## In this repo

- Money inputs go through `asMoney`/`parse` helpers so an invalid amount throws
  once, at the edge, with a field name.
- A journal that does not balance is refused with the imbalance amount, not a
  generic error.
- Import parsers can report row-numbered validation errors and rejections; inspect
  the specific flow and whole-file policy before claiming recovery or partial
  import. DEC-007 requires whole-file rejection for the governed GL upload path;
  do not equate parser diagnostics with a committed partial import.

## Red flags

- `parseFloat(e.target.value) || 0` (turns garbage into zero).
- Error text inside a `title` attribute only.
- A form that clears after a failed save.

**Source:** original.

---
name: period-close-operations
description: >
  Use when working on close: locking, reopening, adjustments, carry-forward. Close
  is a state machine with evidence, not a date field.
group: finance
---

# Period close operations

**Use when** a change touches posting, locking, adjustments or period status.

## Rules

1. **Close is an event with an actor and a time**, recorded, not inferred from a
   timestamp or a boolean someone flipped.
2. **Closed periods refuse writes** at the store level, not only in the UI.
3. **Reopening is a privileged, recorded action** with a reason; it does not erase
   the fact that the period was closed.
4. **Adjustments after close** are their own entries in a named adjusting period,
   never silent edits to posted rows.
5. **Carry-forward** produces new rows with traceable origin; it does not mutate
   the prior period.
6. **Close order is explicit** (chain per period, genesis verified) so a gap is
   detectable.
7. **No SOX-compliance claim is made**: DEC-102 says this is not a SOX compliance system and the local chain is not SOX authority. Do not imply this is changed by a close workflow passing tests.

## In this repo

- The close log is separate from general audit and has an unkeyed local hash chain;
  this is local consistency evidence, not tamper-proof or SOX authority. DEC-103
  resolves O9 as single-user; do not repeat the retired entity-scope blocker or infer
  capabilities beyond that decision.
- DEC-030 fixed chain verification: append order preserved, per-period genesis
  verified. Keep that property when touching the store.
- Close surfaces are part of the spine: exceptions must be visible before lock.

## Red flags

- `if (period.status === 'open')` only in a component.
- Reopen that deletes the close record.
- A close that succeeds with an unposted journal.

**Source:** `src/store/periodCloseStore.ts` and DEC-030/102/103; the server-side
  close implementation and native/offline behavior require separate verification.

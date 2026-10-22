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
7. **Nothing about close is claimed as SOX-compliant** without O4.

## In this repo

- The close log is separate from general audit and is unanchored — say so rather
  than implying a tamper-proof record. `authStore.switchEntity` remains blocked on
  O9, so entity scope for close actions is not authorised by inference.
- DEC-030 fixed chain verification: append order preserved, per-period genesis
  verified. Keep that property when touching the store.
- Close surfaces are part of the spine: exceptions must be visible before lock.

## Red flags

- `if (period.status === 'open')` only in a component.
- Reopen that deletes the close record.
- A close that succeeds with an unposted journal.

**Source:** original, from DEC-030.

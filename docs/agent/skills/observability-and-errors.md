---
name: observability-and-errors
description: >
  Use when handling an error, adding a log, or writing a catch: the failure must be
  visible, attributable, and never silently converted into a default.
group: engineering
---

# Observability and errors

**Use when** code can fail: IO, parsing, network, storage, rendering.

## Rules

1. **No silent catch.** `catch {}` and `catch { return [] }` are data loss with a
   clean conscience. Log with context, or rethrow with context.
2. **Errors carry scope**: what was being done, for which entity/period, with
   which id.
3. **Distinguish "none" from "failed"** in both UI and logs. An empty list and a
   failed load are different states.
4. **One error boundary at the route level** so a broken panel does not blank the
   app, and it says what broke and what still works.
5. **Logs are not a data store**: no amounts, tokens or personal data in them.
6. **Countable**: a repeating failure should be visible without reading 10k lines.

## In this repo

- The quarantine notice is the pattern to copy: it says how many rows were held
  back, which fields, and why per row.
- `ledgerScaleAudit()` is the "how much did we lose" hook; if a new failure mode
  can lose data, it needs an equivalent.
- A caught error that changes a total must also be surfaced where the total is
  shown.

## Red flags

- `console.warn` as the only handling of a failed save.
- A default value that hides the failure (`?? 0`).
- An empty state that looks identical to a zero total.

**Source:** original.

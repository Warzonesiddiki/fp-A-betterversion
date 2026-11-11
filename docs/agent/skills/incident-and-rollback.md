---
name: incident-and-rollback
description: >
  Use when something shipped is wrong in the user's hands: stop the bleeding,
  preserve evidence, then fix the cause.
group: engineering
---

# Incident and rollback

**Use when** a defect is live or data may already be wrong.

## Order of operations

1. **Stop the damage** — disable the path, not the app, if you can. Say what you
   disabled and where.
2. **Preserve evidence** — the stored payload, the input file, the log line. Do not
   "clean up" the state you need to understand.
3. **Tell the truth in the open**: what is wrong, which figures are affected, what
   is not affected, what to do meanwhile.
4. **Fix the cause**, then re-run the checks the incident should have tripped, and
   add the one that would have caught it.
5. **Reconcile data** deliberately: a repair script with a dry run, a row count, a
   before/after total, and a record of what it touched.
6. **Write it down** — a dated record with the root cause and the gate added.

## In this repo

- The GL-ledger hydration path quarantines values it cannot safely re-encode; this
  is a scoped recovery boundary, not a universal repair policy. For another store or
  data path, preserve evidence and follow its documented recovery contract.
- Never repair financial values by rounding silently. Preserve the original,
  quantify affected rows/totals, and follow the path-specific quarantine or recovery
  procedure with human review where required.
- The handover entry is part of the incident record: what the next session must not
  repeat.

## Red flags

- Deleting the bad rows to make the totals tie.
- A hotfix without the test that proves the bug.
- "It was a one-off" with no cause.

**Source:** original.

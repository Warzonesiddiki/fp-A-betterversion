---
name: audit-trail-and-lineage
description: >
  Use when a number must be explainable later: who changed what, from which
  source, through which calculation. Lineage is a product feature, not logging.
group: finance
---

# Audit trail and lineage

**Use when** adding a write path, a calculation surface, or an export of a figure
someone will be asked to defend.

## Rules

1. **Every consequential write records actor, time, target, before/after** (or a
   diff that reconstructs both).
2. **Calculated numbers carry lineage**: which inputs, which engine, which version
   of the formula. "It came from the model" is not lineage.
3. **Corrections are additive**: the original stays visible, the correction is an
   event with a reason and an owner.
4. **Lineage survives the view**: drill-through lands on the rows, not on a summary
   that cannot be expanded.
5. **Append-only where integrity matters**; if a record is mutable, say who can
   mutate it and where that is recorded.
6. **No PII or secrets in the trail** — it is read by more people than the data.

## In this repo

- `AuditEngine`/`AuditTrailEngine` prototypes are retired (DEC-028); the surviving
  helpers are isolated and in-memory and are **not** a product audit authority.
  Do not describe them as one.
- Cell lineage: v2 migration keeps JSON cells and verifies hash recompute
  (DEC-029). Extend that rather than adding a parallel map.
- SOX authority is O4-blocked. An audit trail existing is not the same as a
  control being certified.

## Red flags

- An `updatedAt` column presented as an audit trail.
- A lineage map that only holds the first hop.
- An audit write in the same transaction as the change it records: if a rollback
  can erase the record of an attempt, say so and decide whether that is acceptable.

**Source:** original, from DEC-028/029/031.

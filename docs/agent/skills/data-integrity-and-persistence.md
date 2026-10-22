---
name: data-integrity-and-persistence
description: >
  Use when a change touches persisted data, migrations, import, or anything that
  could lose or silently alter a user's numbers.
group: engineering
---

# Data integrity and persistence

**Use when** data is written, loaded, migrated, imported or exported.

## The standard

1. **Never lose a row silently.** Unrepresentable input is kept verbatim
   (quarantine) and shown; it is not dropped, rounded or zeroed.
2. **Write atomically or not at all.** A half-written period is worse than a
   failed save.
3. **Read old shapes.** Persisted data outlives the code that wrote it. A loader
   must tolerate the previous shape and convert, or refuse loudly with a reason.
4. **Migrations are forward-only and idempotent**, and they never delete a
   column without a decision row.
5. **Import proves itself**: row counts in = accepted + rejected + quarantined,
   and every rejected row has a reason a human can read.
6. **No irreversible migration** without owner authorisation (standing rule).

## In this repo

- Hydration gate: `persist.merge` → `partitionLedgerRows` → `normalizeGLEntry`.
- `ledgerScaleAudit()` reports load-time quarantine as well as live rows.
- `LedgerQuarantineNotice` is the visible surface on GL Explorer and Trial Balance;
  any page whose totals depend on those rows must render it too.
- Gates: `npm run persistence:map`, `npm run schema:equality`.

## Red flags

- `JSON.parse` on stored data with no shape check.
- A `catch` that returns `[]` on load failure.
- Deleting a store key "because nothing uses it" without a census.

**Proves itself with:** a failing-first test on the old payload, plus the gate.
**Source:** original, from DEC-057.

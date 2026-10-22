---
name: data-import-and-mapping
description: >
  Use for any inbound data path: GL extracts, budgets, headcount files, rate
  tables. Nothing enters the store unless it is mapped, counted and accounted for.
group: finance
---

# Data import and mapping

**Use when** a file, an API response or a paste becomes data in the app.

## Method

1. **Read the shape before the rows**: headers, types, encoding, date and number
   formats, currency, sign convention. A wrong assumption here corrupts every row.
2. **Map explicitly.** Each source column is mapped, ignored-with-reason, or
   rejected. No implicit "use the same name".
3. **Count everything**: rows in = accepted + rejected + quarantined. The numbers
   must add up on screen.
4. **Every rejected row has a reason** a human can act on (row number, field,
   value, what was expected).
5. **Validate against the domain**: balanced journals, valid accounts, valid
   periods, entity scope. A structurally valid row can still be financially wrong.
6. **Dry run first** for anything large or destructive, with a preview of totals.
7. **Idempotent re-import**: importing the same file twice must not double the
   ledger; say how duplicates are detected.
8. **Provenance**: store the source file identity, hash or timestamp and the
   mapping version with the imported batch.

## In this repo

- Hydration gate: representable rows re-encode; the rest are quarantined verbatim
  and shown (`LedgerQuarantineNotice`).
- The D365 export/file-intake path is documented but **no D365 shape is verified**
  (O1 open). Do not describe a mapping as validated against real data.
- Imports are the start of the spine (import → quarantine → tie-out → close →
  exception → export); a change here must keep the spine's evidence intact.

## Red flags

- `parseFloat` on a currency string with a thousands separator.
- A skipped row with no counter.
- A mapping that silently drops a column the user can see in the file.

**Source:** original.

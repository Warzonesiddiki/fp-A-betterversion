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
- DEC-104 accepts universal import using the user's own templates for D365 and
  other accounting/finance sources. The owner has not supplied anonymized D365
  source samples plus independent controls for each claimed shape; do not call a
  mapping real-data validated just because the architecture decision is settled.
- Current upload path: `GLUploadPage` constructs a transient user template and
  calls `universalImportParse` → `parseGLRows` → `glStore.importGLData`; preview
  also uses `parseGLRows`. Saved header-signature profiles have immutable local
  revisions and batches retain the exact mapping snapshot, with saved id/version
  only on exact match. This is not a complete template lifecycle: clone/edit/replace,
  unknown-column behavior, built-in selection, and standalone auto-detect workflow
  remain open. No owner D365 sample/source controls have been reconciled. See the
  current connector architecture and master execution plan.
- Imports are the start of the spine (import → quarantine → tie-out → close →
  analysis/review); a change here must keep its evidence intact.

## Red flags

- `parseFloat` on a currency string with a thousands separator.
- A skipped row with no counter.
- A mapping that silently drops a column the user can see in the file.

**Source:** original.

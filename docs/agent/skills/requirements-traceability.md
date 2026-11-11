---
name: requirements-traceability
description: >
  Use when claiming a requirement is met, mapping capability to evidence, or
  filling a register row. Every requirement resolves to a test or is labelled.
group: meta
---

# Requirements traceability

**Use when** adding or answering a requirement, a capability grade, or a register row.

## Method

1. A requirement states an observable behaviour, not an intention. It gets an id
   (FR-/NFR-/UX-/AI-) and a home in the register.
2. Every row carries **status** and **evidence**: test ids, a command, a file.
   No evidence means status `EXPERIMENTAL`, `NOT_BUILT`, or `BLOCKED-ON-OWNER` —
   never `SUPPORTED`.
3. The evidence must fail if the behaviour breaks. A passing snapshot is not
   evidence of a rule.
4. Coverage gaps are counted, not hidden: an unassessed section is
   `SOURCE OWED`, and the count appears next to the covered count.
5. Never shrink the denominator to improve a percentage (DEC-006). Retiring a
   capability requires a decision row, not a deletion.

## In this repo

- `docs/discovery/requirements-register.md` owns requirement IDs and evidence.
  Re-run `node scripts/check-coverage-annex.mjs` for the current mapped and
  SOURCE-OWED counts; do not carry dated totals forward.
- `docs/CAPABILITY_TRUTH_MATRIX.md` is generated static source/test evidence, not
  end-to-end support or certification. Regenerate/check it with
  `npm run capability:inventory:check`; inspect its generated definitions before
  interpreting any maturity label.
- `npm run completion:register:check` validates the current machine-readable
  completion vocabulary and evidence rules. Use its current output rather than
  old PR totals or copied status counts.

## Red flags

- A grade promoted in prose.
- "Covered by manual testing" with no artifact.
- A requirement with no owner when it is blocked.

**Source:** original, from DEC-058 and the capability matrix policy.

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

- `docs/discovery/requirements-register.md` holds 19 rows (FR-001–011, 4 NFR,
  3 UX, 1 AI). `node scripts/check-coverage-annex.mjs` reports 107 mapped and 93
  source owed.
- `npm run capability:inventory` regenerates the 231-row truth matrix with
  dispositions and grades; 0 of 231 are CONNECTED or GOVERNED today, and the 47
  REVIEW rows are a release blocker by the matrix's own policy.
- The completion register (PR #86) is the closed vocabulary;
  `docs/plan/COMPLETION_PLAN_86_100.md` §3 defines the statuses.

## Red flags

- A grade promoted in prose.
- "Covered by manual testing" with no artifact.
- A requirement with no owner when it is blocked.

**Source:** original, from DEC-058 and the capability matrix policy.

---
name: docs-and-decisions
description: >
  Use when writing or editing project documentation: one fact, one owner, one
  date, one command. Documentation is a claim set, not a narrative.
group: meta
---

# Docs and decisions

**Use when** writing a handover, taskboard row, decision, plan, or Notion mirror.

## Rules

1. **One fact, one home.** Numbers live where a gate asserts them, or where a
   dated measurement names its command. Everything else links.
2. **Label the number.** *Measured* (command, today), *recorded* (command, date),
   or *estimated* (never presented as the first two).
3. **Decisions are append-only.** A change of mind is a new DEC row that cites the
   old one; editing history removes the evidence that you changed your mind.
4. **No claim without evidence.** "Supported" means a test that fails when broken.
   "Verified" means it happened here, not upstream.
5. **Respect the doc's shape.** Handover entries are newest-first, one section per
   session, and never rewritten later.
6. **Notion explains, the repository proves.** If they disagree, the repository
   wins and Notion is corrected in the same session.

## In this repo

- Decision log: `docs/discovery/decision-log.md` (DEC-nnn, append only).
- Live queue and owner blockers: `docs/TASKBOARD.md`.
- Handover: `docs/HANDOVER_NEXT_SESSION.md` (newest entry on top).
- Generated, never hand-edited: `docs/CAPABILITY_TRUTH_MATRIX.md`,
  `docs/product/ROUTE_MAP.md`.
- Gates: `npm run docs:verify`, `npm run docs:links -- --strict`,
  `npm run ratchet-docs` if you touched a ratchet's documented baseline.

## Red flags

- A number with no date and no command.
- A backticked path to a file a future PR will create (breaks `docs:links`).
- Prettier reflowing a table and hiding the real edit — re-read the diff.

**Source:** original, from DEC-011/034/058 practice.

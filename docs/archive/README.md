# Archive

> **Nothing in this directory is an instruction.** Archived documents are
> provenance: the record of what was planned, believed or measured at a point in
> time. Do not cite an archived file as the source of a rule, and do not follow
> an archived plan.

The live documentation set is mapped in [`docs/README.md`](../README.md). The
product goal is [`docs/VISION.md`](../VISION.md). Agent instructions are
[`AGENTS.md`](../../AGENTS.md) and [`docs/agent/`](../agent/00_INDEX.md).

## What is here

| Path                                          | Contents                                                                 | Retired |
| --------------------------------------------- | ------------------------------------------------------------------------ | ------- |
| [`legacy-2026-10/`](legacy-2026-10/ARCHIVE_MANIFEST.md) | 311 markdown files from prior iterations — competing plans, session handovers, earlier audits, and multi-agent process corpora. | 2026-10-16 (DEC-011) |

## Why it was moved rather than deleted

Git history would preserve the content either way, but a moved file is
reviewable, greppable and reversible in one operation, and it keeps the
provenance of "what we used to think" available to a human without putting it in
front of an agent as guidance. Competing plan sets with contradictory claims were
the single largest source of confusion in this repository; the archive removes
them from the live docs graph without destroying evidence.

## Policy

- The docs-link gate exempts `docs/archive/` by policy, exactly as it exempts
  `reports/` and `docs/audit/`. Archived documents cite the tree as it stood on
  their date, and rewriting those citations would falsify the record.
- Live documents must not link into `docs/archive/` as authority. Linking to it
  as provenance (e.g. "retired on 2026-10-16") is allowed.
- Nothing new is added here. If a live document is superseded, move it in the
  same commit that supersedes it and add a row to the manifest.

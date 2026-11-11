---
name: connector-driven-documentation
description: >
  Use when a document lives in a connector (Google Docs, Notion, Sheets) and
  must stay truthful to this repository. Re-derives connector content from the
  repo, cites the command that produced it, and never lets a hand-edited number
  drift from the measured one.
group: meta
---

# Connector-driven documentation (connector → repo truth)

**Use when:** a document already lives in a connector and must reflect the
measured state of this repo — a status page, a decision summary, a release
note, a skill reference. This is the **reverse** of
[`connector-utilization`](connector-utilization.md), which publishes repo
artifacts outward.

## Why this exists

A connected app being available is not a request to read or write it. Use connector tools only when the user explicitly asks for that action; repository instructions and an enabled connector do not grant publication permission.


A connector document that drifts from the repo is worse than no document: the
owner acts on a number the repo no longer produces. The repo is the source of
truth; connector content is a **view** of it. Every number in a connector
document must be re-derivable from a command in this tree.

## Method

1. **Load the connector tools.** Call `list_connector_tools` for the connector
   slug before reading or editing connector content.
2. **Identify the connector document and its repo source.** Which connector
   document is being checked, and which repo document owns the facts it states?
   If there is no repo source, the connector document is unsourced — flag it.
3. **Re-derive, do not hand-edit.** For every number in the connector document,
   run the repo command that produces it and compare. Update the connector from
   the command output, not from memory or from a previous copy.
4. **Cite the source.** Each connector section states the repo path and the
   command that produced its numbers (e.g. "from `npm run money:adoption`,
   commit `b180fa7`").
5. **Mark stale, never silently correct.** If a connector number no longer
   matches, mark the section stale and re-derive it. Do not quietly overwrite a
   figure the owner may have already read.
6. **Record the sync.** Log the sync in `docs/discovery/decision-log.md` or the
   completion register: which connector document was re-derived, from which
   commit, with which command output.
7. **Missing is not zero.** A fact the repo cannot produce renders as
   unavailable with a reason in the connector document, never as `0`.

## In this repo

- The source-of-truth matrix: [`docs/agent/00_INDEX.md`](../00_INDEX.md) — which
  document owns which fact.
- The measured state: [`docs/agent/09_KNOWN_GAPS.md`](../09_KNOWN_GAPS.md);
  generated matrices: `docs/CAPABILITY_TRUTH_MATRIX.md`,
  `docs/product/ROUTE_MAP.md`.
- The commands: [`docs/agent/05_COMMANDS_AND_GATES.md`](../05_COMMANDS_AND_GATES.md).
- The publish record: `docs/discovery/decision-log.md`,
  `docs/plan/completion-register.json`.

## Red flags

- A connector number that no repo command reproduces.
- Hand-editing a connector number instead of re-deriving it.
- A connector document with no repo source — unsourced content acting as truth.
- Quietly overwriting a figure instead of marking it stale and re-deriving.
- Treating the connector copy as the source of truth over the repo.

**Proves itself with:** a sync record (connector document, repo commit, command
output) for every re-derivation, and zero connector numbers that a repo command
cannot reproduce.

**Source:** original to FinPlan Pro, split from the former duplicate of
`connector-utilization` to cover the reverse (connector → repo) direction.

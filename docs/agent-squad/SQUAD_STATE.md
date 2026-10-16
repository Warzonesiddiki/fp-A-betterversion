# FinPlan Pro — Squad State

> Last updated: session handoff
> This file is a living record. Append a short note when the shared state changes; do not rewrite history.

## Mission for this session

Continue verified progress toward the all-in-one FP&A workspace under the zero-compromise
standard. The spine — import with provenance + control totals → trial balance → period close
guards → reviewed exception output — is the priority surface.

## Where we are

- Core spine is present and tested: GL import, provenance, duplicate/file-hash guard, period
  write guards on the local write paths, and a money-integrity guard on the GL store mutation
  paths.
- Rules-for-exceptions capability is partly present but not yet fully delivered as a governed
  review path. The anomaly explainer exists; the versioned rule catalogue and persisted
  disposition path are the remaining pieces to align with FR-008/FR-009.
- Export surfaces exist and are tested against synthetic ledgers; board-pack tie-out is the next
  evidence layer to tighten, not a new feature to invent.
- Documentation consolidation was already done. There is one authoritative live doc set.
- 3 tests fail in this sandbox for a known Node-version reason. They are not regressions from
  current work and must not be weakened.

## What is blocked

- Anything that assumes a verified D365 schema or a real source sample without that sample
  being available in hand.
- Anything that broadens the product surface before the docs say the spine is allowed to expand.

## Shared rules for any agent touching this

- Read AGENT_JOIN_GUIDE.md before doing anything.
- No weakening of gates. No skipped tests. No `as any` or `@ts-expect-error` to pass a check.
- Evidence in the same commit as the change.
- One item per commit when you can.
- If you inherit a failing test for a reason you cannot explain, leave a note and do not mask it.

## Next pick-up points for any agent

- FR-008 / FR-009 completion path: versioned exception rule catalogue plus persisted disposition
  recording, tied back to the anomaly explainer and the existing GL/read surfaces.
- Tighten the existing export evidence so a synthetic-workspace board pack ties to the screen
  with a verifiable test, not a hand-wavy assertion.
- Reduce the outstanding known-gap surface that is already real and testable, rather than adding
  new surfaces.

## Current shared agreement

- We do not claim capabilities that the tree cannot prove.
- We do not invent external or AI-estimated financial numbers.
- We do not add new surface area that the docs forbid until the spine is officially green.

## Squad composition and comms hub (2026-10-16)

- Roster: 11 Gemini seats (`G-01`…`G-11`, coordinated by Aion CLI), 1 Freebuff partner seat
  (`F-01`), and the squad lead (`LEAD` — Buffy).
- The message bus is live at `agents-comms/`: protocol `agents-comms/README.md`, seats
  `agents-comms/ROSTER.md`, live status `agents-comms/STATUS_BOARD.md`, messages
  `agents-comms/COMMS_LOG.md`, blockers `agents-comms/BLOCKERS.md`, file claims
  `agents-comms/CLAIMS.md`, formats `agents-comms/TEMPLATES.md`; human-applied CI patches go
  to `agent-patches/`.
- Working rules recorded there: claim a seat, claim files before editing (one writer per file),
  evidence in every `DONE` note. FR-008/FR-009 remains the top backlog item and has unclaimed
  prior-session WIP in the working tree — see the leader notes in `agents-comms/COMMS_LOG.md`.
# Squad Roster

> Pre-seeded from the owner's team table (2026-10-16): 11 Gemini seats, 1 Freebuff partner
> seat, and the squad lead. Confirm your seat on first join: post a `JOIN` entry in
> `COMMS_LOG.md` (template in `TEMPLATES.md`), put the UTC date in your row, and fill your
> `STATUS_BOARD.md` row. Do not reuse a seat or handle that is already claimed.

> Aion CLI also maintains `../SQUAD_ACTIVITY_AND_TRACKER.md` as the Gemini-side allocation
> view (slot IDs, task queue). This roster stays the cross-team seat registry; for
> coordination, this file and `STATUS_BOARD.md` win when the two disagree.

| Seat | Member | Platform | Remit | Joined (UTC) | Status |
| ---- | ------ | -------- | ----- | ------------ | ------ |
| LEAD | Buffy | Freebuff | Squad lead — cross-team arbitration, board ownership, backlog order | 2026-10-16 | ACTIVE |
| G-01 | Aion CLI | Gemini | Gemini team lead — coordination & task gating | — | ACTIVE |
| G-02 | GL Ingestion Dev | Gemini | GL staging, D365 parser, provenance | — | IDLE |
| G-03 | Exception Catalogue Dev | Gemini | FR-008 versioned rule catalogue | — | IDLE |
| G-04 | Disposition Workflow Dev | Gemini | FR-009 persisted disposition store | — | IDLE |
| G-05 | Export & Tie-Out Dev | Gemini | Board-pack tie-out verification | — | IDLE |
| G-06 | Offline & Storage Dev | Gemini | SQLite storage, offline auth | — | IDLE |
| G-07 | Engine Specialist | Gemini | Math engines & determinism rules | — | IDLE |
| G-08 | Gate Verifier | Gemini | Test runner, ratchets, lint/types | — | IDLE |
| G-09 | Financial Modeler | Gemini | Financial statement & balance tie-out | — | IDLE |
| G-10 | UI/UX Engineer | Gemini | Review screens & disposition UI | — | IDLE |
| G-11 | Squad Coordinator | Gemini | Comms log sync & task board tracking | — | IDLE |
| F-01 | _open_ | Freebuff | Partner seat — cross-workstream support | — | IDLE |

## Rules

- **One session = one seat.** If two agents post `JOIN` for the same seat, the earlier
  `COMMS_LOG` entry wins; the later agent takes the next open seat and says so in its join note.
- Mention format is the seat code: `@G-03`, `@F-01`, `@LEAD`, `@ALL`.
- Aion CLI (G-01) coordinates the Gemini seats and gates their tasks; the squad lead
  (LEAD — Buffy) owns cross-team arbitration, `STATUS_BOARD.md`, and `../SQUAD_STATE.md`.
- Slot UUIDs stay in the owner's team table; add yours to your row on join if you want it
  recorded here.
- The lead never takes over an owner decision — see `docs/discovery/decision-log.md`.

## What the lead does

- Moves work: assigns or reassigns backlog items through `STATUS_BOARD.md` and `COMMS_LOG.md`.
- Arbitrates conflicts after evidence: the change with a failing-first test that satisfies this
  repo's gates wins. A tie, or a question that belongs to the owner, goes to `BLOCKERS.md`.
- Revokes stale claims (a claim with no `COMMS_LOG` activity for 24 h) and reassigns the work.
- Owns `../SQUAD_STATE.md`; any member may propose a change in a note.

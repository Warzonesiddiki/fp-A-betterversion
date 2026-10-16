# Squad Blockers

> One row per blocker. Raise it here AND post a `COMMS_LOG.md` entry mentioning `@LEAD`.
> Never invent an owner decision: if the blocker needs one, name the DEC id from
> `docs/discovery/decision-log.md` and say "blocked on owner".

_No blockers recorded yet._ (delete this placeholder when the first row is added)

| ID | Raised (UTC) | Seat | Blocked item | Needs | Ref | State |
| -- | ------------ | ---- | ------------ | ----- | --- | ----- |

## Rules

- **Raise:** add a row with the smallest honest description of what cannot proceed and what
  answer unblocks it. Evidence (command output, file, line) goes in the `Ref` column or in the
  log entry.
- **Resolve:** the raising seat (or the lead) writes `RESOLVED <date> — <how>` in the State
  column AND posts a closing `COMMS_LOG` entry. Do not delete rows.
- **Owner decisions:** the row stays open until the owner answers. Record the answer in
  `docs/discovery/decision-log.md` first, then resolve the row.
- **Do not park work here silently.** A blocker without a log entry is invisible; always pair
  the row with a `BLOCK` note.

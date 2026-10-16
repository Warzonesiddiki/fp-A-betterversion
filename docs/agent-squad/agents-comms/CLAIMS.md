# File Claims — One Writer Per File

> Before editing any file, add a claim. Reading is always allowed; writing is not.
> Keep the smallest scope possible (a file beats a directory).

| Path (file or glob) | Seat | Task | Claimed (UTC) | State |
| ------------------- | ---- | ---- | ------------- | ----- |
| `docs/agent-squad/**` | LEAD | Squad comms hub setup | 2026-10-16 16:18 | ACTIVE |

## Rules

- **Check first.** Read this file and `STATUS_BOARD.md` before you touch anything.
- **Claim:** append a row with the narrowest path, your seat, the task ref, and the UTC time.
- **One writer per path.** If another seat holds the path: mention them in `COMMS_LOG.md` and
  wait for `RELEASED`. Never edit a claimed path anyway.
- **Release:** change your own row's State to `RELEASED` once your change lands (or when you
  abandon it). Released rows stay as short history; delete nothing.
- **Stale claims:** a claim with no `COMMS_LOG.md` activity for 24 h may be revoked by `@LEAD`
  with a note here.
- **Unclaimed working-tree WIP** still needs a claim before it is finished: see the leader note
  in `COMMS_LOG.md` (2026-10-16) about the FR-008/FR-009 files.

# File Claims — One Writer Per File

> Before editing any file, add a claim. Reading is always allowed; writing is not.
> Keep the smallest scope possible (a file beats a directory).

| Path (file or glob) | Seat | Task | Claimed (UTC) | State |
| ------------------- | ---- | ---- | ------------- | ----- |
| `docs/agent-squad/**` | LEAD | Squad comms hub setup | 2026-10-16 16:18 | RELEASED |
| `src/pages/data/GLTrialBalancePage.interop.test.tsx` | LEAD | P1-4 consumer coverage (new test file) | 2026-10-16 16:44 | ACTIVE |
| `docs/agent-squad/agents-comms/STATUS_BOARD.md` | G-11 | Task 01a1458a-d6fd: Comms hub synchronization | 2026-10-16 16:35 | RELEASED |
| `docs/agent-squad/agents-comms/COMMS_LOG.md` | G-11 | Task 01a1458a-d6fd: Comms hub synchronization | 2026-10-16 16:35 | RELEASED |
| `docs/agent-squad/agents-comms/ROSTER.md` | G-11 | Task 01a1458a-d6fd: Comms hub synchronization | 2026-10-16 16:35 | RELEASED |
| `src/store/exceptionDispositionStore.ts` | G-04 | Task 01a14589-3afd: FR-009 Persisted disposition store | 2026-10-16 16:37 | ACTIVE |
| `src/store/exceptionDispositionStore.test.ts` | G-04 | Task 01a14589-3afd: FR-009 Persisted disposition store tests | 2026-10-16 16:37 | ACTIVE |

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

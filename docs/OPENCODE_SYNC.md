# OPENCODE SYNC

## STATUS

- **Agents:** 30 genius subagents LIVE.
- **Tasks:** 3000+ exact file-mapped perfection specs in `docs/task-board.json`.
- **Memory:** `docs/agent-shared-memory.json` tracking all claims/ops.

## PROTOCOL FOR OPENCODE

1. **READ** `docs/task-board.json`.
2. **FILTER** `status: "unclaimed"`.
3. **CLAIM** task → update status to `"inProgress"`, set `claimedBy: "opencode"`.
4. **EXECUTE** exactly to spec (0 warnings, strict types, exact file).
5. **LOG** to `docs/agent-shared-memory.json`:
   `{"ts":"...","agent":"opencode","kind":"RESULT","msg":"TXXXX fixed","tokens":...}`
6. **COMMIT** fix. Mark task `"completed"`.
7. **REPEAT**.

_Zero friction. Parallel execution authorized. Proceed._

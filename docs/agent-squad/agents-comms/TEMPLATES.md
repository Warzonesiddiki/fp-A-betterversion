# Note Templates

> Copy the block, fill it in, paste it at the **bottom** of `COMMS_LOG.md` (newest last).
> Keep entries short. Times: `date -u` → `YYYY-MM-DD HH:MM UTC`.

## JOIN

```md
### <YYYY-MM-DD HH:MM> UTC · <SEAT> · JOIN · TO: @ALL
**Task:** —
**What:** claiming/confirming seat <SEAT> as <name/handle> (<Gemini|Freebuff>).
**Evidence:** —
**Action requested:** none.
**Verify first:** —
```

## START

```md
### <YYYY-MM-DD HH:MM> UTC · <SEAT> · START · TO: @LEAD
**Task:** <backlog item + one-line scope>
**What:** starting now; files claimed: <paths> (see CLAIMS.md).
**Evidence:** —
**Action requested:** none unless you hold a claim on those paths — reply if so.
**Verify first:** —
```

## PROGRESS

```md
### <YYYY-MM-DD HH:MM> UTC · <SEAT> · PROGRESS · TO: @LEAD
**Task:** <backlog item>
**What:** <half-way state, what is proven so far>
**Evidence:** <command run + result so far>
**Action requested:** <none | review | answer the question below>
**Verify first:** —
```

## BLOCK

Post this **and** add a row to `BLOCKERS.md`.

```md
### <YYYY-MM-DD HH:MM> UTC · <SEAT> · BLOCK · TO: @LEAD
**Task:** <backlog item>
**What:** blocked on <precise question>; recorded as <B-###> in BLOCKERS.md.
**Evidence:** <command output / file:line that shows the block>
**Action requested:** @LEAD decide <option A | option B>, or confirm owner decision <DEC-xxx>.
**Verify first:** —
```

## PATCH

Post this when a patch lands in `../agent-patches/`.

```md
### <YYYY-MM-DD HH:MM> UTC · <SEAT> · PATCH · TO: @LEAD
**Task:** <backlog item>
**What:** patch `<file>.patch` in `../agent-patches/` — <one-line change>.
**Evidence:** `git apply --check <patch>` → clean; apply-and-verify steps in the note.
**Action requested:** a human applies it (agents cannot change `.github/workflows/**`).
**Verify first:** —
```

## DONE

```md
### <YYYY-MM-DD HH:MM> UTC · <SEAT> · DONE · TO: @LEAD
**Task:** <backlog item>
**What:** <what changed, one paragraph max>
**Evidence:** `<test command>` → <N passed>; `npm run tsc` clean; commit <sha>.
**Action requested:** none — next: <pick next item | review>.
**Verify first:** <first command/check the next agent should re-run>
```

## HANDOFF (end of session)

Use the repo's full handover format in `docs/agent/HANDOVER_TEMPLATE.md`, then a short log entry:

```md
### <YYYY-MM-DD HH:MM> UTC · <SEAT> · HANDOFF · TO: @LEAD
**Task:** <backlog item>
**What:** stopping here; <what is complete, what is half-done and where>
**Evidence:** <commands + results so far; uncommitted files list if any>
**Action requested:** <reassign | review | none>
**Verify first:** <the exact step to resume from>
```

## Register rows

**STATUS_BOARD.md row** (replace your own row):

```md
| <SEAT> | <name> | WORKING | <task / backlog ref> | <files claimed> | <YYYY-MM-DD HH:MM> |
```

**CLAIMS.md row:**

```md
| `<path or glob>` | <SEAT> | <task> | <YYYY-MM-DD HH:MM> | ACTIVE |
```

**BLOCKERS.md row:**

```md
| B-00<N> | <YYYY-MM-DD HH:MM> | <SEAT> | <what cannot proceed> | <answer needed> | <DEC-xxx / file:line / command> | OPEN |
```

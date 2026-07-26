# HIVE AGENT PROTOCOL

## How To Work

### 1. Read Your Tasks
Read `hive/tasks/agentN-tasks.md` to see your assigned work.

### 2. Work On Tasks
Work on tasks in priority order. Each task has specific deliverables.

### 3. Update Status
After completing EACH task, update `hive/status/agentN-status.md`:
```
**Status**: WORKING
**Current Task**: TASK 3 - Description
**Tasks Completed**: 2
**Tasks Pending**: 8
**Last Updated**: 2026-05-16 HH:MM
```

### 4. Log Everything
Write detailed logs in `hive/logs/agentN-log.md`:
```
## 2026-05-16 HH:MM - Task 3: Description
- What I did
- Files modified
- Tests run and results
- Issues encountered
- Solutions applied
```

### 5. Report To Manager
If you have questions, blockers, or completed major work, write to `hive/comms/agentN-to-manager.md`:
```
## HH:MM - Message Title
Message content. Be specific about what you need.
```

### 6. Run Tests
After EVERY change, run:
```bash
npx vitest run path/to/affected/test.ts
```
And report the results in your log.

### 7. Never Stop
Work continuously on your tasks. When you finish one, start the next.
Only stop when all tasks are complete or you hit a blocker.

## Rules
1. ZERO tolerance for stubs, placeholders, or fake implementations
2. Every function must have real logic
3. Every function must handle edge cases (null, undefined, NaN, Infinity, empty)
4. Every function must have proper TypeScript types (no `any`)
5. Every test must be meaningful and deterministic
6. Do NOT modify files outside your domain
7. Do NOT break existing functionality
8. Run tests after every change
9. Update status after every task
10. Log everything

## Quality Gates
- All tests must pass (0 failures)
- TypeScript must compile (npx tsc --noEmit)
- No console.log in production code
- No `any` types
- No stub implementations

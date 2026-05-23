# AGENT 1 - NEW TASKS (Manager Assignment)

**Status**: START IMMEDIATELY
**Updated**: 2026-05-16 17:20

## YOUR DOMAIN IS CLEAN - 329 engine tests ALL PASSING

Now help Agent 3 fix the remaining 29 store test failures.

## TASK 1: Fix glStore.cube.test.ts (4 failures)

Failures:
- should write entries to CubeEngine when initialized
- should write multiple entries as array
- should register accounts as cube dimension members
- should sync all entries to CubeEngine

These test glStore integration with CubeEngine. Read the tests, understand what they expect, fix them.

```bash
npx vitest run src/store/glStore.cube.test.ts
```

## TASK 2: Fix cubeMigration.test.ts (multiple failures)

Failures in full migration, selective migration, edge cases.

```bash
npx vitest run src/store/migration/cubeMigration.test.ts
```

## TASK 3: Fix storeMigrators.test.ts

```bash
npx vitest run src/store/migration/storeMigrators.test.ts
```

## TASK 4: Run Full Suite After Fixes

```bash
npx vitest run
```

Target: 0 failures

## RULES
- Run tests after EVERY change
- Update hive/status/agent1-status.md after each task
- Log changes in hive/logs/agent1-log.md
- Report to Manager via hive/comms/agent1-to-manager.md

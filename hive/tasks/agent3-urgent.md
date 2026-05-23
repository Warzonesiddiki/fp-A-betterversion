# AGENT 3 - URGENT TASKS (Manager Assignment)

**Status**: START IMMEDIATELY
**Updated**: 2026-05-16 16:55

## TASK A: Fix glStore.cube.test.ts

These tests verify glStore integration with CubeEngine. Fix all failures.

```bash
npx vitest run src/store/glStore.cube.test.ts
```

## TASK B: Fix cubeMigration.test.ts

Store migration tests are failing. Fix all failures.

```bash
npx vitest run src/store/migration/cubeMigration.test.ts
```

## TASK C: Fix storeMigrators.test.ts

Individual store migrator tests are failing. Fix all failures.

```bash
npx vitest run src/store/migration/storeMigrators.test.ts
```

## TASK D: Create cubeStore.ts if missing

Check if `src/store/cubeStore.ts` exists. If not, create it:
- Zustand store wrapping CubeEngine
- Actions: initialize, writeCell, readCell, query, aggregate
- TypeScript interfaces for all state and actions

## TASK E: Wire glStore Through CubeEngine

After cubeStore exists:
- When addEntry is called, also write to CubeEngine
- When generateTrialBalance is called, use CubeEngine aggregation
- Add: syncToCube, syncFromCube, getCubeState

## RULES
- Run tests after EVERY change
- Update hive/status/agent3-status.md after each task
- Log changes in hive/logs/agent3-log.md
- Report to Manager via hive/comms/agent3-to-manager.md

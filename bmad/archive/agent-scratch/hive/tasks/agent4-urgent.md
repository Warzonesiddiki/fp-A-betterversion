# AGENT 4 - URGENT TASKS (Manager Assignment)

**Status**: START IMMEDIATELY
**Updated**: 2026-05-16 16:55

## TASK A: Fix ALL Failing Tests (42 failures across 6 files)

### File 1: FormulaEngine.test.ts (7 failures)
```bash
npx vitest run src/engines/FormulaEngine.test.ts
```
Read failures, fix tests or engine. Agent 1 is also working on this - coordinate.

### File 2: FormulaEngine.integration.test.ts (2 failures)
```bash
npx vitest run src/engines/FormulaEngine.integration.test.ts
```

### File 3: SafeMathParser.test.ts (1 failure)
```bash
npx vitest run src/engines/SafeMathParser.test.ts
```

### File 4: glStore.cube.test.ts (unknown failures)
```bash
npx vitest run src/store/glStore.cube.test.ts
```

### File 5: cubeMigration.test.ts (unknown failures)
```bash
npx vitest run src/store/migration/cubeMigration.test.ts
```

### File 6: storeMigrators.test.ts (unknown failures)
```bash
npx vitest run src/store/migration/storeMigrators.test.ts
```

## TASK B: Run Full Test Suite After Fixes
After all individual files pass, run full suite:
```bash
npx vitest run
```
Target: 0 failures, 0 failed files

## TASK C: Coverage Audit
After tests pass, run coverage:
```bash
npx vitest run --coverage
```
Identify files below 80% coverage.

## RULES
- Run tests after EVERY change
- Update hive/status/agent4-status.md after each task
- Log changes in hive/logs/agent4-log.md
- Report to Manager via hive/comms/agent4-to-manager.md

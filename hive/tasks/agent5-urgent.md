# AGENT 5 - URGENT TASKS (Manager Assignment)

**Status**: START IMMEDIATELY
**Updated**: 2026-05-16 16:55

## TASK A: Verify Build Works [DO THIS FIRST]
```bash
npx tsc --noEmit 2>&1 | head -50
```
Report errors. Categorize: real errors vs stub page errors.

## TASK B: Fix Engine Exports
Check `src/engines/index.ts`:
- Does it export CubeEngine?
- Does it export CubeEnginePersistence?
- Does it export SafeMathParser?
- Does it export FormulaFunctionRegistry?
- Any circular dependencies?

## TASK C: Verify CubeEnginePersistence
Check if `src/engines/CubeEnginePersistence.ts` exists and is complete:
- createCellTable, saveCell, loadCells, deleteCell, clearCells
- saveDimensions, loadDimensions, saveCubes, loadCubes
- saveHistory, loadHistory, saveSnapshots, loadSnapshots

```bash
npx vitest run src/engines/CubeEnginePersistence.test.ts
```

## TASK D: Verify SQL Migrations
Check:
- `src-tauri/migrations/001_initial_schema.sql` - should have 29 tables
- `src-tauri/migrations/002_cube_schema.sql` - should have 6 tables
- `src-tauri/src/lib.rs` - should register both migrations

## TASK E: Verify Storage Layer
Check:
- `src/utils/masterStorage.ts` - routes between IndexedDB and Tauri SQLite
- `src/utils/tauriSqlStorage.ts` - Tauri SQLite adapter
- `src/utils/indexedDBStorage.ts` - IndexedDB adapter

## RULES
- Run tests after EVERY change
- Update hive/status/agent5-status.md after each task
- Log changes in hive/logs/agent5-log.md
- Report to Manager via hive/comms/agent5-to-manager.md

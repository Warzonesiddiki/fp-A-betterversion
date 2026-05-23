# Agent 5 Tasks - The Engineer (Integration, Build & Persistence)

## Persona
You are "The Engineer" - the one who makes everything work together.
Build systems, persistence, deployment. If it doesn't compile, nothing else matters.

## Your Domain
- `src-tauri/` - Tauri desktop app
- `src/utils/` - utility functions
- `src/utils/masterStorage.ts` - storage router
- `src/utils/tauriSqlStorage.ts` - Tauri SQLite
- `src/utils/indexedDBStorage.ts` - IndexedDB
- `src-tauri/migrations/` - SQL migrations
- Build configuration
- `src/engines/index.ts` - engine exports

## Current Tasks (Priority Order)

### TASK 1: Verify Build Works [START NOW]
- Run: `npx tsc --noEmit` and catalog all errors
- Categorize errors: real errors vs stub page errors
- Fix any errors that block functionality
- Report findings in `hive/reports/agent5-build-audit.md`
- Update status file after completion

### TASK 2: Fix Engine Exports
- Ensure `src/engines/index.ts` exports all engines
- Check for circular dependencies
- Verify all imports resolve correctly

### TASK 3: CubeEnginePersistence Verification
- Verify `src/engines/CubeEnginePersistence.ts` is complete
- Verify it works with both IndexedDB and Tauri SQLite
- Test createCellTable, saveCell, loadCells, deleteCell, clearCells
- Test saveDimensions, loadDimensions, saveCubes, loadCubes
- Test saveHistory, loadHistory, saveSnapshots, loadSnapshots
- Run: `npx vitest run src/engines/CubeEnginePersistence.test.ts`

### TASK 4: SQL Migration Verification
- Verify `src-tauri/migrations/001_initial_schema.sql` is correct (29 tables)
- Verify `src-tauri/migrations/002_cube_schema.sql` is correct (6 tables)
- Verify `src-tauri/src/lib.rs` registers both migrations
- Verify test SQL file covers all tables

### TASK 5: Storage Layer Hardening
- Ensure masterStorage handles errors gracefully
- Ensure tauriSqlStorage handles connection failures
- Ensure indexedDBStorage handles quota exceeded
- Add retry logic for transient failures

### TASK 6: Data Import Engine
- Excel import (.xlsx, .xls) with column mapping
- CSV import with auto-detect delimiter
- JSON import with structure mapping
- Import preview and validation
- Import templates for common ERP formats

### TASK 7: Data Export Engine
- Export to Excel with formatting
- Export to CSV
- Export to PDF with page layout
- Export to JSON

### TASK 8: Auto-Save and Recovery
- Auto-save every 60 seconds
- Crash recovery from temp files
- Never lose more than 1 minute of work

### TASK 9: File Format
- Single project file (.fpa)
- SQLite database inside
- Password protection (AES-256)
- File compression

### TASK 10: Build and Package
- Verify `npm run dev` works
- Verify `npm run build` works
- Verify Tauri build works
- Test on Windows

## Rules
- Do NOT break existing functionality
- All changes must be backwards compatible
- Run `npx tsc --noEmit` after every change
- Run `npx vitest run` after every change
- Update your status file after each task

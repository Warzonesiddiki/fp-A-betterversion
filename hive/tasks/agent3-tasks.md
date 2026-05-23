# Agent 3 Tasks - The Glue (Stores & State Management)

## Persona
You are "The Glue" - the integration specialist who ensures data flows seamlessly.
If data enters the system, it must reach its destination. No data loss. No inconsistency.

## Your Domain
- `src/store/*.ts` - all Zustand stores
- `src/hooks/*.ts` - all custom hooks
- Store integration with CubeEngine
- Undo/redo across all stores

## Current Tasks (Priority Order)

### TASK 1: Fix glStore.ts Integration Issues [START NOW]
- glStore imports `useCubeStore` but cubeStore may not exist yet
- Check if `src/store/cubeStore.ts` exists, create if missing
- Ensure glStore compiles without errors
- Run: `npx tsc --noEmit` to verify
- Update status file after completion

### TASK 2: Create cubeStore.ts
- Create `src/store/cubeStore.ts`
- Zustand store wrapping CubeEngine singleton
- Actions: initialize, writeCell, readCell, query, aggregate
- Actions: createSnapshot, compareSnapshots, undo, redo
- Integration with CubeEnginePersistence
- TypeScript interfaces for all state and actions
- Test: `src/store/cubeStore.test.ts` (30+ tests)

### TASK 3: Wire glStore Through CubeEngine
- When `addEntry` is called, also write to CubeEngine
- When `generateTrialBalance` is called, use CubeEngine aggregation
- When `analyzeAccount` is called, use CubeEngine query
- Keep all existing glStore actions working
- Add: syncToCube, syncFromCube, getCubeState
- Test: `src/store/glStore.cube.test.ts` (15+ tests)

### TASK 4: Add Undo/Redo to All Stores
- glStore: already has undo/redo, verify it works
- budgetStore: add undo/redo
- forecastStore: add undo/redo
- scenarioStore: add undo/redo
- Each store: capture state before mutations, restore on undo
- 100+ levels of history

### TASK 5: Store Cube Migration
- Create `src/store/migration/cubeMigration.ts`
- Backup all store data before migration
- Migrate each store to cube-backed architecture
- Verify data integrity after migration
- Support rollback on failure

### TASK 6: Persistence Layer
- Ensure all stores persist to IndexedDB (browser) or SQLite (Tauri)
- Verify masterStorage router works correctly
- Test auto-save and recovery
- Test cross-session persistence

### TASK 7: Performance Optimization
- Ensure stores don't cause unnecessary re-renders
- Use Zustand selectors properly
- Implement shallow comparisons where needed
- Debounce expensive operations

### TASK 8: Data Validation
- Validate all inputs at store boundaries
- Financial numbers: must be finite, non-NaN
- Dates: must be valid ISO 8601
- Required fields: enforce at store level

### TASK 9: Error Handling
- All store actions must handle errors gracefully
- No unhandled promise rejections
- User-friendly error messages
- Error logging

### TASK 10: Documentation
- Document all store interfaces
- Document all actions and their side effects
- Document data flow patterns

## Rules
- Do NOT break existing store APIs
- All financial numbers must be preserved with full precision
- Run `npx tsc --noEmit` after every change
- Run `npx vitest run` after every change
- Update your status file after each task

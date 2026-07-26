# AGENT 1 (DATA) — Detailed Execution Plan

YOUR MISSION: Every store, hook, util, and mock file in this project must be production-grade with 100% tested actions, no dead code, and comprehensive edge case handling.

YOU OWN: `src/store/*`, `src/types/*`, `src/utils/*`, `src/hooks/*`
YOU NEVER TOUCH: `src/engines/*`, `src/pages/*`, `src/components/*`, `.github/*`, `src-tauri/*`

## TASK 1: Hook Tests (src/hooks/)

Read each hook file FIRST, then create `<hook>.test.ts` file beside it. Follow the existing test pattern.

### 1a. `src/hooks/useAuth.ts` → create `src/hooks/useAuth.test.ts`
- Read the file. Does it use Zustand store? Does it call external APIs? Mock everything.
- Test: login() success, login() failure, logout(), isAuthenticated state, token refresh, session expiry
- Edge cases: double login, logout when not logged in, network failure during login

### 1b. `src/hooks/usePersistence.ts` → create `src/hooks/usePersistence.test.ts`
- Read the file. It likely uses localStorage/IndexedDB.
- Test: save() writes data, load() reads data, clear() removes data, error when storage full
- Edge cases: empty data, corrupt data in storage, storage unavailable (private browsing mock)

### 1c. `src/hooks/useExport.ts` → create `src/hooks/useExport.test.ts`
- Read the file. It likely calls ExportEngine methods (exportToPDF, exportToExcel).
- Test: export triggers correct engine method, loading state during export, error handling
- Edge cases: export cancelled, engine throws error, empty data export

### 1d. `src/hooks/useSector.ts` → create `src/hooks/useSector.test.ts`
- Read the file. It likely manages sector/industry configuration.
- Test: sector selection, sector data loading, fallback sector, sector switching
- Edge cases: invalid sector ID, missing sector data

### 1e. ALL remaining hooks in `src/hooks/` — repeat pattern
- 9 total hook files. Create .test.ts for each one that doesn't exist.

## TASK 2: Utility Tests (src/utils/)

### 2a. `src/utils/calculations.ts` → create `src/utils/calculations.test.ts`
- Pure functions. Test mathematical correctness with known inputs/outputs.
- Functions to test (read the file first to see actual exports):
  - Growth rate calculation: (new - old) / old
  - CAGR calculation
  - Percentage of total
  - Ratio calculations
- Edge cases: division by zero, negative values, zero base values, Infinity handling

### 2b. `src/utils/cn.ts` → create `src/utils/cn.test.ts`
- Class name utility (wraps clsx + tailwind-merge).
- Test: single class, multiple classes, conditional classes, merged classes (duplicates)
- Edge cases: undefined, null, empty string, array inputs

### 2c. `src/utils/formatters.ts` → create `src/utils/formatters.test.ts`
- Formatting functions (currency, percentage, number, date).
- Test: formatCurrency(1234.5) returns "$1,234.50", formatPercent(0.125) returns "12.5%"
- Edge cases: negative values, zero, very large numbers, NaN, undefined

### 2d. `src/utils/retry.ts` → create `src/utils/retry.test.ts`
- Retry logic with backoff.
- Test: retry succeeds on Nth attempt, retry fails after max attempts, exponential backoff timing
- Edge cases: 0 retries, immediate success, function throws non-retryable error

### 2e. `src/utils/dataMigration.ts` → create `src/utils/dataMigration.test.ts`
- Data migration utilities.
- Test: migration runs in order, migration rolls back on failure, version tracking
- Edge cases: already at latest version, empty migrations, migration throws

### 2f. `src/utils/backupRestore.ts` → create `src/utils/backupRestore.test.ts`
- Backup/restore functionality.
- Test: create backup, restore from backup, backup contains all expected data
- Edge cases: corrupt backup, empty backup, partial restore

## TASK 3: Mock Data Generators (src/services/mockData/)

Read `src/services/mockData/` — there are 19 mock data files. For each file:
1. Read the file to understand the data shape
2. Create a companion `<file>.test.ts` that verifies:
   - Mock data has correct structure/types
   - All required fields are present
   - Data is internally consistent (e.g., debit = credit)
   - No undefined/null values where they shouldn't be
   - Realistic value ranges (no negative revenue unless intentional)

## TASK 4: Dead Dep Check

- Is `immer` actually imported anywhere in src/? If not, remove from package.json
- Are there any other deps in package.json that are never imported? Check each one

## QUALITY GATE
Before marking any task COMPLETE:
```
cd C:\Users\Tahir\Desktop\frontend that i want
npm run build 2>&1 | Select-Object -Last 5
npx vitest run 2>&1 | Select-Object -Last 10
```
Build + ALL tests must pass.

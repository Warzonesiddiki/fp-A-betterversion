# Dependency Cycle Audit — T03130

**Date:** 2026-06-08
**Tool:** madge 7.x (--circular --extensions ts,tsx --ts-config tsconfig.json)
**Files scanned:** 1,648
**Cycles found:** 22

---

## Summary

| Group                           | Cycle Count | Severity | Pattern                                           |
| ------------------------------- | ----------- | -------- | ------------------------------------------------- |
| Sectors index ↔ sector files    | 15          | Low      | Type-only import cycle                            |
| DataGrid ↔ hooks                | 3           | Medium   | Component exports types consumed by its own hooks |
| Formula barrel ↔ function files | 2           | Low      | Barrel re-export + type import                    |
| DrillTables ↔ DrillThroughChain | 1           | Medium   | Mutual component dependency                       |
| authStore ↔ tokenRotation       | 1           | High     | Store ↔ utility circular                          |

---

## Cycle Group 1: Sector Config (15 cycles)

**Files:**

- `config/sectors/index.ts` → `config/sectors/{sector}.ts`
- `config/sectors/{sector}.ts` → `config/sectors/index.ts`

**Root cause:** Each sector file imports `SectorConfig` type from `./index`. Index imports the sector configs.

**Fix:** Extract `SectorConfig` and `SectorKPI` interfaces to `config/sectors/types.ts`. Both index and sector files import from `types.ts` instead of each other.

```
config/sectors/types.ts     ← NEW (interfaces only)
config/sectors/index.ts     ← imports types + sector configs
config/sectors/agriculture.ts ← imports types only
```

**Impact:** Zero runtime change. Type-only cycle.

---

## Cycle Group 2: DataGrid ↔ Hooks (3 cycles)

**Files:**

- `components/ui/DataGrid.tsx` → `hooks/useDataGridExport.ts`, `hooks/useFindReplace.ts`, `hooks/useSelectionStats.ts`
- Each hook → `components/ui/DataGrid.tsx` (imports `DataGridColumn` type)

**Root cause:** `DataGridColumn` interface is defined inside `DataGrid.tsx`. Hooks need this type.

**Fix:** Extract `DataGridColumn` and `DataGridProps` to `components/ui/DataGrid.types.ts`. Hooks import from `DataGrid.types.ts`.

```
components/ui/DataGrid.types.ts ← NEW (interfaces)
components/ui/DataGrid.tsx       ← imports from DataGrid.types
hooks/useDataGridExport.ts       ← imports from DataGrid.types
hooks/useFindReplace.ts          ← imports from DataGrid.types
hooks/useSelectionStats.ts       ← imports from DataGrid.types
```

---

## Cycle Group 3: Formula Barrel (2 cycles)

**Files:**

- `components/ui/formula/formulaData.ts` → `lookupMathFunctions.ts`, `financialLogicalTextDateStatFunctions.ts`
- Both function files → `formulaData.ts` (imports `FormulaFunction` type)

**Root cause:** `FormulaFunction` interface defined in `formulaData.ts`, function arrays import it.

**Fix:** Extract `FormulaFunction` to `components/ui/formula/formulaTypes.ts`.

```
components/ui/formula/formulaTypes.ts  ← NEW (FormulaFunction interface)
components/ui/formula/formulaData.ts   ← imports from formulaTypes
components/ui/formula/lookupMathFunctions.ts ← imports from formulaTypes
components/ui/formula/financialLogicalTextDateStatFunctions.ts ← imports from formulaTypes
```

---

## Cycle Group 4: DrillTables ↔ DrillThroughChain (1 cycle)

**Files:**

- `DrillThroughChain.tsx` → `DrillTables.tsx` (imports `SummaryTable`, `DetailTable`, `JournalEntryTable`)
- `DrillTables.tsx` → `DrillThroughChain.tsx` (imports `SummaryRow`, `DetailRow`, `JournalEntry` types)

**Root cause:** Types and components are co-located. DrillTables needs types from DrillThroughChain; DrillThroughChain needs components from DrillTables.

**Fix:** Extract shared types (`SummaryRow`, `DetailRow`, `JournalEntry`) to `components/spreadsheet/DrillThrough.types.ts`.

```
components/spreadsheet/DrillThrough.types.ts ← NEW
components/spreadsheet/DrillTables.tsx        ← imports types from DrillThrough.types
components/spreadsheet/DrillThroughChain.tsx   ← imports types + components
```

---

## Cycle Group 5: authStore ↔ tokenRotation (1 cycle — HIGH)

**Files:**

- `store/authStore.ts` → `utils/tokenRotation.ts` (imports `startRotation`, `stopRotation`)
- `utils/tokenRotation.ts` → `store/authStore.ts` (imports `useAuthStore`)

**Root cause:** Token rotation manages refresh logic that reads/writes auth state. Auth store starts/stops rotation on login/logout.

**Fix (Option A — recommended):** Inject store dependency via parameter. `tokenRotation.ts` accepts `getToken`/`setToken` callbacks instead of importing the store directly.

```typescript
// tokenRotation.ts — no store import
export function startRotation(deps: {
  getToken: () => string | null;
  setToken: (token: string) => void;
  clearAuth: () => void;
}): void { ... }

// authStore.ts — passes deps
import { startRotation, stopRotation } from '@/utils/tokenRotation';
startRotation({
  getToken: () => get().accessToken,
  setToken: (t) => set({ accessToken: t }),
  clearAuth: () => get().logout(),
});
```

**Fix (Option B):** Move `startRotation`/`stopRotation` into the store as actions. Eliminate tokenRotation.ts as a standalone module.

---

## Priority Fixes (Recommended Order)

1. **authStore ↔ tokenRotation** — HIGH. True runtime cycle. Break with dependency injection.
2. **DataGrid ↔ hooks** — MEDIUM. Extract `DataGridColumn` type.
3. **DrillTables ↔ DrillThroughChain** — MEDIUM. Extract shared types.
4. **Sectors index ↔ sector files** — LOW. Extract interfaces to `types.ts`.
5. **Formula barrel ↔ function files** — LOW. Extract `FormulaFunction` interface.

---

## Verification

After fixes, re-run:

```bash
node node_modules/madge/bin/cli.js --circular --extensions ts,tsx --ts-config tsconfig.json src/
```

Target: **0 circular dependencies.**

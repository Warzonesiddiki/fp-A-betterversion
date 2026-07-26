# FINPLAN PRO — AI FLEET SYSTEM PROMPT
## Part 5 of 5 (ADDON): Code Patterns, Implementation Guide & Gap Coverage
## Version 5.0.0 | Generated 2026-05-18 | VERIFIED FROM ACTUAL CODEBASE

---

## 0. WHY THIS PART EXISTS

Parts 1-4 cover WHO, WHAT, WHERE, and WHEN.
This part covers HOW — the actual code patterns, conventions,
and implementation details an AI needs to write code that
SEAMLESSLY integrates with the existing codebase.

Without this part, the AI will write code that WORKS but
doesn't MATCH the existing patterns — creating inconsistency,
technical debt, and maintenance nightmares.

---

## 1. ZUSTAND STORE PATTERNS (VERIFIED FROM budgetStore.ts)

### 1.1 Store Definition Pattern

```typescript
// EVERY store follows this exact pattern:
import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { SomeState } from '../types';
import { masterStorage } from '../utils/masterStorage';

export const useSomeStore = create<SomeState>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        // STATE (plain values, not objects wrapping values)
        items: [],
        activeId: null,
        isLoading: false,

        // ACTIONS (mutate draft directly — Immer handles immutability)
        setItems: (items) => {
          set((state) => {
            state.items = items;
          });
        },

        addItem: (item) => {
          set((state) => {
            state.items.push(item);
          });
        },

        updateItem: (id, updates) => {
          set((state) => {
            const idx = state.items.findIndex((i) => i.id === id);
            if (idx !== -1) {
              Object.assign(state.items[idx], updates);
            }
          });
        },

        // ASYNC ACTIONS (call API, then update state)
        fetchItems: async () => {
          set((state) => { state.isLoading = true; });
          try {
            const data = await someApiCall();
            set((state) => {
              state.items = data;
              state.isLoading = false;
            });
          } catch (error) {
            set((state) => { state.isLoading = false; });
            throw error;
          }
        },
      })),
      {
        name: 'some-store-key',
        storage: masterStorage,
      }
    )
  )
);
```

### 1.2 Key Rules for Stores

```
RULE 1: ALWAYS use immer middleware — mutate state.directly, never spread
  ✅ state.items.push(newItem)
  ❌ return { ...state, items: [...state.items, newItem] }

RULE 2: ALWAYS use persist with masterStorage
  This ensures data survives across sessions (IndexedDB or SQLite)

RULE 3: ALWAYS validate inputs in actions
  if (!id || typeof id !== 'string') throw new Error('...');

RULE 4: Track lastChange for audit trail
  state.lastChange = { cellId, oldValue, newValue, timestamp }

RULE 5: Use subscribeWithSelector for reactive subscriptions
  Other stores can subscribe to specific state changes

RULE 6: Store names use camelCase: useBudgetStore, useAuthStore
  File names match: budgetStore.ts, authStore.ts
```

### 1.3 Undo/Redo Pattern (from budgetStore.ts)

```typescript
// Every store that supports undo/redo has:
history: [[]],        // Array of state snapshots
historyIndex: 0,      // Current position in history

// Before any mutating action:
pushHistory: () => {
  set((state) => {
    const snapshot = JSON.parse(JSON.stringify(state.lineItems));
    state.history = state.history.slice(0, state.historyIndex + 1);
    state.history.push(snapshot);
    state.historyIndex = state.history.length - 1;
  });
},

// Undo:
undo: () => {
  set((state) => {
    if (state.historyIndex > 0) {
      state.historyIndex--;
      state.lineItems = JSON.parse(
        JSON.stringify(state.history[state.historyIndex])
      );
    }
  });
},

// Redo:
redo: () => {
  set((state) => {
    if (state.historyIndex < state.history.length - 1) {
      state.historyIndex++;
      state.lineItems = JSON.parse(
        JSON.stringify(state.history[state.historyIndex])
      );
    }
  });
},
```

---

## 2. COMPONENT PATTERNS (VERIFIED FROM Button.tsx, KPICard.tsx)

### 2.1 Component Structure

```typescript
// EVERY component follows this pattern:
import { SomeHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/cn';

export interface ComponentProps extends SomeHTMLAttributes<HTMLElement> {
  variant?: 'default' | 'secondary' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  // ... other props
}

const Component = forwardRef<HTMLElement, ComponentProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <element
        className={cn(baseClasses, variantClasses[variant], className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Component.displayName = 'Component';

export { Component };
```

### 2.2 Styling Pattern

```typescript
// ALWAYS use cn() utility for class merging:
import { cn } from '@/utils/cn';

// cn() = clsx() + tailwind-merge()
// Combines classes intelligently, resolving Tailwind conflicts

className={cn(
  'base-classes',
  variant === 'primary' && 'bg-blue-600',
  size === 'lg' && 'text-lg',
  className  // Allow override from props
)}
```

### 2.3 Dark Mode Pattern

```typescript
// EVERY component must support dark mode via Tailwind dark: prefix
const variantClasses = {
  default: 'bg-blue-600 text-white hover:bg-blue-700',
  outline: 'border border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700',
};
```

### 2.4 Radix UI Integration

```typescript
// For complex UI primitives, use Radix UI:
import * as Dialog from '@radix-ui/react-dialog';
import * as Select from '@radix-ui/react-select';
import * as Tabs from '@radix-ui/react-tabs';

// Wrap Radix components with Tailwind styling:
<Dialog.Root>
  <Dialog.Trigger asChild>
    <Button>Open</Button>
  </Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 bg-black/50" />
    <Dialog.Content className="fixed top-1/2 left-1/2 ...">
      {/* content */}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

---

## 3. ENGINE PATTERNS (VERIFIED FROM FormulaEngine.ts, ConsolidationEngine.ts)

### 3.1 Engine Class Structure

```typescript
// EVERY engine follows this pattern:
export class SomeEngine {
  // STATIC constants
  static readonly MAX_SIZE = 100000;

  // STATIC methods (stateless, pure functions)
  static processData(input: InputType): OutputType {
    // Validation
    if (!input) throw new Error('Input required');

    // Core logic
    const result = /* calculation */;

    // Return typed result
    return { value: result, error: undefined };
  }

  // INSTANCE methods (if engine has state)
  private state: EngineState;

  constructor(initialState?: Partial<EngineState>) {
    this.state = { ...defaultState, ...initialState };
  }

  // Public API
  getValue(): number { return this.state.value; }
  setValue(v: number): void { this.state.value = v; }
}
```

### 3.2 FormulaEngine Pattern (Current State)

```typescript
// FormulaEngine has:
// - AST parser with operator precedence
// - 5 functions: SUM, IF, COUNT, NPV, CAGR
// - Cell references: A1, B2 (single letter columns only)
// - Range references: A1:A10 (single column or row only)
// - Integration with IterativeCalculationEngine for circular refs

// To ADD a new function:
// 1. Add to the function evaluation switch in evaluateFunction()
// 2. Add test cases in FormulaEngine.test.ts
// 3. Update FormulaFunctionRegistry.ts
```

### 3.3 Test Pattern for Engines

```typescript
// Engine tests follow this pattern:
import { describe, it, expect } from 'vitest';
import { SomeEngine, type InputType } from './SomeEngine';

// Helper functions for creating test data
function createInput(overrides: Partial<InputType> = {}): InputType {
  return { /* defaults */ ...overrides };
}

describe('SomeEngine', () => {
  describe('processData', () => {
    it('should handle basic case', () => {
      const input = createInput();
      const result = SomeEngine.processData(input);
      expect(result.value).toBe(expectedValue);
      expect(result.error).toBeUndefined();
    });

    it('should handle edge case: empty input', () => {
      const result = SomeEngine.processData(null as any);
      expect(result.error).toBeDefined();
    });

    it('should handle edge case: zero values', () => {
      const input = createInput({ amount: 0 });
      const result = SomeEngine.processData(input);
      expect(result.value).toBe(0);
    });

    it('should handle edge case: negative values', () => {
      const input = createInput({ amount: -1000 });
      const result = SomeEngine.processData(input);
      expect(result.value).toBeLessThan(0);
    });
  });
});
```

### 3.4 Error Boundary Pattern

```typescript
// Use react-error-boundary for graceful error handling:
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="p-6 text-center">
      <h2 className="text-lg font-semibold text-red-600">
        Something went wrong
      </h2>
      <p className="mt-2 text-sm text-gray-600">{error.message}</p>
      <button
        onClick={resetErrorBoundary}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Try again
      </button>
    </div>
  );
}

// Wrap pages and major components:
<ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
  <SomePage />
</ErrorBoundary>

// In page components, wrap the entire return:
export default function BudgetPage() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      {/* page content */}
    </ErrorBoundary>
  );
}
```

### 3.5 Web Worker Pattern

```typescript
// Workers are in src/workers/:
// - batch-calc.worker.ts — Formula calculations
// - consolidation.worker.ts — Consolidation calculations
// - monte-carlo.worker.ts — Monte Carlo simulation
// - worker-pool.ts — Worker pool management

// To use a worker:
import { WorkerPool } from '@/workers/worker-pool';

const pool = new WorkerPool(4); // 4 worker threads

// Submit work:
const result = await pool.execute('batch-calc', {
  type: 'calculate',
  cells: dirtyCells,
  formulas: formulaMap,
});

// Workers communicate via postMessage:
// Main thread → Worker: { type: string, data: any }
// Worker → Main thread: { type: string, result: any, error?: string }

// RULES:
// 1. Never pass non-serializable data (functions, class instances)
// 2. Always handle worker errors with try/catch
// 3. Terminate workers when done: pool.terminate()
// 4. Use transferable objects for large data (ArrayBuffer)
```

### 3.6 Tauri IPC Pattern

```typescript
// Tauri commands are defined in src-tauri/src/lib.rs:
// #[tauri::command]
// fn get_app_info() -> AppInfo { ... }

// Call from frontend:
import { invoke } from '@tauri-apps/api/core';

const info = await invoke<AppInfo>('get_app_info');

// For database operations, use tauri-plugin-sql:
import Database from '@tauri-apps/plugin-sql';
const db = await Database.load('sqlite:finplan.db');
const rows = await db.select('SELECT * FROM budgets WHERE id = ?', [id]);

// For file operations, use tauri-plugin-fs:
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
const content = await readTextFile('data.json');
await writeTextFile('data.json', JSON.stringify(data));

// For dialogs, use tauri-plugin-dialog:
import { save, open } from '@tauri-apps/plugin-dialog';
const filePath = await save({ filters: [{ name: 'FinPlan', extensions: ['finplan'] }] });

// RULES:
// 1. Always handle Tauri command errors (they throw, not return error objects)
// 2. Use try/catch around all invoke() calls
// 3. Check if running in Tauri: const isTauri = window.__TAURI_INTERNALS__
// 4. Provide web fallbacks when Tauri APIs aren't available
```

---

## 4. PAGE PATTERNS (VERIFIED FROM actual page files)

### 4.1 Page Structure

```typescript
// EVERY page follows this pattern:
import { useState, useEffect } from 'react';
import { useSomeStore } from '@/store/someStore';
import { SomeComponent } from '@/components/some/SomeComponent';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function SomePage() {
  const { items, isLoading, fetchItems } = useSomeStore();

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  if (isLoading) return <LoadingSpinner />;

  return (
    <ErrorBoundary>
      <div className="space-y-6 p-6">
        <h1 className="text-2xl font-bold">Page Title</h1>
        <SomeComponent data={items} />
      </div>
    </ErrorBoundary>
  );
}
```

### 4.2 Route Registration (in App.tsx)

```typescript
// Pages are lazy-loaded:
const SomePage = lazy(() => import('./pages/some/SomePage'));

// Routes use React Router:
<Route path="/some" element={<SomePage />} />
<Route path="/some/:id" element={<SomeDetailPage />} />
```

---

## 5. TYPE DEFINITION PATTERNS (VERIFIED FROM types/)

### 5.1 Type File Structure

```typescript
// src/types/index.ts — Central type definitions
export interface Budget {
  id: string;
  name: string;
  description: string;
  fiscalYear: number;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected';
  template: string;
  departments: string[];
  entities: string[];
  baseCurrency: string;
  totalAmount: number;
  createdByName: string;
  submittedAt: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  version: number;
  progress: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface BudgetLineItem {
  id: string;
  budgetId: string;
  accountId: string;
  accountName: string;
  accountCode: string;
  accountType: AccountType;
  periodId: string;
  month: number;
  amount: number;
  notes: string;
  // ... more fields
}

export type AccountType = 'Revenue' | 'COGS' | 'OpEx' | 'CapEx' | 'Other';
```

---

## 6. IMPORT/EXPORT PATTERNS

### 6.1 Import Path Convention

```typescript
// ALWAYS use @/ alias for src/ imports:
import { Button } from '@/components/ui/Button';
import { useBudgetStore } from '@/store/budgetStore';
import { FormulaEngine } from '@/engines/FormulaEngine';
import type { Budget } from '@/types';
import { cn } from '@/utils/cn';

// NEVER use relative paths that go up more than 2 levels:
❌ import { Button } from '../../../../components/ui/Button';
✅ import { Button } from '@/components/ui/Button';
```

### 6.2 Barrel File Pattern

```typescript
// Each directory has an index.ts that re-exports:
// src/components/ui/index.ts
export { Button } from './Button';
export { Card } from './Card';
export { Input } from './Input';

// Usage:
import { Button, Card, Input } from '@/components/ui';
```

---

## 7. ERROR HANDLING PATTERNS

### 7.1 Engine Error Handling

```typescript
// Engines return results with error field:
interface EngineResult<T> {
  value: T;
  error?: string;
  dependencies?: string[];
}

// NEVER throw in engines — return error results:
static processData(input: unknown): EngineResult<number> {
  if (!input) {
    return { value: 0, error: 'No input provided' };
  }
  // ... process
  return { value: result, error: undefined };
}
```

### 7.2 Store Error Handling

```typescript
// Stores throw errors for invalid inputs:
if (!id || typeof id !== 'string') {
  throw new Error('id must be a non-empty string');
}

// Stores set isLoading/error state for async operations:
fetchData: async () => {
  set((s) => { s.isLoading = true; s.error = null; });
  try {
    const data = await apiCall();
    set((s) => { s.items = data; s.isLoading = false; });
  } catch (err) {
    set((s) => { s.error = err.message; s.isLoading = false; });
  }
}
```

### 7.3 Component Error Handling

```typescript
// Use ErrorBoundary for component-level errors:
<ErrorBoundary fallback={<ErrorFallback />}>
  <SomeComponent />
</ErrorBoundary>

// Use try/catch for event handlers:
const handleClick = () => {
  try {
    doSomethingRisky();
  } catch (error) {
    showToast('error', 'Something went wrong');
  }
};
```

---

## 8. TESTING PATTERNS

### 8.1 Store Test Pattern

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useBudgetStore } from './budgetStore';

describe('budgetStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useBudgetStore.setState({
      budgets: [],
      activeBudgetId: null,
      lineItems: [],
      isLoading: false,
      // ... all initial state
    });
  });

  it('should create a budget', () => {
    const { createBudget } = useBudgetStore.getState();
    createBudget({ name: 'Test', fiscalYear: 2024, /* ... */ });
    const { budgets } = useBudgetStore.getState();
    expect(budgets).toHaveLength(1);
    expect(budgets[0].name).toBe('Test');
  });
});
```

### 8.2 Engine Test Pattern

```typescript
import { describe, it, expect } from 'vitest';
import { ConsolidationEngine, type EntityData } from './ConsolidationEngine';

// Helper functions for test data
function createEntry(id: string, code: string, amount: number, entityId: string) {
  return { id, accountCode: code, accountName: 'Test', amount, currency: 'USD', date: '2024-01-01', entityId };
}

describe('ConsolidationEngine', () => {
  it('should consolidate two entities', () => {
    const parent = { entityId: 'p', entityName: 'Parent', currency: 'USD', entries: [createEntry('1', '1000', 1000, 'p')] };
    const child = { entityId: 'c', entityName: 'Child', currency: 'USD', entries: [createEntry('2', '1000', 500, 'c')] };
    const ownership = [{ parentId: 'p', childId: 'c', ownershipPct: 100, method: 'full' as const }];

    const result = ConsolidationEngine.consolidate([parent, child], ownership);

    expect(result.consolidatedEntries.length).toBeGreaterThan(0);
    // ... more assertions
  });
});
```

---

## 9. AG GRID PATTERNS

### 9.1 Column Definition Pattern

```typescript
const columnDefs: ColDef[] = [
  {
    field: 'accountName',
    headerName: 'Account',
    width: 200,
    pinned: 'left',
    filter: 'agTextColumnFilter',
  },
  {
    field: 'amount',
    headerName: 'Amount',
    width: 150,
    type: 'numericColumn',
    valueFormatter: (params) => formatCurrency(params.value),
    cellRenderer: 'agAnimateShowChangeCellRenderer',
  },
  {
    field: 'variance',
    headerName: 'Variance',
    width: 120,
    cellClass: (params) => params.value > 0 ? 'text-green-600' : 'text-red-600',
  },
];
```

### 9.2 Grid Configuration Pattern

```typescript
<AgGridReact
  rowData={rowData}
  columnDefs={columnDefs}
  defaultColDef={{
    sortable: true,
    filter: true,
    resizable: true,
    minWidth: 80,
  }}
  enableRangeSelection={true}
  enableFillHandle={true}
  undoRedoCellEditing={true}
  onCellValueChanged={handleCellChange}
  getRowId={(params) => params.data.id}
/>
```

---

## 10. CHART PATTERNS (Recharts)

### 10.1 Standard Chart Pattern

```typescript
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

<ResponsiveContainer width="100%" height={300}>
  <BarChart data={chartData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="period" />
    <YAxis tickFormatter={formatCurrency} />
    <Tooltip formatter={formatCurrency} />
    <Legend />
    <Bar dataKey="budget" fill="#94a3b8" name="Budget" />
    <Bar dataKey="actual" fill="#3b82f6" name="Actual" />
  </BarChart>
</ResponsiveContainer>
```

### 10.5 Common Mistakes to Avoid

MISTAKE 1: Using spread instead of Immer
  ❌ set(state => ({ ...state, items: [...state.items, newItem] }))
  ✅ set(state => { state.items.push(newItem); })
  WHY: Immer handles immutability. Spreading defeats the purpose.

MISTAKE 2: Not validating financial inputs
  ❌ setAmount(amount: number) { state.amount = amount; }
  ✅ if (!Number.isFinite(amount)) throw new Error('Invalid amount');
  WHY: NaN, Infinity, or undefined will corrupt financial data.

MISTAKE 3: Using 'any' type
  ❌ const data: any = await fetchData();
  ✅ const data: Budget[] = await fetchData();
  WHY: TypeScript catches bugs. 'any' disables it.

MISTAKE 4: Not using ErrorBoundary
  ❌ return <SomeComponent />; // Will crash entire app on error
  ✅ return <ErrorBoundary><SomeComponent /></ErrorBoundary>;
  WHY: One component error shouldn't crash the entire app.

MISTAKE 5: Storing formatted numbers in state
  ❌ state.amount = "$1,234.56";
  ✅ state.amount = 1234.56; // Format at display layer
  WHY: Formatted strings can't be used in calculations.

MISTAKE 6: Not using cn() for class merging
  ❌ className={`base ${condition ? 'active' : ''} ${className}`}
  ✅ className={cn('base', condition && 'active', className)}
  WHY: cn() handles Tailwind conflicts and conditional classes properly.

MISTAKE 7: Console.log in production code
  ❌ console.log('debug:', data);
  ✅ Remove all console.log before committing
  WHY: Performance impact, security risk (leaking data), cluttered console.

MISTAKE 8: Not handling loading/error states
  ❌ return <div>{data.map(...)}</div>; // Crashes if data is undefined
  ✅ if (isLoading) return <Skeleton />;
     if (error) return <ErrorMessage />;
     return <div>{data.map(...)}</div>;
  WHY: Users see white screen or crash instead of helpful feedback.

---

## 10.6 CRITICAL FINDINGS FROM AGENT ANALYSIS

### Finding 1: Excel Import is NOT Implemented in ImportEngine
```
ImportEngine.importFile() returns error:
  "Excel import requires the ExcelJS library. Please convert to CSV or JSON first."
The xlsx library IS installed but ImportEngine doesn't use it.
ONLY CSV and JSON import actually work.
Excel import needs to be IMPLEMENTED, not just connected.
```

### Finding 2: LoginPage.tsx is a STUB
```
LoginPage.tsx does NOT call authStore.login().
It does a fake setTimeout(800ms) then navigates to "/".
The auth flow (JWT, refresh, interceptor) WORKS but the login page
doesn't connect to it. This needs to be wired up.
```

### Finding 3: File Save Doesn't Write to Disk
```
FinPlanFileEngine.saveToFile() only serializes to JSON string.
It NEVER writes to disk. The caller must persist the returned string.
In Tauri mode, the caller uses tauri-plugin-fs to write.
In web mode, the caller uses file-saver to download.
```

### Finding 4: Auto-Save is 5 Minutes, Not 30 Seconds
```
AutoSaveEngine defaults to intervalMs = 300000 (5 minutes).
The prompt claims 30 seconds. This is WRONG.
Auto-save also triggers on blur, close, and manual trigger.
```

### Finding 5: Two Separate Undo/Redo Implementations
```
budgetStore: Inline history array + historyIndex in Zustand state
glStore: External UndoRedoEngine<T> class with maxDepth=100
These are INCONSISTENT. New stores should use UndoRedoEngine.
```

### Finding 6: Store Patterns Vary
```
budgetStore: subscribeWithSelector(persist(immer(...))) — full stack
glStore: subscribeWithSelector(persist(immer(...))) — full stack
authStore: persist(...) only — no Immer, no subscribeWithSelector
uiStore: persist(...) only — simplest pattern
New stores should use the full stack unless there's a reason not to.
```

### Finding 7: SQLite Stores JSON Snapshots, Not Normalized Data
```
Tauri SQLite uses a `stores` table with columns: id TEXT PK, value TEXT
Zustand store state is serialized as JSON and stored as a single string.
This means ALL store data is in one row per store.
CubeEnginePersistence creates separate tables for cube data.
```

### Finding 8: Only 1 Tauri Command Exists
```
Only get_app_info is defined in lib.rs.
All other Tauri interaction is via plugins (SQL, FS, dialog, shell).
The frontend uses @tauri-apps/plugin-sql for database access.
Menu events are communicated via app.emit("menu-event", id).
```

### Finding 9: Engines Are Fully Independent
```
No cross-engine imports (except FormulaEngine → IterativeCalculationEngine).
Each engine is a standalone computation layer.
Data flow happens at the store/page layer, not between engines.
Stores call engines, engines never call stores.
```

---

## 11. CRITICAL IMPLEMENTATION GAPS

### 11.1 What the FormulaEngine NEEDS (Currently Only 5 Functions)

```
PRIORITY 1 — MUST IMPLEMENT IMMEDIATELY:
  AVERAGE, MIN, MAX, COUNTA, COUNTBLANK
  AND, OR, NOT, IFERROR, IFS, SWITCH
  VLOOKUP, HLOOKUP, INDEX, MATCH, XLOOKUP
  SUMIF, SUMIFS, COUNTIF, COUNTIFS, AVERAGEIF
  CONCATENATE, LEFT, RIGHT, MID, LEN, TRIM, UPPER, LOWER
  DATE, YEAR, MONTH, DAY, TODAY, NOW, EDATE, EOMONTH
  ABS, ROUND, ROUNDUP, ROUNDDOWN, CEILING, FLOOR, MOD, INT

PRIORITY 2 — FINANCIAL FUNCTIONS:
  IRR, XIRR, XNPV, PV, FV, PMT, IPMT, PPMT
  SLN (straight-line depreciation), DB, DDB, SYD
  EFFECT, NOMINAL (interest rate conversions)

PRIORITY 3 — ADVANCED FUNCTIONS:
  OFFSET, INDIRECT, CHOOSE, LOOKUP
  ARRAY formulas, dynamic arrays
  Multi-column range references (A1:C10)
  String concatenation with & operator
```

### 11.2 What the Backend NEEDS (Currently Only Auth Works)

```
PRIORITY 1 — IMPLEMENT THESE ROUTES:
  budgets.ts — CRUD for budgets and line items
  gl.ts — GL entries, accounts, trial balance
  forecasts.ts — Forecast CRUD + periods
  scenarios.ts — Scenario CRUD + line items

PRIORITY 2 — IMPLEMENT THESE ROUTES:
  reports.ts — Report CRUD + templates
  entities.ts — Entities, departments, users
  export.ts — Server-side PDF/Excel generation for large datasets

NOTE: The app works WITHOUT the backend (client-side computation).
The backend is OPTIONAL for team collaboration scenarios.
```

### 11.3 What Pages NEED Audit

```
Pages that EXIST but may be SCAFFOLDS:
  /consolidation/* — Needs verification of actual functionality
  /currency/* — Needs verification
  /revenue/* — Needs verification
  /tax/* — Needs verification
  /lease — Needs verification
  /cash/* — Needs verification
  /treasury/* — Needs verification
  /healthcare/* — Needs verification
  /banking/* — Needs verification
  /energy/* — Needs verification
  /construction/* — Needs verification
  /insurance/* — Needs verification

Pages that are CONFIRMED WORKING:
  /dashboard — ✅
  /budgets/* — ✅
  /forecasts/* — ✅
  /scenarios/* — ✅
  /variance — ✅
  /analytics — ✅
  /reports/* — ✅
  /data/* — ✅
  /settings/* — ✅
  /login, /register — ✅
```

---

## 12. FINANCIAL DOMAIN KNOWLEDGE

### 12.1 Key Accounting Standards Referenced

```
ASC 606  — Revenue Recognition (5-step model)
ASC 810  — Consolidation (variable interest entities)
ASC 842  — Lease Accounting (right-of-use assets)
ASC 740  — Income Taxes (deferred tax, effective rate)
ASC 830  — Foreign Currency Translation
IFRS 15  — Revenue Recognition (international)
IFRS 16  — Lease Accounting (international)
IFRS 8   — Operating Segments
SOX      — Sarbanes-Oxley (audit trail, internal controls)
```

### 12.2 Key Financial Formulas

```
Gross Margin = (Revenue - COGS) / Revenue
EBITDA = Operating Income + Depreciation + Amortization
Net Income = Revenue - All Expenses - Tax
Free Cash Flow = Operating Cash Flow - CapEx
Working Capital = Current Assets - Current Liabilities
DSO = (Accounts Receivable / Revenue) × 365
DPO = (Accounts Payable / COGS) × 365
DIO = (Inventory / COGS) × 365
Current Ratio = Current Assets / Current Liabilities
Debt-to-Equity = Total Debt / Total Equity
ROE = Net Income / Shareholders' Equity
ROA = Net Income / Total Assets
```

### 12.3 Key SaaS Metrics

```
MRR = Sum of all monthly recurring revenue
ARR = MRR × 12
NRR = (Starting MRR + Expansion - Contraction - Churn) / Starting MRR
GRR = (Starting MRR - Contraction - Churn) / Starting MRR
Churn Rate = Customers Lost / Total Customers
LTV = ARPU / Churn Rate
CAC = Total Sales & Marketing Cost / New Customers
LTV:CAC Ratio = LTV / CAC (target: >3x)
Magic Number = Net New ARR / Sales & Marketing Spend (prior quarter)
Rule of 40 = Revenue Growth % + Profit Margin % (target: >40%)
```

---

## 13. PERFORMANCE OPTIMIZATION PATTERNS

### 13.1 Grid Performance

```
- Use AG Grid's virtual scrolling (built-in)
- Enable row buffering: cacheBlockSize={100}
- Use getRowId for stable row identity
- Avoid re-rendering entire grid on cell edit
- Use cell renderer for complex cells, not cell formatter
```

### 13.2 Calculation Performance

```
- Use IncrementalCalcEngine (only recalc dirty cells)
- Use Web Workers for heavy calculations
- Use requestIdleCallback for non-urgent updates
- Debounce user input (300ms for search, 100ms for cell edits)
- Use React.memo for expensive components
```

### 13.3 Memory Management

```
- Use virtualization for large lists
- Clean up event listeners in useEffect return
- Avoid storing large objects in Zustand state
- Use WeakMap for caching where appropriate
- Implement pagination for large datasets
```

---

## 14. SECURITY PATTERNS

### 14.1 Input Validation

```typescript
// ALWAYS validate at boundaries:
function updateAmount(id: string, amount: number) {
  if (!id || typeof id !== 'string') throw new Error('Invalid id');
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    throw new Error('Amount must be a finite number');
  }
  if (amount > 999999999999) throw new Error('Amount exceeds maximum');
  // ... proceed
}
```

### 14.2 Data Protection

```
- Never log sensitive financial data
- Use AES-256 for file encryption (EncryptionEngine.ts)
- JWT tokens in memory only (not localStorage)
- Auto-lock after inactivity (SessionEngine.ts)
- Audit trail for all changes (CellAuditTrailEngine.ts)
```

---

## 15. QUICK REFERENCE CARD

```
TO CREATE A NEW ENGINE:
  1. Create src/engines/YourEngine.ts
  2. Export class with static methods
  3. Add types to src/types/
  4. Create src/engines/YourEngine.test.ts
  5. Export from src/engines/index.ts

TO CREATE A NEW STORE:
  1. Create src/store/yourStore.ts
  2. Use create<YourState>()(subscribeWithSelector(persist(immer(...))))
  3. Use masterStorage for persistence
  4. Create src/store/yourStore.test.ts
  5. Export from src/store/index.ts

TO CREATE A NEW PAGE:
  1. Create src/pages/yourdomain/YourPage.tsx
  2. Export default function component
  3. Add lazy import in App.tsx
  4. Add route in App.tsx
  5. Add to sidebar navigation

TO CREATE A NEW COMPONENT:
  1. Create src/components/yourdomain/YourComponent.tsx
  2. Use forwardRef + cn() utility
  3. Export from src/components/yourdomain/index.ts
  4. Create YourComponent.test.tsx

TO ADD A NEW API ENDPOINT:
  1. Create server/src/routes/yourRoute.ts
  2. Add Zod validation schema
  3. Add auth middleware if protected
  4. Register in server/src/index.ts
  5. Add API service in src/services/

TO RUN AND VERIFY:
  npm run test         — All tests pass
  npm run build        — Build succeeds
  npm run lint         — No errors
  npm run dev          — Feature works in browser
```

### 15.5 Gotchas & Edge Cases

FINANCIAL:
  - Division by zero → return 0 or #DIV/0! equivalent, never crash
  - Negative revenue → valid in some cases (refunds, returns)
  - Zero depreciation → valid for fully depreciated assets
  - Null currency → default to entity's base currency
  - Empty cells in SUM → treat as 0, not error
  - Circular references → IterativeCalcEngine handles, but flag them

STATE MANAGEMENT:
  - Store hydration delay → persist() loads async, check isHydrated
  - Undo after save → undo should work even after auto-save
  - Concurrent edits → last-write-wins for single-user, merge for multi-user
  - Large state → don't put 10M cells in Zustand, use CubeEngine

UI:
  - AG Grid + React strict mode → may cause double renders
  - Dark mode + charts → ensure chart colors work in both themes
  - Keyboard shortcuts → don't conflict with browser defaults (Ctrl+S)
  - Lazy loading → Suspense boundary needed for every lazy route

---

## 16. SESSION CONTINUITY PROTOCOL

Each session inherits the FULL context from all previous sessions.
This protocol ensures nothing is lost between sessions.

### 16.1 Session Handoff File

  Every session writes a `.session-handoff.json` file to the project root.
  The next session reads this file to restore context.

  ```json
  {
    "sessionNumber": 47,
    "lastModified": "2026-05-18T14:30:00Z",
    "filesModified": ["src/store/budgetStore.ts", "src/pages/BudgetPage.tsx"],
    "currentBranch": "feature/budget-workflow",
    "lastCommand": "npm run test -- --coverage",
    "testStatus": "passing (247/247)",
    "buildStatus": "passing (293KB gzip)",
    "staleDataWarnings": ["ImportEngine xlsx support not tested"],
    "nextRecommendedAction": "Wire ImportEngine to xlsx parser",
    "blockers": ["None"],
    "decisionsMade": [
      "Use UndoRedoEngine<T> pattern for all new stores",
      "Standardize on immer+persist+subscribeWithSelector stack"
    ],
    "openQuestions": [
      "Should we support .xlsb format?",
      "Default auto-save interval: 30s or 60s?"
    ]
  }
  ```

### 16.2 Session Init Flow

  1. Read `.session-handoff.json` (if exists)
  2. Read `reports/{agent}-complete.md` for latest agent completion reports
  3. Run `git log --oneline -10` to see recent changes
  4. Run `npm run test` to verify current state
  5. Restore any in-progress work from previous session
  6. Present handoff summary to the user

### 16.3 Session Close Flow

  1. Update `.session-handoff.json` with current state
  2. Run final `npm run test` and record test status
  3. Run final `npm run build` and record build status
  4. Write session summary to user
  5. If changes made, note any uncommitted work

### 16.4 Cross-Session Knowledge

  The fleet maintains these cross-session artifacts:
  - `AGENTS.md` — Agent task assignments (read-only reference)
  - `reports/` — Agent completion reports (read-only reference)
  - `.session-handoff.json` — Session continuity (overwritten each session)
  - `prompt/` — System prompt parts (updated when structure changes)

## 17. PROMPT SELF-EVOLUTION

The prompt is NOT static. It should evolve as the codebase grows.

### 17.1 When to Update the Prompt

  UPDATE immediately after:
  - Any engine count changes (e.g., 115 → 120 engines)
  - Any store count changes (e.g., 19 → 21 stores)
  - Any page count changes (e.g., 85 → 90 pages)
  - Any component count changes (e.g., 133 → 150 components)
  - Critical findings resolved (move from 🔥 to ✅ in Part 4 roadmap)
  - New critical findings discovered (add to Part 4 roadmap)

  UPDATE periodically (every 10 sessions or 1 week):
  - File statistics (lines of code, file counts)
  - Gap-closure roadmap status
  - Any sections that feel outdated or inaccurate

### 17.2 How to Update

  1. Edit the affected part directly
  2. Log the change in `prompt/FinPlan_Pro_Prompt_Upgrade_Log.md`
  3. Bump the version number
  4. Update the date stamp

### 17.3 Self-Healing Checks

  At the start of every session, the fleet should verify:
  - Do the engine counts match? (expected: 115, check: `find src/engines -name "*.ts" ! -name "*.test.ts" ! -name "index.ts" | wc -l`)
  - Do the store counts match? (expected: 17, check: `ls src/store/*.ts | grep -v test | grep -v index | wc -l`)
  - Do the page counts match? (expected: 87 routes, check: `grep -c "path=" src/App.tsx`)
  - Do the component counts match? (expected: 108, check: `find src/components -name "*.tsx" ! -name "*.test.tsx" | wc -l`)
  - Is the version number in the prompt still current?
  - Are any sections contradicted by the actual code?

  If any check fails, flag it in the session handoff as a prompt
  update recommendation.

This section can be customized based on user preferences and workflow needs.

---

╔══════════════════════════════════════════════════════════════════════════════╗
║  END OF PART 5 (ADDON)                                                       ║
║                                                                              ║
║  ALL 5 PARTS ARE NOW COMPLETE (v5.0.0):                                      ║
║    Part 1: Identity, Fleet & A1-A5 Reconciliation                            ║
║    Part 2: Complete Project State & Technical Context                        ║
║    Part 3: Competitive Intelligence & Gap Analysis                           ║
║    Part 4: Gap-Focused Roadmap & Strategy                                    ║
║    Part 5: Code Patterns, Continuity & Self-Evolution                        ║
║                                                                              ║
║  TOTAL: ~5,000+ lines across 5 parts.                                        ║
║  ~345+ features catalogued. 25 competitors analyzed.                         ║
║  20 fleet agents + A1-A5 agents reconciled. 115 engines.                     ║
║  17 stores. 87 routes. 108 components. 15 sector configs.                    ║
║  ~62K LOC (src/ .ts/.tsx).                                                   ║
║                                                                              ║
║  USAGE: Combine Parts 1-5 into a single prompt.                              ║
║  The AI now has everything it needs to write code that                       ║
║  SEAMLESSLY integrates with the existing codebase.                           ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

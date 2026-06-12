# FinPlan Pro — Acquired Skills & External Patterns

> Practical patterns sourced from official docs, community best practices, and production codebases.
> Auto-generated for FinPlan Pro (React + TypeScript + Tauri + AG Grid + Zustand + Recharts + Vitest)

---

## 1. AG Grid Financial Data Patterns

### 1.1 Currency Cell Renderer

```typescript
// src/components/grid/CurrencyCellRenderer.tsx
import { type ICellRendererParams } from 'ag-grid-community';

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

export function CurrencyCellRenderer({ value }: ICellRendererParams) {
  if (value == null || isNaN(value)) return <span className="text-muted">—</span>;
  const isNegative = value < 0;
  return (
    <span className={isNegative ? 'text-red-600' : 'text-green-700'}>
      {isNegative ? `(${formatter.format(Math.abs(value))})` : formatter.format(value)}
    </span>
  );
}
```

**FinPlan Pro application:** Use on all monetary columns in BudgetGrid, GLGrid, ForecastGrid. Negative values in parentheses per financial convention (see `.claude/rules/finplan-financial.md`).

### 1.2 Percentage Cell Renderer with Variance Coloring

```typescript
export function PercentCellRenderer({ value, data, colDef }: ICellRendererParams) {
  if (value == null) return <span>—</span>;
  const pct = (value * 100).toFixed(1);
  const isFavorable = data?.[`${colDef?.field}_favorable`]; // precomputed
  return (
    <span className={isFavorable ? 'text-green-600' : 'text-red-600'}>
      {pct}%
    </span>
  );
}
```

### 1.3 Conditional Formatting via `cellClassRules`

```typescript
// Column definition for variance %
{
  headerName: 'Variance %',
  field: 'variancePct',
  cellClassRules: {
    'bg-green-50 text-green-700': (params) => params.value > 0.05,   // >5% favorable
    'bg-red-50 text-red-700':     (params) => params.value < -0.05,  // >5% unfavorable
    'bg-yellow-50 text-yellow-700': (params) => params.value >= -0.05 && params.value <= 0.05,
  },
  valueFormatter: (params) => params.value != null ? `${(params.value * 100).toFixed(1)}%` : '—',
}
```

### 1.4 GL Account Grouping (Tree Data)

```typescript
// AG Grid Tree Data for Chart of Accounts
const gridOptions = {
  treeData: true,
  animateRows: true,
  groupDefaultExpanded: -1,
  getDataPath: (data: GLAccount) => data.accountPath, // ['1000', '1100', '1110']
  autoGroupColumnDef: {
    headerName: 'Account',
    field: 'accountName',
    cellRendererParams: { suppressCount: true },
  },
};
```

**Source:** AG Grid Tree Data docs — https://www.ag-grid.com/javascript-data-grid/tree-data/

### 1.5 Pivot Table Configuration

```typescript
const pivotConfig = {
  pivotMode: true,
  pivotPanelShow: 'always',
  rowGroupCols: [{ field: 'department' }, { field: 'costCenter' }],
  pivotCols: [{ field: 'period' }], // Q1, Q2, Q3, Q4
  valueCols: [{ field: 'amount', aggFunc: 'sum' }],
};
```

### 1.6 Financial Grid Performance (100K+ rows)

```typescript
const gridOptions = {
  rowModelType: 'clientSide',
  cacheBlockSize: 100,
  maxBlocksInCache: 10,
  enableCellChangeFlash: true,
  suppressAnimationFrame: false, // let browser handle animation
  getRowId: (params) => params.data.id, // stable row IDs for efficient updates
};
```

---

## 2. Zustand Middleware Patterns

### 2.1 Canonical Stack (FinPlan Pro Standard)

```typescript
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface BudgetState {
  budgets: Budget[];
  activeBudgetId: string | null;
  // actions
  addBudget: (budget: Budget) => void;
  setActive: (id: string) => void;
}

export const useBudgetStore = create<BudgetState>()(
  subscribeWithSelector(
    persist(
      immer((set) => ({
        budgets: [],
        activeBudgetId: null,
        addBudget: (budget) =>
          set((state) => {
            state.budgets.push(budget);
          }),
        setActive: (id) =>
          set((state) => {
            state.activeBudgetId = id;
          }),
      })),
      {
        name: 'finplan-budget',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({ budgets: state.budgets, activeBudgetId: state.activeBudgetId }),
      }
    )
  )
);
```

**Source:** Zustand docs — https://docs.pmnd.rs/guides/typescript#middleware-that-changes-the-store-type

### 2.2 Undo/Redo with Temporal Middleware

```typescript
import { temporal } from 'zundo';

export const useBudgetStore = create<BudgetState>()(
  temporal(
    immer((set) => ({
      /* ... state and actions ... */
    })),
    {
      limit: 100, // 100-level history
      equality: (pastState, currentState) =>
        JSON.stringify(pastState) === JSON.stringify(currentState),
      handleSet: (handleSet) => {
        // Debounce rapid changes (e.g., typing in cells)
        return throttle(handleSet, 300);
      },
    }
  )
);

// Usage in component
const { undo, redo, pastStates, futureStates } = useBudgetStore.temporal.getState();
```

**Source:** zundo library — https://github.com/charkour/zundo

### 2.3 SubscribeWithSelector for Cross-Store Reactivity

```typescript
// React to budget changes to auto-trigger forecast recalculation
useBudgetStore.subscribe(
  (state) => state.budgets,
  (budgets, prevBudgets) => {
    if (budgets !== prevBudgets) {
      useForecastStore.getState().recalculateFromBudgets(budgets);
    }
  },
  { fireImmediately: false }
);
```

### 2.4 Devtools Integration

```typescript
import { devtools } from 'zustand/middleware';

export const useStore = create(
  devtools(
    immer((set) => ({
      /* ... */
    })),
    { name: 'FinPlan Budget Store', enabled: import.meta.env.DEV }
  )
);
```

---

## 3. Tauri Desktop Patterns

### 3.1 File System Commands (Rust backend)

```rust
// src-tauri/src/commands.rs
use tauri::command;
use std::fs;

#[command]
fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[command]
fn write_file(path: String, contents: String) -> Result<(), String> {
    fs::write(&path, &contents).map_err(|e| e.to_string())
}

#[command]
fn save_budget_file(path: String, data: Vec<u8>) -> Result<(), String> {
    fs::write(&path, &data).map_err(|e| e.to_string())
}
```

```typescript
// src/services/tauriBridge.ts
import { invoke } from '@tauri-apps/api/core';

export async function saveToDisk(path: string, data: string): Promise<void> {
  await invoke('write_file', { path, contents: data });
}

export async function loadFromDisk(path: string): Promise<string> {
  return invoke('read_file', { path });
}
```

**Source:** Tauri v2 IPC docs — https://v2.tauri.app/develop/calling-rust/

### 3.2 Native Menu

```rust
// src-tauri/src/menu.rs
use tauri::menu::{Menu, MenuItem, Submenu};

pub fn build_menu(app: &tauri::App) -> Menu<tauri::Wry> {
    let file_menu = Submenu::with_items(app, "File", true, &[
        &MenuItem::with_id(app, "new", "New Budget", true, Some("CmdOrCtrl+N"))?,
        &MenuItem::with_id(app, "open", "Open...", true, Some("CmdOrCtrl+O"))?,
        &MenuItem::with_id(app, "save", "Save", true, Some("CmdOrCtrl+S"))?,
        &MenuItem::with_id(app, "export", "Export to Excel...", true, Some("CmdOrCtrl+E"))?,
    ])?;
    Menu::with_items(app, &[&file_menu])
}
```

### 3.3 System Tray

```rust
use tauri::tray::{TrayIconBuilder, MouseButton, MouseButtonState, TrayIconEvent};

TrayIconBuilder::new()
    .icon(app.default_window_icon().unwrap().clone())
    .on_tray_icon_event(|tray, event| {
        if let TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. } = event {
            let app = tray.app_handle();
            if let Some(window) = app.get_webview_window("main") {
                window.show().unwrap();
                window.set_focus().unwrap();
            }
        }
    })
    .build(app)?;
```

### 3.4 Auto-Save via Tauri Events

```typescript
// src/hooks/useAutoSave.ts
import { listen } from '@tauri-apps/api/event';

export function useAutoSave(intervalMs = 30000) {
  useEffect(() => {
    const timer = setInterval(() => {
      const data = useBudgetStore.getState();
      invoke('auto_save', { data: JSON.stringify(data) });
    }, intervalMs);
    return () => clearInterval(timer);
  }, []);
}
```

---

## 4. React Financial UI Patterns

### 4.1 Currency Input with Formatting

```typescript
import { useRef, useState } from 'react';

export function CurrencyInput({ value, onChange, currency = 'USD' }: Props) {
  const [displayValue, setDisplayValue] = useState(formatCurrency(value));
  const inputRef = useRef<HTMLInputElement>(null);

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency', currency, minimumFractionDigits: 2,
  });

  function formatCurrency(n: number) {
    return n < 0 ? `(${formatter.format(Math.abs(n))})` : formatter.format(n);
  }

  const handleBlur = () => {
    const raw = parseFloat(displayValue.replace(/[^0-9.-]/g, ''));
    if (!isNaN(raw)) {
      onChange(raw);
      setDisplayValue(formatCurrency(raw));
    }
  };

  return (
    <input
      ref={inputRef}
      value={displayValue}
      onChange={(e) => setDisplayValue(e.target.value)}
      onBlur={handleBlur}
      onFocus={() => setDisplayValue(String(value))}
      className="text-right font-mono tabular-nums"
    />
  );
}
```

### 4.2 Fiscal Period Date Picker

```typescript
const FISCAL_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function FiscalPeriodSelect({ fiscalYearStart, value, onChange }: Props) {
  const periods = FISCAL_MONTHS.map((m, i) => ({
    label: `${m} FY${fiscalYearStart + (i >= 6 ? 1 : 0)}`,
    value: `${fiscalYearStart + (i >= 6 ? 1 : 0)}-${String(i + 1).padStart(2, '0')}`,
  }));

  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      {periods.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
    </select>
  );
}
```

### 4.3 Skeleton Loading for Financial Data

```typescript
export function FinancialTableSkeleton({ rows = 10, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="animate-pulse">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 py-2 border-b">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-4 bg-gray-200 rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
```

### 4.4 Number Abbreviation (K, M, B)

```typescript
export function abbreviateNumber(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}
```

---

## 5. Vitest Testing Patterns

### 5.1 Store Testing (Reset Before Each)

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useBudgetStore } from './budgetStore';
import { act } from '@testing-library/react';

describe('budgetStore', () => {
  beforeEach(() => {
    useBudgetStore.setState({ budgets: [], activeBudgetId: null });
  });

  it('adds a budget', () => {
    act(() => {
      useBudgetStore.getState().addBudget({ id: '1', name: 'Test', status: 'draft' });
    });
    expect(useBudgetStore.getState().budgets).toHaveLength(1);
  });

  it('handles undo/redo', () => {
    const { undo, redo } = useBudgetStore.temporal.getState();
    act(() => {
      useBudgetStore.getState().addBudget({ id: '1', name: 'A' });
      useBudgetStore.getState().addBudget({ id: '2', name: 'B' });
    });
    expect(useBudgetStore.getState().budgets).toHaveLength(2);
    act(() => undo());
    expect(useBudgetStore.getState().budgets).toHaveLength(1);
    act(() => redo());
    expect(useBudgetStore.getState().budgets).toHaveLength(2);
  });
});
```

### 5.2 Engine Testing (Pure Function Pattern)

```typescript
import { describe, it, expect } from 'vitest';
import { FormulaEngine } from './FormulaEngine';

describe('FormulaEngine', () => {
  const getCellValue = (ref: string) => {
    const cells: Record<string, number> = { A1: 10, A2: 20, B1: 5 };
    return cells[ref] ?? 0;
  };

  it('evaluates SUM formula', () => {
    const result = FormulaEngine.parseFormula('=SUM(A1, A2)');
    const evalResult = FormulaEngine.evaluate(result.nodes, getCellValue);
    expect(evalResult.value).toBe(30);
    expect(evalResult.dependencies).toEqual(['A1', 'A2']);
  });

  it('handles division by zero', () => {
    const result = FormulaEngine.parseFormula('=A1/0');
    const evalResult = FormulaEngine.evaluate(result.nodes, getCellValue);
    expect(evalResult.error).toBe('#DIV/0!');
  });

  it('handles circular references', () => {
    const formulas = new Map([
      ['A1', '=A2+1'],
      ['A2', '=A1+1'],
    ]);
    const analysis = FormulaEngine.analyzeForCircularReferences(formulas);
    expect(analysis.hasCircular).toBe(true);
  });
});
```

### 5.3 Component Testing with Store Mock

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useBudgetStore } from '@/store/budgetStore';

function renderWithStore(ui: React.ReactElement, initialState?: Partial<BudgetState>) {
  if (initialState) {
    useBudgetStore.setState(initialState);
  }
  return render(ui);
}

it('displays budget list', () => {
  renderWithStore(<BudgetList />, {
    budgets: [{ id: '1', name: 'FY2026 Budget', status: 'draft' }],
  });
  expect(screen.getByText('FY2026 Budget')).toBeInTheDocument();
});
```

---

## 6. Recharts Financial Charts

### 6.1 Waterfall Chart (Revenue Bridge)

```typescript
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ReferenceLine } from 'recharts';

const waterfallData = [
  { name: 'Revenue', value: 1000, fill: '#16a34a' },
  { name: 'COGS', value: -400, fill: '#dc2626' },
  { name: 'Gross Profit', value: 600, isTotal: true, fill: '#2563eb' },
  { name: 'OpEx', value: -250, fill: '#dc2626' },
  { name: 'EBITDA', value: 350, isTotal: true, fill: '#2563eb' },
];

export function WaterfallChart({ data }: { data: typeof waterfallData }) {
  return (
    <BarChart data={data} width={600} height={300}>
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
      <ReferenceLine y={0} stroke="#000" />
      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
        {data.map((entry, i) => (
          <Cell key={i} fill={entry.fill} />
        ))}
      </Bar>
    </BarChart>
  );
}
```

### 6.2 Variance Chart (Budget vs Actual)

```typescript
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ReferenceLine } from 'recharts';

export function VarianceChart({ data }: { data: BudgetActual[] }) {
  return (
    <BarChart data={data} width={800} height={400}>
      <XAxis dataKey="category" />
      <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
      <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
      <Legend />
      <ReferenceLine y={0} stroke="#666" />
      <Bar dataKey="budget" fill="#94a3b8" name="Budget" radius={[2, 2, 0, 0]} />
      <Bar dataKey="actual" fill="#2563eb" name="Actual" radius={[2, 2, 0, 0]} />
    </BarChart>
  );
}
```

### 6.3 Sparkline for KPI Cards

```typescript
import { LineChart, Line, ResponsiveContainer } from 'recharts';

export function Sparkline({ data, color = '#2563eb' }: { data: number[]; color?: string }) {
  const chartData = data.map((v, i) => ({ x: i, y: v }));
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={chartData}>
        <Line type="monotone" dataKey="y" stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

### 6.4 Multi-Axis Chart (Revenue + Margin %)

```typescript
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';

export function RevenueMarginChart({ data }: { data: RevenueMargin[] }) {
  return (
    <ComposedChart data={data} width={800} height={400}>
      <XAxis dataKey="period" />
      <YAxis yAxisId="left" tickFormatter={(v) => `$${(v / 1e6).toFixed(1)}M`} />
      <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v}%`} />
      <Tooltip />
      <Legend />
      <Bar yAxisId="left" dataKey="revenue" fill="#2563eb" name="Revenue" radius={[2, 2, 0, 0]} />
      <Line yAxisId="right" type="monotone" dataKey="margin" stroke="#16a34a" name="Margin %" strokeWidth={2} />
    </ComposedChart>
  );
}
```

---

## Quick Reference — Sources

| Topic                  | Key Source                                                                                         |
| ---------------------- | -------------------------------------------------------------------------------------------------- |
| AG Grid Cell Renderers | https://www.ag-grid.com/react-data-grid/component-cell-renderer/                                   |
| AG Grid Tree Data      | https://www.ag-grid.com/javascript-data-grid/tree-data/                                            |
| Zustand Middleware     | https://docs.pmnd.rs/guides/typescript#middleware                                                  |
| Zundo (Undo/Redo)      | https://github.com/charkour/zundo                                                                  |
| Tauri v2 IPC           | https://v2.tauri.app/develop/calling-rust/                                                         |
| Tauri Menus            | https://v2.tauri.app/develop/system-tray/                                                          |
| Vitest                 | https://vitest.dev/guide/                                                                          |
| Recharts               | https://recharts.org/en-US                                                                         |
| Intl.NumberFormat      | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat |

---

## 7. OWASP Security Patterns for SPAs

### 7.1 Content Security Policy Headers

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    {
      name: 'csp-headers',
      configureServer(server) {
        server.middlewares.use((_, res, next) => {
          res.setHeader(
            'Content-Security-Policy',
            [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'", // Vite HMR needs unsafe-inline
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self'",
              "connect-src 'self'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; ')
          );
          next();
        });
      },
    },
  ],
});
```

### 7.2 XSS Prevention in Financial Data Display

```typescript
// NEVER use dangerouslySetInnerHTML with financial data
// BAD: <div dangerouslySetInnerHTML={{ __html: description }} />
// GOOD:
function SafeDescription({ description }: { description: string }) {
  return <p className="text-sm">{description}</p>; // React auto-escapes
}

// Sanitize user input before storing
import DOMPurify from 'isomorphic-dompurify';

function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] }); // strip ALL tags
}
```

### 7.3 JWT Token Security

```typescript
// Store access token in memory (NOT localStorage)
const authState = {
  accessToken: null as string | null,
  refreshToken: null as string | null, // can be in httpOnly cookie
};

// Axios interceptor for token refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const newToken = await refreshAccessToken();
      error.config.headers.Authorization = `Bearer ${newToken}`;
      return axios(error.config);
    }
    return Promise.reject(error);
  }
);
```

---

## 8. Offline-First Patterns

### 8.1 Service Worker with Workbox

```typescript
// vite.config.ts with vite-plugin-pwa
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.example\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 86400 },
              networkTimeoutSeconds: 5,
            },
          },
        ],
      },
    }),
  ],
});
```

### 8.2 IndexedDB for Offline Data

```typescript
import { openDB } from 'idb';

const dbPromise = openDB('finplan-offline', 1, {
  upgrade(db) {
    db.createObjectStore('budgets', { keyPath: 'id' });
    db.createObjectStore('pending-changes', { keyPath: 'id', autoIncrement: true });
  },
});

async function saveOffline(store: string, data: unknown) {
  const db = await dbPromise;
  await db.put(store, data);
}

async function getPendingChanges() {
  const db = await dbPromise;
  return db.getAll('pending-changes');
}

async function syncWhenOnline() {
  const changes = await getPendingChanges();
  for (const change of changes) {
    await api.sync(change);
    const db = await dbPromise;
    await db.delete('pending-changes', change.id);
  }
}

window.addEventListener('online', syncWhenOnline);
```

### 8.3 Conflict Resolution (Last-Write-Wins)

```typescript
interface Syncable {
  id: string;
  updatedAt: string; // ISO timestamp
  version: number;
}

function resolveConflict<T extends Syncable>(local: T, remote: T): T {
  // Last-write-wins with version check
  if (local.version > remote.version) return local;
  if (remote.version > local.version) return remote;
  // Same version — compare timestamps
  return new Date(local.updatedAt) > new Date(remote.updatedAt) ? local : remote;
}
```

---

## 9. TypeScript Advanced Patterns

### 9.1 Branded Types for Financial Values

```typescript
// Prevent mixing currency types at compile time
type USD = number & { __brand: 'USD' };
type EUR = number & { __brand: 'EUR' };
type Percentage = number & { __brand: 'Percentage' };

function usd(n: number): USD {
  return n as USD;
}
function eur(n: number): EUR {
  return n as EUR;
}
function pct(n: number): Percentage {
  return n as Percentage;
}

// TypeScript catches: const total: USD = usd(100) + eur(50); // ERROR
```

### 9.2 Discriminated Unions for API Responses

```typescript
type ApiResponse<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

function DataDisplay<T>({ response }: { response: ApiResponse<T> }) {
  switch (response.status) {
    case 'loading': return <Skeleton />;
    case 'success': return <Data data={response.data} />;
    case 'error': return <Error message={response.error} />;
  }
  // TypeScript knows response is never — exhaustive check
}
```

### 9.3 Generic Store Creator

```typescript
function createStore<T extends Record<string, unknown>>(
  name: string,
  initialState: T,
  actions: (
    set: (fn: (state: Draft<T>) => void) => void
  ) => Record<string, (...args: unknown[]) => void>
) {
  return create<T>()(
    subscribeWithSelector(
      persist(
        immer((set) => ({
          ...initialState,
          ...actions((fn) => set(fn)),
        })),
        { name }
      )
    )
  );
}
```

---

## 10. Tailwind Financial UI Patterns

### 10.1 Dense Data Table

```tsx
<div className="text-xs font-mono tabular-nums">
  <table className="w-full border-collapse">
    <thead>
      <tr className="bg-gray-50 sticky top-0">
        <th className="px-2 py-1 text-left font-semibold text-gray-600 border-b">Account</th>
        <th className="px-2 py-1 text-right font-semibold text-gray-600 border-b">Budget</th>
        <th className="px-2 py-1 text-right font-semibold text-gray-600 border-b">Actual</th>
        <th className="px-2 py-1 text-right font-semibold text-gray-600 border-b">Variance</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-100">
      {rows.map((row) => (
        <tr key={row.id} className="hover:bg-blue-50/50 transition-colors">
          <td className="px-2 py-1">{row.account}</td>
          <td className="px-2 py-1 text-right">{formatCurrency(row.budget)}</td>
          <td className="px-2 py-1 text-right">{formatCurrency(row.actual)}</td>
          <td
            className={clsx(
              'px-2 py-1 text-right font-medium',
              row.variance >= 0 ? 'text-green-700' : 'text-red-700'
            )}
          >
            {formatCurrency(row.variance)}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### 10.2 KPI Card

```tsx
<div className="bg-white rounded-lg border p-4 shadow-sm">
  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</p>
  <p className="text-2xl font-bold text-gray-900 mt-1 tabular-nums">{formatCurrency(value)}</p>
  <div className="flex items-center mt-2 text-sm">
    {change >= 0 ? (
      <span className="text-green-600 flex items-center gap-1">
        <ArrowUp className="w-3 h-3" /> {change.toFixed(1)}%
      </span>
    ) : (
      <span className="text-red-600 flex items-center gap-1">
        <ArrowDown className="w-3 h-3" /> {Math.abs(change).toFixed(1)}%
      </span>
    )}
    <span className="text-gray-400 ml-2">vs prior period</span>
  </div>
</div>
```

### 10.3 Variance Badge

```tsx
function VarianceBadge({ value, type }: { value: number; type: 'revenue' | 'expense' }) {
  const favorable = type === 'revenue' ? value >= 0 : value <= 0;
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        favorable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      )}
    >
      {favorable ? '+' : ''}
      {(value * 100).toFixed(1)}%
    </span>
  );
}
```

---

## 11. Error Boundary Patterns

### 11.1 Financial Error Boundary

```typescript
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';

function FinancialErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
      <h3 className="text-red-800 font-semibold">Something went wrong</h3>
      <p className="text-red-600 text-sm mt-1">{error.message}</p>
      <button onClick={resetErrorBoundary} className="mt-3 px-4 py-2 bg-red-600 text-white rounded text-sm">
        Try again
      </button>
    </div>
  );
}

// Wrap pages with error boundary
<ErrorBoundary FallbackComponent={FinancialErrorFallback} onReset={() => window.location.reload()}>
  <BudgetPage />
</ErrorBoundary>
```

### 11.2 Async Error Handling

```typescript
function useAsyncData<T>(fetcher: () => Promise<T>) {
  const [state, setState] = useState<ApiResponse<T>>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    fetcher()
      .then((data) => {
        if (!cancelled) setState({ status: 'success', data });
      })
      .catch((error) => {
        if (!cancelled) setState({ status: 'error', error: error.message });
      });
    return () => {
      cancelled = true;
    };
  }, [fetcher]);

  return state;
}
```

---

## 12. Performance Monitoring

### 12.1 Web Vitals Reporting

```typescript
import { onLCP, onFID, onCLS, onFCP, onTTFB } from 'web-vitals';

function reportMetric(metric: { name: string; value: number; rating: string }) {
  console.log(`[Web Vitals] ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`);
  // Send to analytics in production
  if (import.meta.env.PROD) {
    fetch('/api/metrics', {
      method: 'POST',
      body: JSON.stringify(metric),
      keepalive: true,
    });
  }
}

onLCP(reportMetric); // Largest Contentful Paint
onFID(reportMetric); // First Input Delay
onCLS(reportMetric); // Cumulative Layout Shift
onFCP(reportMetric); // First Contentful Paint
onTTFB(reportMetric); // Time to First Byte
```

### 12.2 Bundle Analysis

```bash
# Install
npm i -D rollup-plugin-visualizer

# vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    visualizer({
      open: true,
      filename: 'bundle-analysis.html',
      gzipSize: true,
    }),
  ],
});
```

---

## 13. Financial Modeling Best Practices

### 13.1 Variance Decomposition

```typescript
// Rate-Volume-Mix variance analysis
function calcRateVolumeMix(
  budgetRate: number,
  budgetVol: number,
  actualRate: number,
  actualVol: number
) {
  const rateVariance = (actualRate - budgetRate) * budgetVol;
  const volumeVariance = (actualVol - budgetVol) * budgetRate;
  const mixVariance = (actualRate - budgetRate) * (actualVol - budgetVol);
  return {
    rateVariance,
    volumeVariance,
    mixVariance,
    total: rateVariance + volumeVariance + mixVariance,
  };
}
```

### 13.2 Driver-Based Planning

```typescript
interface Driver {
  name: string;
  baseValue: number;
  growthRate: number;
  seasonality: number[]; // 12 monthly factors
}

function projectFromDrivers(drivers: Driver[], periods: number): number[] {
  return Array.from({ length: periods }, (_, i) => {
    const month = i % 12;
    return drivers.reduce((total, driver) => {
      const growth = driver.baseValue * Math.pow(1 + driver.growthRate, i);
      return total + growth * driver.seasonality[month];
    }, 0);
  });
}
```

### 13.3 Consolidation Elimination

```typescript
interface IntercompanyTransaction {
  sellerId: string;
  buyerId: string;
  amount: number;
  type: 'revenue' | 'expense';
}

function eliminateIntercompany(
  entities: Entity[],
  transactions: IntercompanyTransaction[]
): Entity[] {
  const adjustments = new Map<string, number>();

  for (const tx of transactions) {
    // Seller: reduce revenue
    adjustments.set(tx.sellerId, (adjustments.get(tx.sellerId) ?? 0) - tx.amount);
    // Buyer: reduce expense
    adjustments.set(tx.buyerId, (adjustments.get(tx.buyerId) ?? 0) + tx.amount);
  }

  return entities.map((e) => ({
    ...e,
    revenue: e.revenue + (adjustments.get(e.id) ?? 0),
  }));
}
```

---

## 14. MSW (Mock Service Worker) for Testing

```typescript
// src/test/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/budgets', () => {
    return HttpResponse.json([
      { id: '1', name: 'FY2026 Budget', status: 'draft', amount: 1000000 },
      { id: '2', name: 'FY2025 Budget', status: 'approved', amount: 950000 },
    ]);
  }),

  http.post('/api/budgets', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: '3', ...body, status: 'draft' }, { status: 201 });
  }),

  http.get('/api/budgets/:id', ({ params }) => {
    return HttpResponse.json({ id: params.id, name: 'Test Budget', status: 'draft' });
  }),
];

// src/test/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';
export const server = setupServer(...handlers);

// vitest setup
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

## 15. React Keyboard Navigation

```typescript
// Grid keyboard navigation
function useGridKeyboard(rows: number, cols: number) {
  const [focus, setFocus] = useState({ row: 0, col: 0 });

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          setFocus((f) => ({ ...f, row: Math.max(0, f.row - 1) }));
          break;
        case 'ArrowDown':
          setFocus((f) => ({ ...f, row: Math.min(rows - 1, f.row + 1) }));
          break;
        case 'ArrowLeft':
          setFocus((f) => ({ ...f, col: Math.max(0, f.col - 1) }));
          break;
        case 'ArrowRight':
          setFocus((f) => ({ ...f, col: Math.min(cols - 1, f.col + 1) }));
          break;
        case 'Tab':
          e.preventDefault();
          setFocus((f) => ({
            row: f.col === cols - 1 ? Math.min(rows - 1, f.row + 1) : f.row,
            col: f.col === cols - 1 ? 0 : f.col + 1,
          }));
          break;
        case 'Enter':
          /* activate cell */ break;
        case 'Escape':
          /* deactivate cell */ break;
      }
    },
    [rows, cols]
  );

  return { focus, handleKeyDown };
}
```

---

## Summary — 15 Categories Covered

| #   | Category               | Patterns                                            | Priority |
| --- | ---------------------- | --------------------------------------------------- | -------- |
| 1   | AG Grid Financial      | Cell renderers, tree data, pivot, performance       | HIGH     |
| 2   | Zustand Middleware     | Canonical stack, undo/redo, cross-store, devtools   | HIGH     |
| 3   | Tauri Desktop          | IPC, native menu, system tray, auto-save            | HIGH     |
| 4   | React Financial UI     | Currency input, fiscal picker, skeleton, abbrev     | HIGH     |
| 5   | Vitest Testing         | Store, engine, component, edge cases                | HIGH     |
| 6   | Recharts Financial     | Waterfall, variance, sparkline, multi-axis          | MEDIUM   |
| 7   | OWASP Security         | CSP, XSS prevention, JWT tokens                     | HIGH     |
| 8   | Offline-First          | Service worker, IndexedDB, conflict resolution      | MEDIUM   |
| 9   | TypeScript Advanced    | Branded types, discriminated unions, generics       | MEDIUM   |
| 10  | Tailwind Financial     | Dense tables, KPI cards, variance badges            | MEDIUM   |
| 11  | Error Boundaries       | Financial fallback, async errors                    | HIGH     |
| 12  | Performance Monitoring | Web Vitals, bundle analysis                         | MEDIUM   |
| 13  | Financial Modeling     | Variance decomposition, driver-based, consolidation | HIGH     |
| 14  | MSW Testing            | API mocking, handlers, server setup                 | MEDIUM   |
| 15  | Keyboard Navigation    | Grid nav, tab order, focus management               | MEDIUM   |

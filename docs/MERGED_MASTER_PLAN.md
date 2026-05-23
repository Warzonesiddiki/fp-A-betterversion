# 🏆 FINPLAN PRO — THE ULTIMATE FP&A PLATFORM
## Merged Master Plan: Vision × Engineering

> **Mission:** Surpass Anaplan, Workday Adaptive, OneStream, Planful, Pigment, Prophix, Vena, Jirav, Cube, and Drivetrain in every non-AI capability. Unified, offline-first, free, single-file, Excel-grade, covering every FP&A domain.
>
> **Architecture:** React 19 + Zustand 5 (UI layer) × Tauri v2 + SQLite (persistence) × CubeEngine (multi-dimensional data model) × FormulaEngine (300+ functions)
>
> **Target:** 69/69 standard features + 6 unique features + 300+ formulas + 20+ chart types + 100+ reports + 10M cell capacity

---

## PART 1: VISION SYNTHESIS — BEST OF BOTH

### My Plan's Strengths (Engineering Reality)
| Strength | Why It Matters |
|----------|----------------|
| Test-first approach with fix roadmap | Actually achievable in 4 weeks |
| Existing codebase pattern-matching | Builds on working code (Zustand, AG Grid, Recharts) |
| Concrete store/engine interfaces | No ambiguity in implementation |
| Page-wiring map | Every page accounted for |
| Known failing tests with root causes | Fastest path to green builds |
| Web worker strategy | Large dataset handling proof-of-concept |
| Performance baselines | Measurable targets |

### Your Vision's Strengths (Architectural Superiority)
| Strength | Why It Matters |
|----------|----------------|
| Multi-dimensional data model (cube) | True OLAP — not just flat stores |
| Unlimited custom dimensions | Competitors cap at 7-15 dimensions |
| 300+ Excel-compatible formulas | Power users demand Excel parity |
| Single .fpa file format | Portable, shareable, backup-friendly |
| Virtual scrolling grid (1M+ rows) | Enterprise datasets without lag |
| Full consolidation workflow step-by-step | Compliance-grade close process |
| Report designer with drag-drop | Empower non-technical users |
| ETL pipeline builder | Self-service data integration |
| Snapshot/compare/audit trail | Complete data governance |
| Performance SLAs (50ms cell edit) | Feels native, not web |

### Architecture Decision

```
HYBRID LAYERED ARCHITECTURE:

┌─────────────────────────────────────────────────────┐
│                   LAYER 6: UI                       │
│   React 19 + AG Grid (spreadsheet) + Recharts       │
│   Pages · Components · Dashboards · Reports          │
│   Existing code adapted to consume from cube         │
├─────────────────────────────────────────────────────┤
│                   LAYER 5: STATE                     │
│   Zustand 5 stores (lightweight cache layer)         │
│   32 stores: 14 existing + 18 new                    │
│   Each store reads from cube, caches for UI speed    │
├─────────────────────────────────────────────────────┤
│                   LAYER 4: ENGINES                    │
│   24 existing + 15 new = 39 total engines            │
│   Pure TypeScript, deterministic, testable            │
│   Planning · Consolidation · Reporting · Industry     │
├─────────────────────────────────────────────────────┤
│                   LAYER 3: FORMULA ENGINE             │
│   300+ Excel-compatible functions                    │
│   Recursive descent parser + dependency graph         │
│   Incremental recalculation (dirty cells only)        │
│   Multi-threaded via Web Workers                      │
├─────────────────────────────────────────────────────┤
│                   LAYER 2: CUBE ENGINE (NEW)          │
│   Multi-dimensional in-memory data model              │
│   Unlimited dimensions + hierarchies + attributes     │
│   Sparse columnar storage + compressed               │
│   DECIMAL(28,8) precision — no floating point         │
│   Versioned cells + snapshot management               │
├─────────────────────────────────────────────────────┤
│                   LAYER 1: PERSISTENCE                │
│   Tauri v2 + SQLite (single .fpa file)               │
│   AES-256 encryption option                          │
│   Auto-save + crash recovery                         │
│   SQLite FTS5 for full-text search                   │
└─────────────────────────────────────────────────────┘
```

---

## PART 2: COMPLETE MODULE MAP (YOUR VISION → EXISTING CODE)

### How each Module maps to existing code

| Module # | Your Module | Status | Implementation Strategy |
|:--------:|-------------|:------:|------------------------|
| M1 | Data Model Engine | 🔴 NEW | Build CubeEngine — new TypeScript engine, SQLite-backed |
| M2 | Spreadsheet Engine | 🟡 EXTEND | Enhance AG Grid + expand FormulaEngine to 300+ functions |
| M3 | Chart of Accounts | 🟡 EXTEND | Enhance existing ChartOfAccountsPage + glStore |
| M4 | Entity Management | 🔴 NEW | Build entityStore + hierarchy engine |
| M5 | Planning & Budgeting | 🟡 EXTEND | Enhance budgetStore + forecastStore + 8 new planning engines |
| M6 | Forecasting | 🔴 NEW | Build RollingForecastEngine + forecastStore |
| M7 | Financial Reporting | 🟡 EXTEND | Enhance reportStore + build ReportBuilderEngine |
| M8 | Consolidation | 🟢 EXISTING | ConsolidationEngine already exists (needs fixes + enhancements) |
| M9 | Data Import | 🟢 EXISTING | GLUploadPage already works (enhance with ETL pipeline) |
| M10 | Visualization | 🟢 EXISTING | Recharts + AG Grid (enhance with 20+ chart types) |
| M11 | Close Management | 🟡 EXTEND | PeriodCloseEngine exists (add journal entry workflow) |
| M12 | Document Management | 🟢 EXISTING | DocumentEngine exists |
| M13 | UI/UX | 🟡 EXTEND | Enhance existing (command palette, keyboard shortcuts, themes) |
| M14 | File Management | 🔴 NEW | .fpa single-file format via Tauri SQLite |
| M15 | Printing | 🔴 NEW | Build print engine (jsPDF exists, need page setup) |
| M16 | Help System | 🟡 EXTEND | Enhance existing HelpPage |
| M17 | Performance | 🟡 OPTIMIZE | Web workers, virtual scrolling, incremental calc |
| M18 | Installation | 🟢 EXISTING | Tauri build already works |
| M19 | Error Handling | 🟡 EXTEND | Enhance error boundaries + add integrity checks |
| M20 | Differentiators | 🔴 NEW | Snapshot, round-trip, audit trail, templates |
| M21 | Sample Data | 🔴 NEW | Build sample project generator |

### STATUS LEGEND
| Status | Meaning | Count |
|:------:|---------|:-----:|
| 🔴 NEW | Must be built from scratch | 7 |
| 🟡 EXTEND | Enhances existing code significantly | 9 |
| 🟢 EXISTING | Already works, minor enhancements | 5 |
| 🟡 OPTIMIZE | Performance optimization of existing | 1 |

---

## PART 3: CUBE ENGINE — THE CORE (Your M1)

### Why a Cube Engine Instead of Just Zustand Stores

The current architecture uses flat Zustand stores (like `glStore.entries[]`). This doesn't scale to:
- Queries like "revenue by product by region for Q3 2025 vs budget"
- Unlimited custom dimensions
- 10M+ data cells
- Snapshot/versioning/audit at cell level

**The CubeEngine adds an OLAP-style in-memory data model on top of SQLite.**

### Architecture

```
┌────────────────────────────────────────────────────┐
│                  CubeEngine                         │
│                                                     │
│  registerDimension(name, hierarchies, attributes)   │
│  registerCube(name, dimensions[], measures[])       │
│  write(cell: CubeCell) → versioned                  │
│  read(query: CubeQuery) → CubeResult                │
│  aggregate(query) → CubeResult (summed)             │
│  snapshot(name) → freezes all data                  │
│  compare(snapA, snapB) → CubeDiff                   │
│  getAuditTrail(cell) → CellChange[]                 │
│                                                     │
│  Storage: SQLite via Tauri plugin-sql               │
│  Hot cache: In-memory Map<CubeKey, CellValue>       │
│  Sparse: Compressed columnar for empty cells        │
└────────────────────────────────────────────────────┘
```

### Implementation Plan

**File:** `src/engines/CubeEngine.ts` (~800 lines)
**File:** `src/types/cube-types.ts` (~200 lines)

```typescript
// === CUBE TYPES ===

interface DimensionDefinition {
  name: string;
  type: 'system' | 'user';
  hierarchies: HierarchyDefinition[];
  attributes: AttributeDefinition[];
  members: Map<string, DimensionMember>;
}

interface HierarchyDefinition {
  name: string;
  levels: string[];  // e.g., ['region', 'country', 'city']
  effectiveDating: boolean;
}

interface DimensionMember {
  id: string;
  code: string;
  name: string;
  parentId?: string;
  hierarchy: string;
  level: number;
  isLeaf: boolean;
  isActive: boolean;
  attributes: Record<string, string | number | boolean>;
  formulas?: string;
  effectiveStart?: string;
  effectiveEnd?: string;
}

interface CubeDefinition {
  name: string;
  dimensions: string[];  // dimension names
  measures: MeasureDefinition[];
  storage: 'sparse' | 'dense';
}

interface MeasureDefinition {
  name: string;
  dataType: 'numeric' | 'text' | 'date' | 'boolean';
  precision?: number;  // decimal places for numeric
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'none';
  currency?: boolean;
}

interface CubeCell {
  // Dimension keys: { dimensionName: memberId }
  coords: Record<string, string>;
  measure: string;
  value: number | string | Date | boolean;
  dataType: 'input' | 'calculated' | 'consolidated' | 'linked' | 'imported';
  comment?: string;
  attachment?: string;  // file path
}

interface CubeQuery {
  cube: string;
  rows: string[];        // dimension names to place on rows
  columns: string[];     // dimension names to place on columns
  filters: QueryFilter[];
  measures: string[];
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  includeSubtotals?: boolean;
  includeGrandTotal?: boolean;
}

interface QueryFilter {
  dimension: string;
  memberIds: string[];
  includeChildren?: boolean;
}

interface CubeResult {
  headers: { dimension: string; members: string[] }[];
  rows: { label: string; values: (number | string | null)[]; isTotal: boolean }[];
  grandTotal?: (number | string | null)[];
}

interface CellAddress {
  cube: string;
  coords: Record<string, string>;
  measure: string;
}

interface CellHistoryEntry {
  timestamp: string;
  oldValue: number | string | Date | boolean | null;
  newValue: number | string | Date | boolean;
  dataType: 'input' | 'calculated' | 'imported';
  reason?: string;
}

interface Snapshot {
  id: string;
  name: string;
  createdAt: string;
  description?: string;
}

interface CubeDiff {
  changed: { address: CellAddress; oldValue: any; newValue: any }[];
  added: CellAddress[];
  removed: CellAddress[];
  summary: { accountsChanged: number; entitiesChanged: number; totalCellsChanged: number };
}
```

**System Dimensions (always exist):**
- `Account` — chart of accounts with hierarchies (reporting, tax)
- `Entity` — legal entities, departments, cost centers
- `Time` — year → quarter → month → week → day
- `Scenario` — Actual, Budget, Forecast, WhatIf1, WhatIf2, ...
- `Currency` — reporting currency, local currencies
- `Version` — Draft, Submitted, Approved, Locked
- `DataSource` — Manual, Import-Batch-X, Calculated

**User Can Add Dimensions At Any Time:**
- Product, Customer, Channel, Geography, Project, Cost Center, Employee, Vendor, ...

**SQLite Schema (auto-generated on first use):**
```sql
-- Dimensions table (metadata)
CREATE TABLE dimensions (
  name TEXT PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'user',
  created_at TEXT NOT NULL
);

-- Dimension members
CREATE TABLE dimension_members (
  id TEXT PRIMARY KEY,
  dimension TEXT NOT NULL REFERENCES dimensions(name),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  parent_id TEXT,
  hierarchy TEXT NOT NULL DEFAULT 'default',
  level INTEGER NOT NULL DEFAULT 0,
  is_leaf INTEGER NOT NULL DEFAULT 1,
  is_active INTEGER NOT NULL DEFAULT 1,
  attributes TEXT, -- JSON
  formula TEXT,
  effective_start TEXT,
  effective_end TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Cubes metadata
CREATE TABLE cubes (
  name TEXT PRIMARY KEY,
  config TEXT NOT NULL -- JSON with dimensions, measures, storage config
);

-- Data cells (sparse storage — only stores non-empty cells)
CREATE TABLE data_cells (
  id TEXT PRIMARY KEY,
  cube TEXT NOT NULL REFERENCES cubes(name),
  coords TEXT NOT NULL, -- JSON: {dimension: memberId, ...}
  measure TEXT NOT NULL,
  value_numeric REAL,
  value_text TEXT,
  value_date TEXT,
  value_boolean INTEGER,
  data_type TEXT NOT NULL DEFAULT 'input',
  comment TEXT,
  attachment TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

-- Cell version history (audit trail)
CREATE TABLE cell_history (
  id TEXT PRIMARY KEY,
  cell_id TEXT NOT NULL REFERENCES data_cells(id),
  old_value_numeric REAL,
  old_value_text TEXT,
  old_value_date TEXT,
  old_value_boolean INTEGER,
  new_value_numeric REAL,
  new_value_text TEXT,
  new_value_date TEXT,
  new_value_boolean INTEGER,
  data_type TEXT NOT NULL,
  reason TEXT,
  timestamp TEXT NOT NULL
);

-- Snapshots
CREATE TABLE snapshots (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL
);

-- Snapshot cell values (frozen copy at snapshot time)
CREATE TABLE snapshot_cells (
  snapshot_id TEXT NOT NULL REFERENCES snapshots(id),
  cell_id TEXT NOT NULL,
  value_numeric REAL,
  value_text TEXT,
  value_date TEXT,
  value_boolean INTEGER,
  data_type TEXT,
  PRIMARY KEY (snapshot_id, cell_id)
);
```

---

## PART 4: FORMULA ENGINE — 300+ FUNCTIONS (Your M2 + My A7)

### Current State: 5 functions (SUM, IF, COUNT, NPV, CAGR)
### Target: 300+ functions across 11 categories

### Architecture

```
┌─────────────────────────────────────────────────────┐
│                   FormulaEngine v2                    │
│                                                       │
│  Tokenizer → Recursive Descent Parser → AST          │
│       ↓                                               │
│  Function Registry (300+ entries)                    │
│       ↓                                               │
│  Evaluator (visitor pattern on AST)                  │
│       ↓                                               │
│  Dependency Graph (precedents + dependents)           │
│       ↓                                               │
│  Incremental Recalculation (dirty cells only)         │
│       ↓                                               │
│  Multi-threaded via Web Worker pool                   │
└─────────────────────────────────────────────────────┘
```

### Function Registry — 11 Categories

**File:** `src/engines/FormulaEngine/` (directory, not single file)

```
src/engines/FormulaEngine/
├── index.ts                    # exports FormulaEngine class
├── tokenizer.ts                # Lexer: string → Token[]
├── parser.ts                   # Recursive descent: Token[] → AST
├── ast-types.ts                # AST node definitions
├── evaluator.ts                # Visitor: AST → value
├── dependency-graph.ts         # Precedent/dependent tracking
├── functions/
│   ├── index.ts                # Function registry
│   ├── math.ts                 # 50+ math & trig functions
│   ├── logical.ts              # 15 logical functions
│   ├── lookup.ts               # 20 lookup & reference functions
│   ├── text.ts                 # 30 text functions
│   ├── date-time.ts            # 30 date & time functions
│   ├── statistical.ts          # 40 statistical functions
│   ├── financial.ts            # 25 financial functions
│   ├── info.ts                 # 15 information functions
│   ├── engineering.ts          # 15 engineering functions
│   ├── web.ts                  # (stub — offline, no web calls)
│   └── fpa.ts                  # 15 FP&A-specific custom functions
├── workers/
│   ├── calc-worker.ts          # Web Worker for parallel calc
│   └── pool.ts                 # Worker pool manager
└── FormulaEngine.test.ts       # 500+ tests
```

### Category 1: Math & Trig (50+ functions)
```
SUM, SUMIF, SUMIFS, SUMPRODUCT, SUBTOTAL,
ABS, ROUND, ROUNDUP, ROUNDDOWN, CEILING, FLOOR,
MOD, POWER, SQRT, INT, TRUNC,
MIN, MAX, AVERAGE, AVERAGEIF, AVERAGEIFS,
COUNT, COUNTA, COUNTIF, COUNTIFS,
RAND, RANDBETWEEN,
PI, SIN, COS, TAN, ASIN, ACOS, ATAN, ATAN2,
LOG, LOG10, EXP, LN, LCM, GCD,
COMBIN, PERMUT, FACT,
SIGN, EVEN, ODD, QUOTIENT, PRODUCT,
MROUND, FLOOR.MATH, CEILING.MATH,
ISO.CEILING, AGGREGATE
```

### Category 2: Logical (15 functions)
```
IF, IFS, AND, OR, NOT, XOR,
TRUE, FALSE, IFERROR, IFNA,
SWITCH, LET,
ISBLANK, ISLOGICAL, ISTEXT
```

### Category 3: Lookup & Reference (20 functions)
```
VLOOKUP, HLOOKUP, INDEX, MATCH, XLOOKUP,
OFFSET, INDIRECT, CHOOSE,
ADDRESS, ROW, COLUMN, ROWS, COLUMNS,
AREAS, TRANSPOSE, HYPERLINK,
FORMULATEXT, CELL, TYPE, NA,
GETPIVOTDATA, RTD
```

### Category 4: Text (30 functions)
```
LEFT, RIGHT, MID, LEN,
FIND, SEARCH, SUBSTITUTE, REPLACE,
UPPER, LOWER, PROPER, TRIM, CLEAN,
CONCATENATE, CONCAT, TEXTJOIN,
TEXT, VALUE, NUMBERVALUE,
DOLLAR, FIXED, REPT,
EXACT, CHAR, CODE,
T, N, BAHTTEXT,
UNICHAR, UNICODE
```

### Category 5: Date & Time (30 functions)
```
TODAY, NOW,
DATE, TIME,
YEAR, MONTH, DAY,
HOUR, MINUTE, SECOND,
DATEVALUE, TIMEVALUE,
EOMONTH, EDATE,
WORKDAY, WORKDAY.INTL,
NETWORKDAYS, NETWORKDAYS.INTL,
DATEDIF, DAYS, DAYS360,
WEEKDAY, WEEKNUM, ISOWEEKNUM,
MONTH, YEARFRAC,
TIMEZONE.OFFSET,
ISOWEEKNUM, QUARTER (custom)
```

### Category 6: Statistical (40 functions)
```
AVERAGEA, AVERAGE.WEIGHTED (custom),
COUNTBLANK, MAXA, MINA,
GEOMEAN, HARMEAN, TRIMMEAN,
AVEDEV, DEVSQ,
FISHER, FISHERINV,
PEARSON, RSQ, SLOPE, INTERCEPT,
FORECAST, FORECAST.ETS, TREND, GROWTH,
LINEST, LOGEST, STEYX,
CORREL, COVARIANCE.P, COVARIANCE.S,
NORM.DIST, NORM.INV, NORM.S.DIST, NORM.S.INV,
T.DIST, T.DIST.2T, T.DIST.RT, T.INV, T.INV.2T,
F.DIST, F.DIST.RT, F.INV, F.INV.RT,
BINOM.DIST, POISSON.DIST,
CHISQ.DIST, CHISQ.DIST.RT, CHISQ.INV, CHISQ.INV.RT,
EXPON.DIST, LOGNORM.DIST, WEIBULL.DIST, CONFIDENCE,
PERCENTILE, PERCENTILE.INC, PERCENTILE.EXC,
PERCENTRANK, PERCENTRANK.INC, PERCENTRANK.EXC,
MEDIAN, MODE, MODE.SNGL, MODE.MULT,
STDEV, STDEV.S, STDEV.P, STDEVA, STDEVPA,
VAR, VAR.S, VAR.P, VARA, VARPA,
LARGE, SMALL, RANK, RANK.AVG, RANK.EQ
```

### Category 7: Financial (25 functions)
```
NPV, IRR, XIRR, MIRR,
PMT, PPMT, IPMT,
FV, PV, RATE, NPER,
CUMIPMT, CUMPRINC,
EFFECT, NOMINAL,
SLN, SYD, DB, DDB, VDB,
CAGR (custom),
YIELD, PRICE, DISC,
DOLLARDE, DOLLARFR
```

### Category 8: Information (15 functions)
```
ISBLANK, ISERR, ISERROR, ISEVEN,
ISLOGICAL, ISNA, ISNONTEXT, ISNUMBER,
ISODD, ISREF, ISTEXT,
ISFORMULA, N, SHEET, SHEETS,
TYPE, NA, ERROR.TYPE
```

### Category 9: Engineering (15 functions)
```
BIN2DEC, BIN2HEX, BIN2OCT,
DEC2BIN, DEC2HEX, DEC2OCT,
HEX2BIN, HEX2DEC, HEX2OCT,
OCT2BIN, OCT2DEC, OCT2HEX,
CONVERT (unit conversion),
DELTA, GESTEP,
ERF, ERFC
```

### Category 10: FP&A-Specific (15 custom functions)

These are the differentiators — no competitor has these as formula functions.

```typescript
// ALLOCATE(amount, allocationBasis, dimension)
// Distribute amount across dimension members based on weights
ALLOCATE(amount: number, allocationBasis: number[], dimension: string): number[]

// SPREAD(amount, startPeriod, endPeriod, method)
// Spread amount over time range
// method: 'even' | 'front' | 'back' | 'curve' | 'seasonal'
SPREAD(amount: number, startPeriod: number, endPeriod: number, method: string): number[]

// CAGR(startValue, endValue, periods)
CAGR(startValue: number, endValue: number, periods: number): number

// YOY(currentValue, priorValue) → {value, percent}
YOY(currentValue: number, priorValue: number): { value: number; percent: number }

// MOM(currentValue, priorValue) → {value, percent}
MOM(currentValue: number, priorValue: number): { value: number; percent: number }

// YTD(values[], periodIndex) → sum from period 0 to periodIndex
YTD(values: number[], periodIndex: number): number

// QTD(values[], periodIndex) → sum from quarter start to periodIndex
QTD(values: number[], periodIndex: number, periodsPerQuarter: number): number

// ROLLING(values[], windowSize) → rolling sum of last N periods
ROLLING(values: number[], windowSize: number): number[]

// AVERAGE.ROLLING(values[], windowSize) → rolling average
AVERAGE.ROLLING(values: number[], windowSize: number): number[]

// CONVERT.CURRENCY(amount, fromCurrency, toCurrency, rateType, period)
CONVERT_CURRENCY(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rateType: 'closing' | 'average' | 'historical' | 'custom',
  period: string
): number

// ELIMINATE.IC(entityA, entityB, account)
// Returns intercompany elimination amount
ELIMINATE_IC(entityA: string, entityB: string, account: string): number

// TRANSLATE(amount, entity, rateType)
// Translates amount at entity's currency using specified rate type
TRANSLATE(amount: number, entity: string, rateType: string): number

// MINORITY.INTEREST(netIncome, ownershipPercent, noncontrollingPercent)
MINORITY_INTEREST(netIncome: number, ownershipPercent: number): number

// DRIVER.BASED(drivers: DriverValue[], rates: RateValue[])
// Returns driver × rate products
DRIVER_BASED(drivers: number[], rates: number[]): number[]

// RATIO(numerator, denominator, format)
// Returns formatted ratio with divide-by-zero protection
RATIO(numerator: number, denominator: number): number

// BUDGET.VARIANCE(actual, budget) → {amount, percent, isFavorable}
BUDGET_VARIANCE(actual: number, budget: number, isExpense: boolean): {
  amount: number; percent: number; isFavorable: boolean
}
```

### Parser Enhancement

The current tokenizer uses a simple regex. For 300+ functions, we need:

```
Phase 1: Tokenizer (string → Token[])
  - Numbers: 123, 123.456, 1.23E-10
  - Strings: "hello", 'hello', "hello ""world"""
  - Identifiers: A1, $A$1, Sheet1!A1, _MyRange, FUNCTION_NAME
  - Operators: +, -, *, /, ^, %, =, <, >, <=, >=, <>
  - Punctuation: (, ), ,, :, ;, {, }, [, ]
  - Whitespace: skip
  - Comments: // to end of line, /* ... */

Phase 2: Parser (Token[] → AST)
  - Recursive descent with operator precedence
  - Precedence table:
    1. () function calls
    2. ^ exponentiation (right-to-left)
    3. * / % (left-to-right)
    4. + - (left-to-right)
    5. & string concat (left-to-right)
    6. = < > <= >= <> comparison (left-to-right)

Phase 3: AST → Evaluation
  - Visitor pattern
  - Function lookup in registry
  - Range resolution via CubeEngine
  - Cross-sheet/cross-cube references
```

### Incremental Recalculation

```
DependencyGraph:
  - Tracks cell → cell dependencies
  - On cell change:
    1. Mark cell as dirty
    2. BFS through dependents
    3. Only recalculate dirty nodes
    4. Propagate to all dependents
  - Circular reference detection via DFS coloring

Sorting:
  - Topological sort of dependency graph
  - Recalculate in dependency order
  - Parallelize independent branches via Web Workers
```

### FormulaEngine Test Matrix (500+ tests)

| Category | Functions | Tests Per | Total Tests |
|----------|:---------:|:---------:|:-----------:|
| Math & Trig | 50 | 3-5 | 200 |
| Logical | 15 | 3-4 | 50 |
| Lookup & Reference | 20 | 4-5 | 90 |
| Text | 30 | 3-4 | 100 |
| Date & Time | 30 | 4-5 | 130 |
| Statistical | 40 | 3-5 | 160 |
| Financial | 25 | 5-8 | 150 |
| Information | 15 | 2-3 | 35 |
| Engineering | 15 | 3-4 | 50 |
| FP&A custom | 15 | 5-6 | 80 |
| Parser edge cases | — | — | 50 |
| Performance | — | — | 10 |
| **TOTAL** | **300+** | | **~1100** |

---

## PART 5: COMPLETE STORE ROSTER (32 Total)

### Existing 14 Stores — Keep and Enhance
| # | Store | Enhancement |
|:-:|-------|-------------|
| 1 | glStore | Add cube integration (read from cube, write to cube) |
| 2 | budgetStore | Enhance with planning cycle support (M5) |
| 3 | forecastStore | Enhance with rolling forecast (M6) |
| 4 | scenarioStore | Add sensitivity analysis, goal seek (M5.9) |
| 5 | dataStore | Add ETL pipeline support (M9) |
| 6 | authStore | Keep as-is (single user, simplified) |
| 7 | settingsStore | Add theme/UI preferences (M13) |
| 8 | uiStore | Keep as-is |
| 9 | notificationStore | Enhance with notification center (M13.6) |
| 10 | tourStore | Keep as-is (first-run tour M21) |
| 11 | varianceStore | **Wire to VarianceDashboardPage** |
| 12 | reportStore | **Wire to ReportBuilderEngine** |
| 13 | collaborationStore | Keep (single user → simplify to annotations) |
| 14 | analyticsStore | **Wire to AnalyticsPage** |

### 18 New Stores — Build
| Group | # | Store | Engine | Data Source |
|:-----:|:-:|-------|--------|:-----------:|
| **A** | 15 | consolidationStore | ConsolidationEngine | Cube |
| **A** | 16 | currencyStore | MultiCurrencyEngine | Cube |
| **A** | 17 | inventoryStore | InventoryEngine | Cube |
| **A** | 18 | bankingStore | BankingEngine | Cube |
| **A** | 19 | healthcareStore | HealthcareEngine | Cube |
| **A** | 20 | realEstateStore | RealEstateEngine | Cube |
| **A** | 21 | retailStore | RetailEngine | Cube |
| **B** | 22 | revRecStore | RevRecEngine | Cube |
| **B** | 23 | leaseStore | LeaseEngine | Cube |
| **B** | 24 | taxStore | TaxEngine | Cube |
| **B** | 25 | capexStore | CapExEngine | Cube |
| **B** | 26 | cashStore | CashEngine | Cube |
| **B** | 27 | workforceStore | WorkforceEngine | Cube |
| **B** | 28 | saasStore | SaaSMetricsEngine | Cube |
| **B** | 29 | esgStore | ESGEngine | Cube |
| **B** | 30 | periodCloseStore | PeriodCloseEngine | Cube |
| **C** | 31 | cellAuditStore | CellAuditTrailEngine | Cube |
| **C** | 32 | documentStore | DocumentEngine | File system |

---

## PART 6: COMPLETE ENGINE ROSTER (39 Total)

### Existing 24 Engines — Status
| # | Engine | Status | Action |
|:-:|--------|:------:|--------|
| 1 | ConsolidationEngine | 🟡 4 failing tests | Fix + enhance M8 |
| 2 | RevRecEngine | 🟡 2 failing tests | Fix |
| 3 | FormulaEngine | 🟡 5 functions → 300+ | **Massive expansion** |
| 4 | CustomFieldEngine | 🟢 working | Remove eval() |
| 5 | ScenarioEngine | 🟢 working | Enhance M5.9 |
| 6 | COGSVarianceEngine | 🟢 working | — |
| 7 | SaaSMetricsEngine | 🟢 working | — |
| 8 | CapExEngine | 🟢 working | Enhance M5.6 |
| 9 | FiscalCalendar | 🟢 working | Extend for multi-calendar M4.4 |
| 10 | WorkforceEngine | 🟢 working | Enhance M5.5 |
| 11 | VarianceDecompositionEngine | 🟢 working | — |
| 12 | UndoRedoEngine | 🟢 working | Extend to 100+ levels, persist M19 |
| 13 | TaxEngine | 🟢 working | — |
| 14 | PeriodCloseEngine | 🟢 working | Enhance M11 |
| 15 | MultiCurrencyEngine | 🟢 working | Enhance M8.2 |
| 16 | LeaseEngine | 🟢 working | — |
| 17 | ExportEngine | 🟢 working | Enhance with print M15 |
| 18 | ExcelKeyboardEngine | 🟢 working | Keep |
| 19 | ESGEngine | 🟢 working | — |
| 20 | DataLineageEngine | 🟢 working | — |
| 21 | CashEngine | 🟢 working | Enhance M5.8 |
| 22 | BankingEngine | 🟡 mock data | Remove mocks, wire to cube |
| 23 | HealthcareEngine | 🟡 mock data | Remove mocks, wire to cube |
| 24 | InventoryEngine | 🟢 working | — |
| — | RealEstateEngine | 🟡 mock data | Remove mocks, wire to cube |
| — | RetailEngine | 🟡 mock data | Remove mocks, wire to cube |

### 15 New Engines — Build
| # | Engine | Module | Purpose |
|:-:|--------|:------:|---------|
| 25 | **CubeEngine** | M1 | Multi-dimensional data model (FOUNDATION) |
| 26 | **RollingForecastEngine** | M6 | Auto-extending forecasts |
| 27 | **DriverBasedPlanningEngine** | M5 | Driver tree → financial outcomes |
| 28 | **ThreeStatementEngine** | M5 | Integrated P&L/BS/CF |
| 29 | **BreakbackEngine** | M5 | Top-down target allocation |
| 30 | **ZeroBasedBudgetEngine** | M5 | Cost pool scoring/prioritization |
| 31 | **ProfitabilityEngine** | M7.2 | Multi-dimensional margin |
| 32 | **SensitivityEngine** | M5.9 | Tornado/1-way/2-way/Monte Carlo |
| 33 | **LongRangePlanningEngine** | M5 | 3-5 year strategic model |
| 34 | **TopDownBottomUpEngine** | M5 | Multi-pass reconciliation |
| 35 | **InsuranceEngine** | — | Premium, loss reserving |
| 36 | **NonprofitEngine** | — | Fund accounting, grants |
| 37 | **EducationEngine** | — | Enrollment, tuition, endowments |
| 38 | **GovernmentEngine** | — | Fund budgeting, appropriations |
| 39 | **HubEngine** (unified dispatch) | — | Routes all engine calls |

---

## PART 7: 8-PHASE EXECUTION ROADMAP

### PHASE 0: FOUNDATION (Days 1-5)
**Goal:** Green build + CubeEngine operational

| Day | Tasks |
|:---:|-------|
| 1 | Fix 11 failing tests (glStore, useFirstRun, RevRecEngine, ConsolidationEngine) |
| 1 | Fix broken types (GLState, AnalyticsState, ScenarioEngine) |
| 1 | Secure CustomFieldEngine (remove eval()) |
| 2-3 | **Build CubeEngine** — dimension system, cube CRUD, SQLite persistence |
| 3 | Build cube types (`src/types/cube-types.ts`) |
| 4 | Build system dimensions (Account, Entity, Time, Scenario, Currency) |
| 4 | Implement sparse storage + in-memory cache |
| 5 | Write CubeEngine tests (50+ tests) |
| 5 | Integrate cube with existing glStore (read/write through cube) |
| **Gate** | **`npx vitest run` — 719 tests passing, 0 failures** |

### PHASE 1: FORMULA ENGINE V2 (Days 6-12)
**Goal:** 300+ Excel-compatible functions

| Day | Tasks |
|:---:|-------|
| 6 | Rewrite tokenizer (handle all Excel token types) |
| 6 | Rewrite parser (full operator precedence, all AST node types) |
| 7 | Build function registry pattern + evaluator |
| 7 | Implement Math & Trig (50 functions) + tests |
| 8 | Implement Logical (15) + Lookup & Reference (20) + tests |
| 8 | Implement Text (30) + Date & Time (30) + tests |
| 9 | Implement Statistical (40) + tests |
| 10 | Implement Financial (25) + tests |
| 10 | Implement Information (15) + Engineering (15) + tests |
| 11 | **Implement FP&A-specific (15)** — ALLOCATE, SPREAD, CAGR, etc. |
| 11 | Build dependency graph + incremental recalculation |
| 12 | Build Web Worker pool for parallel calc |
| 12 | Write 500+ total FormulaEngine tests |
| **Gate** | **FormulaEngine: 300+ functions, 500+ tests passing** |

### PHASE 2: CORE FP&A MODULES (Days 13-20)
**Goal:** Full planning, budgeting, forecasting

| Day | Tasks |
|:---:|-------|
| 13 | **Chart of Accounts** — full hierarchy, bulk operations (M3) |
| 13 | **Entity Management** — entityStore, hierarchies, multi-calendar (M4) |
| 14 | **Planning Cycles** — cycle management, templates, status workflow (M5.1-2) |
| 15 | **Data Entry** — spread functions, copy forward, driver-based (M5.3) |
| 15 | **Scenario Modeling** — compare, merge, sensitivity, goal seek (M5.9) |
| 16 | **Revenue Planning** — top-down, bottom-up, pipeline, pricing (M5.4) |
| 17 | **Headcount Planning** — employee-level, comp, benefits, burden (M5.5) |
| 17 | **CapEx Planning** — asset-level, depreciation, NBV (M5.6) |
| 18 | **OpEx Planning** — categories, vendor modeling, allocations (M5.7) |
| 18 | **Working Capital** — DSO/DIO/DPO, cash conversion cycle (M5.8) |
| 19 | **Rolling Forecast** — 7 methods, accuracy tracking, auto-extend (M6) |
| 20 | **Build 9 planning engines** + tests (RollingForecast, DriverBased, ThreeStatement, Breakback, ZBB, Profitability, Sensitivity, LongRange, TopDownBottomUp) |
| **Gate** | **All planning modules working, 9 new engines tested** |

### PHASE 3: CONSOLIDATION + CLOSE (Days 21-25)
**Goal:** Full multi-entity consolidation

| Day | Tasks |
|:---:|-------|
| 21 | **Consolidation Enhance** — fix failing tests, add multi-hierarchy, step workflow (M8.1/8.5) |
| 22 | **Currency Translation** — rate table, current rate, temporal, CTA (M8.2) |
| 22 | **IC Eliminations** — matching, auto-elimination, audit trail (M8.3) |
| 23 | **Consolidation Adjustments** — journals, fair value, goodwill (M8.4) |
| 23 | **Minority Interest + Equity Method** (M8.5) |
| 24 | **Segment Reporting** — IFRS 8 / ASC 280 (M8.6) |
| 24 | **Close Calendar + Tasks + Checklists** (M11) |
| 25 | **Journal Entry Workflow** — draft→submit→approve→post, recurring, reversing (M11.4) |
| **Gate** | **End-to-end consolidation: 5 entities, 3 currencies, IC eliminations** |

### PHASE 4: REPORTING + DASHBOARDS (Days 26-30)
**Goal:** Professional financial reports and dashboards

| Day | Tasks |
|:---:|-------|
| 26 | **Build 18 new stores** (Group A: 7 GL-driven) |
| 27 | **Build Group B stores** (9 structured) + Group C (2 utility) |
| 28 | **P&L, BS, CF reports** — configurable structure, multi-period, comparisons (M7.1) |
| 28 | **Variance Analysis + Bridge/Waterfall Reports** (M7.2.1-2) |
| 29 | **Report Designer** — drag-drop builder, table/chart/text components (M7.3) |
| 29 | **Narrative Reporting** — rich text, merge fields, board book (M7.4) |
| 30 | **Dashboard Builder** — 20+ chart types, KPI cards, filters, templates (M10) |
| 30 | **Pre-built dashboards** — Executive, Revenue, Expense, Cash Flow, Headcount (M10.4) |
| **Gate** | **All 32 stores built, report designer working, 10 pre-built dashboards** |

### PHASE 5: DATA + FILE MANAGEMENT (Days 31-34)
**Goal:** Data import/export, ETL, file operations

| Day | Tasks |
|:---:|-------|
| 31 | **Data Import** — Excel/CSV/JSON/XML, column mapping, templates (M9.1-2) |
| 32 | **ETL Pipeline Builder** — visual pipeline, filter/map/aggregate/join (M9.5) |
| 32 | **ERP Import Templates** — SAP, Oracle, NetSuite, QuickBooks (M9.3) |
| 33 | **Export** — Excel, PDF, CSV, JSON with full formatting (M9.4) |
| 33 | **Single .fpa File Format** — SQLite-backed, AES-256, auto-save, recovery (M14) |
| 34 | **Print Engine** — page setup, headers/footers, print preview, PDF (M15) |
| 34 | **Backup + Restore** — manual + auto-backup (M19.4) |
| **Gate** | **Import 100K rows in <5s, export to Excel preserves formatting** |

### PHASE 6: PAGES WIRING (Days 35-40)
**Goal:** Zero stub pages — every page fully interactive

| Day | Tasks |
|:---:|-------|
| 35 | Wire Group A store pages (7 domains: consolidation, currency, inventory, banking, healthcare, real estate, retail) |
| 36 | Wire Group B store pages (9 domains: revRec, lease, tax, capex, cash, workforce, saas, esg, periodClose) |
| 37 | Wire Group C pages (cellAudit, document) + unused stores (variance, report, collaboration, analytics) |
| 38 | Replace mock-data pages (18 Category E pages → real cube data) |
| 39 | Wire energy pages + remaining category B/C pages |
| 40 | Add missing routes + verify all 100+ pages render correctly |
| **Gate** | **Zero stub pages, every page shows real data from cube** |

### PHASE 7: POLISH + DIFFERENTIATION (Days 41-46)
**Goal:** Production-ready quality with unique features

| Day | Tasks |
|:---:|-------|
| 41 | **Excel Round-Trip** — export to Excel, edit, import back (M20.1) |
| 41 | **Snapshot + Compare** — named snapshots, diff reporting (M20.2) |
| 42 | **Complete Audit Trail** — every change logged, filterable viewer (M20.3) |
| 42 | **Template Library** — 20+ industry templates (SaaS, Manufacturing, Retail, Healthcare, etc.) |
| 43 | **Data Annotations** — flag cells, add notes, annotation reports (M20.6) |
| 43 | **Multi-Window** — multiple views of same project (M20.7) |
| 44 | **Sample Project** — 3 years data, 5 entities, multi-currency, SCENARIO (M21) |
| 44 | **Help System** — formula reference, context-sensitive F1, search (M16) |
| 45 | **Performance Optimization** — virtualized rendering, lazy loading, worker pool tuning (M17) |
| 45 | **UI/UX Polish** — command palette, keyboard shortcuts, themes, accessibility (M13) |
| 46 | **Final Test Pass** — all tests green, performance benchmarks met |
| 46 | **Installation Packaging** — MSI/EXE installer, system requirements verified (M18) |
| **Gate** | **All 69 features complete, 0 failing tests, performance SLAs met** |

### PHASE 8: AI (Future — After All Non-AI Complete)
**Not in scope for this plan. See docs/MASTER_PLAN.md §7 for details.**

---

## PART 8: PERFORMANCE SLAs

| Operation | Target | Measurement |
|-----------|:------:|:-----------:|
| App startup | < 3s | Cold start, 10MB project |
| Open project (10MB) | < 2s | SQLite load |
| Open project (100MB) | < 5s | SQLite + memory map |
| Cell edit response | < 50ms | Single cell |
| Formula recalc (100K cells) | < 2s | 300 formulas, no I/O |
| Formula recalc (1M cells) | < 10s | Incremental, dirty-only |
| Report render | < 2s | P&L, 5 years monthly |
| Dashboard render | < 3s | 10 components, 5 charts |
| Data import (100K rows) | < 5s | CSV |
| Data import (1M rows) | < 30s | CSV, batched |
| Consolidation (50 entities) | < 30s | 3 currencies, IC, minority |
| PDF export (50 pages) | < 10s | Full report |
| Excel export (100K rows) | < 5s | xlsx |
| Dimension query | < 100ms | 10K members |
| Cube aggregate | < 200ms | 500K cells → 1 result |
| Snapshot create | < 1s per GB | Full data freeze |
| Snapshot compare | < 2s per GB | Diff two snapshots |

### Techniques to Achieve SLAs
1. **Virtualized rendering** — AG Grid already virtualized, tune row buffer
2. **Incremental recalculation** — dependency graph, only dirty + dependents
3. **Web Worker pool** — 4 workers (one per CPU core), balanced dispatch
4. **Columnar in-memory cache** — CubeEngine hot cache in typed arrays
5. **Lazy loading** — dimensions loaded on first query, cached thereafter
6. **Debounced input** — 50ms debounce on cell edit, batch recalculation
7. **SQLite optimizations** — WAL mode, prepared statements, indexes

---

## PART 9: WHAT WE BUILD AND IN WHAT ORDER

### Priority Summary

| Priority | What | Why This Order |
|:--------:|------|----------------|
| **P0** | Fix 11 failing tests | Must have green build to proceed |
| **P0** | CubeEngine (M1) | Everything depends on the data model |
| **P0** | FormulaEngine v2 (M2) | Core UI interaction, 300+ functions |
| **P1** | Planning modules (M5) | Core FP&A — what users buy the tool for |
| **P1** | Consolidation (M8) | Enterprise requirement |
| **P1** | 18 new stores | State layer for all features |
| **P2** | Reporting + Dashboards (M7, M10) | Visibility into the data |
| **P2** | Chart of Accounts (M3) + Entities (M4) | Foundation for all planning |
| **P2** | Data Import + ETL (M9) | User gets data in |
| **P3** | File format + Print (M14, M15) | Polish for production use |
| **P3** | Page wiring (all 100+) | Zero stubs |
| **P3** | Differentiators (M20) | Excel round-trip, snapshot, audit |
| **P4** | Template library + Sample data (M20, M21) | Learning resources |
| **P4** | Help system (M16) | Documentation |
| **P4** | Performance + Polish (M17, M13) | Final optimization |

### Engineering Verdict: 6-8 Weeks Full Time

| Phase | Days | Deliverables |
|:-----:|:----:|-------------|
| P0: Fix + Cube | 5 | Green build, CubeEngine operational |
| P1: Formula v2 | 7 | 300+ functions, 500+ tests |
| P2: FP&A Core | 8 | All planning modules, 9 new engines |
| P3: Consolidation | 5 | Full close + consolidation workflow |
| P4: Reporting | 5 | 32 stores, report designer, dashboards |
| P5: Data + Files | 4 | ETL, .fpa format, print |
| P6: Pages | 6 | All 100+ pages wired |
| P7: Polish | 6 | Differentiators, samples, performance |
| **Total** | **46** | **Production-ready FP&A platform** |

---

## PART 10: COMPETITIVE COMPARISON (AFTER BUILD)

| Category | Feature Count | FinPlan Pro | Best Competitor |
|:--------:|:-------------:|:-----------:|:---------------:|
| Data Model | Unlimited dimensions | ✅ | 7-15 (Anaplan) |
| Formulas | 300+ Excel functions | ✅ | Limited (all) |
| Spreadsheet | Virtual scroll 1M+ rows | ✅ | AG Grid basic |
| Planning | 10 modules (rev/hc/capex/opex/wc) | ✅ | 4-6 modules |
| Forecasting | Rolling + accuracy tracking | ✅ | Basic (Adaptive) |
| Consolidation | Full workflow + multi-GAAP | ✅ | Full (OneStream) |
| Reporting | Designer + narrative + KPIs | ✅ | Designer (Planful) |
| Dashboards | 20 chart types + builder | ✅ | 10-15 (Pigment) |
| ETL | Visual pipeline builder | ✅ | None (all) |
| Audit Trail | Cell-level with snapshots | ✅ | Basic (all) |
| Excel Round-Trip | Export → edit → import | ✅ | One-way (all) |
| Industry Templates | 20+ bundled | ✅ | 0-5 (all) |
| Offline | Complete | ✅ | None (all) |
| Price | Free | ✅ | $15K-500K/yr |

**Verdict: FinPlan Pro will be the most feature-complete FP&A platform ever built.**

---

*Merged Plan v1.0 — May 16, 2026*
*Sources: docs/MASTER_PLAN.md + User Vision Document (21 Modules)*

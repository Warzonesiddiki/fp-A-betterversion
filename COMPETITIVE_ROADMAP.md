<!-- LEGACY: Superseded by FINPLAN_PROJECT_BLUEPRINT.md + MASTER_PLAN_V2.md (2026-05-24) -->
# FinPlan Pro — Competitive Domination Roadmap

> **Goal**: Outperform 20 FP&A competitors in a single, free, 100% offline app.
> **Constraint**: No AI in the product. Pure calculation + UX excellence.
> **Stack**: React 19 + TypeScript + Zustand + AG Grid + Recharts + Tauri (desktop)

---

## Current State (STRONG)

- **35 engines** — OLAP Cube, Formula, Consolidation (ASC 810/805/830), Scenario (Monte Carlo), Rolling Forecast, Driver Cascade, Workforce, CapEx, Cash, RevRec, Lease, Tax, ESG, 10 sector verticals
- **95 pages** — Full route coverage across all FP&A domains
- **16 stores** — Zustand + Immer with undo/redo
- **4 web workers** — Formula, consolidation, export, scenario offloaded
- **Desktop** — Tauri native app (unique vs ALL competitors)
- **Git-like version control** — Budget branching/merging (unique)
- **10 industry verticals** — SaaS, Manufacturing, Retail, Banking, Healthcare, Energy, Insurance, Real Estate, Construction, ESG

---

## What Competitors Charge $50K-$500K/Year For (FREE in FinPlan Pro)

| Feature | Competitors | FinPlan Pro Target |
|---------|-------------|-------------------|
| Excel-like spreadsheet | Vena, Datarails, Cube | ✅ AG Grid + formula bar + keyboard |
| 300+ formula functions | Anaplan, Pigment, Jedox | ✅ Expand FormulaFunctionRegistry |
| Multi-entity consolidation | All enterprise tools | ✅ Already built (ASC 810) |
| Driver-based planning | Anaplan, Planful, Prophix | ✅ DAG cascade engine |
| Monte Carlo simulation | Pigment, Anaplan, Board | ✅ Scenario engine |
| Rolling forecasts | All tools | ✅ Rolling forecast engine |
| Scenario comparison | Runway, Pigment, Abacum | ⬜ Needs UI enhancement |
| Report builder | All tools | ⬜ Needs drag-drop designer |
| Conditional formatting | All tools | ⬜ Missing |
| Circular references | Anaplan, Jedox, Board | ⬜ Missing |
| Cell comments | Vena, Prophix, Planful | ⬜ Engine exists, needs UI |
| Approval workflows | All tools | ⬜ Needs enhancement |
| Audit trail | All enterprise tools | ✅ Engine exists |
| Offline/desktop | NONE | ✅ Tauri (UNIQUE) |
| Free/open source | NONE | ✅ (UNIQUE) |
| 10 sector verticals | Most have 3-5 | ✅ 10 (BEST-IN-CLASS) |

---

## Implementation Phases

### PHASE 1: Formula Engine Supremacy (300+ functions)
**Goal**: Match Anaplan/Pigment formula library

Add to `FormulaFunctionRegistry.ts`:
- **Lookup**: VLOOKUP, HLOOKUP, INDEX, MATCH, XLOOKUP, OFFSET
- **Math**: SUMPRODUCT, SUMIFS, COUNTIFS, AVERAGEIFS, MINIFS, MAXIFS, ABS, ROUND, ROUNDUP, ROUNDDOWN, MOD, POWER, SQRT, LN, LOG, LOG10, EXP
- **Financial**: IRR, XIRR, NPV, XNPV, PV, FV, PMT, IPMT, PPMT, NPER, RATE, SLN, DB, SYD, DDB, VDB
- **Text**: CONCATENATE, LEFT, RIGHT, MID, LEN, TRIM, UPPER, LOWER, PROPER, SUBSTITUTE, FIND, SEARCH, VALUE, TEXT, REPT
- **Date**: DATE, YEAR, MONTH, DAY, EOMONTH, EDATE, DATEDIF, NETWORKDAYS, WORKDAY, WEEKNUM, ISOWEEKNUM
- **Logical**: IFS, SWITCH, AND, OR, NOT, IFERROR, IFNA, TRUE, FALSE
- **Statistical**: MEDIAN, MODE, PERCENTILE, QUARTILE, STDEV, STDEVP, VAR, VARP, CORREL, FORECAST, TREND, GROWTH, SLOPE, INTERCEPT, RSQ, NORM.DIST, NORM.INV, T.DIST, T.INV, BINOM.DIST, POISSON.DIST
- **Array**: FILTER, SORT, SORTBY, UNIQUE, SEQUENCE, RANDARRAY, TRANSPOSE, MMULT, MDETERM, MINVERSE
- **Dynamic**: LET, LAMBDA, MAP, REDUCE, SCAN, MAKEARRAY, ISOMITTED

### PHASE 2: Spreadsheet UI Perfection
**Goal**: Excel-grade cell editing experience

- Formula bar with autocomplete, function tooltips, cell reference highlighting
- Cell editing with Tab/Enter navigation
- Drag-fill (series, copy, linear growth)
- Copy/paste with formula reference adjustment
- Multi-cell selection (click-drag, Shift+click, Ctrl+click)
- Column/row resize, hide, reorder via drag
- Cell formatting (number, currency, percentage, date, custom)
- Merge/unmerge cells
- Freeze panes (rows + columns)
- Sheet tabs with add/rename/delete/reorder
- Undo/redo integration with UndoRedoEngine
- Context menu (right-click) with cell operations
- Auto-sum shortcut
- Double-click column border to auto-fit

### PHASE 3: Circular Reference & Iterative Calculation
**Goal**: Handle debt schedules, interest calculations

- Iterative calculation engine (max iterations + tolerance settings)
- Circular reference detection with visual warning
- Convergence visualization (show iteration progress)
- Enable/disable per workbook
- Support for: debt schedules, interest-on-interest, working capital loops

### PHASE 4: Conditional Formatting
**Goal**: Traffic lights, data bars, icon sets

- Rules engine: cell value, formula, comparison operators
- Visual types: background color, text color, data bars, icon sets, color scales
- Variance highlighting: favorable (green), unfavorable (red), neutral (yellow)
- Growth rate coloring
- Budget vs actual heat maps
- Custom rule builder UI
- Rule priority ordering

### PHASE 5: Report Builder (Drag & Drop)
**Goal**: Visual report designer matching Planful/Pigment

- Row/column/filter/prompt paradigm
- Drag dimensions to rows/columns
- Add measures/calculations
- Filter by any dimension member
- Period prompts (fiscal year, quarter, month)
- Subtotals and grand totals
- Conditional formatting in reports
- Save/load report templates
- Export to PDF/Excel/CSV
- Report scheduling UI (queue for email when backend available)

### PHASE 6: Drill-Through & Commentary
**Goal**: Multi-level drill + cell-level comments

- Summary → Detail → Journal Entry → Source Document drill chain
- Click any number to drill down
- Breadcrumb trail showing drill path
- Cell-level threaded comments
- @mention support (local user list)
- Comment indicators on cells
- Attach files to cells
- Commentary templates for variance explanations

### PHASE 7: Approval Workflows
**Goal**: Multi-level approval chains

- Workflow designer (sequential, parallel, conditional)
- Approval states: Draft → Submitted → In Review → Approved → Rejected → Locked
- Delegation (approve on behalf of)
- Escalation (auto-escalate after timeout)
- Change request workflow (propose changes for review)
- Bulk approval
- Approval dashboard with queue
- Email notification templates (for future SMTP)

### PHASE 8: Book & Burst Reporting
**Goal**: Generate 100+ entity-specific reports in one batch

- Report book definition (list of reports × entities)
- Variable substitution (entity name, period, currency)
- Parallel generation using web workers
- Progress tracking
- Download as ZIP
- Board pack generation (consolidated PDF)

### PHASE 9: Advanced Dashboard Widgets
**Goal**: Executive-grade KPI visualization

- KPI cards with sparklines, trend arrows, variance badges
- Traffic light indicators
- Gauge charts for targets
- Waterfall charts for bridge analysis
- Tornado charts for sensitivity
- Heatmaps for variance matrices
- Sankey diagrams for flow analysis
- TreeMap for hierarchical data
- Combo charts (bar + line)
- Dashboard templates (CFO, Controller, Analyst views)
- Widget library with drag-drop placement

### PHASE 10: Allocation Rule Builder
**Goal**: Visual allocation rule designer

- Direct, driver-based, step-down, reciprocal methods
- Visual rule builder (source → driver → target)
- Allocation preview (before/after comparison)
- Allocation journal entry generation
- Allocation history and audit trail
- Multi-step allocation chains

### PHASE 11: Intercompany Matching
**Goal**: Automated IC elimination matching

- Auto-detect IC pairs across entities
- Tolerance settings (amount, percentage)
- Matching summary with unmatched items
- Manual matching override
- IC reconciliation report
- Elimination journal entry generation

### PHASE 12: What-If Sandbox Enhancement
**Goal**: Full sandbox matching Runway/Pigment

- Side-by-side scenario comparison (2-4 scenarios)
- Scenario merge (take best-of from multiple scenarios)
- Impact analysis (what changed and by how much)
- Scenario locking (prevent accidental changes)
- Scenario sharing (export/import scenario definitions)
- Scenario timeline view (see changes over time)

### PHASE 13: Excel Keyboard Mastery
**Goal**: Full Excel shortcut parity

- Ctrl+C/V/X with smart paste
- Ctrl+Z/Y for undo/redo
- Ctrl+D/R for fill down/right
- Ctrl+Shift+L for filters
- Ctrl+T for table creation
- Ctrl+~ for formula view
- F2 for cell edit mode
- F4 for absolute reference toggle
- Alt+= for auto-sum
- Ctrl+1 for format cells dialog
- Ctrl+Page Up/Down for sheet navigation
- Custom shortcut configuration

### PHASE 14: Export & Template Library
**Goal**: Professional-grade export quality

- Board pack templates (monthly, quarterly, annual)
- P&L template with variance columns
- Balance sheet template
- Cash flow template
- KPI dashboard template
- Custom template builder
- Logo/branding injection
- Page headers/footers with variables
- Table of contents generation
- PDF bookmarks

### PHASE 15: Performance Optimization
**Goal**: Handle 10M+ cell models

- Virtual scrolling for large grids (already in AG Grid)
- Incremental formula recalculation (only affected cells)
- Lazy loading for off-screen data
- Web worker pooling for parallel computation
- Query result caching (in-memory)
- Sparse cell storage optimization (already in CubeEngine)
- Progressive rendering for dashboards

---

## Competitive Advantages (What NO Competitor Has)

1. **100% Offline** — No server dependency, works in airplane mode
2. **Free & Open Source** — $0 vs $50K-$500K/year
3. **Desktop Native** — Tauri for native performance, system tray, file associations
4. **Git-Like Version Control** — Branch/merge budgets with conflict detection
5. **10 Industry Verticals** — More than any competitor
6. **In-Browser AI** — HuggingFace Transformers (opt-in, not in core product)
7. **No Vendor Lock-In** — Data stays on user's machine
8. **Modern Stack** — React 19, TypeScript 5.9, no legacy dependencies

---

## Success Metrics

- [ ] 300+ formula functions (vs Anaplan's 300+)
- [ ] Excel-grade keyboard shortcuts (100% parity)
- [ ] <100ms formula recalculation for 100K cells
- [ ] <500ms consolidation for 50 entities
- [ ] 95th percentile report generation <5s
- [ ] 100% of competitor features covered
- [ ] Zero crashes on 1M+ cell models

# UI Component Brainstorm — FinPlan Pro

## Current State: 163 Components (14/15 Features Already Exist!)

Most "new" features already exist. Focus should be on ENHANCEMENT, not creation.

---

## Feature Status Matrix

| #   | Feature                    | Status      | File                              | Lines | Priority   |
| --- | -------------------------- | ----------- | --------------------------------- | ----- | ---------- |
| 1   | Command Palette            | EXISTS      | ui/CommandPalette.tsx             | 188   | ENHANCE    |
| 2   | Drag & Drop Dashboard      | EXISTS      | dashboard/DashboardTemplate.tsx   | 301   | ENHANCE    |
| 3   | Split View                 | EXISTS      | ui/SplitPane.tsx                  | 101   | ENHANCE    |
| 4   | Data Grid Pro (Excel-like) | EXISTS      | ui/SpreadsheetGrid.tsx            | 474   | ENHANCE    |
| 5   | Chart Builder              | **MISSING** | —                                 | —     | **BUILD**  |
| 6   | Report Builder             | EXISTS      | reports/ReportBuilder.tsx         | 610   | ENHANCE    |
| 7   | Scenario Comparison        | EXISTS      | ui/ScenarioComparisonGrid.tsx     | 253   | ENHANCE    |
| 8   | Budget Wizard              | EXISTS      | ui/OnboardingWizard.tsx           | —     | ENHANCE    |
| 9   | Formula Bar                | EXISTS      | reports/FormulaBar.tsx            | 334   | ENHANCE    |
| 10  | Cell Comments              | EXISTS      | ui/CellCommentPanel.tsx           | 191   | ENHANCE    |
| 11  | Version History            | EXISTS      | ui/VersionDiffViewer.tsx          | 31    | **EXPAND** |
| 12  | Approval Workflow          | EXISTS      | ui/ApprovalDashboard.tsx          | 106   | ENHANCE    |
| 13  | Data Validation            | EXISTS      | ui/CircularReferenceWarning.tsx   | —     | ENHANCE    |
| 14  | Conditional Formatting     | EXISTS      | ui/ConditionalFormattingPanel.tsx | 774   | ENHANCE    |
| 15  | Print/PDF Preview          | EXISTS      | reports/ExportDialog.tsx          | —     | ENHANCE    |

---

## What Actually Needs Building

### 1. Chart Builder (MISSING — Build This)

**What:** Drag-and-drop interface to create charts from data fields
**Why:** No competitor has this. Users select fields → auto-suggest chart type → customize
**How to beat competitors:**

- AI-suggested chart types based on data shape
- Live preview as fields are dragged
- Save as template for reuse
- Export as PNG/SVG/PDF

**Technical requirements:**

- Drag-and-drop zone for field assignment (x-axis, y-axis, series, filters)
- Chart type selector with smart suggestions
- Recharts integration for rendering
- Template persistence in store

### 2. Version Diff Viewer (31 lines — Needs Expansion)

**What:** Full version history with timeline, not just diff viewing
**Why:** Anaplan has this. Critical for audit compliance.
**How to beat competitors:**

- Visual timeline with branching
- Side-by-side diff with cell-level highlighting
- One-click restore to any version
- Auto-save versions on every change

---

## Enhancement Priorities (Top 10)

### HIGH Priority

1. **Command Palette** — Wire into AppLayout, add fuzzy search, recent commands
2. **SpreadsheetGrid** — Add formula evaluation, cell references, copy-paste from Excel
3. **ConditionalFormatting** — Add more rules (top/bottom %, data bars, icon sets)
4. **ApprovalWorkflow** — Add multi-level approvals, email notifications, SLA tracking
5. **WhatIfSandbox** — Add Monte Carlo simulation, sensitivity analysis sliders

### MEDIUM Priority

6. **ReportBuilder** — Add drag-drop section reordering, live preview
7. **FormulaBar** — Add autocomplete, syntax highlighting, error indicators
8. **DashboardTemplate** — Add widget library, save/load layouts, responsive grid
9. **SplitPane** — Add sync scrolling, compare mode for scenarios
10. **CellComments** — Add @mentions, threading, resolve/unresolve

---

## Features NO Competitor Has (1000x Advantage)

### 1. AI Formula Assistant

- Type "calculate CAGR" → auto-generates `=CAGR(B2, B10, 5)`
- Suggests formulas based on selected cells
- Explains complex formulas in plain English

### 2. Natural Language Queries

- "Show me Q3 revenue by region" → auto-builds chart
- "Compare budget vs actual for marketing" → auto-filters
- Voice input for hands-free analysis

### 3. Real-Time Collaboration Indicators

- See who's viewing which cell (like Google Sheets)
- Cursor presence for multiplayer editing
- Comment threads on specific cells

### 4. Smart Data Validation

- Auto-detect anomalies (outliers, missing data)
- Suggest corrections based on historical patterns
- Inline error indicators with fix suggestions

### 5. Predictive Autofill

- Drag-fill patterns (linear, exponential, seasonal)
- AI-predicted values based on trends
- Confidence intervals on predictions

### 6. One-Click Board Pack

- Select dashboards → auto-generate PDF board pack
- Executive summary auto-written from KPIs
- Customizable templates per board meeting type

### 7. Scenario Replay

- Record scenario creation as video/GIF
- Share with stakeholders who don't have access
- Annotate with voice notes

### 8. Cross-Entity Drill-Down

- Click consolidated number → see entity breakdown
- Currency translation at click time
- Intercompany matching visualization

---

## Top 10 Components to Build for 1000x Advantage

| Rank | Component                | Impact | Effort | Differentiator                             |
| ---- | ------------------------ | ------ | ------ | ------------------------------------------ |
| 1    | Chart Builder            | HIGH   | 3 days | No competitor has drag-drop chart creation |
| 2    | AI Formula Assistant     | HIGH   | 5 days | Natural language → formula conversion      |
| 3    | Natural Language Queries | HIGH   | 5 days | "Show me..." → auto-build analysis         |
| 4    | Version History (expand) | HIGH   | 2 days | Visual timeline + one-click restore        |
| 5    | Predictive Autofill      | MEDIUM | 3 days | AI-powered pattern recognition             |
| 6    | One-Click Board Pack     | MEDIUM | 2 days | Auto-generate executive PDF                |
| 7    | Real-Time Presence       | MEDIUM | 3 days | Google Sheets-style collaboration          |
| 8    | Smart Data Validation    | MEDIUM | 2 days | Anomaly detection + auto-fix               |
| 9    | Scenario Replay          | LOW    | 2 days | Record + share scenario creation           |
| 10   | Cross-Entity Drill-Down  | LOW    | 2 days | Consolidated → entity breakdown            |

**Total effort: ~29 days for all 10**

---

## Immediate Actions (This Session)

1. Wire CommandPalette into AppLayout (15 min)
2. Expand VersionDiffViewer to full version history (30 min)
3. Add Monte Carlo to WhatIfSandbox (30 min)
4. Add formula autocomplete to FormulaBar (30 min)

---

## Key files

- src/components/ui/CommandPalette.tsx
- src/components/ui/SpreadsheetGrid.tsx
- src/components/ui/WhatIfSandbox.tsx
- src/components/ui/ConditionalFormattingPanel.tsx
- src/components/reports/ReportBuilder.tsx
- src/components/reports/FormulaBar.tsx
- src/components/ui/VersionDiffViewer.tsx
- src/components/ui/ApprovalDashboard.tsx

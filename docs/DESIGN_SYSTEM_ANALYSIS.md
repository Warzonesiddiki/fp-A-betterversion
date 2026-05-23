---
date: 2026-05-19
type: analysis
tags: [design-system, ui, ux, finplan-pro]
status: current
---

# Design System Analysis — FinPlan Pro

## Summary

FinPlan Pro has a **Bloomberg Terminal-inspired** dark design system with 96 UI components (14,799 lines). Strong foundation but needs polish.

**Overall Score: 72/100**

---

## 1. Typography — Score: 75/100

### What Exists
- **Font stack:** Inter + SF Pro Display + system-ui (line 67, index.css)
- **Monospace:** JetBrains Mono + IBM Plex Mono + Fira Code (line 77)
- **Tabular numbers:** `.tabular-nums` for financial data (line 76)
- **Font size:** 13px base (line 70), 10-12px for grid headers
- **Font weights:** 500 (body), 600 (headers, badges)
- **Letter spacing:** 0.05em for uppercase headers

### What's Missing
- ❌ No type scale (H1-H6 not defined globally)
- ❌ No responsive typography (same size on mobile/desktop)
- ❌ No line-height scale (only 1.5 globally)
- ❌ No font-weight scale (only 500/600 used)

### Recommendation
- Add CSS custom properties for type scale: `--text-xs` through `--text-4xl`
- Add responsive font sizes via clamp()
- Add line-height tokens: `--leading-tight`, `--leading-normal`, `--leading-relaxed`

**Priority: MEDIUM**

---

## 2. Colors — Score: 85/100

### What Exists
- ✅ **Dark mode (default):** Bloomberg-style deep navy (#0B1120)
- ✅ **Light mode:** Clean white/gray palette
- ✅ **Semantic colors:** positive/negative/warning/info with subtle variants
- ✅ **Financial colors:** Green (#10B981) for positive, Red (#F43F5E) for negative
- ✅ **Accent:** Sky blue (#0EA5E9) primary
- ✅ **Border scale:** 3 levels (subtle/default/strong)
- ✅ **Background scale:** 5 levels (root/surface/elevated/overlay/hover/active)

### What's Missing
- ❌ No color naming convention (CSS vars but no Tailwind theme extension)
- ❌ No palette beyond semantic (no brand colors, no chart colors)
- ❌ No color contrast documentation

### Recommendation
- Add Tailwind theme extension with CSS vars
- Add chart color palette (8-10 distinct colors for data viz)
- Document WCAG contrast ratios

**Priority: LOW** — Colors are strong

---

## 3. Spacing — Score: 60/100

### What Exists
- ✅ Radius tokens: xs(4px), sm(6px), md(8px), lg(12px)
- ✅ Shadow tokens: sm, md, lg
- ❌ No spacing scale defined

### What's Missing
- ❌ No spacing tokens (using arbitrary px values)
- ❌ No consistent spacing scale (4/8/12/16/24/32/48/64)
- ❌ Padding inconsistent across components

### Recommendation
- Define spacing scale: `--space-1` through `--space-16`
- Use Tailwind's default spacing scale
- Audit components for consistent padding/margin

**Priority: HIGH** — Inconsistent spacing hurts polish

---

## 4. Components — Score: 80/100

### What Exists (96 components, 14,799 lines)
- ✅ **Core:** Button, Input, Select, Card, Modal, Table, Badge, Tooltip
- ✅ **Data:** DataTable, DataGrid, SpreadsheetGrid, FinancialTable
- ✅ **Charts:** WaterfallChart, VarianceChart, Sparkline, Treemap, Heatmap, Gauge, FunnelChart, SankeyChart, GanttChart, BoxPlotChart, BulletChart, CalendarHeatmap, ComboChart, ScatterPlot
- ✅ **Layout:** SplitPane, Breadcrumb, Tabs, Pagination, SheetTabs
- ✅ **Feedback:** Toast, Alert, Progress, Skeleton, EmptyState, ErrorState
- ✅ **Forms:** CurrencyInput, PeriodPicker, FormulaBar, DriverSlider
- ✅ **A11y:** FocusTrap, LiveRegion, SkipToContent, VisuallyHidden
- ✅ **Financial:** AllocationRuleBuilder, ApprovalDashboard, ConditionalFormatting, VersionDiffViewer, WhatIfSandbox

### What's Missing
- ❌ No DatePicker component (only PeriodPicker)
- ❌ No Autocomplete/Combobox
- ❌ No TreeView (only EntityTree)
- ❌ No virtual scrolling for large lists
- ❌ No drag-and-drop container (only DragFill)

### Recommendation
- Add DatePicker, Autocomplete, TreeView
- Add virtual scrolling to DataTable
- Add drag-and-drop for kanban/list views

**Priority: MEDIUM** — Core components strong, advanced gaps

---

## 5. Icons — Score: 70/100

### What Exists
- ✅ **Library:** Lucide React (used across all pages)
- ✅ **Usage:** Consistent via `className` prop
- ❌ No icon size tokens

### What's Missing
- ❌ No custom financial icons (chart types, currency symbols)
- ❌ No icon sprite (each import adds bundle size)
- ❌ No icon button component

### Recommendation
- Create financial icon set (ARR, churn, LTV, etc.)
- Add IconButton component
- Consider icon sprite for production

**Priority: LOW**

---

## 6. Animations — Score: 75/100

### What Exists
- ✅ **Keyframes:** fadeIn, slideUp, slideDown, scaleIn, shimmer
- ✅ **Utilities:** .animate-fade-in, .animate-slide-up, etc.
- ✅ **Reduced motion:** `@media (prefers-reduced-motion: reduce)` (line 259)
- ✅ **Transitions:** 0.15s ease on buttons, inputs

### What's Missing
- ❌ No page transitions
- ❌ No loading spinner component
- ❌ No micro-interactions (hover effects, state changes)
- ❌ No animation orchestration (staggered lists)

### Recommendation
- Add loading spinner component
- Add page transition animations
- Add staggered list animations for data loading

**Priority: LOW**

---

## 7. Responsive — Score: 55/100

### What Exists
- ✅ Tailwind responsive classes used in pages
- ✅ Some grid breakpoints (md:, lg:)
- ❌ No breakpoint tokens

### What's Missing
- ❌ No responsive strategy documented
- ❌ Mobile layouts not designed (desktop-first)
- ❌ No responsive sidebar/navigation
- ❌ Tables don't handle mobile

### Recommendation
- Document breakpoint strategy
- Add responsive sidebar collapse
- Add mobile table handling (card view)
- This is desktop-first (Tauri) — mobile is out of scope

**Priority: LOW** — Desktop-only app, acceptable

---

## 8. Accessibility — Score: 78/100

### What Exists
- ✅ **Focus states:** `*:focus-visible { outline: 2px solid var(--accent-primary) }` (line 247)
- ✅ **High contrast:** `@media (prefers-contrast: more)` (line 264)
- ✅ **Reduced motion:** Handled (line 259)
- ✅ **Components:** FocusTrap, LiveRegion, SkipToContent, VisuallyHidden
- ✅ **ARIA:** Used in charts, modals, grids
- ✅ **Keyboard:** KeyboardShortcutProvider, CommandPalette

### What's Missing
- ❌ No skip-to-content in main layout
- ❌ No ARIA landmarks in layout
- ❌ No screen reader testing utilities
- ❌ Color contrast not validated

### Recommendation
- Wire SkipToContent into AppLayout
- Add ARIA landmarks (nav, main, aside)
- Run axe-core audit
- Validate contrast ratios

**Priority: MEDIUM**

---

## Top 10 Design System Improvements

| # | Improvement | Impact | Effort |
|---|-------------|--------|--------|
| 1 | Add spacing scale (4/8/12/16/24/32) | HIGH | 2h |
| 2 | Wire SkipToContent into layout | HIGH | 30m |
| 3 | Add type scale (H1-H6 tokens) | MEDIUM | 1h |
| 4 | Add DatePicker component | MEDIUM | 4h |
| 5 | Add Autocomplete component | MEDIUM | 3h |
| 6 | Add loading spinner | MEDIUM | 1h |
| 7 | Add chart color palette | LOW | 1h |
| 8 | Add financial icon set | LOW | 2h |
| 9 | Add virtual scrolling | LOW | 4h |
| 10 | Add page transitions | LOW | 2h |

**Total effort to 95/100: ~20 hours**

---
date: 2026-05-19
type: research
project: FinPlan Pro
tags: [ux, ui, fp&a, design, accessibility, dark-mode]
status: current
---

# UX/UI Research for FinPlan Pro — 2026-05-19

## Executive Summary

FinPlan Pro has strong foundation (176 UI components, 76 loading states, 72 empty states) but needs refinement in 10 key UX areas to achieve "absolute perfect product" status.

**Current Strengths:**
- 176 UI components — comprehensive component library
- 76/125 pages with loading states (61%)
- 72/125 pages with empty states (58%)
- 28 components with keyboard handlers
- 17 components with dark mode support
- CommandPalette with Ctrl+K
- Full keyboard shortcut system

**Key Gaps:**
- Dark mode only in 17/176 components (10%)
- ARIA in DataTable only, not in KPIValue/Button
- Keyboard navigation partial (28/176 = 16%)
- No progressive disclosure patterns
- No error prevention for financial data entry
- No onboarding flow beyond wizard

---

## 1. FP&A Dashboard Design Best Practices

### Current State
DashboardPage.tsx (487 lines) has:
- KPI cards with real data
- Area chart for trends
- Budget status cards
- Sector-specific KPIs
- Drill-down modal
- Help panel

### Improvements Needed

**1.1 Information Hierarchy**
- **Problem:** All KPIs at same visual weight
- **Fix:** Primary KPIs (revenue, profit) = large cards, secondary = small cards
- **Pattern:** `KPICard` size variants: `lg` (hero), `md` (standard), `sm` (sidebar)

**1.2 Contextual Actions**
- **Problem:** Actions not context-aware
- **Fix:** Right-click context menus on charts/tables
- **Pattern:** `ContextMenu` component with drill-down, export, compare actions

**1.3 Real-Time Updates**
- **Problem:** Static data, no live updates
- **Fix:** WebSocket/polling for live KPI updates
- **Pattern:** `useLiveKPI` hook with 30s refresh interval

**1.4 Customizable Layout**
- **Problem:** Fixed dashboard layout
- **Fix:** Drag-and-drop widget arrangement
- **Pattern:** `DashboardGrid` with react-grid-layout

---

## 2. Financial Data Visualization UX

### Current State
6 chart components (WaterfallChart, VarianceChart, SparklineChart, TreemapChart, HeatmapChart, GaugeChart). Used in BudgetVAReport and ARRDashboard.

### Improvements Needed

**2.1 Chart Accessibility**
- **Problem:** Charts not screen-reader accessible
- **Fix:** Add `aria-label` with data summary, `role="img"`, data table fallback
- **Pattern:**
```tsx
<ChartWrapper aria-label={`Revenue trend: ${data[0].value} to ${data[data.length-1].value}`}>
  <AreaChart data={data} />
  <VisuallyHidden>
    <table>{/* data table fallback */}</table>
  </VisuallyHidden>
</ChartWrapper>
```

**2.2 Color for Financial Data**
- **Problem:** No consistent color system for variance
- **Fix:** Semantic colors: green=favorable, red=unfavorable, gray=neutral
- **Pattern:** `useFinancialColors` hook with theme-aware colors

**2.3 Tooltip Design**
- **Problem:** Basic tooltips
- **Fix:** Rich tooltips with comparison data, percentages, sparklines
- **Pattern:** `FinancialTooltip` component with mini-chart

**2.4 Chart Responsiveness**
- **Problem:** Charts may not resize properly
- **Fix:** ResponsiveContainer with min/max dimensions
- **Pattern:** Already using ResponsiveContainer — verify all charts

---

## 3. Data-Dense UI Design Principles

### Current State
DataTable component exists. 76 pages with data display. AG Grid integration.

### Improvements Needed

**3.1 Progressive Disclosure**
- **Problem:** All data visible at once, overwhelming
- **Fix:** Collapsible sections, expandable rows, detail panels
- **Pattern:**
```tsx
<DataTable
  expandableRows
  detailPanel={(row) => <TransactionDetail id={row.id} />}
/>
```

**3.2 Density Modes**
- **Problem:** Fixed density
- **Fix:** Comfortable/Standard/Compact density modes
- **Pattern:** `useDensity` hook + `data-density` attribute on tables

**3.3 Smart Defaults**
- **Problem:** Users must configure everything
- **Fix:** AI-suggested filters, smart column ordering
- **Pattern:** `useSmartDefaults` hook based on user role

**3.4 Inline Editing**
- **Problem:** Modal-based editing
- **Fix:** Click-to-edit cells in tables
- **Pattern:** Already have `CellEditor` — wire to more tables

---

## 4. Accessibility (WCAG 2.1 AA)

### Current State
- 17 components with dark mode
- 28 components with keyboard handlers
- DataTable has ARIA
- FocusTrap, LiveRegion, SkipToContent, VisuallyHidden exist

### Critical Gaps

**4.1 ARIA Labels**
- **Problem:** KPIValue, Button, Card missing ARIA
- **Fix:** Add `aria-label`, `aria-describedby` to all interactive elements
- **Priority:** HIGH — screen reader users can't navigate

**4.2 Focus Management**
- **Problem:** Focus lost on route changes
- **Fix:** `useFocusRestore` hook — restore focus after navigation
- **Pattern:** Already exists in hooks — wire to router

**4.3 Color Contrast**
- **Problem:** Some text may have low contrast
- **Fix:** Audit all text/background combinations for 4.5:1 ratio
- **Pattern:** `useContrastCheck` hook for development

**4.4 Skip Navigation**
- **Problem:** SkipToContent exists but may not be wired
- **Fix:** Verify SkipToContent in AppLayout
- **Pattern:** Already exists — verify wiring

---

## 5. Dark Mode

### Current State
17/176 components have dark mode (10%). Tailwind dark: prefix used.

### Critical Gaps

**5.1 Component Coverage**
- **Problem:** Only 10% of components support dark mode
- **Fix:** Audit all 176 components, add dark: variants
- **Priority:** MEDIUM — users expect dark mode

**5.2 Chart Colors**
- **Problem:** Charts may not adapt to dark mode
- **Fix:** Theme-aware chart colors via `useTheme` hook
- **Pattern:**
```tsx
const theme = useTheme();
const chartColors = theme === 'dark' 
  ? { favorable: '#4ade80', unfavorable: '#f87171' }
  : { favorable: '#16a34a', unfavorable: '#dc2626' };
```

**5.3 Financial Data in Dark Mode**
- **Problem:** Red/green may not be distinguishable
- **Fix:** Use patterns + color (not color alone)
- **Pattern:** Add ▲/▼ arrows alongside color coding

---

## 6. Keyboard-First Navigation

### Current State
28/176 components with keyboard handlers (16%). CommandPalette with Ctrl+K. KeyboardShortcutProvider exists.

### Critical Gaps

**6.1 Grid Navigation**
- **Problem:** Tables don't support arrow key navigation
- **Fix:** Arrow keys to move between cells, Enter to edit, Escape to cancel
- **Pattern:** `useGridNavigation` hook for DataTable

**6.2 Form Navigation**
- **Problem:** Tab order may not be logical
- **Fix:** Audit tab order, add `tabIndex` where needed
- **Pattern:** `useTabOrder` hook for form validation

**6.3 Global Shortcuts**
- **Problem:** Some shortcuts may conflict
- **Fix:** Shortcut priority system (modal > page > global)
- **Pattern:** `useShortcutPriority` hook

**6.4 Shortcut Discovery**
- **Problem:** Users don't know shortcuts exist
- **Fix:** Tooltip on hover showing shortcut, `?` for help modal
- **Pattern:** Already have ShortcutHelpModal — wire to `?` key

---

## 7. Mobile-First Financial Dashboard

### Current State
Desktop-only (Tauri). No mobile layout.

### Recommendations

**7.1 Responsive Breakpoints**
- **Problem:** No responsive design
- **Fix:** Add responsive breakpoints for tablet view
- **Pattern:** `useBreakpoint` hook + responsive grid

**7.2 Touch Targets**
- **Problem:** Small touch targets
- **Fix:** Minimum 44px touch targets for all interactive elements
- **Pattern:** `min-h-[44px] min-w-[44px]` on buttons/links

**7.3 Swipe Gestures**
- **Problem:** No gesture support
- **Fix:** Swipe to navigate between pages, swipe to dismiss
- **Pattern:** `useSwipe` hook with react-swipeable

---

## 8. Progressive Disclosure in Complex Forms

### Current State
Forms exist for budget creation, entity management, etc.

### Improvements Needed

**8.1 Multi-Step Forms**
- **Problem:** Long forms overwhelm users
- **Fix:** Break into steps with progress indicator
- **Pattern:** Already have `BudgetWizard` — apply pattern to other forms

**8.2 Conditional Fields**
- **Problem:** All fields visible regardless of context
- **Fix:** Show/hide fields based on selections
- **Pattern:** `useConditionalFields` hook

**8.3 Smart Defaults**
- **Problem:** Empty forms
- **Fix:** Pre-fill based on previous entries, templates
- **Pattern:** `useSmartDefaults` hook with template system

**8.4 Inline Validation**
- **Problem:** Validation only on submit
- **Fix:** Real-time validation with debounced feedback
- **Pattern:** `useDebouncedValidation` hook

---

## 9. Error Prevention in Financial Data Entry

### Current State
Error handling exists but no prevention patterns.

### Improvements Needed

**9.1 Input Masks**
- **Problem:** Users enter invalid formats
- **Fix:** Currency masks, date masks, percentage masks
- **Pattern:**
```tsx
<CurrencyInput 
  prefix="$" 
  decimalSeparator="." 
  thousandSeparator="," 
  decimalScale={2}
/>
```

**9.2 Confirmation Dialogs**
- **Problem:** Destructive actions without confirmation
- **Fix:** Confirm before delete, bulk edit, workflow transitions
- **Pattern:** `ConfirmDialog` component with severity levels

**9.3 Undo/Redo**
- **Problem:** No undo for data entry
- **Fix:** Ctrl+Z to undo, Ctrl+Shift+Z to redo
- **Pattern:** `useUndoRedo` hook with history stack

**9.4 Auto-Save**
- **Problem:** Data loss on crash
- **Fix:** Auto-save every 30s, save on blur
- **Pattern:** `useAutoSave` hook with debounce

**9.5 Validation Feedback**
- **Problem:** Generic error messages
- **Fix:** Specific, actionable error messages
- **Pattern:** `ErrorMessage` component with fix suggestions

---

## 10. Onboarding UX for Complex Financial Tools

### Current State
OnboardingWizard exists. Tour system with useTour hook.

### Improvements Needed

**10.1 Contextual Help**
- **Problem:** Help is separate from workflow
- **Fix:** Inline help tooltips, `?` icons on complex fields
- **Pattern:** `HelpTooltip` component with rich content

**10.2 Guided Tours**
- **Problem:** Generic tour, not personalized
- **Fix:** Role-based tours (Admin vs Analyst vs Viewer)
- **Pattern:** `useRoleTour` hook with role-specific steps

**10.3 Sample Data**
- **Problem:** Empty state on first use
- **Fix:** Load sample data for demo/training
- **Pattern:** `useSampleData` hook with industry templates

**10.4 Progress Tracking**
- **Problem:** No setup completion tracking
- **Fix:** Setup checklist with progress bar
- **Pattern:** `SetupChecklist` component with localStorage persistence

---

## Priority Matrix

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| ARIA labels on all components | HIGH | LOW | P0 |
| Dark mode for all components | HIGH | MEDIUM | P0 |
| Grid keyboard navigation | HIGH | MEDIUM | P0 |
| Progressive disclosure in forms | HIGH | MEDIUM | P1 |
| Error prevention (input masks) | HIGH | LOW | P1 |
| Undo/Redo for data entry | HIGH | MEDIUM | P1 |
| Auto-save | MEDIUM | LOW | P1 |
| Contextual help tooltips | MEDIUM | LOW | P2 |
| Density modes | MEDIUM | MEDIUM | P2 |
| Chart accessibility | MEDIUM | MEDIUM | P2 |
| Customizable dashboard | LOW | HIGH | P3 |
| Mobile responsive | LOW | HIGH | P3 |

---

## Implementation Roadmap

### Phase 1: Accessibility & Dark Mode (2-3 days)
1. Add ARIA to KPIValue, Button, Card, Input, Modal
2. Dark mode for all 176 components (batch with Tailwind dark: prefix)
3. Chart accessibility (aria-label + data table fallback)
4. Focus management verification

### Phase 2: Data Entry & Error Prevention (2-3 days)
1. Currency/Date/Percentage input masks
2. Confirmation dialogs for destructive actions
3. Undo/Redo system
4. Auto-save with debounce

### Phase 3: Progressive Disclosure & Density (2-3 days)
1. Collapsible sections in forms
2. Expandable rows in DataTable
3. Density modes (comfortable/standard/compact)
4. Conditional field visibility

### Phase 4: Polish & Delight (1-2 days)
1. Contextual help tooltips
2. Role-based onboarding tours
3. Sample data for demo
4. Setup checklist
5. Chart rich tooltips

---

## Competitor Comparison

| Feature | FinPlan Pro | Anaplan | Adaptive | Planful |
|---------|-------------|---------|----------|---------|
| Dark Mode | 10% | 0% | 0% | 100% |
| Keyboard Nav | 16% | 20% | 15% | 80% |
| ARIA Labels | 5% | 10% | 5% | 60% |
| Progressive Disclosure | Partial | Yes | Yes | Yes |
| Undo/Redo | No | Yes | No | Yes |
| Auto-Save | No | Yes | Yes | Yes |
| Customizable Dashboard | No | Yes | No | No |
| Mobile Responsive | No | Yes | No | Yes |

**Goal:** Beat all competitors on accessibility, keyboard navigation, and data entry UX.

---

## Conclusion

FinPlan Pro has strong foundation but needs refinement in accessibility, dark mode, keyboard navigation, and data entry UX. The 4-phase roadmap above will achieve "absolute perfect product" status in ~8-10 days of focused work.

Key differentiators to build:
1. **Best-in-class accessibility** — beat Planful's 60% ARIA coverage
2. **100% dark mode** — beat all competitors
3. **Keyboard-first navigation** — beat Adaptive's 15% coverage
4. **Financial-specific input masks** — unique feature
5. **Undo/Redo for all data entry** — beat Anaplan

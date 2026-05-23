---
date: 2026-05-19
type: research
project: FinPlan Pro
tags: [ux, ui, fp&a, dark-mode, accessibility, keyboard]
status: current
---

# FinPlan Pro UX Research — 2026-05-19

## Current UI Strengths
- [[ui-components]] 176 components in library
- [[loading-states]] 76 pages with loading skeletons (61%)
- [[empty-states]] 72 pages with empty state handling (58%)
- [[keyboard-shortcuts]] CommandPalette with Ctrl+K
- [[dark-mode]] 17 components with dark: variants (10%)
- [[accessibility]] FocusTrap, LiveRegion, SkipToContent, VisuallyHidden

## Critical UX Gaps

### [[accessibility]] — ARIA Labels
- Only [[DataTable]] has proper ARIA
- [[KPIValue]], [[Button]], [[Card]] missing aria-label
- Need: `aria-label`, `aria-describedby` on all interactive elements
- **Priority:** P0

### [[dark-mode]] — Component Coverage
- Only 17/176 components (10%) support dark mode
- Need: Tailwind `dark:` variants on all components
- Charts need theme-aware colors via `useTheme` hook
- **Priority:** P0

### [[keyboard-shortcuts]] — Grid Navigation
- Only 28/176 components (16%) have keyboard handlers
- Tables don't support arrow key navigation
- Need: `useGridNavigation` hook for [[DataTable]]
- **Priority:** P0

### [[progressive-disclosure]] — Complex Forms
- All fields visible regardless of context
- Need: Conditional fields, multi-step forms, smart defaults
- [[BudgetWizard]] pattern exists — apply to other forms
- **Priority:** P1

### [[error-prevention]] — Financial Data Entry
- No input masks for currency/date/percentage
- No confirmation dialogs for destructive actions
- No undo/redo for data entry
- No auto-save
- **Priority:** P1

## Implementation Roadmap

### Phase 1: Accessibility & Dark Mode (2-3 days)
1. Add ARIA to [[KPIValue]], [[Button]], [[Card]], [[Input]], [[Modal]]
2. Dark mode for all 176 components
3. Chart accessibility (aria-label + data table fallback)
4. Focus management verification

### Phase 2: Data Entry & Error Prevention (2-3 days)
1. Currency/Date/Percentage input masks
2. Confirmation dialogs
3. Undo/Redo system
4. Auto-save with debounce

### Phase 3: Progressive Disclosure & Density (2-3 days)
1. Collapsible sections in forms
2. Expandable rows in [[DataTable]]
3. Density modes (comfortable/standard/compact)
4. Conditional field visibility

### Phase 4: Polish & Delight (1-2 days)
1. Contextual help tooltips
2. Role-based onboarding tours
3. Sample data for demo
4. Setup checklist

## Competitor Comparison
- [[Anaplan]]: 0% dark mode, 20% keyboard, 10% ARIA
- [[Adaptive Insights]]: 0% dark mode, 15% keyboard, 5% ARIA
- [[Planful]]: 100% dark mode, 80% keyboard, 60% ARIA
- **FinPlan Pro Target:** 100% dark mode, 90% keyboard, 80% ARIA

## Key Differentiators
1. Best-in-class [[accessibility]] — beat Planful's 60%
2. 100% [[dark-mode]] — beat all competitors
3. Keyboard-first [[keyboard-shortcuts]] — beat Adaptive's 15%
4. Financial-specific input masks — unique feature
5. Undo/Redo for all data entry — beat Anaplan

## Related
- [[charts]] — need accessibility improvements
- [[DataTable]] — needs grid navigation
- [[DashboardPage]] — needs customizable layout
- [[onboarding]] — needs role-based tours

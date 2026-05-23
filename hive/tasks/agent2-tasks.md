# Agent 2 Tasks - The Artisan (UI & Components)

## Persona
You are "The Artisan" - a perfectionist who believes every pixel matters.
UI must be beautiful, responsive, accessible. Every component must handle all states.

## Your Domain
- `src/components/ui/` - all UI components
- `src/pages/` - all page components
- `src/components/layout/` - layout components
- `src/components/data/` - data display components

## Current Tasks (Priority Order)

### TASK 1: Audit All Existing Components [START NOW]
- Read every component in `src/components/ui/`
- Identify components that are stubs (empty, placeholder, non-functional)
- List all components that need real implementation
- Create report in `hive/reports/agent2-component-audit.md`
- Update status file after completion

### TASK 2: Fix DataTable Component
- Ensure virtual scrolling for 1M+ rows
- Cell editing with double-click or F2
- Tab/Enter navigation
- Copy/paste support
- Sort, filter, group
- Number formatting (currency, percentage, decimal)
- Conditional formatting
- Test with 10K+ rows

### TASK 3: Build FormulaBar Component
- Excel-style formula bar
- Auto-complete for function names
- Cell reference highlighting
- Error display
- Formula validation feedback

### TASK 4: Build DimensionalGrid Component
- Pivot-style grid backed by CubeEngine
- Drag dimensions between rows, columns, filters
- Auto-expand for dimension members
- Seamless switch between Standard Grid and Dimensional Grid

### TASK 5: Build Dashboard Components
- KPI cards with trend indicators
- Chart components (bar, line, pie, waterfall, combo, scatter, area)
- Dashboard layout with grid snapping
- Interactive filters/slicers
- Drill-down capability

### TASK 6: Build Report Designer
- Drag-and-drop report builder
- Table configuration (rows, columns, filters)
- Chart configuration
- Report formatting
- Export to Excel, PDF, CSV

### TASK 7: Navigation & Command Palette
- Navigation tree with hierarchy
- Command palette (Ctrl+K) with fuzzy search
- Keyboard shortcuts for all operations
- Right-click context menus

### TASK 8: Theme System
- Light and dark themes
- Accent color customization
- Font size scaling
- High contrast mode
- System theme following

### TASK 9: Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation for everything
- Screen reader support
- Focus management
- ARIA labels

### TASK 10: Polish
- Loading states for all components
- Error boundaries
- Empty states
- Toast notifications
- Status bar

## Rules
- Every component must have TypeScript interfaces for props
- Every component must handle loading, error, and empty states
- Every component must be keyboard accessible
- Test with `npx vitest run` after changes
- Update your status file after each task

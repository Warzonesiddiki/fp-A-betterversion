# Proposal: Unified `FinPlanGrid` Component

## Status

**Author:** AI Reviewer / Agent
**Date:** 2026-05-24
**Type:** Component Consolidation / Architecture Improvement

## Context

Currently, the FinPlan Pro codebase contains five distinct grid components with overlapping functionality:

1. `DataTable.tsx`: Basic read-only table with virtual scrolling.
2. `FinancialTable.tsx`: Specialized for financial reports (subtotals, variance colors).
3. `ScenarioComparisonGrid.tsx`: Comparison-specific layout for scenarios.
4. `DataGrid.tsx`: AG Grid-based editable grid with toolbars.
5. `SpreadsheetGrid.tsx`: AG Grid-based Excel-like spreadsheet with formula bar.

Each component implements its own virtualization, sorting, and filtering logic, leading to maintenance overhead and inconsistent UX.

## Proposal

Consolidate all grid variants into a single, highly-configurable `FinPlanGrid` component powered by **AG Grid Community**.

### 1. Unified Interface

```typescript
export type GridPreset = 'standard' | 'report' | 'spreadsheet' | 'comparison';

export interface FinPlanGridColumn {
  field: string;
  headerName: string;
  type?: 'text' | 'number' | 'currency' | 'percent' | 'date' | 'badge';
  width?: number;
  flex?: number;
  editable?: boolean;
  pinned?: 'left' | 'right';
  // Financial specifics
  isVariance?: boolean;
  accountType?: 'Revenue' | 'Expense';
  // Customization
  cellRenderer?: React.ComponentType<any>;
  valueFormatter?: (params: any) => string;
}

export interface FinPlanGridProps {
  /** The operational mode of the grid */
  preset?: GridPreset;
  /** Column definitions */
  columns: FinPlanGridColumn[];
  /** Row data */
  rows: any[];
  /** Loading state */
  loading?: boolean;
  /** Enable Excel-style formula bar */
  showFormulaBar?: boolean;
  /** Enable toolbar with export/find/replace */
  showToolbar?: boolean;
  /** Subtotal logic for 'report' preset */
  showSubtotals?: boolean;
  /** Selection statistics (sum, avg, etc) */
  showSelectionStats?: boolean;
  /** AG Grid options override for escape-hatch */
  gridOptions?: GridOptions;
  /** Event handlers */
  onCellValueChanged?: (event: any) => void;
  onSelectionChanged?: (selectedRows: any[]) => void;
  className?: string;
}
```

### 2. Benefits

- **Zero Duplication**: Shared virtualization, sorting, and filtering via AG Grid.
- **Native GUI Feel**: High performance and robust keyboard support (essential for Tauri-based desktop apps).
- **Reduced Bundle Size**: Removes multiple manual virtualization implementations.
- **Unified Styling**: Consistent "FinPlan Pro" look across all data views.
- **Feature Richness**: Standardizes advanced features (Export, Find/Replace, Selection Stats) across all grids.

### 3. Migration Plan

1. **Phase 1**: Implement `FinPlanGrid` wrapper around AG Grid.
2. **Phase 2**: Create cell renderers for `badge`, `variance` (financial), and `comparison`.
3. **Phase 3**: Replace `DataTable` usage in simple views.
4. **Phase 4**: Migrate `FinancialTable` and `ScenarioComparisonGrid` by implementing their custom logic as AG Grid row styles and renderers.
5. **Phase 5**: Subsume `DataGrid` and `SpreadsheetGrid` functionality into `FinPlanGrid`.
6. **Phase 6**: Remove deprecated components and manual virtualization dependencies.

### 4. Technical Implementation Details

- **Variance Coloring**: Use `cellClassRules` in AG Grid to apply `fin-positive` and `fin-negative` based on row context (e.g., `row.accountType`).
- **Subtotals**: Use AG Grid's `getRowStyle` to bold rows where `isSubtotal: true`.
- **Keyboard Shortcuts**: Integrate `ExcelKeyboardEngine` directly into the `FinPlanGrid` event handler.
- **Offline Reliability**: AG Grid's client-side model ensures full functionality in the Tauri shell without network roundtrips.

## Success Criteria

- [ ] Single entry point for all grid-based UI in FinPlan Pro.
- [ ] 100% feature parity with all five current components.
- [ ] Consistent performance for datasets up to 100k+ rows.
- [ ] Improved accessibility (WCAG 2.1 AA) via AG Grid's robust ARIA support.

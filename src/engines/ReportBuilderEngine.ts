// =============================================================================
// REPORT BUILDER ENGINE
// Custom financial report creation with grid-based layout
// Pure TypeScript, deterministic, testable
// =============================================================================

// --- Cell Type Definitions ---

export type CellType = 'metric' | 'formula' | 'text' | 'chart' | 'table';
export type NumberFormat = 'currency' | 'percentage' | 'compact' | 'wholenumber' | 'decimal';
export type Alignment = 'left' | 'center' | 'right';
export type RowType = 'header' | 'data' | 'subtotal' | 'total' | 'blank';
export type ColumnType = 'label' | 'period' | 'custom';
export type PeriodType = 'actual' | 'budget' | 'forecast' | 'variance';
export type ConditionOperator = 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'neq';
export type TemplateType =
  | 'income_statement'
  | 'balance_sheet'
  | 'cash_flow'
  | 'budget_vs_actual'
  | 'variance_analysis'
  | 'board_pack'
  | 'executive_summary'
  | 'custom';
export type PermissionLevel = 'view' | 'comment' | 'edit' | 'admin';
export type BorderStyle = 'none' | 'thin' | 'medium' | 'thick';
export type GroupCollapseState = 'expanded' | 'collapsed';
export type ExportFormat = 'pdf' | 'excel' | 'csv';
export type ParameterType = 'text' | 'number' | 'date' | 'select' | 'boolean';

// --- Cell Styling ---

export interface CellStyle {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  fontSize: number;
  fontFamily: string;
  textColor: string;
  backgroundColor: string;
  borderTop: BorderStyle;
  borderBottom: BorderStyle;
  borderLeft: BorderStyle;
  borderRight: BorderStyle;
  alignment: Alignment;
  indent: number;
  wrap: boolean;
}

// --- Conditional Formatting ---

export interface ConditionalFormat {
  id: string;
  condition: ConditionOperator;
  value: number;
  style: Partial<CellStyle>;
  label?: string;
}

// --- Report Cells ---

export interface MetricCellContent {
  coords: string; // Cube coordinate reference (e.g., "Revenue.Q1.Actual")
  measure: string; // Measure name
  entityId?: string; // Optional entity filter
  scenarioId?: string; // Optional scenario filter
  periodId?: string; // Optional period filter
  format: NumberFormat;
  decimals: number;
  showSign: boolean; // Show +/- for variances
  conditionalFormats?: ConditionalFormat[];
}

export interface FormulaCellContent {
  expression: string; // Formula expression (e.g., "A1/A2*100", "(A1-A2)/A2*100")
  format: NumberFormat;
  decimals: number;
  label?: string; // Optional display label
  conditionalFormats?: ConditionalFormat[];
}

export interface TextCellContent {
  text: string;
  style?: Partial<CellStyle>;
}

export interface ChartElementContent {
  chartId: string;
  chartType: 'bar' | 'line' | 'pie' | 'area' | 'combo' | 'waterfall' | 'scatter';
  title: string;
  width: number;
  height: number;
  dataRef?: string; // Reference to data source
}

export interface TableElementContent {
  tableId: string;
  sourceReportId?: string; // Reference to another report
  maxRows: number;
  showHeaders: boolean;
  striped: boolean;
}

export type CellContent =
  | { type: 'metric'; content: MetricCellContent }
  | { type: 'formula'; content: FormulaCellContent }
  | { type: 'text'; content: TextCellContent }
  | { type: 'chart'; content: ChartElementContent }
  | { type: 'table'; content: TableElementContent };

// --- Report Cell ---

export interface ReportCell {
  id: string;
  type: CellType;
  content: CellContent;
  style: CellStyle;
  colspan: number;
  rowspan: number;
  isVisible: boolean;
}

// --- Report Row ---

export interface RowGrouping {
  level: number; // 0 = top level, 1 = nested, etc.
  parentId?: string; // Parent row ID for nesting
  state: GroupCollapseState;
}

export interface ReportRow {
  id: string;
  type: RowType;
  cells: ReportCell[];
  height: number;
  isVisible: boolean;
  grouping?: RowGrouping;
  pageBreakBefore: boolean;
}

// --- Report Column ---

export interface ReportColumn {
  id: string;
  type: ColumnType;
  header: string;
  width: number;
  period?: PeriodType;
  scenario?: string;
  entityId?: string;
  isVisible: boolean;
  isLocked: boolean;
}

// --- Report Layout ---

export interface ReportLayout {
  rows: ReportRow[];
  columns: ReportColumn[];
  columnWidths: Record<string, number>;
  defaultRowHeight: number;
  frozenColumns: number;
  frozenRows: number;
}

// --- Report Filter ---

export interface ReportFilter {
  field: string;
  operator: ConditionOperator;
  value: string | number;
}

// --- Report Sharing ---

export interface ReportShare {
  userId: string;
  permission: PermissionLevel;
  sharedAt: string;
  sharedBy: string;
}

// --- Report Definition ---

export interface ReportDefinition {
  id: string;
  name: string;
  description: string;
  template: TemplateType;
  layout: ReportLayout;
  filters: ReportFilter[];
  shares: ReportShare[];
  parameters?: ReportParameter[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  tags: string[];
  isArchived: boolean;
  version: number;
}

// --- PDF Export Metadata ---

export interface PDFExportMetadata {
  reportId: string;
  title: string;
  subtitle?: string;
  orientation: 'portrait' | 'landscape';
  pageSize: 'letter' | 'a4' | 'legal';
  margins: { top: number; bottom: number; left: number; right: number };
  showPageNumbers: boolean;
  showTimestamp: boolean;
  watermark?: string;
  headerText?: string;
  footerText?: string;
}

// --- Cube Data Binding ---

export interface CubeData {
  [coordinate: string]: number | string | boolean | null;
}

export interface CellBinding {
  coords: string;
  measure: string;
  entityId?: string;
  scenarioId?: string;
  periodId?: string;
}

export interface ResolvedCell {
  cellId: string;
  rawValue: number | string | null;
  formattedValue: string;
  binding: CellBinding | null;
}

// --- Report Parameters ---

export interface ReportParameter {
  id: string;
  name: string;
  label: string;
  type: ParameterType;
  value: string | number | boolean;
  defaultValue: string | number | boolean;
  options?: Array<{ label: string; value: string | number }>;
  required: boolean;
}

// --- Export Data Structures ---

export interface ExcelExportSheet {
  name: string;
  data: Array<Array<string | number | boolean | null>>;
  columnWidths: number[];
}

export interface ExcelExportResult {
  sheets: ExcelExportSheet[];
  metadata: {
    title: string;
    createdAt: string;
    author: string;
    orientation: 'portrait' | 'landscape';
  };
}

export interface CSVExportResult {
  content: string;
  filename: string;
  mimeType: string;
}

// --- Formula Dependencies ---

export interface FormulaDependency {
  cellId: string;
  references: string[];
  hasCircularRef: boolean;
}

// --- Section Definition ---

export interface ReportSection {
  id: string;
  type: 'header' | 'data' | 'subtotal' | 'total' | 'chart' | 'text' | 'footer';
  title: string;
  startRowIndex: number;
  endRowIndex: number;
  binding?: CellBinding;
  isCollapsed: boolean;
}

// --- Default Styles ---

const DEFAULT_CELL_STYLE: CellStyle = {
  bold: false,
  italic: false,
  underline: false,
  fontSize: 11,
  fontFamily: 'Inter, sans-serif',
  textColor: '#1F2937',
  backgroundColor: 'transparent',
  borderTop: 'none',
  borderBottom: 'none',
  borderLeft: 'none',
  borderRight: 'none',
  alignment: 'left',
  indent: 0,
  wrap: false,
};

const _HEADER_STYLE: Partial<CellStyle> = {
  bold: true,
  fontSize: 12,
  backgroundColor: '#F3F4F6',
  borderBottom: 'medium',
  alignment: 'center',
};

const TOTAL_STYLE: Partial<CellStyle> = {
  bold: true,
  borderTop: 'medium',
  borderBottom: 'medium',
};

const _SUBTOTAL_STYLE: Partial<CellStyle> = {
  bold: true,
  borderTop: 'thin',
};

// =============================================================================
// REPORT BUILDER ENGINE
// =============================================================================

export class ReportBuilderEngine {
  // ---------------------------------------------------------------------------
  // Report CRUD
  // ---------------------------------------------------------------------------

  /**
   * Create a new report definition
   */
  static createReport(
    name: string,
    template: TemplateType,
    createdBy: string,
    description = ''
  ): ReportDefinition {
    if (!name.trim()) {
      throw new Error('Report name is required');
    }

    const now = new Date().toISOString();
    const id = this.generateId();

    const layout = this.getTemplateLayout(template);

    return {
      id,
      name: name.trim(),
      description,
      template,
      layout,
      filters: [],
      shares: [],
      createdAt: now,
      updatedAt: now,
      createdBy,
      tags: [],
      isArchived: false,
      version: 1,
    };
  }

  /**
   * Update a report definition (immutable)
   */
  static updateReport(
    report: ReportDefinition,
    updates: Partial<Pick<ReportDefinition, 'name' | 'description' | 'tags' | 'filters'>>
  ): ReportDefinition {
    if (updates.name !== undefined && !updates.name.trim()) {
      throw new Error('Report name cannot be empty');
    }

    return {
      ...report,
      ...updates,
      updatedAt: new Date().toISOString(),
      version: report.version + 1,
    };
  }

  /**
   * Delete a report (returns true if valid to delete)
   */
  static canDeleteReport(report: ReportDefinition): boolean {
    return !report.isArchived;
  }

  /**
   * Archive a report
   */
  static archiveReport(report: ReportDefinition): ReportDefinition {
    return {
      ...report,
      isArchived: true,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Clone a report with a new name
   */
  static cloneReport(
    report: ReportDefinition,
    newName: string,
    createdBy: string
  ): ReportDefinition {
    if (!newName.trim()) {
      throw new Error('Clone name is required');
    }

    const now = new Date().toISOString();
    return {
      ...report,
      id: this.generateId(),
      name: newName.trim(),
      createdAt: now,
      updatedAt: now,
      createdBy,
      shares: [],
      version: 1,
      isArchived: false,
    };
  }

  // ---------------------------------------------------------------------------
  // Layout Manipulation
  // ---------------------------------------------------------------------------

  /**
   * Add a row to the layout at the specified index
   */
  static addRow(layout: ReportLayout, type: RowType, index?: number): ReportLayout {
    const newRow: ReportRow = {
      id: this.generateId(),
      type,
      cells: layout.columns.map((col) =>
        this.createEmptyCell(col.type === 'label' ? 'text' : 'metric')
      ),
      height: layout.defaultRowHeight,
      isVisible: true,
      pageBreakBefore: false,
    };

    const rows = [...layout.rows];
    const insertAt = index !== undefined ? Math.min(index, rows.length) : rows.length;
    rows.splice(insertAt, 0, newRow);

    return { ...layout, rows };
  }

  /**
   * Remove a row from the layout by ID
   */
  static removeRow(layout: ReportLayout, rowId: string): ReportLayout {
    return {
      ...layout,
      rows: layout.rows.filter((r) => r.id !== rowId),
    };
  }

  /**
   * Move a row from one position to another
   */
  static moveRow(layout: ReportLayout, rowId: string, targetIndex: number): ReportLayout {
    const rows = [...layout.rows];
    const sourceIndex = rows.findIndex((r) => r.id === rowId);
    if (sourceIndex === -1) return layout;

    const [moved] = rows.splice(sourceIndex, 1) as [ReportRow];
    const insertAt = Math.min(targetIndex, rows.length);
    rows.splice(insertAt, 0, moved);

    return { ...layout, rows };
  }

  /**
   * Add a column to the layout at the specified index
   */
  static addColumn(
    layout: ReportLayout,
    column: Omit<ReportColumn, 'id' | 'isVisible' | 'isLocked'>,
    index?: number
  ): ReportLayout {
    const newColumn: ReportColumn = {
      ...column,
      id: this.generateId(),
      isVisible: true,
      isLocked: false,
    };

    const columns = [...layout.columns];
    const insertAt = index !== undefined ? Math.min(index, columns.length) : columns.length;
    columns.splice(insertAt, 0, newColumn);

    // Add a cell to each existing row for the new column
    const rows = layout.rows.map((row) => ({
      ...row,
      cells: [
        ...row.cells.slice(0, insertAt),
        this.createEmptyCell(column.type === 'label' ? 'text' : 'metric'),
        ...row.cells.slice(insertAt),
      ],
    }));

    const columnWidths = { ...layout.columnWidths, [newColumn.id]: column.width };

    return { ...layout, columns, rows, columnWidths };
  }

  /**
   * Remove a column from the layout by ID
   */
  static removeColumn(layout: ReportLayout, columnId: string): ReportLayout {
    const colIndex = layout.columns.findIndex((c) => c.id === columnId);
    if (colIndex === -1) return layout;

    const columns = layout.columns.filter((c) => c.id !== columnId);
    const rows = layout.rows.map((row) => ({
      ...row,
      cells: row.cells.filter((_, i) => i !== colIndex),
    }));

    const columnWidths = { ...layout.columnWidths };
    delete columnWidths[columnId];

    return { ...layout, columns, rows, columnWidths };
  }

  /**
   * Update a cell at a specific row and column
   */
  static updateCell(
    layout: ReportLayout,
    rowIndex: number,
    colIndex: number,
    cellContent: CellContent,
    style?: Partial<CellStyle>
  ): ReportLayout {
    if (rowIndex < 0 || rowIndex >= layout.rows.length) {
      throw new Error(`Row index ${rowIndex} out of bounds`);
    }
    if (colIndex < 0 || colIndex >= layout.columns.length) {
      throw new Error(`Column index ${colIndex} out of bounds`);
    }

    const rows = layout.rows.map((row, ri) => {
      if (ri !== rowIndex) return row;
      return {
        ...row,
        cells: row.cells.map((cell, ci) => {
          if (ci !== colIndex) return cell;
          return {
            ...cell,
            type: cellContent.type,
            content: cellContent,
            style: style ? { ...cell.style, ...style } : cell.style,
          };
        }),
      };
    });

    return { ...layout, rows };
  }

  /**
   * Toggle row visibility
   */
  static toggleRowVisibility(layout: ReportLayout, rowId: string): ReportLayout {
    return {
      ...layout,
      rows: layout.rows.map((row) =>
        row.id === rowId ? { ...row, isVisible: !row.isVisible } : row
      ),
    };
  }

  /**
   * Toggle column visibility
   */
  static toggleColumnVisibility(layout: ReportLayout, columnId: string): ReportLayout {
    return {
      ...layout,
      columns: layout.columns.map((col) =>
        col.id === columnId ? { ...col, isVisible: !col.isVisible } : col
      ),
    };
  }

  /**
   * Set column width
   */
  static setColumnWidth(layout: ReportLayout, columnId: string, width: number): ReportLayout {
    if (width < 0) throw new Error('Column width must be non-negative');

    return {
      ...layout,
      columns: layout.columns.map((col) => (col.id === columnId ? { ...col, width } : col)),
      columnWidths: { ...layout.columnWidths, [columnId]: width },
    };
  }

  /**
   * Set row height
   */
  static setRowHeight(layout: ReportLayout, rowId: string, height: number): ReportLayout {
    if (height < 0) throw new Error('Row height must be non-negative');

    return {
      ...layout,
      rows: layout.rows.map((row) => (row.id === rowId ? { ...row, height } : row)),
    };
  }

  // ---------------------------------------------------------------------------
  // Row Grouping
  // ---------------------------------------------------------------------------

  /**
   * Create a row group by setting grouping on a row
   */
  static createRowGroup(
    layout: ReportLayout,
    rowId: string,
    level: number,
    parentId?: string
  ): ReportLayout {
    return {
      ...layout,
      rows: layout.rows.map((row) =>
        row.id === rowId
          ? { ...row, grouping: { level, parentId, state: 'expanded' as const } }
          : row
      ),
    };
  }

  /**
   * Toggle group collapse/expand state
   */
  static toggleGroupState(layout: ReportLayout, rowId: string): ReportLayout {
    return {
      ...layout,
      rows: layout.rows.map((row) => {
        if (row.id !== rowId || !row.grouping) return row;
        return {
          ...row,
          grouping: {
            ...row.grouping,
            state: row.grouping.state === 'expanded' ? 'collapsed' : 'expanded',
          },
        };
      }),
    };
  }

  /**
   * Expand or collapse all children of a grouped row
   */
  static setGroupChildrenVisibility(
    layout: ReportLayout,
    parentRowId: string,
    visible: boolean
  ): ReportLayout {
    const parentRow = layout.rows.find((r) => r.id === parentRowId);
    if (!parentRow?.grouping) return layout;

    return {
      ...layout,
      rows: layout.rows.map((row) => {
        if (row.grouping?.parentId === parentRowId) {
          return { ...row, isVisible: visible };
        }
        return row;
      }),
    };
  }

  // ---------------------------------------------------------------------------
  // Formatting
  // ---------------------------------------------------------------------------

  /**
   * Apply a style to a cell
   */
  static applyCellStyle(cell: ReportCell, style: Partial<CellStyle>): ReportCell {
    return {
      ...cell,
      style: { ...cell.style, ...style },
    };
  }

  /**
   * Apply a style to an entire row
   */
  static applyRowStyle(
    layout: ReportLayout,
    rowIndex: number,
    style: Partial<CellStyle>
  ): ReportLayout {
    if (rowIndex < 0 || rowIndex >= layout.rows.length) {
      throw new Error(`Row index ${rowIndex} out of bounds`);
    }

    return {
      ...layout,
      rows: layout.rows.map((row, ri) => {
        if (ri !== rowIndex) return row;
        return {
          ...row,
          cells: row.cells.map((cell) => ({
            ...cell,
            style: { ...cell.style, ...style },
          })),
        };
      }),
    };
  }

  /**
   * Add conditional formatting to a metric or formula cell
   */
  static addConditionalFormat(cell: ReportCell, format: ConditionalFormat): ReportCell {
    if (cell.type !== 'metric' && cell.type !== 'formula') {
      throw new Error('Conditional formatting only applies to metric or formula cells');
    }

    const content = cell.content as { content: MetricCellContent | FormulaCellContent };
    const existingFormats = content.content.conditionalFormats ?? [];

    return {
      ...cell,
      content: {
        ...cell.content,
        content: {
          ...content.content,
          conditionalFormats: [...existingFormats, format],
        },
      } as CellContent,
    };
  }

  /**
   * Evaluate conditional formats and return the matching style
   */
  static evaluateConditionalFormats(
    formats: ConditionalFormat[],
    value: number
  ): Partial<CellStyle> | null {
    for (const format of formats) {
      if (this.matchesCondition(format.condition, value, format.value)) {
        return format.style;
      }
    }
    return null;
  }

  /**
   * Format a number according to the specified format
   */
  static formatNumber(value: number, format: NumberFormat, decimals = 2): string {
    if (!Number.isFinite(value)) return '#N/A';

    switch (format) {
      case 'currency': {
        const formatted = Math.abs(value).toFixed(decimals);
        const withCommas = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return value < 0 ? `($${withCommas})` : `$${withCommas}`;
      }
      case 'percentage':
        return `${(value * 100).toFixed(decimals)}%`;
      case 'compact': {
        const absValue = Math.abs(value);
        const sign = value < 0 ? '(' : '';
        const end = value < 0 ? ')' : '';
        if (absValue >= 1_000_000_000)
          return `${sign}$${(absValue / 1_000_000_000).toFixed(1)}B${end}`;
        if (absValue >= 1_000_000) return `${sign}$${(absValue / 1_000_000).toFixed(1)}M${end}`;
        if (absValue >= 1_000) return `${sign}$${(absValue / 1_000).toFixed(1)}K${end}`;
        return `${sign}$${absValue.toFixed(decimals)}${end}`;
      }
      case 'wholenumber':
        return Math.round(value).toLocaleString('en-US');
      case 'decimal':
      default:
        return value.toFixed(decimals);
    }
  }

  // ---------------------------------------------------------------------------
  // Sharing
  // ---------------------------------------------------------------------------

  /**
   * Share a report with a user
   */
  static shareReport(
    report: ReportDefinition,
    userId: string,
    permission: PermissionLevel,
    sharedBy: string
  ): ReportDefinition {
    const existingShareIndex = report.shares.findIndex((s) => s.userId === userId);
    const now = new Date().toISOString();

    let shares: ReportShare[];
    if (existingShareIndex >= 0) {
      shares = report.shares.map((s, i) =>
        i === existingShareIndex ? { ...s, permission, sharedAt: now, sharedBy } : s
      );
    } else {
      shares = [...report.shares, { userId, permission, sharedAt: now, sharedBy }];
    }

    return { ...report, shares, updatedAt: now };
  }

  /**
   * Remove sharing for a user
   */
  static unshareReport(report: ReportDefinition, userId: string): ReportDefinition {
    return {
      ...report,
      shares: report.shares.filter((s) => s.userId !== userId),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get the permission level for a user
   */
  static getUserPermission(report: ReportDefinition, userId: string): PermissionLevel | null {
    // Creator always has admin
    if (report.createdBy === userId) return 'admin';

    const share = report.shares.find((s) => s.userId === userId);
    return share?.permission ?? null;
  }

  // ---------------------------------------------------------------------------
  // Export
  // ---------------------------------------------------------------------------

  /**
   * Generate PDF export metadata for a report
   */
  static generatePDFMetadata(
    report: ReportDefinition,
    options?: Partial<PDFExportMetadata>
  ): PDFExportMetadata {
    return {
      reportId: report.id,
      title: report.name,
      subtitle: report.description || undefined,
      orientation: 'landscape',
      pageSize: 'letter',
      margins: { top: 72, bottom: 72, left: 54, right: 54 },
      showPageNumbers: true,
      showTimestamp: true,
      ...options,
    };
  }

  /**
   * Export report layout as serializable JSON (for save/load)
   */
  static exportLayout(layout: ReportLayout): string {
    return JSON.stringify(layout, null, 2);
  }

  /**
   * Import layout from JSON string
   */
  static importLayout(json: string): ReportLayout {
    try {
      const parsed = JSON.parse(json) as unknown;
      if (!this.isValidLayout(parsed)) {
        throw new Error('Invalid layout structure');
      }
      return parsed;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown parse error';
      throw new Error(`Failed to import layout: ${message}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  /**
   * Validate a report definition
   */
  static validateReport(report: ReportDefinition): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!report.name.trim()) {
      errors.push('Report name is required');
    }

    if (report.layout.rows.length === 0) {
      errors.push('Report must have at least one row');
    }

    if (report.layout.columns.length === 0) {
      errors.push('Report must have at least one column');
    }

    // Validate each row has the correct number of cells
    const expectedCellCount = report.layout.columns.length;
    for (let i = 0; i < report.layout.rows.length; i++) {
      const row = report.layout.rows[i];
      if (row!.cells.length !== expectedCellCount) {
        errors.push(`Row ${i} has ${row!.cells.length} cells but expected ${expectedCellCount}`);
      }
    }

    // Validate formula cells reference valid positions
    for (const row of report.layout.rows) {
      for (const cell of row.cells) {
        if (cell.type === 'formula') {
          const formulaContent = cell.content as { content: FormulaCellContent };
          const formula = formulaContent.content;
          if (!formula.expression.trim()) {
            errors.push('Formula cell has empty expression');
          }
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  // ---------------------------------------------------------------------------
  // Template Instantiation
  // ---------------------------------------------------------------------------

  /**
   * Get predefined layout for a report template
   */
  static getTemplateLayout(template: TemplateType): ReportLayout {
    switch (template) {
      case 'income_statement':
        return this.createIncomeStatementLayout();
      case 'balance_sheet':
        return this.createBalanceSheetLayout();
      case 'cash_flow':
        return this.createCashFlowLayout();
      case 'budget_vs_actual':
        return this.createBudgetVsActualLayout();
      case 'variance_analysis':
        return this.createVarianceAnalysisLayout();
      case 'board_pack':
        return this.createBoardPackLayout();
      case 'executive_summary':
        return this.createExecutiveSummaryLayout();
      case 'custom':
      default:
        return this.createEmptyLayout();
    }
  }

  /**
   * Get available templates with descriptions
   */
  static getAvailableTemplates(): Array<{ type: TemplateType; name: string; description: string }> {
    return [
      {
        type: 'income_statement',
        name: 'Income Statement',
        description: 'Revenue, expenses, and net income by period',
      },
      {
        type: 'balance_sheet',
        name: 'Balance Sheet',
        description: 'Assets, liabilities, and equity snapshot',
      },
      {
        type: 'cash_flow',
        name: 'Cash Flow Statement',
        description: 'Operating, investing, and financing activities',
      },
      {
        type: 'budget_vs_actual',
        name: 'Budget vs Actual',
        description: 'Compare budget to actual performance',
      },
      {
        type: 'variance_analysis',
        name: 'Variance Analysis',
        description: 'Detailed variance breakdown with explanations',
      },
      {
        type: 'board_pack',
        name: 'Board Pack',
        description: 'Comprehensive board meeting report package',
      },
      {
        type: 'executive_summary',
        name: 'Executive Summary',
        description: 'High-level KPIs and trends for leadership',
      },
      { type: 'custom', name: 'Custom (Blank)', description: 'Start from a blank canvas' },
    ];
  }

  // ---------------------------------------------------------------------------
  // Aggregate Queries
  // ---------------------------------------------------------------------------

  /**
   * Get visible rows only (for rendering)
   */
  static getVisibleRows(layout: ReportLayout): ReportRow[] {
    return layout.rows.filter((row) => row.isVisible);
  }

  /**
   * Get visible columns only (for rendering)
   */
  static getVisibleColumns(layout: ReportLayout): ReportColumn[] {
    return layout.columns.filter((col) => col.isVisible);
  }

  /**
   * Get row by ID
   */
  static getRowById(layout: ReportLayout, rowId: string): ReportRow | undefined {
    return layout.rows.find((r) => r.id === rowId);
  }

  /**
   * Get column by ID
   */
  static getColumnById(layout: ReportLayout, columnId: string): ReportColumn | undefined {
    return layout.columns.find((c) => c.id === columnId);
  }

  /**
   * Count cells by type across the entire layout
   */
  static countCellsByType(layout: ReportLayout): Record<CellType, number> {
    const counts: Record<CellType, number> = {
      metric: 0,
      formula: 0,
      text: 0,
      chart: 0,
      table: 0,
    };

    for (const row of layout.rows) {
      for (const cell of row.cells) {
        counts[cell.type]++;
      }
    }

    return counts;
  }

  // ---------------------------------------------------------------------------
  // Private Helpers
  // ---------------------------------------------------------------------------

  private static idCounter = 0;

  private static generateId(): string {
    this.idCounter++;
    return `rpt_${Date.now()}_${this.idCounter}_${Math.random().toString(36).slice(2, 8)}`;
  }

  private static createEmptyCell(type: CellType): ReportCell {
    const defaultContent: CellContent =
      type === 'text'
        ? { type: 'text', content: { text: '' } }
        : {
            type: 'metric',
            content: { coords: '', measure: '', format: 'currency', decimals: 0, showSign: false },
          };

    return {
      id: this.generateId(),
      type,
      content: defaultContent,
      style: { ...DEFAULT_CELL_STYLE },
      colspan: 1,
      rowspan: 1,
      isVisible: true,
    };
  }

  private static createEmptyLayout(): ReportLayout {
    return {
      rows: [],
      columns: [],
      columnWidths: {},
      defaultRowHeight: 28,
      frozenColumns: 1,
      frozenRows: 1,
    };
  }

  private static matchesCondition(
    operator: ConditionOperator,
    actual: number,
    threshold: number
  ): boolean {
    switch (operator) {
      case 'gt':
        return actual > threshold;
      case 'lt':
        return actual < threshold;
      case 'gte':
        return actual >= threshold;
      case 'lte':
        return actual <= threshold;
      case 'eq':
        return actual === threshold;
      case 'neq':
        return actual !== threshold;
      default:
        return false;
    }
  }

  private static isValidLayout(value: unknown): value is ReportLayout {
    if (typeof value !== 'object' || value === null) return false;
    const obj = value as Record<string, unknown>;
    return (
      Array.isArray(obj.rows) &&
      Array.isArray(obj.columns) &&
      typeof obj.columnWidths === 'object' &&
      typeof obj.defaultRowHeight === 'number'
    );
  }

  // ---------------------------------------------------------------------------
  // Template Layouts
  // ---------------------------------------------------------------------------

  private static createIncomeStatementLayout(): ReportLayout {
    const labelColId = this.generateId();
    const actualColId = this.generateId();
    const budgetColId = this.generateId();
    const varianceColId = this.generateId();

    const columns: ReportColumn[] = [
      {
        id: labelColId,
        type: 'label',
        header: 'Line Item',
        width: 240,
        isVisible: true,
        isLocked: true,
      },
      {
        id: actualColId,
        type: 'period',
        header: 'Actual',
        width: 140,
        period: 'actual',
        isVisible: true,
        isLocked: false,
      },
      {
        id: budgetColId,
        type: 'period',
        header: 'Budget',
        width: 140,
        period: 'budget',
        isVisible: true,
        isLocked: false,
      },
      {
        id: varianceColId,
        type: 'period',
        header: 'Variance',
        width: 140,
        period: 'variance',
        isVisible: true,
        isLocked: false,
      },
    ];

    const lineItems = [
      { label: 'Revenue', type: 'data' as RowType },
      { label: '  Product Revenue', type: 'data' as RowType },
      { label: '  Service Revenue', type: 'data' as RowType },
      { label: 'Total Revenue', type: 'subtotal' as RowType },
      { label: '', type: 'blank' as RowType },
      { label: 'Cost of Goods Sold', type: 'data' as RowType },
      { label: '  Materials', type: 'data' as RowType },
      { label: '  Labor', type: 'data' as RowType },
      { label: 'Total COGS', type: 'subtotal' as RowType },
      { label: '', type: 'blank' as RowType },
      { label: 'Gross Profit', type: 'subtotal' as RowType },
      { label: '', type: 'blank' as RowType },
      { label: 'Operating Expenses', type: 'data' as RowType },
      { label: '  Sales & Marketing', type: 'data' as RowType },
      { label: '  Research & Development', type: 'data' as RowType },
      { label: '  General & Administrative', type: 'data' as RowType },
      { label: 'Total OpEx', type: 'subtotal' as RowType },
      { label: '', type: 'blank' as RowType },
      { label: 'EBITDA', type: 'total' as RowType },
      { label: 'Net Income', type: 'total' as RowType },
    ];

    const rows: ReportRow[] = lineItems.map((item) => ({
      id: this.generateId(),
      type: item.type,
      cells: columns.map((col) => {
        if (col.type === 'label') {
          return {
            ...this.createEmptyCell('text'),
            content: {
              type: 'text' as const,
              content: {
                text: item.label,
                style: item.type === 'total' || item.type === 'subtotal' ? TOTAL_STYLE : undefined,
              },
            },
          };
        }
        return this.createEmptyCell('metric');
      }),
      height: 28,
      isVisible: item.type !== 'blank' || item.label !== '',
      pageBreakBefore: false,
    }));

    return {
      rows,
      columns,
      columnWidths: {
        [labelColId]: 240,
        [actualColId]: 140,
        [budgetColId]: 140,
        [varianceColId]: 140,
      },
      defaultRowHeight: 28,
      frozenColumns: 1,
      frozenRows: 1,
    };
  }

  private static createBalanceSheetLayout(): ReportLayout {
    const labelColId = this.generateId();
    const currentColId = this.generateId();
    const priorColId = this.generateId();

    const columns: ReportColumn[] = [
      {
        id: labelColId,
        type: 'label',
        header: 'Account',
        width: 240,
        isVisible: true,
        isLocked: true,
      },
      {
        id: currentColId,
        type: 'period',
        header: 'Current Period',
        width: 160,
        period: 'actual',
        isVisible: true,
        isLocked: false,
      },
      {
        id: priorColId,
        type: 'period',
        header: 'Prior Period',
        width: 160,
        period: 'actual',
        isVisible: true,
        isLocked: false,
      },
    ];

    const lineItems = [
      'ASSETS',
      'Current Assets',
      '  Cash & Equivalents',
      '  Accounts Receivable',
      '  Inventory',
      'Total Current Assets',
      '',
      'Non-Current Assets',
      '  Property, Plant & Equipment',
      '  Intangible Assets',
      'Total Non-Current Assets',
      'TOTAL ASSETS',
      '',
      'LIABILITIES',
      'Current Liabilities',
      '  Accounts Payable',
      '  Short-term Debt',
      'Total Current Liabilities',
      '',
      'Non-Current Liabilities',
      '  Long-term Debt',
      'Total Non-Current Liabilities',
      'TOTAL LIABILITIES',
      '',
      'EQUITY',
      '  Common Stock',
      '  Retained Earnings',
      'TOTAL EQUITY',
      '',
      'TOTAL LIABILITIES & EQUITY',
    ];

    const rows: ReportRow[] = lineItems.map((label) => ({
      id: this.generateId(),
      type:
        label === ''
          ? ('blank' as RowType)
          : label.startsWith('TOTAL') ||
              label === 'ASSETS' ||
              label === 'LIABILITIES' ||
              label === 'EQUITY'
            ? ('total' as RowType)
            : label.startsWith('  ')
              ? ('data' as RowType)
              : ('subtotal' as RowType),
      cells: columns.map((col) => {
        if (col.type === 'label') {
          return {
            ...this.createEmptyCell('text'),
            content: { type: 'text' as const, content: { text: label } },
          };
        }
        return this.createEmptyCell('metric');
      }),
      height: 28,
      isVisible: label !== '',
      pageBreakBefore: false,
    }));

    return {
      rows,
      columns,
      columnWidths: { [labelColId]: 240, [currentColId]: 160, [priorColId]: 160 },
      defaultRowHeight: 28,
      frozenColumns: 1,
      frozenRows: 1,
    };
  }

  private static createCashFlowLayout(): ReportLayout {
    const labelColId = this.generateId();
    const currentColId = this.generateId();
    const priorColId = this.generateId();

    const columns: ReportColumn[] = [
      {
        id: labelColId,
        type: 'label',
        header: 'Activity',
        width: 260,
        isVisible: true,
        isLocked: true,
      },
      {
        id: currentColId,
        type: 'period',
        header: 'Current Period',
        width: 150,
        period: 'actual',
        isVisible: true,
        isLocked: false,
      },
      {
        id: priorColId,
        type: 'period',
        header: 'Prior Period',
        width: 150,
        period: 'actual',
        isVisible: true,
        isLocked: false,
      },
    ];

    const lineItems = [
      'OPERATING ACTIVITIES',
      '  Net Income',
      '  Depreciation & Amortization',
      '  Changes in Working Capital',
      'Net Cash from Operations',
      '',
      'INVESTING ACTIVITIES',
      '  Capital Expenditures',
      '  Acquisitions',
      'Net Cash from Investing',
      '',
      'FINANCING ACTIVITIES',
      '  Debt Repayment',
      '  Dividends Paid',
      '  Share Buybacks',
      'Net Cash from Financing',
      '',
      'NET CHANGE IN CASH',
      'Beginning Cash Balance',
      'ENDING CASH BALANCE',
    ];

    const rows: ReportRow[] = lineItems.map((label) => ({
      id: this.generateId(),
      type:
        label === ''
          ? ('blank' as RowType)
          : label.startsWith('Net') ||
              label.startsWith('ENDING') ||
              label.startsWith('OPERATING') ||
              label.startsWith('INVESTING') ||
              label.startsWith('FINANCING')
            ? ('total' as RowType)
            : label.startsWith('  ')
              ? ('data' as RowType)
              : ('subtotal' as RowType),
      cells: columns.map((col) => {
        if (col.type === 'label') {
          return {
            ...this.createEmptyCell('text'),
            content: { type: 'text' as const, content: { text: label } },
          };
        }
        return this.createEmptyCell('metric');
      }),
      height: 28,
      isVisible: label !== '',
      pageBreakBefore: false,
    }));

    return {
      rows,
      columns,
      columnWidths: { [labelColId]: 260, [currentColId]: 150, [priorColId]: 150 },
      defaultRowHeight: 28,
      frozenColumns: 1,
      frozenRows: 1,
    };
  }

  private static createBudgetVsActualLayout(): ReportLayout {
    const labelColId = this.generateId();
    const actualColId = this.generateId();
    const budgetColId = this.generateId();
    const varAmtColId = this.generateId();
    const varPctColId = this.generateId();

    const columns: ReportColumn[] = [
      {
        id: labelColId,
        type: 'label',
        header: 'Category',
        width: 200,
        isVisible: true,
        isLocked: true,
      },
      {
        id: actualColId,
        type: 'period',
        header: 'Actual',
        width: 120,
        period: 'actual',
        isVisible: true,
        isLocked: false,
      },
      {
        id: budgetColId,
        type: 'period',
        header: 'Budget',
        width: 120,
        period: 'budget',
        isVisible: true,
        isLocked: false,
      },
      {
        id: varAmtColId,
        type: 'period',
        header: 'Var ($)',
        width: 120,
        period: 'variance',
        isVisible: true,
        isLocked: false,
      },
      {
        id: varPctColId,
        type: 'period',
        header: 'Var (%)',
        width: 100,
        period: 'variance',
        isVisible: true,
        isLocked: false,
      },
    ];

    const rows: ReportRow[] = [
      'Revenue',
      'COGS',
      'Gross Profit',
      'Operating Expenses',
      'EBITDA',
      'Net Income',
    ].map((label) => ({
      id: this.generateId(),
      type: (label === 'Gross Profit' || label === 'EBITDA' || label === 'Net Income'
        ? 'subtotal'
        : 'data') as RowType,
      cells: columns.map((col) => {
        if (col.type === 'label') {
          return {
            ...this.createEmptyCell('text'),
            content: { type: 'text' as const, content: { text: label } },
          };
        }
        return this.createEmptyCell('metric');
      }),
      height: 28,
      isVisible: true,
      pageBreakBefore: false,
    }));

    return {
      rows,
      columns,
      columnWidths: {
        [labelColId]: 200,
        [actualColId]: 120,
        [budgetColId]: 120,
        [varAmtColId]: 120,
        [varPctColId]: 100,
      },
      defaultRowHeight: 28,
      frozenColumns: 1,
      frozenRows: 1,
    };
  }

  private static createVarianceAnalysisLayout(): ReportLayout {
    const labelColId = this.generateId();
    const actualColId = this.generateId();
    const budgetColId = this.generateId();
    const varAmtColId = this.generateId();
    const varPctColId = this.generateId();
    const explanationColId = this.generateId();

    const columns: ReportColumn[] = [
      {
        id: labelColId,
        type: 'label',
        header: 'Line Item',
        width: 180,
        isVisible: true,
        isLocked: true,
      },
      {
        id: actualColId,
        type: 'period',
        header: 'Actual',
        width: 110,
        period: 'actual',
        isVisible: true,
        isLocked: false,
      },
      {
        id: budgetColId,
        type: 'period',
        header: 'Budget',
        width: 110,
        period: 'budget',
        isVisible: true,
        isLocked: false,
      },
      {
        id: varAmtColId,
        type: 'period',
        header: 'Variance ($)',
        width: 110,
        period: 'variance',
        isVisible: true,
        isLocked: false,
      },
      {
        id: varPctColId,
        type: 'period',
        header: 'Variance (%)',
        width: 100,
        period: 'variance',
        isVisible: true,
        isLocked: false,
      },
      {
        id: explanationColId,
        type: 'custom',
        header: 'Explanation',
        width: 240,
        isVisible: true,
        isLocked: false,
      },
    ];

    const rows: ReportRow[] = ['Revenue', 'COGS', 'Gross Margin', 'OpEx', 'EBITDA'].map(
      (label) => ({
        id: this.generateId(),
        type: (label === 'Gross Margin' || label === 'EBITDA' ? 'subtotal' : 'data') as RowType,
        cells: columns.map((col) => {
          if (col.type === 'label') {
            return {
              ...this.createEmptyCell('text'),
              content: { type: 'text' as const, content: { text: label } },
            };
          }
          if (col.type === 'custom') {
            return this.createEmptyCell('text');
          }
          return this.createEmptyCell('metric');
        }),
        height: 28,
        isVisible: true,
        pageBreakBefore: false,
      })
    );

    return {
      rows,
      columns,
      columnWidths: {
        [labelColId]: 180,
        [actualColId]: 110,
        [budgetColId]: 110,
        [varAmtColId]: 110,
        [varPctColId]: 100,
        [explanationColId]: 240,
      },
      defaultRowHeight: 28,
      frozenColumns: 1,
      frozenRows: 1,
    };
  }

  private static createBoardPackLayout(): ReportLayout {
    const labelColId = this.generateId();
    const currentColId = this.generateId();
    const priorColId = this.generateId();

    const columns: ReportColumn[] = [
      { id: labelColId, type: 'label', header: 'KPI', width: 220, isVisible: true, isLocked: true },
      {
        id: currentColId,
        type: 'period',
        header: 'Current',
        width: 150,
        period: 'actual',
        isVisible: true,
        isLocked: false,
      },
      {
        id: priorColId,
        type: 'period',
        header: 'Prior Year',
        width: 150,
        period: 'actual',
        isVisible: true,
        isLocked: false,
      },
    ];

    const kpis = [
      'Revenue',
      'Revenue Growth %',
      'Gross Margin %',
      'EBITDA',
      'EBITDA Margin %',
      'Net Income',
      'Cash & Equivalents',
      'Total Debt',
      'Headcount',
      'ARR',
      'Customer Count',
      'Net Revenue Retention %',
    ];

    const rows: ReportRow[] = kpis.map((kpi) => ({
      id: this.generateId(),
      type: 'data' as RowType,
      cells: columns.map((col) => {
        if (col.type === 'label') {
          return {
            ...this.createEmptyCell('text'),
            content: { type: 'text' as const, content: { text: kpi } },
          };
        }
        return this.createEmptyCell('metric');
      }),
      height: 28,
      isVisible: true,
      pageBreakBefore: false,
    }));

    return {
      rows,
      columns,
      columnWidths: { [labelColId]: 220, [currentColId]: 150, [priorColId]: 150 },
      defaultRowHeight: 28,
      frozenColumns: 1,
      frozenRows: 1,
    };
  }

  private static createExecutiveSummaryLayout(): ReportLayout {
    const labelColId = this.generateId();
    const valueColId = this.generateId();
    const trendColId = this.generateId();

    const columns: ReportColumn[] = [
      {
        id: labelColId,
        type: 'label',
        header: 'Metric',
        width: 200,
        isVisible: true,
        isLocked: true,
      },
      {
        id: valueColId,
        type: 'period',
        header: 'Value',
        width: 160,
        period: 'actual',
        isVisible: true,
        isLocked: false,
      },
      {
        id: trendColId,
        type: 'custom',
        header: 'Trend',
        width: 180,
        isVisible: true,
        isLocked: false,
      },
    ];

    const metrics = [
      'Total Revenue',
      'Revenue YoY Growth',
      'Gross Margin',
      'Operating Income',
      'Free Cash Flow',
      'Cash Runway (months)',
    ];

    const rows: ReportRow[] = metrics.map((metric) => ({
      id: this.generateId(),
      type: 'data' as RowType,
      cells: [
        {
          ...this.createEmptyCell('text'),
          content: { type: 'text' as const, content: { text: metric } },
        },
        this.createEmptyCell('metric'),
        this.createEmptyCell('chart'),
      ],
      height: 36,
      isVisible: true,
      pageBreakBefore: false,
    }));

    return {
      rows,
      columns,
      columnWidths: { [labelColId]: 200, [valueColId]: 160, [trendColId]: 180 },
      defaultRowHeight: 36,
      frozenColumns: 1,
      frozenRows: 1,
    };
  }

  // ---------------------------------------------------------------------------
  // Data Binding — Resolve Cell Values from Cube Data
  // ---------------------------------------------------------------------------

  /**
   * Build a composite lookup key from a cell binding
   */
  static buildBindingKey(binding: CellBinding): string {
    const parts = [binding.coords, binding.measure];
    if (binding.entityId) parts.push(binding.entityId);
    if (binding.scenarioId) parts.push(binding.scenarioId);
    if (binding.periodId) parts.push(binding.periodId);
    return parts.join('.');
  }

  /**
   * Resolve a single cell's value from cube data
   */
  static resolveCellValue(cell: ReportCell, cubeData: CubeData): ResolvedCell {
    const base: ResolvedCell = {
      cellId: cell.id,
      rawValue: null,
      formattedValue: '',
      binding: null,
    };

    if (cell.type === 'text') {
      const textContent = cell.content as { content: { text: string } };
      base.rawValue = textContent.content.text;
      base.formattedValue = textContent.content.text;
      return base;
    }

    if (cell.type === 'metric') {
      const metricContent = cell.content as { content: MetricCellContent };
      const mc = metricContent.content;
      const binding: CellBinding = {
        coords: mc.coords,
        measure: mc.measure,
        entityId: mc.entityId,
        scenarioId: mc.scenarioId,
        periodId: mc.periodId,
      };
      base.binding = binding;

      const key = this.buildBindingKey(binding);
      const value = cubeData[key];

      if (value !== undefined && value !== null) {
        const numValue = typeof value === 'number' ? value : Number(value);
        if (Number.isFinite(numValue)) {
          base.rawValue = numValue;
          base.formattedValue = this.formatNumber(numValue, mc.format, mc.decimals);
        } else {
          base.rawValue = String(value);
          base.formattedValue = String(value);
        }
      } else {
        base.rawValue = null;
        base.formattedValue = '—';
      }
      return base;
    }

    if (cell.type === 'formula') {
      const formulaContent = cell.content as { content: FormulaCellContent };
      base.rawValue = null;
      base.formattedValue = formulaContent.content.label ?? formulaContent.content.expression;
      return base;
    }

    if (cell.type === 'chart') {
      const chartContent = cell.content as { content: ChartElementContent };
      base.rawValue = null;
      base.formattedValue = `[Chart: ${chartContent.content.title}]`;
      return base;
    }

    if (cell.type === 'table') {
      base.rawValue = null;
      base.formattedValue = '[Table]';
      return base;
    }

    return base;
  }

  /**
   * Resolve all metric cells in a layout using cube data
   */
  static resolveLayout(layout: ReportLayout, cubeData: CubeData): ResolvedCell[][] {
    return layout.rows.map((row) => row.cells.map((cell) => this.resolveCellValue(cell, cubeData)));
  }

  /**
   * Build a lookup key from metric cell content
   */
  static buildMetricKey(content: MetricCellContent): string {
    const binding: CellBinding = {
      coords: content.coords,
      measure: content.measure,
      entityId: content.entityId,
      scenarioId: content.scenarioId,
      periodId: content.periodId,
    };
    return this.buildBindingKey(binding);
  }

  // ---------------------------------------------------------------------------
  // Subtotal / Total Calculations
  // ---------------------------------------------------------------------------

  /**
   * Calculate the sum of numeric values from resolved cells in a column
   */
  static calculateColumnSum(
    resolvedCells: ResolvedCell[][],
    columnIndex: number,
    startRow: number,
    endRow: number
  ): number {
    let sum = 0;
    for (let i = startRow; i <= endRow && i < resolvedCells.length; i++) {
      const cell = resolvedCells[i]?.[columnIndex];
      if (cell && typeof cell.rawValue === 'number' && Number.isFinite(cell.rawValue)) {
        sum += cell.rawValue;
      }
    }
    return sum;
  }

  /**
   * Identify subtotal/total row ranges in a layout
   * Returns groups of consecutive 'data' rows followed by a 'subtotal' or 'total' row
   */
  static identifySectionRanges(layout: ReportLayout): Array<{
    type: 'data' | 'subtotal' | 'total';
    startIndex: number;
    endIndex: number;
  }> {
    const sections: Array<{
      type: 'data' | 'subtotal' | 'total';
      startIndex: number;
      endIndex: number;
    }> = [];
    let currentType: 'data' | 'subtotal' | 'total' | null = null;
    let startIndex = 0;

    for (let i = 0; i < layout.rows.length; i++) {
      const rowType = layout.rows[i]!.type;
      const normalizedType: 'data' | 'subtotal' | 'total' =
        rowType === 'data' || rowType === 'header'
          ? 'data'
          : rowType === 'subtotal'
            ? 'subtotal'
            : rowType === 'total'
              ? 'total'
              : 'data';

      if (normalizedType !== currentType) {
        if (currentType !== null) {
          sections.push({ type: currentType, startIndex, endIndex: i - 1 });
        }
        currentType = normalizedType;
        startIndex = i;
      }
    }

    if (currentType !== null) {
      sections.push({ type: currentType, startIndex, endIndex: layout.rows.length - 1 });
    }

    return sections;
  }

  /**
   * Auto-populate subtotal/total rows by summing preceding data rows
   */
  static autoPopulateTotals(
    layout: ReportLayout,
    cubeData: CubeData,
    numberFormat: NumberFormat = 'currency',
    decimals = 0
  ): ReportLayout {
    const resolved = this.resolveLayout(layout, cubeData);
    const sections = this.identifySectionRanges(layout);

    const rows = layout.rows.map((row) => ({ ...row, cells: [...row.cells] }));

    for (const section of sections) {
      if (section.type !== 'subtotal' && section.type !== 'total') continue;

      // Find the preceding data section
      const precedingData = sections.filter(
        (s) => s.type === 'data' && s.endIndex < section.startIndex
      );
      if (precedingData.length === 0) continue;

      const dataSection = precedingData[precedingData.length - 1];

      for (let colIdx = 0; colIdx < layout.columns.length; colIdx++) {
        const col = layout.columns[colIdx];
        if (col!.type === 'label') continue;

        const _sum = this.calculateColumnSum(
          resolved,
          colIdx,
          dataSection!.startIndex,
          dataSection!.endIndex
        );
        const existingCell = rows![section.startIndex]!.cells[colIdx];

        if (existingCell?.type === 'metric') {
          const updatedCell: ReportCell = {
            ...(existingCell as ReportCell),
            content: {
              type: 'metric' as const,
              content: {
                coords: `Auto.${section.type}.${colIdx}`,
                measure: 'sum',
                format: numberFormat,
                decimals,
                showSign: false,
              },
            },
          };
          rows![section.startIndex]!.cells[colIdx] = updatedCell;
        }
      }
    }

    return { ...layout, rows };
  }

  // ---------------------------------------------------------------------------
  // Formula Evaluation
  // ---------------------------------------------------------------------------

  /**
   * Parse formula references (e.g., "A1+B2*2" -> ["A1", "B2"])
   */
  static parseFormulaReferences(expression: string): string[] {
    const refPattern = /[A-Z]+\d+/g;
    return [...new Set(expression.match(refPattern) ?? [])];
  }

  /**
   * Evaluate a simple arithmetic formula with cell references
   * Supports: +, -, *, /, parentheses, and cell references (e.g., A1, B2)
   */
  static evaluateFormula(expression: string, cellValues: Record<string, number>): number {
    // Replace cell references with their values
    let resolved = expression;
    const refs = this.parseFormulaReferences(expression);

    for (const ref of refs) {
      const value = cellValues[ref];
      if (value === undefined) {
        throw new Error(`Missing value for cell reference: ${ref}`);
      }
      if (!Number.isFinite(value)) {
        throw new Error(`Non-finite value for cell reference: ${ref}`);
      }
      resolved = resolved.replace(new RegExp(ref, 'g'), String(value));
    }

    // Safe arithmetic evaluation (no eval)
    return this.safeEvaluate(resolved);
  }

  /**
   * Safe arithmetic evaluator — supports +, -, *, /, parentheses, decimals, negatives
   */
  static safeEvaluate(expression: string): number {
    const tokens = this.tokenize(expression);
    const result = this.parseExpression(tokens, { pos: 0 });

    if (!Number.isFinite(result)) {
      throw new Error('Formula result is not a finite number');
    }
    return result;
  }

  private static tokenize(expr: string): string[] {
    const tokens: string[] = [];
    let i = 0;
    const s = expr.replace(/\s+/g, '');

    while (i < s.length) {
      const ch = s[i]!;

      // Number (including negative at start or after operator/open-paren)
      if (
        (ch >= '0' && ch <= '9') ||
        (ch === '.' && i + 1 < s.length && s[i + 1]! >= '0' && s[i + 1]! <= '9') ||
        (ch === '-' &&
          (tokens.length === 0 ||
            tokens[tokens.length - 1] === '(' ||
            '+-*/('.includes(tokens[tokens.length - 1] ?? '')))
      ) {
        let num: string = ch;
        i++;
        while (i < s.length && ((s[i]! >= '0' && s[i]! <= '9') || s[i] === '.')) {
          num += s[i]!;
          i++;
        }
        tokens.push(num);
      } else if ('+-*/()'.includes(ch)) {
        tokens.push(ch);
        i++;
      } else {
        // Skip unknown characters
        i++;
      }
    }
    return tokens;
  }

  private static parseExpression(tokens: string[], ctx: { pos: number }): number {
    let result = this.parseTerm(tokens, ctx);

    while (ctx.pos < tokens.length && (tokens[ctx.pos] === '+' || tokens[ctx.pos] === '-')) {
      const op = tokens[ctx.pos];
      ctx.pos++;
      const right = this.parseTerm(tokens, ctx);
      result = op === '+' ? result + right : result - right;
    }

    return result;
  }

  private static parseTerm(tokens: string[], ctx: { pos: number }): number {
    let result = this.parseFactor(tokens, ctx);

    while (ctx.pos < tokens.length && (tokens[ctx.pos] === '*' || tokens[ctx.pos] === '/')) {
      const op = tokens[ctx.pos];
      ctx.pos++;
      const right = this.parseFactor(tokens, ctx);
      if (op === '/' && right === 0) {
        throw new Error('Division by zero');
      }
      result = op === '*' ? result * right : result / right;
    }

    return result;
  }

  private static parseFactor(tokens: string[], ctx: { pos: number }): number {
    if (ctx.pos >= tokens.length) {
      throw new Error('Unexpected end of expression');
    }

    const token = tokens[ctx.pos];

    if (token === '(') {
      ctx.pos++;
      const result = this.parseExpression(tokens, ctx);
      if (ctx.pos >= tokens.length || tokens[ctx.pos] !== ')') {
        throw new Error('Missing closing parenthesis');
      }
      ctx.pos++;
      return result;
    }

    ctx.pos++;
    const num = Number(token);
    if (!Number.isFinite(num)) {
      throw new Error(`Invalid number: ${token}`);
    }
    return num;
  }

  // ---------------------------------------------------------------------------
  // Circular Reference Detection
  // ---------------------------------------------------------------------------

  /**
   * Detect circular references in formula cells within a layout
   * Returns an array of cell IDs that participate in circular references
   */
  static detectCircularReferences(layout: ReportLayout): FormulaDependency[] {
    // Build dependency graph from formula cells
    const cellIdMap = new Map<string, { row: number; col: number }>();
    const dependencies = new Map<string, string[]>();

    for (let ri = 0; ri < layout.rows.length; ri++) {
      for (let ci = 0; ci < layout.rows[ri]!.cells.length; ci++) {
        const cell = layout.rows[ri]!.cells[ci];
        cellIdMap.set(cell!.id, { row: ri, col: ci });

        if (cell!.type === 'formula') {
          const formulaContent = cell!.content as { content: FormulaCellContent };
          const refs = this.parseFormulaReferences(formulaContent.content.expression);
          // Convert positional refs (A1, B2) to cell IDs by mapping column letter + row number
          const depIds: string[] = [];
          for (const ref of refs) {
            const colLetter = ref.match(/[A-Z]+/)?.[0] ?? '';
            const rowNum = parseInt(ref.match(/\d+/)?.[0] ?? '0', 10);
            const colIndex = this.columnLetterToIndex(colLetter);
            if (colIndex >= 0 && rowNum >= 1 && rowNum <= layout.rows.length) {
              const targetCell = layout.rows[rowNum - 1]?.cells[colIndex];
              if (targetCell) {
                depIds.push(targetCell.id);
              }
            }
          }
          dependencies.set(cell!.id, depIds);
        }
      }
    }

    // DFS cycle detection
    const results: FormulaDependency[] = [];
    const visited = new Set<string>();
    const inStack = new Set<string>();

    const dfs = (cellId: string, path: string[]): boolean => {
      if (inStack.has(cellId)) {
        // Found a cycle — mark all nodes in the cycle
        return true;
      }
      if (visited.has(cellId)) return false;

      visited.add(cellId);
      inStack.add(cellId);

      const deps = dependencies.get(cellId) ?? [];
      let hasCycle = false;
      for (const dep of deps) {
        if (dfs(dep, [...path, cellId])) {
          hasCycle = true;
        }
      }

      inStack.delete(cellId);

      if (hasCycle || deps.some((d) => inStack.has(d))) {
        results.push({
          cellId,
          references: deps,
          hasCircularRef: true,
        });
      } else {
        results.push({
          cellId,
          references: deps,
          hasCircularRef: false,
        });
      }

      return hasCycle;
    };

    for (const cellId of dependencies.keys()) {
      if (!visited.has(cellId)) {
        dfs(cellId, []);
      }
    }

    return results;
  }

  /**
   * Convert column letter (A, B, ..., Z, AA, AB...) to 0-based index
   */
  static columnLetterToIndex(letter: string): number {
    let index = 0;
    for (let i = 0; i < letter.length; i++) {
      index = index * 26 + (letter.charCodeAt(i) - 64);
    }
    return index - 1;
  }

  /**
   * Convert 0-based column index to letter (0 -> A, 1 -> B, ..., 25 -> Z, 26 -> AA)
   */
  static columnIndexToLetter(index: number): string {
    let letter = '';
    let n = index + 1;
    while (n > 0) {
      const rem = (n - 1) % 26;
      letter = String.fromCharCode(65 + rem) + letter;
      n = Math.floor((n - 1) / 26);
    }
    return letter;
  }

  // ---------------------------------------------------------------------------
  // Excel Export Generation
  // ---------------------------------------------------------------------------

  /**
   * Generate Excel-compatible data from a report definition and cube data
   */
  static generateExcelExport(report: ReportDefinition, cubeData: CubeData): ExcelExportResult {
    const resolved = this.resolveLayout(report.layout, cubeData);
    const visibleColumns = this.getVisibleColumns(report.layout);

    // Build header row from column headers
    const headerRow = visibleColumns.map((col) => col.header);

    // Build data rows
    const dataRows: Array<Array<string | number | boolean | null>> = [];

    const _visibleRows = this.getVisibleRows(report.layout);
    for (let ri = 0; ri < report.layout.rows.length; ri++) {
      const row = report.layout.rows[ri];
      if (!row!.isVisible) continue;

      const excelRow: Array<string | number | boolean | null> = [];
      for (let ci = 0; ci < report.layout.columns.length; ci++) {
        const col = report.layout.columns[ci];
        if (!col!.isVisible) continue;

        const cell = resolved[ri]?.[ci];
        if (cell) {
          excelRow.push(cell.rawValue);
        } else {
          excelRow.push(null);
        }
      }
      dataRows.push(excelRow);
    }

    const columnWidths = visibleColumns.map((col) => col.width);

    return {
      sheets: [
        {
          name: report.name.substring(0, 31), // Excel sheet name limit
          data: [headerRow, ...dataRows],
          columnWidths,
        },
      ],
      metadata: {
        title: report.name,
        createdAt: new Date().toISOString(),
        author: report.createdBy,
        orientation: 'landscape',
      },
    };
  }

  // ---------------------------------------------------------------------------
  // CSV Export Generation
  // ---------------------------------------------------------------------------

  /**
   * Generate CSV content from a report definition and cube data
   */
  static generateCSVExport(report: ReportDefinition, cubeData: CubeData): CSVExportResult {
    const resolved = this.resolveLayout(report.layout, cubeData);
    const visibleColumns = this.getVisibleColumns(report.layout);

    const escapeCSV = (value: string | number | boolean | null): string => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const lines: string[] = [];

    // Header line
    const headerLine = visibleColumns.map((col) => escapeCSV(col.header)).join(',');
    lines.push(headerLine);

    // Data lines
    for (let ri = 0; ri < report.layout.rows.length; ri++) {
      const row = report.layout.rows[ri];
      if (!row!.isVisible) continue;

      const csvCells: string[] = [];
      for (let ci = 0; ci < report.layout.columns.length; ci++) {
        const col = report.layout.columns[ci];
        if (!col!.isVisible) continue;

        const cell = resolved[ri]?.[ci];
        if (cell) {
          csvCells.push(escapeCSV(cell.rawValue));
        } else {
          csvCells.push('');
        }
      }
      lines.push(csvCells.join(','));
    }

    const safeName = report.name.replace(/[^a-zA-Z0-9_-]/g, '_');

    return {
      content: lines.join('\n'),
      filename: `${safeName}.csv`,
      mimeType: 'text/csv',
    };
  }

  // ---------------------------------------------------------------------------
  // Report Parameters
  // ---------------------------------------------------------------------------

  /**
   * Add a parameter to a report definition
   */
  static addParameter(report: ReportDefinition, parameter: ReportParameter): ReportDefinition {
    const existing =
      (report as ReportDefinition & { parameters?: ReportParameter[] }).parameters ?? [];
    if (existing.some((p) => p.id === parameter.id)) {
      throw new Error(`Parameter "${parameter.id}" already exists`);
    }

    return {
      ...report,
      parameters: [...existing, parameter],
      updatedAt: new Date().toISOString(),
      version: report.version + 1,
    } as ReportDefinition;
  }

  /**
   * Update a parameter value in a report definition
   */
  static updateParameterValue(
    report: ReportDefinition,
    parameterId: string,
    value: string | number | boolean
  ): ReportDefinition {
    const existing =
      (report as ReportDefinition & { parameters?: ReportParameter[] }).parameters ?? [];
    const index = existing.findIndex((p) => p.id === parameterId);
    if (index === -1) {
      throw new Error(`Parameter "${parameterId}" not found`);
    }

    const updated = existing.map((p, i) => (i === index ? { ...p, value } : p));

    return {
      ...report,
      parameters: updated,
      updatedAt: new Date().toISOString(),
      version: report.version + 1,
    } as ReportDefinition;
  }

  /**
   * Remove a parameter from a report definition
   */
  static removeParameter(report: ReportDefinition, parameterId: string): ReportDefinition {
    const existing =
      (report as ReportDefinition & { parameters?: ReportParameter[] }).parameters ?? [];
    return {
      ...report,
      parameters: existing.filter((p) => p.id !== parameterId),
      updatedAt: new Date().toISOString(),
      version: report.version + 1,
    } as ReportDefinition;
  }

  /**
   * Get all parameters for a report
   */
  static getParameters(report: ReportDefinition): ReportParameter[] {
    return (report as ReportDefinition & { parameters?: ReportParameter[] }).parameters ?? [];
  }

  // ---------------------------------------------------------------------------
  // Section Management
  // ---------------------------------------------------------------------------

  /**
   * Extract logical sections from a layout based on row types
   */
  static getSections(layout: ReportLayout): ReportSection[] {
    const sections: ReportSection[] = [];
    let currentSection: ReportSection | null = null;

    for (let i = 0; i < layout.rows.length; i++) {
      const row = layout.rows[i];
      const sectionType = this.rowTypeToSectionType(row!.type);

      if (!currentSection || currentSection.type !== sectionType) {
        if (currentSection) {
          currentSection.endRowIndex = i - 1;
          sections.push(currentSection);
        }
        currentSection = {
          id: this.generateId(),
          type: sectionType,
          title: this.getSectionTitle(layout, i, sectionType),
          startRowIndex: i,
          endRowIndex: i,
          isCollapsed: false,
        };
      } else {
        currentSection.endRowIndex = i;
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  }

  private static rowTypeToSectionType(rowType: RowType): ReportSection['type'] {
    switch (rowType) {
      case 'header':
        return 'header';
      case 'data':
        return 'data';
      case 'subtotal':
        return 'subtotal';
      case 'total':
        return 'total';
      case 'blank':
        return 'text';
      default:
        return 'data';
    }
  }

  private static getSectionTitle(
    layout: ReportLayout,
    rowIndex: number,
    sectionType: ReportSection['type']
  ): string {
    const row = layout.rows[rowIndex];
    const labelCell = row!.cells.find((_, ci) => layout.columns[ci]?.type === 'label');
    if (labelCell) {
      const textContent = labelCell.content as { content?: { text?: string } };
      if (textContent.content?.text) return textContent.content.text;
    }
    return `${sectionType.charAt(0).toUpperCase()}${sectionType.slice(1)} Section`;
  }

  // ---------------------------------------------------------------------------
  // Multi-format Export Dispatcher
  // ---------------------------------------------------------------------------

  /**
   * Export a report in the specified format
   */
  static exportReport(
    report: ReportDefinition,
    cubeData: CubeData,
    format: ExportFormat
  ): PDFExportMetadata | ExcelExportResult | CSVExportResult {
    switch (format) {
      case 'pdf':
        return this.generatePDFMetadata(report);
      case 'excel':
        return this.generateExcelExport(report, cubeData);
      case 'csv':
        return this.generateCSVExport(report, cubeData);
      default: {
        const _exhaustive: never = format;
        throw new Error(`Unsupported export format: ${_exhaustive}`);
      }
    }
  }
}

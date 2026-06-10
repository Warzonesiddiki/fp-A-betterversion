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

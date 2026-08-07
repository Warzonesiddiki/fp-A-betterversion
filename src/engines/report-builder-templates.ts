// =============================================================================
// REPORT BUILDER — Template Layouts
// Predefined financial report templates (income statement, balance sheet, etc.)
// =============================================================================

import { randomId } from '@/utils/cryptoId';
import {
  type TemplateType,
  type ReportLayout,
  type ReportRow,
  type ReportColumn,
  type CellType,
  type RowType,
  DEFAULT_CELL_STYLE,
  TOTAL_STYLE,
} from './report-builder-types';

// ---------------------------------------------------------------------------
// Shared Helpers (used by templates and main engine)
// ---------------------------------------------------------------------------

export function generateReportId(): string {
  return `rpt_${randomId()}`;
}

export function createEmptyCell(type: CellType) {
  const defaultContent =
    type === 'text'
      ? { type: 'text' as const, content: { text: '' } }
      : {
          type: 'metric' as const,
          content: {
            coords: '',
            measure: '',
            format: 'currency' as const,
            decimals: 0,
            showSign: false,
          },
        };

  return {
    id: generateReportId(),
    type,
    content: defaultContent,
    style: { ...DEFAULT_CELL_STYLE },
    colspan: 1,
    rowspan: 1,
    isVisible: true,
  };
}

export function createEmptyLayout(): ReportLayout {
  return {
    rows: [],
    columns: [],
    columnWidths: {},
    defaultRowHeight: 28,
    frozenColumns: 1,
    frozenRows: 1,
    filters: [],
  };
}

// ---------------------------------------------------------------------------
// Template Registry
// ---------------------------------------------------------------------------

export function getTemplateLayout(template: TemplateType): ReportLayout {
  switch (template) {
    case 'income_statement':
      return createIncomeStatementLayout();
    case 'balance_sheet':
      return createBalanceSheetLayout();
    case 'cash_flow':
      return createCashFlowLayout();
    case 'budget_vs_actual':
      return createBudgetVsActualLayout();
    case 'variance_analysis':
      return createVarianceAnalysisLayout();
    case 'board_pack':
      return createBoardPackLayout();
    case 'executive_summary':
      return createExecutiveSummaryLayout();
    case 'custom':
    default:
      return createEmptyLayout();
  }
}

export function getAvailableTemplates(): Array<{
  type: TemplateType;
  name: string;
  description: string;
}> {
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
// Income Statement
// ---------------------------------------------------------------------------

function createIncomeStatementLayout(): ReportLayout {
  const labelColId = generateReportId();
  const actualColId = generateReportId();
  const budgetColId = generateReportId();
  const varianceColId = generateReportId();

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
    id: generateReportId(),
    type: item.type,
    cells: columns.map((col) => {
      if (col.type === 'label') {
        return {
          ...createEmptyCell('text'),
          content: {
            type: 'text' as const,
            content: {
              text: item.label,
              style: item.type === 'total' || item.type === 'subtotal' ? TOTAL_STYLE : undefined,
            },
          },
        };
      }
      return createEmptyCell('metric');
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
    filters: [],
  };
}

// ---------------------------------------------------------------------------
// Balance Sheet
// ---------------------------------------------------------------------------

function createBalanceSheetLayout(): ReportLayout {
  const labelColId = generateReportId();
  const currentColId = generateReportId();
  const priorColId = generateReportId();

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
    id: generateReportId(),
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
          ...createEmptyCell('text'),
          content: { type: 'text' as const, content: { text: label } },
        };
      }
      return createEmptyCell('metric');
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
    filters: [],
  };
}

// ---------------------------------------------------------------------------
// Cash Flow
// ---------------------------------------------------------------------------

function createCashFlowLayout(): ReportLayout {
  const labelColId = generateReportId();
  const currentColId = generateReportId();
  const priorColId = generateReportId();

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
    id: generateReportId(),
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
          ...createEmptyCell('text'),
          content: { type: 'text' as const, content: { text: label } },
        };
      }
      return createEmptyCell('metric');
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
    filters: [],
  };
}

// ---------------------------------------------------------------------------
// Budget vs Actual
// ---------------------------------------------------------------------------

function createBudgetVsActualLayout(): ReportLayout {
  const labelColId = generateReportId();
  const actualColId = generateReportId();
  const budgetColId = generateReportId();
  const varAmtColId = generateReportId();
  const varPctColId = generateReportId();

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
    id: generateReportId(),
    type: (label === 'Gross Profit' || label === 'EBITDA' || label === 'Net Income'
      ? 'subtotal'
      : 'data') as RowType,
    cells: columns.map((col) => {
      if (col.type === 'label') {
        return {
          ...createEmptyCell('text'),
          content: { type: 'text' as const, content: { text: label } },
        };
      }
      return createEmptyCell('metric');
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
    filters: [],
  };
}

// ---------------------------------------------------------------------------
// Variance Analysis
// ---------------------------------------------------------------------------

function createVarianceAnalysisLayout(): ReportLayout {
  const labelColId = generateReportId();
  const actualColId = generateReportId();
  const budgetColId = generateReportId();
  const varAmtColId = generateReportId();
  const varPctColId = generateReportId();
  const explanationColId = generateReportId();

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

  const rows: ReportRow[] = ['Revenue', 'COGS', 'Gross Margin', 'OpEx', 'EBITDA'].map((label) => ({
    id: generateReportId(),
    type: (label === 'Gross Margin' || label === 'EBITDA' ? 'subtotal' : 'data') as RowType,
    cells: columns.map((col) => {
      if (col.type === 'label') {
        return {
          ...createEmptyCell('text'),
          content: { type: 'text' as const, content: { text: label } },
        };
      }
      if (col.type === 'custom') {
        return createEmptyCell('text');
      }
      return createEmptyCell('metric');
    }),
    height: 28,
    isVisible: true,
    pageBreakBefore: false,
  }));

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
    filters: [],
  };
}

// ---------------------------------------------------------------------------
// Board Pack
// ---------------------------------------------------------------------------

function createBoardPackLayout(): ReportLayout {
  const labelColId = generateReportId();
  const currentColId = generateReportId();
  const priorColId = generateReportId();

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
    id: generateReportId(),
    type: 'data' as RowType,
    cells: columns.map((col) => {
      if (col.type === 'label') {
        return {
          ...createEmptyCell('text'),
          content: { type: 'text' as const, content: { text: kpi } },
        };
      }
      return createEmptyCell('metric');
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
    filters: [],
  };
}

// ---------------------------------------------------------------------------
// Executive Summary
// ---------------------------------------------------------------------------

function createExecutiveSummaryLayout(): ReportLayout {
  const labelColId = generateReportId();
  const valueColId = generateReportId();
  const trendColId = generateReportId();

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
    id: generateReportId(),
    type: 'data' as RowType,
    cells: [
      { ...createEmptyCell('text'), content: { type: 'text' as const, content: { text: metric } } },
      createEmptyCell('metric'),
      createEmptyCell('chart'),
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
    filters: [],
  };
}

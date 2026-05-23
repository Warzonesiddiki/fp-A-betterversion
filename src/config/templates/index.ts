/**
 * Template registry — pre-built templates for 16 industries.
 *
 * Each template defines columns, rows, KPIs, and chart configs
 * for a specific budget/forecast/report type.
 */

import type {
  Template,
  TemplateCategory,
  TemplateIndustry,
  TemplateColumn,
  TemplateRow,
  TemplateKPI,
  TemplateChart,
} from '@/engines/TemplateEngine';

// --- Column presets ---

const budgetColumns: TemplateColumn[] = [
  { key: 'lineItem', label: 'Line Item', type: 'text', width: 200 },
  { key: 'budget', label: 'Budget', type: 'currency', align: 'right', format: '$#,##0' },
  { key: 'actual', label: 'Actual', type: 'currency', align: 'right', format: '$#,##0' },
  { key: 'variance', label: 'Variance', type: 'currency', align: 'right', format: '$#,##0' },
  { key: 'variancePct', label: 'Var %', type: 'percentage', align: 'right' },
  { key: 'forecast', label: 'Forecast', type: 'currency', align: 'right', format: '$#,##0' },
];

const forecastColumns: TemplateColumn[] = [
  { key: 'lineItem', label: 'Line Item', type: 'text', width: 200 },
  { key: 'q1', label: 'Q1', type: 'currency', align: 'right' },
  { key: 'q2', label: 'Q2', type: 'currency', align: 'right' },
  { key: 'q3', label: 'Q3', type: 'currency', align: 'right' },
  { key: 'q4', label: 'Q4', type: 'currency', align: 'right' },
  { key: 'total', label: 'FY Total', type: 'currency', align: 'right' },
];

const reportColumns: TemplateColumn[] = [
  { key: 'account', label: 'Account', type: 'text', width: 250 },
  { key: 'currentPeriod', label: 'Current Period', type: 'currency', align: 'right' },
  { key: 'priorPeriod', label: 'Prior Period', type: 'currency', align: 'right' },
  { key: 'change', label: 'Change', type: 'currency', align: 'right' },
  { key: 'changePct', label: 'Change %', type: 'percentage', align: 'right' },
];

// --- KPI presets ---

const techKPIs: TemplateKPI[] = [
  { id: 'arr', label: 'ARR', formula: 'SUM(mrr)*12', format: 'currency', higherIsBetter: true },
  {
    id: 'nrr',
    label: 'Net Revenue Retention',
    formula: '',
    format: 'percentage',
    target: 120,
    higherIsBetter: true,
  },
  {
    id: 'churn',
    label: 'Churn Rate',
    formula: '',
    format: 'percentage',
    target: 5,
    higherIsBetter: false,
  },
  {
    id: 'ltvCac',
    label: 'LTV/CAC',
    formula: '',
    format: 'number',
    target: 3,
    higherIsBetter: true,
  },
  {
    id: 'magicNumber',
    label: 'Magic Number',
    formula: '',
    format: 'number',
    target: 1,
    higherIsBetter: true,
  },
];

const manufacturingKPIs: TemplateKPI[] = [
  { id: 'oee', label: 'OEE', formula: '', format: 'percentage', target: 85, higherIsBetter: true },
  {
    id: 'yield',
    label: 'Yield Rate',
    formula: '',
    format: 'percentage',
    target: 95,
    higherIsBetter: true,
  },
  {
    id: 'scrapRate',
    label: 'Scrap Rate',
    formula: '',
    format: 'percentage',
    target: 2,
    higherIsBetter: false,
  },
  {
    id: 'cycleTime',
    label: 'Cycle Time (hrs)',
    formula: '',
    format: 'number',
    target: 24,
    higherIsBetter: false,
  },
];

const retailKPIs: TemplateKPI[] = [
  {
    id: 'sameStoreSales',
    label: 'Same-Store Sales Growth',
    formula: '',
    format: 'percentage',
    target: 5,
    higherIsBetter: true,
  },
  {
    id: 'inventoryTurnover',
    label: 'Inventory Turnover',
    formula: '',
    format: 'number',
    target: 8,
    higherIsBetter: true,
  },
  { id: 'gmroi', label: 'GMROI', formula: '', format: 'number', target: 150, higherIsBetter: true },
  {
    id: 'basketSize',
    label: 'Avg Basket Size',
    formula: '',
    format: 'currency',
    higherIsBetter: true,
  },
];

const bankingKPIs: TemplateKPI[] = [
  {
    id: 'nim',
    label: 'Net Interest Margin',
    formula: '',
    format: 'percentage',
    target: 3.5,
    higherIsBetter: true,
  },
  {
    id: 'npl',
    label: 'NPL Ratio',
    formula: '',
    format: 'percentage',
    target: 2,
    higherIsBetter: false,
  },
  {
    id: 'car',
    label: 'Capital Adequacy Ratio',
    formula: '',
    format: 'percentage',
    target: 12,
    higherIsBetter: true,
  },
  { id: 'roa', label: 'ROA', formula: '', format: 'percentage', target: 1.5, higherIsBetter: true },
];

const healthcareKPIs: TemplateKPI[] = [
  {
    id: 'occupancy',
    label: 'Occupancy Rate',
    formula: '',
    format: 'percentage',
    target: 85,
    higherIsBetter: true,
  },
  {
    id: 'alos',
    label: 'Avg Length of Stay',
    formula: '',
    format: 'number',
    target: 4,
    higherIsBetter: false,
  },
  {
    id: 'readmission',
    label: 'Readmission Rate',
    formula: '',
    format: 'percentage',
    target: 10,
    higherIsBetter: false,
  },
  {
    id: 'caseMix',
    label: 'Case Mix Index',
    formula: '',
    format: 'number',
    target: 1.5,
    higherIsBetter: true,
  },
];

const energyKPIs: TemplateKPI[] = [
  {
    id: 'production',
    label: 'Production Volume',
    formula: '',
    format: 'number',
    higherIsBetter: true,
  },
  {
    id: 'reserveLife',
    label: 'Reserve Life Index',
    formula: '',
    format: 'number',
    target: 10,
    higherIsBetter: true,
  },
  {
    id: 'liftingCost',
    label: 'Lifting Cost ($/bbl)',
    formula: '',
    format: 'currency',
    target: 15,
    higherIsBetter: false,
  },
];

const realEstateKPIs: TemplateKPI[] = [
  { id: 'noi', label: 'NOI', formula: '', format: 'currency', higherIsBetter: true },
  {
    id: 'capRate',
    label: 'Cap Rate',
    formula: '',
    format: 'percentage',
    target: 6,
    higherIsBetter: true,
  },
  {
    id: 'occupancy',
    label: 'Occupancy Rate',
    formula: '',
    format: 'percentage',
    target: 95,
    higherIsBetter: true,
  },
  { id: 'dscr', label: 'DSCR', formula: '', format: 'number', target: 1.25, higherIsBetter: true },
];

const constructionKPIs: TemplateKPI[] = [
  { id: 'wip', label: 'WIP Balance', formula: '', format: 'currency' },
  {
    id: 'overbilling',
    label: 'Overbilling %',
    formula: '',
    format: 'percentage',
    target: 10,
    higherIsBetter: false,
  },
  {
    id: 'jobCost',
    label: 'Job Cost Variance',
    formula: '',
    format: 'percentage',
    target: 5,
    higherIsBetter: false,
  },
];

const insuranceKPIs: TemplateKPI[] = [
  {
    id: 'lossRatio',
    label: 'Loss Ratio',
    formula: '',
    format: 'percentage',
    target: 65,
    higherIsBetter: false,
  },
  {
    id: 'combinedRatio',
    label: 'Combined Ratio',
    formula: '',
    format: 'percentage',
    target: 100,
    higherIsBetter: false,
  },
  {
    id: 'expenseRatio',
    label: 'Expense Ratio',
    formula: '',
    format: 'percentage',
    target: 30,
    higherIsBetter: false,
  },
];

const genericKPIs: TemplateKPI[] = [
  {
    id: 'revenue',
    label: 'Total Revenue',
    formula: 'SUM(revenue)',
    format: 'currency',
    higherIsBetter: true,
  },
  {
    id: 'grossMargin',
    label: 'Gross Margin',
    formula: '',
    format: 'percentage',
    target: 40,
    higherIsBetter: true,
  },
  {
    id: 'operatingMargin',
    label: 'Operating Margin',
    formula: '',
    format: 'percentage',
    target: 15,
    higherIsBetter: true,
  },
  {
    id: 'netMargin',
    label: 'Net Margin',
    formula: '',
    format: 'percentage',
    target: 10,
    higherIsBetter: true,
  },
];

// --- Chart presets ---

const budgetCharts: TemplateChart[] = [
  { type: 'variance', title: 'Budget vs Actual', dataKey: 'variance', xAxisKey: 'lineItem' },
  { type: 'bar', title: 'Forecast Trend', dataKey: 'forecast', xAxisKey: 'lineItem' },
];

const forecastCharts: TemplateChart[] = [
  { type: 'line', title: 'Quarterly Trend', dataKey: 'total', xAxisKey: 'lineItem' },
  { type: 'area', title: 'Revenue by Quarter', dataKey: 'q1', xAxisKey: 'lineItem' },
];

const reportCharts: TemplateChart[] = [
  { type: 'bar', title: 'Period Comparison', dataKey: 'change', xAxisKey: 'account' },
  { type: 'waterfall', title: 'Variance Waterfall', dataKey: 'change', xAxisKey: 'account' },
];

// --- Row generators ---

function makeBudgetRows(industry: TemplateIndustry): TemplateRow[] {
  const base: TemplateRow[] = [
    { id: 'revenue', label: 'Revenue', level: 0, isTotal: false },
    { id: 'revenue-product', label: '  Product Revenue', level: 1, parentId: 'revenue' },
    { id: 'revenue-services', label: '  Services Revenue', level: 1, parentId: 'revenue' },
    { id: 'revenue-subscriptions', label: '  Subscription Revenue', level: 1, parentId: 'revenue' },
    { id: 'cogs', label: 'Cost of Goods Sold', level: 0 },
    { id: 'gross-profit', label: 'Gross Profit', level: 0, isTotal: true },
    { id: 'opex', label: 'Operating Expenses', level: 0 },
    { id: 'opex-salary', label: '  Salaries & Benefits', level: 1, parentId: 'opex' },
    { id: 'opex-rent', label: '  Rent & Facilities', level: 1, parentId: 'opex' },
    { id: 'opex-marketing', label: '  Marketing & Advertising', level: 1, parentId: 'opex' },
    { id: 'opex-technology', label: '  Technology & Software', level: 1, parentId: 'opex' },
    { id: 'opex-travel', label: '  Travel & Entertainment', level: 1, parentId: 'opex' },
    { id: 'opex-other', label: '  Other Operating Expenses', level: 1, parentId: 'opex' },
    { id: 'ebitda', label: 'EBITDA', level: 0, isTotal: true },
    { id: 'da', label: 'Depreciation & Amortization', level: 0 },
    { id: 'ebit', label: 'Operating Income (EBIT)', level: 0, isTotal: true },
    { id: 'interest', label: 'Interest Expense', level: 0 },
    { id: 'tax', label: 'Income Tax', level: 0 },
    { id: 'net-income', label: 'Net Income', level: 0, isTotal: true },
  ];

  // Industry-specific additions
  if (industry === 'technology' || industry === 'generic') {
    base.splice(4, 0, {
      id: 'revenue-saas',
      label: '  SaaS Revenue',
      level: 1,
      parentId: 'revenue',
    });
  }

  return base;
}

function makeForecastRows(): TemplateRow[] {
  return [
    { id: 'revenue', label: 'Total Revenue', level: 0 },
    { id: 'revenue-new', label: '  New Business', level: 1, parentId: 'revenue' },
    { id: 'revenue-renewal', label: '  Renewals', level: 1, parentId: 'revenue' },
    { id: 'revenue-expansion', label: '  Expansion', level: 1, parentId: 'revenue' },
    { id: 'cogs', label: 'Cost of Goods Sold', level: 0 },
    { id: 'gross-profit', label: 'Gross Profit', level: 0, isTotal: true },
    { id: 'opex', label: 'Total Operating Expenses', level: 0 },
    { id: 'opex-headcount', label: '  Headcount Costs', level: 1, parentId: 'opex' },
    { id: 'opex-infrastructure', label: '  Infrastructure', level: 1, parentId: 'opex' },
    { id: 'opex-goto', label: '  Go-to-Market', level: 1, parentId: 'opex' },
    { id: 'ebitda', label: 'EBITDA', level: 0, isTotal: true },
    { id: 'net-income', label: 'Net Income', level: 0, isTotal: true },
  ];
}

function makePLRows(): TemplateRow[] {
  return [
    { id: 'revenue', label: 'Revenue', level: 0 },
    { id: 'revenue-product', label: '  Product Sales', level: 1, parentId: 'revenue' },
    { id: 'revenue-services', label: '  Service Revenue', level: 1, parentId: 'revenue' },
    { id: 'revenue-other', label: '  Other Revenue', level: 1, parentId: 'revenue' },
    { id: 'cogs', label: 'Cost of Revenue', level: 0 },
    { id: 'gross-profit', label: 'Gross Profit', level: 0, isTotal: true },
    { id: 'opex-sales', label: 'Sales & Marketing', level: 0 },
    { id: 'opex-rd', label: 'Research & Development', level: 0 },
    { id: 'opex-ga', label: 'General & Administrative', level: 0 },
    { id: 'total-opex', label: 'Total Operating Expenses', level: 0, isTotal: true },
    { id: 'ebit', label: 'Operating Income', level: 0, isTotal: true },
    { id: 'interest-income', label: 'Interest Income', level: 0 },
    { id: 'interest-expense', label: 'Interest Expense', level: 0 },
    { id: 'other-income', label: 'Other Income/(Expense)', level: 0 },
    { id: 'pretax', label: 'Income Before Tax', level: 0, isTotal: true },
    { id: 'tax', label: 'Income Tax Expense', level: 0 },
    { id: 'net-income', label: 'Net Income', level: 0, isTotal: true },
  ];
}

function makeBSRows(): TemplateRow[] {
  return [
    { id: 'assets', label: 'ASSETS', level: 0 },
    { id: 'cash', label: '  Cash & Equivalents', level: 1, parentId: 'assets' },
    { id: 'ar', label: '  Accounts Receivable', level: 1, parentId: 'assets' },
    { id: 'inventory', label: '  Inventory', level: 1, parentId: 'assets' },
    { id: 'prepaid', label: '  Prepaid Expenses', level: 1, parentId: 'assets' },
    { id: 'current-assets', label: 'Total Current Assets', level: 0, isTotal: true },
    { id: 'ppe', label: '  Property, Plant & Equipment', level: 1 },
    { id: 'intangibles', label: '  Intangible Assets', level: 1 },
    { id: 'goodwill', label: '  Goodwill', level: 1 },
    { id: 'total-assets', label: 'TOTAL ASSETS', level: 0, isTotal: true },
    { id: 'liabilities', label: 'LIABILITIES', level: 0 },
    { id: 'ap', label: '  Accounts Payable', level: 1, parentId: 'liabilities' },
    { id: 'accrued', label: '  Accrued Liabilities', level: 1, parentId: 'liabilities' },
    { id: 'debt-current', label: '  Current Debt', level: 1, parentId: 'liabilities' },
    { id: 'current-liabilities', label: 'Total Current Liabilities', level: 0, isTotal: true },
    { id: 'lt-debt', label: '  Long-Term Debt', level: 1 },
    { id: 'deferred', label: '  Deferred Revenue', level: 1 },
    { id: 'total-liabilities', label: 'TOTAL LIABILITIES', level: 0, isTotal: true },
    { id: 'equity', label: 'EQUITY', level: 0 },
    { id: 'common', label: '  Common Stock', level: 1, parentId: 'equity' },
    { id: 'retained', label: '  Retained Earnings', level: 1, parentId: 'equity' },
    { id: 'total-equity', label: 'TOTAL EQUITY', level: 0, isTotal: true },
    { id: 'total-le', label: 'TOTAL LIABILITIES + EQUITY', level: 0, isTotal: true },
  ];
}

function makeCFRows(): TemplateRow[] {
  return [
    { id: 'ops', label: 'CASH FROM OPERATIONS', level: 0 },
    { id: 'net-income', label: '  Net Income', level: 1, parentId: 'ops' },
    { id: 'da', label: '  Depreciation & Amortization', level: 1, parentId: 'ops' },
    { id: 'wc-change', label: '  Working Capital Changes', level: 1, parentId: 'ops' },
    { id: 'ops-total', label: 'Net Cash from Operations', level: 0, isTotal: true },
    { id: 'investing', label: 'CASH FROM INVESTING', level: 0 },
    { id: 'capex', label: '  Capital Expenditures', level: 1, parentId: 'investing' },
    { id: 'acquisitions', label: '  Acquisitions', level: 1, parentId: 'investing' },
    { id: 'investing-total', label: 'Net Cash from Investing', level: 0, isTotal: true },
    { id: 'financing', label: 'CASH FROM FINANCING', level: 0 },
    { id: 'debt-issued', label: '  Debt Issued', level: 1, parentId: 'financing' },
    { id: 'debt-repaid', label: '  Debt Repaid', level: 1, parentId: 'financing' },
    { id: 'dividends', label: '  Dividends Paid', level: 1, parentId: 'financing' },
    { id: 'financing-total', label: 'Net Cash from Financing', level: 0, isTotal: true },
    { id: 'net-change', label: 'Net Change in Cash', level: 0, isTotal: true },
    { id: 'beginning-cash', label: 'Beginning Cash Balance', level: 0 },
    { id: 'ending-cash', label: 'Ending Cash Balance', level: 0, isTotal: true },
  ];
}

// --- Template factory ---

function makeTemplate(
  id: string,
  name: string,
  description: string,
  category: TemplateCategory,
  industry: TemplateIndustry,
  columns: TemplateColumn[],
  rows: TemplateRow[],
  kpis: TemplateKPI[],
  charts: TemplateChart[],
  tags: string[] = []
): Template {
  return {
    id,
    name,
    description,
    category,
    industry,
    columns,
    rows,
    kpis,
    charts,
    version: 1,
    createdAt: '2026-05-19T00:00:00Z',
    updatedAt: '2026-05-19T00:00:00Z',
    author: 'FinPlan Pro',
    tags,
  };
}

// --- Exported templates ---

function getKPIsForIndustry(industry: TemplateIndustry): TemplateKPI[] {
  const map: Record<TemplateIndustry, TemplateKPI[]> = {
    technology: techKPIs,
    manufacturing: manufacturingKPIs,
    retail: retailKPIs,
    banking: bankingKPIs,
    healthcare: healthcareKPIs,
    energy: energyKPIs,
    'real-estate': realEstateKPIs,
    construction: constructionKPIs,
    insurance: insuranceKPIs,
    education: genericKPIs,
    agriculture: genericKPIs,
    government: genericKPIs,
    nonprofit: genericKPIs,
    hospitality: genericKPIs,
    transportation: genericKPIs,
    generic: genericKPIs,
  };
  return map[industry] ?? genericKPIs;
}

const industries: TemplateIndustry[] = [
  'technology',
  'manufacturing',
  'retail',
  'banking',
  'healthcare',
  'energy',
  'real-estate',
  'construction',
  'insurance',
  'education',
  'agriculture',
  'government',
  'nonprofit',
  'hospitality',
  'transportation',
  'generic',
];

const industryLabels: Record<TemplateIndustry, string> = {
  technology: 'Technology / SaaS',
  manufacturing: 'Manufacturing',
  retail: 'Retail',
  banking: 'Banking / Financial Services',
  healthcare: 'Healthcare',
  energy: 'Energy / Oil & Gas',
  'real-estate': 'Real Estate',
  construction: 'Construction',
  insurance: 'Insurance',
  education: 'Education',
  agriculture: 'Agriculture',
  government: 'Government',
  nonprofit: 'Nonprofit',
  hospitality: 'Hospitality',
  transportation: 'Transportation / Logistics',
  generic: 'Generic / Cross-Industry',
};

// Generate 16 industry-specific budget templates
const budgetTemplates: Template[] = industries.map((ind) =>
  makeTemplate(
    `budget-${ind}`,
    `${industryLabels[ind]} Annual Budget`,
    `Annual operating budget template for ${industryLabels[ind]} with industry-specific KPIs and line items.`,
    'budget',
    ind,
    budgetColumns,
    makeBudgetRows(ind),
    getKPIsForIndustry(ind),
    budgetCharts,
    ['budget', 'annual', ind]
  )
);

// Forecast templates
const forecastTemplates: Template[] = [
  makeTemplate(
    'forecast-rolling',
    'Rolling 12-Month Forecast',
    'Continuous rolling forecast updated monthly with actuals and re-forecast.',
    'forecast',
    'generic',
    forecastColumns,
    makeForecastRows(),
    genericKPIs,
    forecastCharts,
    ['forecast', 'rolling', '12-month']
  ),
  makeTemplate(
    'forecast-driver',
    'Driver-Based Forecast',
    'Forecast driven by operational metrics (headcount, units, customers).',
    'forecast',
    'generic',
    forecastColumns,
    makeForecastRows(),
    genericKPIs,
    forecastCharts,
    ['forecast', 'driver-based']
  ),
  makeTemplate(
    'forecast-scenario',
    'Scenario Forecast (3 Scenarios)',
    'Best case, base case, worst case scenario forecast.',
    'forecast',
    'generic',
    [
      ...forecastColumns,
      { key: 'bestCase', label: 'Best Case', type: 'currency', align: 'right' },
      { key: 'worstCase', label: 'Worst Case', type: 'currency', align: 'right' },
    ],
    makeForecastRows(),
    genericKPIs,
    [
      ...forecastCharts,
      { type: 'line', title: 'Scenario Comparison', dataKey: 'total', xAxisKey: 'lineItem' },
    ],
    ['forecast', 'scenario']
  ),
];

// Report templates
const reportTemplates: Template[] = [
  makeTemplate(
    'report-pl',
    'Income Statement (P&L)',
    'Standard profit and loss statement with period comparison.',
    'report',
    'generic',
    reportColumns,
    makePLRows(),
    genericKPIs.slice(0, 2),
    reportCharts,
    ['report', 'p&l', 'income-statement']
  ),
  makeTemplate(
    'report-bs',
    'Balance Sheet',
    'Standard balance sheet with assets, liabilities, equity.',
    'report',
    'generic',
    reportColumns,
    makeBSRows(),
    [
      {
        id: 'currentRatio',
        label: 'Current Ratio',
        formula: '',
        format: 'number',
        target: 2,
        higherIsBetter: true,
      },
    ],
    [
      {
        type: 'bar',
        title: 'Assets vs Liabilities',
        dataKey: 'currentPeriod',
        xAxisKey: 'account',
      },
    ],
    ['report', 'balance-sheet']
  ),
  makeTemplate(
    'report-cf',
    'Cash Flow Statement',
    'Operating, investing, financing cash flows with net change.',
    'report',
    'generic',
    reportColumns,
    makeCFRows(),
    [{ id: 'fcf', label: 'Free Cash Flow', formula: '', format: 'currency', higherIsBetter: true }],
    [
      {
        type: 'waterfall',
        title: 'Cash Flow Waterfall',
        dataKey: 'currentPeriod',
        xAxisKey: 'account',
      },
    ],
    ['report', 'cash-flow']
  ),
  makeTemplate(
    'report-variance',
    'Variance Analysis Report',
    'Budget vs actual variance analysis with favorable/unfavorable indicators.',
    'report',
    'generic',
    [
      ...reportColumns,
      { key: 'budget', label: 'Budget', type: 'currency', align: 'right' },
      { key: 'variance', label: 'Variance', type: 'currency', align: 'right' },
      { key: 'variancePct', label: 'Var %', type: 'percentage', align: 'right' },
    ],
    makePLRows(),
    genericKPIs,
    [
      {
        type: 'variance',
        title: 'Budget vs Actual Variance',
        dataKey: 'variance',
        xAxisKey: 'account',
      },
    ],
    ['report', 'variance']
  ),
];

// Dashboard template
const dashboardTemplates: Template[] = [
  makeTemplate(
    'dashboard-executive',
    'Executive Dashboard',
    'High-level KPI dashboard for C-suite with revenue, margin, cash metrics.',
    'dashboard',
    'generic',
    [
      { key: 'metric', label: 'Metric', type: 'text', width: 200 },
      { key: 'current', label: 'Current', type: 'currency', align: 'right' },
      { key: 'target', label: 'Target', type: 'currency', align: 'right' },
      { key: 'status', label: 'Status', type: 'text', align: 'center' },
    ],
    [
      { id: 'revenue', label: 'Total Revenue', level: 0 },
      { id: 'gross-margin', label: 'Gross Margin %', level: 0 },
      { id: 'ebitda', label: 'EBITDA', level: 0 },
      { id: 'net-income', label: 'Net Income', level: 0 },
      { id: 'cash', label: 'Cash Balance', level: 0 },
      { id: 'burn-rate', label: 'Monthly Burn Rate', level: 0 },
      { id: 'runway', label: 'Runway (Months)', level: 0 },
      { id: 'headcount', label: 'Headcount', level: 0 },
    ],
    [
      {
        id: 'revenue-kpi',
        label: 'Revenue',
        formula: '',
        format: 'currency',
        higherIsBetter: true,
      },
      {
        id: 'margin-kpi',
        label: 'Gross Margin',
        formula: '',
        format: 'percentage',
        target: 40,
        higherIsBetter: true,
      },
      {
        id: 'cash-kpi',
        label: 'Cash Position',
        formula: '',
        format: 'currency',
        higherIsBetter: true,
      },
    ],
    [
      { type: 'sparkline', title: 'Revenue Trend', dataKey: 'revenue' },
      { type: 'gauge', title: 'Gross Margin', dataKey: 'gross-margin' },
      { type: 'bar', title: 'KPI Status', dataKey: 'current', xAxisKey: 'metric' },
    ],
    ['dashboard', 'executive', 'kpi']
  ),
];

// --- All templates combined ---

export const allTemplates: Template[] = [
  ...budgetTemplates,
  ...forecastTemplates,
  ...reportTemplates,
  ...dashboardTemplates,
];

export const templateCategories: { id: TemplateCategory; label: string; count: number }[] = [
  { id: 'budget', label: 'Budgets', count: budgetTemplates.length },
  { id: 'forecast', label: 'Forecasts', count: forecastTemplates.length },
  { id: 'report', label: 'Reports', count: reportTemplates.length },
  { id: 'dashboard', label: 'Dashboards', count: dashboardTemplates.length },
];

export { industryLabels };
export type { TemplateIndustry };

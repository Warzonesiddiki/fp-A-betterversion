export interface ReportTemplate {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly type: string;
  readonly lastGenerated: string;
  readonly format: readonly string[];
}

export const reports: ReportTemplate[] = [
  {
    id: 'rpt-pl-summary',
    name: 'P&L Summary Report',
    description:
      'Standard profit and loss summary with current period, YTD, and variance vs budget.',
    category: 'Financial Statements',
    type: 'Standard',
    lastGenerated: '2024-12-01T08:00:00Z',
    format: ['pdf', 'xlsx', 'html'],
  },
  {
    id: 'rpt-budget-variance',
    name: 'Budget vs Actual Variance',
    description:
      'Detailed variance analysis comparing actual results to budget across all accounts.',
    category: 'Variance Analysis',
    type: 'Standard',
    lastGenerated: '2024-12-02T06:30:00Z',
    format: ['pdf', 'xlsx', 'csv'],
  },
  {
    id: 'rpt-dept-spend',
    name: 'Department Spend Analysis',
    description:
      'Department-level spending breakdown with month-over-month and budget comparisons.',
    category: 'Operational',
    type: 'Standard',
    lastGenerated: '2024-11-30T17:00:00Z',
    format: ['pdf', 'xlsx'],
  },
  {
    id: 'rpt-exec-dashboard',
    name: 'Executive Dashboard',
    description:
      'Executive summary with KPIs, revenue trends, margin analysis, and key variance highlights.',
    category: 'Executive',
    type: 'Dashboard',
    lastGenerated: '2024-12-02T07:00:00Z',
    format: ['pdf', 'html'],
  },
  {
    id: 'rpt-forecast',
    name: 'Forecast vs Budget',
    description: 'Comparison of latest forecast against approved budget with trend analysis.',
    category: 'Forecasting',
    type: 'Standard',
    lastGenerated: '2024-11-28T16:00:00Z',
    format: ['pdf', 'xlsx'],
  },
  {
    id: 'rpt-scenario-comparison',
    name: 'Scenario Comparison',
    description: 'Side-by-side comparison of all scenarios with probability-weighted outcomes.',
    category: 'Scenario Analysis',
    type: 'Standard',
    lastGenerated: '2024-11-25T14:00:00Z',
    format: ['pdf', 'html'],
  },
  {
    id: 'rpt-headcount',
    name: 'Headcount & Compensation Report',
    description: 'FTE counts, compensation costs, and hiring plan status by department.',
    category: 'Operational',
    type: 'Standard',
    lastGenerated: '2024-11-15T10:00:00Z',
    format: ['pdf', 'xlsx', 'csv'],
  },
  {
    id: 'rpt-cash-flow',
    name: 'Cash Flow Statement',
    description:
      'Statement of cash flows including operating, investing, and financing activities.',
    category: 'Financial Statements',
    type: 'Standard',
    lastGenerated: '2024-11-30T12:00:00Z',
    format: ['pdf', 'xlsx'],
  },
];

export function getReportById(id: string): ReportTemplate | undefined {
  return reports.find((r) => r.id === id);
}

export function getReportsByCategory(category: string): ReportTemplate[] {
  return reports.filter((r) => r.category === category);
}

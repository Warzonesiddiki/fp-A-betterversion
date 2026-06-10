export const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
export const MONTHS_FULL = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

export const QUARTER_MONTHS: Record<'Q1' | 'Q2' | 'Q3' | 'Q4', number[]> = {
  Q1: [0, 1, 2],
  Q2: [3, 4, 5],
  Q3: [6, 7, 8],
  Q4: [9, 10, 11],
};

export const BUDGET_STATUSES = ['Draft', 'InReview', 'Approved', 'Locked', 'Rejected'] as const;
export const FORECAST_TYPES = ['Rolling', 'Quarterly', 'Annual'] as const;
export const ACCOUNT_TYPES = [
  'Revenue',
  'COGS',
  'OpEx',
  'CapEx',
  'Asset',
  'Liability',
  'Equity',
] as const;
export const ROLES = ['Admin', 'FP&A_Manager', 'Analyst', 'Department_Head', 'Viewer'] as const;
export const VAR_STATUSES = ['Favorable', 'Unfavorable', 'Neutral'] as const;
export const THRESHOLD_STATUSES = ['Within', 'Watch', 'Significant'] as const;
export const TASK_STATUSES = ['Todo', 'InProgress', 'Done'] as const;
export const TASK_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'] as const;
export const IMPORT_STATUSES = ['Pending', 'Processing', 'Completed', 'Failed'] as const;
export const SCENARIO_TYPES = ['Base', 'Optimistic', 'Pessimistic', 'Custom'] as const;

export const VARIANCE_THRESHOLDS = { WITHIN: 5, WATCH: 10 };

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'CHF', 'CNY', 'AUD', 'INR', 'BRL'];
export const INDUSTRIES = [
  'Technology',
  'Manufacturing',
  'Retail',
  'Healthcare',
  'Financial Services',
  'Energy',
  'Real Estate',
  'Construction',
  'Education',
  'Government',
  'Non-Profit',
  'Media',
];

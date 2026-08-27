import type {
  GLEntry,
  Budget,
  Scenario,
  User,
  FinanceReport,
  GLAccount,
  Forecast,
  VarianceAnalysis,
  Department,
  Entity,
  ExchangeRate,
  CellAuditEntry,
  ActivityLog,
  Notification,
  Task,
  ApprovalRequest,
  OrganizationSettings,
  UserRole,
  AccountType,
  BudgetStatus,
  ForecastType,
  Role,
  VarianceStatus,
  ThresholdStatus,
  TaskStatus,
  TaskPriority,
} from '@/types';
import Decimal from 'decimal.js';

// Utility for ID generation
const genId = (prefix: string) => `${prefix}-${Math.random().toString(36).substring(2, 11)}`;
const randomDate = (start: Date, end: Date) =>
  new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();

export function generateBudgets(count: number = 5): Budget[] {
  const statuses: BudgetStatus[] = ['Draft', 'InReview', 'Approved', 'Locked', 'Rejected'];
  return Array.from({ length: count }, (_, i) => ({
    id: genId('bud'),
    name: `FY2024 Q${(i % 4) + 1} Operating Budget`,
    description: `Quarterly operating budget for Q${(i % 4) + 1}`,
    fiscalYear: 2024,
    status: statuses[i % statuses.length]!,
    template: 'Standard OPEX',
    departments: [genId('dept'), genId('dept')],
    entities: [genId('ent')],
    baseCurrency: 'USD',
    totalAmount: 1000000 + Math.random() * 5000000,
    createdBy: genId('usr'),
    createdByName: 'John Doe',
    createdAt: randomDate(new Date(2023, 0, 1), new Date()),
    updatedAt: new Date().toISOString(),
    submittedAt: i > 1 ? new Date().toISOString() : null,
    approvedAt: i > 2 ? new Date().toISOString() : null,
    approvedBy: i > 2 ? genId('usr') : null,
    version: 1,
    progress: Math.floor(Math.random() * 100),
  }));
}

export function generateScenarios(count: number = 5): Scenario[] {
  const types: ('Base' | 'Optimistic' | 'Pessimistic' | 'Custom')[] = [
    'Base',
    'Optimistic',
    'Pessimistic',
    'Custom',
  ];
  return Array.from({ length: count }, (_, i) => ({
    id: genId('scn'),
    name: `${types[i % types.length]!} Case 2024`,
    description: `${types[i % types.length]!} scenario planning`,
    baseBudgetId: genId('bud'),
    baseBudgetName: 'FY2024 Base',
    type: types[i % types.length]!,
    probability: Math.floor(Math.random() * 100),
    isActive: i === 0,
    isLocked: false,
    assumptions: [],
    calculatedMetrics: {
      revenue: 5000000 * (1 + Math.random()),
      ebitda: 1000000 * (1 + Math.random()),
      netIncome: 800000 * (1 + Math.random()),
      cashFlow: 750000 * (1 + Math.random()),
      headcount: 150 + Math.floor(Math.random() * 50),
      burnRate: 200000,
      runway: 18 + Math.floor(Math.random() * 12),
      grossMargin: 65 + Math.random() * 10,
      ebitdaMargin: 20 + Math.random() * 10,
    },
    createdBy: genId('usr'),
    createdByName: 'Jane Smith',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

export function generateUsers(count: number = 10): User[] {
  const roles: Role[] = ['Admin', 'FP&A_Manager', 'Analyst', 'Department_Head', 'Viewer'];
  return Array.from({ length: count }, (_, i) => ({
    id: genId('usr'),
    email: `user${i}@finplanpro.com`,
    firstName: `User${i}`,
    lastName: `Test${i}`,
    avatarUrl: null,
    role: roles[i % roles.length]!,
    departmentId: genId('dept'),
    departmentName: 'Finance',
    entityId: genId('ent'),
    status: 'Active',
    lastLoginAt: new Date().toISOString(),
    mfaEnabled: true,
    permissions: ['read:all', 'write:all'],
  }));
}

export function generateReports(count: number = 5): FinanceReport[] {
  return Array.from({ length: count }, (_, i) => ({
    id: genId('rpt'),
    name: `Monthly Financials ${i + 1}`,
    type: 'P&L',
    format: 'PDF',
    createdAt: randomDate(new Date(2023, 0, 1), new Date()),
    createdBy: genId('usr'),
  }));
}

export function generateGLAccounts(count: number = 20): GLAccount[] {
  const types: AccountType[] = ['Revenue', 'COGS', 'OpEx', 'CapEx', 'Asset', 'Liability', 'Equity'];
  return Array.from({ length: count }, (_, i) => ({
    id: genId('acct'),
    code: `${((i % 9) + 1) * 1000 + i}`,
    name: `Account ${i}`,
    type: types[i % types.length]!,
    category: 'Operating',
    subCategory: 'General',
    parentId: null,
    level: 0,
    sortOrder: i,
    isActive: true,
    entityId: genId('ent'),
    departmentId: null,
    isCalculated: false,
    formula: null,
    children: [],
  }));
}

export function generateGLEntries(count: number = 50): GLEntry[] {
  return Array.from({ length: count }, (_, i) => {
    const postDate = randomDate(new Date(2023, 0, 1), new Date());
    const fiscalPeriod = `2024-${String((i % 12) + 1).padStart(2, '0')}`;
    const debit = Math.random() * 10000;
    const credit = Math.random() * 5000;
    const id = genId('je');
    const accountCode = `${1000 + i}`;
    return {
      id,
      accountId: id,
      accountCode,
      accountName: `Test Account ${i}`,
      period: fiscalPeriod,
      periodName: fiscalPeriod,
      debit,
      credit,
      netChange: new Decimal(credit).minus(debit).toNumber(),
      date: postDate,
      postDate,
      amount: new Decimal(debit).plus(credit).toNumber(),
      description: `Journal Entry ${i}`,
      reference: id,
      entityId: 'Default',
      departmentId: 'General',
      currency: 'USD',
      fiscalPeriod,
      department: 'General',
      entity: 'Default',
      journalId: id,
      journalLine: i + 1,
      source: 'Manual',
    };
  });
}

export function generateForecasts(count: number = 5): Forecast[] {
  const types: ForecastType[] = ['Rolling', 'Quarterly', 'Annual'];
  return Array.from({ length: count }, (_, i) => ({
    id: genId('fcst'),
    name: `Q${(i % 4) + 1} Forecast`,
    description: `Forecast for Q${(i % 4) + 1}`,
    type: types[i % types.length]!,
    baseBudgetId: genId('bud'),
    baseBudgetName: 'Base Budget',
    status: 'Completed',
    rollingWindowMonths: 12,
    confidenceLevel: 'High',
    createdBy: genId('usr'),
    createdByName: 'Alice Jones',
    lastUpdated: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  }));
}

export function generateVariances(count: number = 10): VarianceAnalysis[] {
  const statuses: VarianceStatus[] = ['Favorable', 'Unfavorable', 'Neutral'];
  const thresholds: ThresholdStatus[] = ['Within', 'Watch', 'Significant'];
  return Array.from({ length: count }, (_, i) => {
    const budget = new Decimal(Math.random()).times(100000).toNumber();
    const actual = new Decimal(budget)
      .plus(new Decimal(Math.random()).minus(0.5).times(20000))
      .toNumber();
    const dollarVar = new Decimal(actual).minus(budget).toNumber();
    const percentVar = new Decimal(dollarVar).dividedBy(budget).times(100).toNumber();
    return {
      id: genId('var'),
      accountId: genId('acct'),
      accountName: `Variance Account ${i}`,
      accountCode: `V${1000 + i}`,
      accountType: 'OpEx',
      budgetAmount: budget,
      actualAmount: actual,
      forecastAmount: new Decimal(budget).times(1.05).toNumber(),
      dollarVariance: dollarVar,
      percentVariance: percentVar,
      varianceStatus: statuses[i % 3]!,
      thresholdStatus: thresholds[i % 3]!,
      commentary: 'Generated variance',
      commentaryStatus: 'Reviewed',
      monthlyBreakdown: [],
      rateVariance: 0,
      volumeVariance: dollarVar,
    };
  });
}

export function generateDepartments(count: number = 5): Department[] {
  return Array.from({ length: count }, (_, i) => ({
    id: genId('dept'),
    name: `Department ${i}`,
    code: `D${i}`,
    costCenter: `CC${i}`,
    headId: genId('usr'),
    headName: `Head ${i}`,
    budgetAmount: Math.random() * 1000000,
    userCount: Math.floor(Math.random() * 50),
  }));
}

export function generateEntities(count: number = 3): Entity[] {
  return Array.from({ length: count }, (_, i) => ({
    id: genId('ent'),
    name: `Entity ${i}`,
    code: `E${i}`,
    currency: ['USD', 'EUR', 'GBP'][i % 3]!,
    country: ['US', 'UK', 'DE'][i % 3]!,
    isParent: i === 0,
    parentId: i === 0 ? null : genId('ent'),
  }));
}

export function generateExchangeRates(count: number = 10): ExchangeRate[] {
  return Array.from({ length: count }, (_, i) => ({
    id: genId('fx'),
    fromCurrency: 'USD',
    toCurrency: ['EUR', 'GBP', 'JPY', 'CAD'][i % 4]!,
    rate: 0.8 + Math.random() * 0.4,
    effectiveDate: new Date().toISOString(),
  }));
}

export function generateCellAuditEntries(count: number = 20): CellAuditEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    id: genId('aud'),
    cellId: genId('cell'),
    accountId: genId('acct'),
    accountName: `Audited Account ${i}`,
    month: (i % 12) + 1,
    oldValue: Math.random() * 1000,
    newValue: Math.random() * 1000,
    userId: genId('usr'),
    userName: `Auditor ${i}`,
    timestamp: new Date().toISOString(),
    reason: 'Manual adjustment',
  }));
}

export function generateActivities(count: number = 15): ActivityLog[] {
  return Array.from({ length: count }, (_, i) => ({
    id: genId('act'),
    userId: genId('usr'),
    userName: `Active User ${i}`,
    userEmail: `user${i}@finplan.com`,
    action: ['Created', 'Updated', 'Deleted', 'Reviewed'][i % 4]!,
    resourceType: 'Budget',
    resourceId: genId('res'),
    resourceName: `Resource ${i}`,
    details: null,
    timestamp: new Date().toISOString(),
  }));
}

export function generateNotifications(count: number = 5): Notification[] {
  return Array.from({ length: count }, (_, i) => ({
    id: genId('notif'),
    type: 'info',
    title: `Notification ${i}`,
    message: `Message content for notification ${i}`,
    isRead: false,
    actionUrl: `/resource/${i}`,
    createdAt: new Date().toISOString(),
  }));
}

export function generateTasks(count: number = 5): Task[] {
  const statuses: TaskStatus[] = ['Todo', 'InProgress', 'Done'];
  const priorities: TaskPriority[] = ['Low', 'Medium', 'High', 'Critical'];
  return Array.from({ length: count }, (_, i) => ({
    id: genId('task'),
    title: `Task ${i}`,
    description: `Task description ${i}`,
    assigneeId: genId('usr'),
    assigneeName: `Assignee ${i}`,
    dueDate: new Date(Date.now() + 86400000 * i).toISOString(),
    priority: priorities[i % 4]!,
    status: statuses[i % 3]!,
    relatedResourceType: null,
    relatedResourceId: null,
    createdBy: genId('usr'),
    createdAt: new Date().toISOString(),
  }));
}

export function generateApprovals(count: number = 5): ApprovalRequest[] {
  return Array.from({ length: count }, (_, i) => ({
    id: genId('appr'),
    resourceType: 'Budget',
    resourceId: genId('bud'),
    resourceName: `Budget Approval ${i}`,
    requesterId: genId('usr'),
    requesterName: `Requester ${i}`,
    amount: Math.random() * 100000,
    status: 'Pending',
    submittedAt: new Date().toISOString(),
    reviewedAt: null,
    reviewedBy: null,
    comments: null,
  }));
}

export function generateSettings(): OrganizationSettings {
  return {
    name: 'FinPlan Corp',
    fiscalYear: 2024,
    fiscalYearStart: '2024-01-01',
    calendarType: 'Standard',
    baseCurrency: 'USD',
    timezone: 'UTC',
    dateFormat: 'YYYY-MM-DD',
    decimalPlaces: 2,
  };
}

export function generateRoles(count: number = 3): UserRole[] {
  return Array.from({ length: count }, (_, i) => ({
    id: genId('role'),
    name: `Role ${i}`,
    permissions: ['read', 'write'],
  }));
}

export function generateCashFlow(
  count: number = 12
): { month: number; inflow: number; outflow: number; net: number }[] {
  return Array.from({ length: count }, (_, i) => {
    const inflow = 500000 + Math.random() * 200000;
    const outflow = 300000 + Math.random() * 150000;
    return {
      month: i + 1,
      inflow,
      outflow,
      net: new Decimal(inflow).minus(outflow).toNumber(),
    };
  });
}

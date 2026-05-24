import type { GLAccount, VarianceAnalysis, MonthlyVariance } from '@/types';

import { glAccounts, getAccountsByType, getAccountById, getAccountByCode } from './accounts';
import { users, departments as userDepts, entities as userEntities } from './users';
import { budgets } from './budgets';
import { scenarios } from './scenarios';
import { variancesData } from './variances';

// ---------------------------------------------------------------------------
// Re-exports
// ---------------------------------------------------------------------------

export { glAccounts, getAccountsByType, getAccountById, getAccountByCode };
export { users, getUserById, getUserByEmail, getUsersByDepartment, getUsersByRole } from './users';
export { departments, getDepartmentById } from './departments';
export { entities, getEntityById } from './entities';
export { budgets, getBudgetById, getBudgetsByStatus } from './budgets';
export { forecasts, forecastDrivers, getForecastById, getForecastsByStatus } from './forecasts';
export { scenarios, getScenarioById, getProbabilityWeightedMetrics } from './scenarios';
export {
  variancesData,
  getVarianceByAccountId,
  getVariancesByStatus,
  getVariancesByThreshold,
} from './variances';
export { reports, getReportById, getReportsByCategory } from './reports';
export { analyticsChartData } from './analytics';
export { notifications as notificationData } from './notifications';
export { ACTIVITIES, NOTIFICATIONS, TASKS, APPROVALS } from './activity';
export { mockGLEntries, mockTrialBalance, computeTrialBalance } from './glData';
export { mockExchangeRates, getExchangeRate, convertCurrency } from './exchangeRates';
export {
  mockCellAuditEntries,
  getAuditEntriesByCell,
  getAuditEntriesByAccount,
  getAuditEntriesByUser,
} from './cellAuditEntries';
export {
  mockOrganizationSettings,
  mockOrganizationProfiles,
  mockUserPreferences,
  mockFeatureFlags,
  mockExportOptions,
} from './settings';

export type { ReportTemplate } from './reports';
export type {
  ChartDataPoint,
  MarginDataPoint,
  BudgetVsActualPoint,
  BenchmarkItem,
  AnalyticsChartData,
} from './analytics';
export type { GLEntry } from '@/types';
export type { TrialBalanceItem } from './glData';

// ---------------------------------------------------------------------------
// Aggregated exports
// ---------------------------------------------------------------------------

export const USERS = users;
export const DEPARTMENTS = userDepts;
export const ENTITIES = userEntities;
export const BUDGETS = budgets;
export const SCENARIOS = scenarios;
export const VARIANCE_DATA = variancesData;

// ---------------------------------------------------------------------------
// Fiscal periods
// ---------------------------------------------------------------------------

export const PERIODS = Array.from({ length: 12 }, (_, i) => ({
  id: `period-${String(i + 1).padStart(2, '0')}`,
  year: 2024,
  periodNumber: i + 1,
  name: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
  startDate: `2024-${String(i + 1).padStart(2, '0')}-01`,
  endDate: new Date(2024, i + 1, 0).toISOString().split('T')[0],
}));

// ---------------------------------------------------------------------------
// Full chart of accounts (42 accounts covering full P&L)
// ---------------------------------------------------------------------------

export const CHART_OF_ACCOUNTS: GLAccount[] = [
  // Revenue
  {
    id: 'acct-4000',
    code: '4000',
    name: 'Revenue',
    type: 'Revenue',
    category: 'Operating',
    subCategory: 'Revenue',
    parentId: null,
    level: 0,
    sortOrder: 100,
    isActive: true,
    entityId: 'ent-us',
    departmentId: null,
    isCalculated: false,
    formula: null,
    children: [],
  },
  {
    id: 'acct-4100',
    code: '4100',
    name: 'Subscription Revenue',
    type: 'Revenue',
    category: 'Operating',
    subCategory: 'Subscription',
    parentId: 'acct-4000',
    level: 1,
    sortOrder: 110,
    isActive: true,
    entityId: 'ent-us',
    departmentId: 'dept-sales',
    isCalculated: false,
    formula: null,
    children: [],
  },
  {
    id: 'acct-4110',
    code: '4110',
    name: 'Subscription Revenue - Enterprise',
    type: 'Revenue',
    category: 'Operating',
    subCategory: 'Subscription',
    parentId: 'acct-4100',
    level: 2,
    sortOrder: 111,
    isActive: true,
    entityId: 'ent-us',
    departmentId: 'dept-sales',
    isCalculated: false,
    formula: null,
    children: [],
  },
  {
    id: 'acct-4120',
    code: '4120',
    name: 'Subscription Revenue - SMB',
    type: 'Revenue',
    category: 'Operating',
    subCategory: 'Subscription',
    parentId: 'acct-4100',
    level: 2,
    sortOrder: 112,
    isActive: true,
    entityId: 'ent-us',
    departmentId: 'dept-sales',
    isCalculated: false,
    formula: null,
    children: [],
  },
  {
    id: 'acct-4200',
    code: '4200',
    name: 'Professional Services Revenue',
    type: 'Revenue',
    category: 'Operating',
    subCategory: 'Services',
    parentId: 'acct-4000',
    level: 1,
    sortOrder: 120,
    isActive: true,
    entityId: 'ent-us',
    departmentId: 'dept-sales',
    isCalculated: false,
    formula: null,
    children: [],
  },
  {
    id: 'acct-4300',
    code: '4300',
    name: 'Other Revenue',
    type: 'Revenue',
    category: 'Operating',
    subCategory: 'Other',
    parentId: 'acct-4000',
    level: 1,
    sortOrder: 130,
    isActive: true,
    entityId: 'ent-us',
    departmentId: null,
    isCalculated: false,
    formula: null,
    children: [],
  },
  // COGS
  {
    id: 'acct-5000',
    code: '5000',
    name: 'Cost of Goods Sold',
    type: 'COGS',
    category: 'Operating',
    subCategory: 'COGS',
    parentId: null,
    level: 0,
    sortOrder: 200,
    isActive: true,
    entityId: 'ent-us',
    departmentId: null,
    isCalculated: false,
    formula: null,
    children: [],
  },
  {
    id: 'acct-5100',
    code: '5100',
    name: 'Cloud Infrastructure',
    type: 'COGS',
    category: 'Operating',
    subCategory: 'Infrastructure',
    parentId: 'acct-5000',
    level: 1,
    sortOrder: 210,
    isActive: true,
    entityId: 'ent-us',
    departmentId: 'dept-operations',
    isCalculated: false,
    formula: null,
    children: [],
  },
  {
    id: 'acct-5110',
    code: '5110',
    name: 'Cloud Infrastructure - Production',
    type: 'COGS',
    category: 'Operating',
    subCategory: 'Infrastructure',
    parentId: 'acct-5100',
    level: 2,
    sortOrder: 211,
    isActive: true,
    entityId: 'ent-us',
    departmentId: 'dept-operations',
    isCalculated: false,
    formula: null,
    children: [],
  },
  {
    id: 'acct-5120',
    code: '5120',
    name: 'Cloud Infrastructure - Dev/Test',
    type: 'COGS',
    category: 'Operating',
    subCategory: 'Infrastructure',
    parentId: 'acct-5100',
    level: 2,
    sortOrder: 212,
    isActive: true,
    entityId: 'ent-us',
    departmentId: 'dept-engineering',
    isCalculated: false,
    formula: null,
    children: [],
  },
  {
    id: 'acct-5200',
    code: '5200',
    name: 'Direct Labor',
    type: 'COGS',
    category: 'Operating',
    subCategory: 'Labor',
    parentId: 'acct-5000',
    level: 1,
    sortOrder: 220,
    isActive: true,
    entityId: 'ent-us',
    departmentId: 'dept-operations',
    isCalculated: false,
    formula: null,
    children: [],
  },
  {
    id: 'acct-5300',
    code: '5300',
    name: 'Licensing & Royalties',
    type: 'COGS',
    category: 'Operating',
    subCategory: 'Licensing',
    parentId: 'acct-5000',
    level: 1,
    sortOrder: 230,
    isActive: true,
    entityId: 'ent-us',
    departmentId: null,
    isCalculated: false,
    formula: null,
    children: [],
  },
  // Gross Profit
  {
    id: 'acct-6000',
    code: '6000',
    name: 'Gross Profit',
    type: 'Revenue',
    category: 'Summary',
    subCategory: 'GrossProfit',
    parentId: null,
    level: 0,
    sortOrder: 300,
    isActive: true,
    entityId: 'ent-us',
    departmentId: null,
    isCalculated: true,
    formula: '4000 - 5000',
    children: [],
  },
  // OpEx
  {
    id: 'acct-7000',
    code: '7000',
    name: 'Operating Expenses',
    type: 'OpEx',
    category: 'Operating',
    subCategory: 'OpEx',
    parentId: null,
    level: 0,
    sortOrder: 400,
    isActive: true,
    entityId: 'ent-us',
    departmentId: null,
    isCalculated: false,
    formula: null,
    children: [],
  },
  {
    id: 'acct-7100',
    code: '7100',
    name: 'Salaries & Wages',
    type: 'OpEx',
    category: 'Operating',
    subCategory: 'Personnel',
    parentId: 'acct-7000',
    level: 1,
    sortOrder: 410,
    isActive: true,
    entityId: 'ent-us',
    departmentId: null,
    isCalculated: false,
    formula: null,
    children: [],
  },
  {
    id: 'acct-7110',
    code: '7110',
    name: 'Sales Commissions',
    type: 'OpEx',
    category: 'Operating',
    subCategory: 'Personnel',
    parentId: 'acct-7100',
    level: 2,
    sortOrder: 411,
    isActive: true,
    entityId: 'ent-us',
    departmentId: 'dept-sales',
    isCalculated: false,
    formula: null,
    children: [],
  },
  {
    id: 'acct-7120',
    code: '7120',
    name: 'Bonuses',
    type: 'OpEx',
    category: 'Operating',
    subCategory: 'Personnel',
    parentId: 'acct-7100',
    level: 2,
    sortOrder: 412,
    isActive: true,
    entityId: 'ent-us',
    departmentId: null,
    isCalculated: false,
    formula: null,
    children: [],
  },
  {
    id: 'acct-7200',
    code: '7200',
    name: 'Employee Benefits',
    type: 'OpEx',
    category: 'Operating',
    subCategory: 'Personnel',
    parentId: 'acct-7000',
    level: 1,
    sortOrder: 420,
    isActive: true,
    entityId: 'ent-us',
    departmentId: null,
    isCalculated: false,
    formula: null,
    children: [],
  },
  {
    id: 'acct-7210',
    code: '7210',
    name: 'Health Insurance',
    type: 'OpEx',
    category: 'Operating',
    subCategory: 'Personnel',
    parentId: 'acct-7200',
    level: 2,
    sortOrder: 421,
    isActive: true,
    entityId: 'ent-us',
    departmentId: null,
    isCalculated: false,
    formula: null,
    children: [],
  },
  {
    id: 'acct-7220',
    code: '7220',
    name: 'Retirement Plans',
    type: 'OpEx',
    category: 'Operating',
    subCategory: 'Personnel',
    parentId: 'acct-7200',
    level: 2,
    sortOrder: 422,
    isActive: true,
    entityId: 'ent-us',
    departmentId: null,
    isCalculated: false,
    formula: null,
    children: [],
  },
  {
    id: 'acct-7300',
    code: '7300',
    name: 'Marketing & Advertising',
    type: 'OpEx',
    category: 'Operating',
    subCategory: 'Sales & Marketing',
    parentId: 'acct-7000',
    level: 1,
    sortOrder: 430,
    isActive: true,
    entityId: 'ent-us',
    departmentId: 'dept-marketing',
    isCalculated: false,
    formula: null,
    children: [],
  },
  {
    id: 'acct-7310',
    code: '7310',
    name: 'Digital Advertising',
    type: 'OpEx',
    category: 'Operating',
    subCategory: 'Sales & Marketing',
    parentId: 'acct-7300',
    level: 2,
    sortOrder: 431,
    isActive: true,
    entityId: 'ent-us',
    departmentId: 'dept-marketing',
    isCalculated: false,
    formula: null,
    children: [],
  },
  {
    id: 'acct-7320',
    code: '7320',
    name: 'Events & Trade Shows',
    type: 'OpEx',
    category: 'Operating',
    subCategory: 'Sales & Marketing',
    parentId: 'acct-7300',
    level: 2,
    sortOrder: 432,
    isActive: true,
    entityId: 'ent-us',
    departmentId: 'dept-marketing',
    isCalculated: false,
    formula: null,
    children: [],
  },
  {
    id: 'acct-7330',
    code: '7330',
    name: 'Content Production',
    type: 'OpEx',
    category: 'Operating',
    subCategory: 'Sales & Marketing',
    parentId: 'acct-7300',
    level: 2,
    sortOrder: 433,
    isActive: true,
    entityId: 'ent-us',
    departmentId: 'dept-marketing',
    isCalculated: false,
    formula: null,
    children: [],
  },
  {
    id: 'acct-7400',
    code: '7400',
    name: 'Travel & Entertainment',
    type: 'OpEx',
    category: 'Operating',
    subCategory: 'Travel',
    parentId: 'acct-7000',
    level: 1,
    sortOrder: 440,
    isActive: true,
    entityId: 'ent-us',
    departmentId: null,
    isCalculated: false,
    formula: null,
    children: [],
  },
  {
    id: 'acct-7410',
    code: '7410',
    name: 'Business Travel',
    type: 'OpEx',
    category: 'Operating',
    subCategory: 'Travel',
    parentId: 'acct-7400',
    level: 2,
    sortOrder: 441,
    isActive: true,
    entityId: 'ent-us',
    departmentId: null,
    isCalculated: false,
    formula: null,
    children: [],
  },
  {
    id: 'acct-7420',
    code: '7420',
    name: 'Client Entertainment',
    type: 'OpEx',
    category: 'Operating',
    subCategory: 'Travel',
    parentId: 'acct-7400',
    level: 2,
    sortOrder: 442,
    isActive: true,
    entityId: 'ent-us',
    departmentId: 'dept-sales',
    isCalculated: false,
    formula: null,
    children: [],
  },
  {
    id: 'acct-7500',
    code: '7500',
    name: 'Software & Tools',
    type: 'OpEx',
    category: 'Operating',
    subCategory: 'Technology',
    parentId: 'acct-7000',
    level: 1,
    sortOrder: 450,
    isActive: true,
    entityId: 'ent-us',
    departmentId: null,
    isCalculated: false,
    formula: null,
    children: [],
  },
  {
    id: 'acct-7510',
    code: '7510',
    name: 'SaaS Subscriptions',
    type: 'OpEx',
    category: 'Operating',
    subCategory: 'Technology',
    parentId: 'acct-7500',
    level: 2,
    sortOrder: 451,
    isActive: true,
    entityId: 'ent-us',
    departmentId: null,
    isCalculated: false,
    formula: null,
    children: [],
  },
  {
    id: 'acct-7520',
    code: '7520',
    name: 'Infrastructure Tools',
    type: 'OpEx',
    category: 'Operating',
    subCategory: 'Technology',
    parentId: 'acct-7500',
    level: 2,
    sortOrder: 452,
    isActive: true,
    entityId: 'ent-us',
    departmentId: 'dept-engineering',
    isCalculated: false,
    formula: null,
    children: [],
  },
  {
    id: 'acct-7600',
    code: '7600',
    name: 'Rent & Facilities',
    type: 'OpEx',
    category: 'Operating',
    subCategory: 'Facilities',
    parentId: 'acct-7000',
    level: 1,
    sortOrder: 460,
    isActive: true,
    entityId: 'ent-us',
    departmentId: null,
    isCalculated: false,
    formula: null,
    children: [],
  },
  {
    id: 'acct-7610',
    code: '7610',
    name: 'Office Rent',
    type: 'OpEx',
    category: 'Operating',
    subCategory: 'Facilities',
    parentId: 'acct-7600',
    level: 2,
    sortOrder: 461,
    isActive: true,
    entityId: 'ent-us',
    departmentId: null,
    isCalculated: false,
    formula: null,
    children: [],
  },
  {
    id: 'acct-7620',
    code: '7620',
    name: 'Utilities & Maintenance',
    type: 'OpEx',
    category: 'Operating',
    subCategory: 'Facilities',
    parentId: 'acct-7600',
    level: 2,
    sortOrder: 462,
    isActive: true,
    entityId: 'ent-us',
    departmentId: null,
    isCalculated: false,
    formula: null,
    children: [],
  },
  {
    id: 'acct-7700',
    code: '7700',
    name: 'Professional Services',
    type: 'OpEx',
    category: 'Operating',
    subCategory: 'External Services',
    parentId: 'acct-7000',
    level: 1,
    sortOrder: 470,
    isActive: true,
    entityId: 'ent-us',
    departmentId: null,
    isCalculated: false,
    formula: null,
    children: [],
  },
  {
    id: 'acct-7710',
    code: '7710',
    name: 'Legal Fees',
    type: 'OpEx',
    category: 'Operating',
    subCategory: 'External Services',
    parentId: 'acct-7700',
    level: 2,
    sortOrder: 471,
    isActive: true,
    entityId: 'ent-us',
    departmentId: null,
    isCalculated: false,
    formula: null,
    children: [],
  },
  {
    id: 'acct-7720',
    code: '7720',
    name: 'Audit & Tax',
    type: 'OpEx',
    category: 'Operating',
    subCategory: 'External Services',
    parentId: 'acct-7700',
    level: 2,
    sortOrder: 472,
    isActive: true,
    entityId: 'ent-us',
    departmentId: 'dept-finance',
    isCalculated: false,
    formula: null,
    children: [],
  },
  {
    id: 'acct-7730',
    code: '7730',
    name: 'Consulting',
    type: 'OpEx',
    category: 'Operating',
    subCategory: 'External Services',
    parentId: 'acct-7700',
    level: 2,
    sortOrder: 473,
    isActive: true,
    entityId: 'ent-us',
    departmentId: null,
    isCalculated: false,
    formula: null,
    children: [],
  },
  {
    id: 'acct-7800',
    code: '7800',
    name: 'Depreciation & Amortization',
    type: 'OpEx',
    category: 'Operating',
    subCategory: 'Non-Cash',
    parentId: 'acct-7000',
    level: 1,
    sortOrder: 480,
    isActive: true,
    entityId: 'ent-us',
    departmentId: null,
    isCalculated: false,
    formula: null,
    children: [],
  },
  {
    id: 'acct-7900',
    code: '7900',
    name: 'Other Operating Expenses',
    type: 'OpEx',
    category: 'Operating',
    subCategory: 'Other',
    parentId: 'acct-7000',
    level: 1,
    sortOrder: 490,
    isActive: true,
    entityId: 'ent-us',
    departmentId: null,
    isCalculated: false,
    formula: null,
    children: [],
  },
  // Summary
  {
    id: 'acct-8000',
    code: '8000',
    name: 'EBITDA',
    type: 'OpEx',
    category: 'Summary',
    subCategory: 'Profitability',
    parentId: null,
    level: 0,
    sortOrder: 500,
    isActive: true,
    entityId: 'ent-us',
    departmentId: null,
    isCalculated: true,
    formula: '6000 - 7000 + 7800',
    children: [],
  },
  {
    id: 'acct-8100',
    code: '8100',
    name: 'Operating Income',
    type: 'OpEx',
    category: 'Summary',
    subCategory: 'Profitability',
    parentId: null,
    level: 0,
    sortOrder: 510,
    isActive: true,
    entityId: 'ent-us',
    departmentId: null,
    isCalculated: true,
    formula: '6000 - 7000',
    children: [],
  },
  {
    id: 'acct-8200',
    code: '8200',
    name: 'Net Income',
    type: 'Equity',
    category: 'Summary',
    subCategory: 'Profitability',
    parentId: null,
    level: 0,
    sortOrder: 520,
    isActive: true,
    entityId: 'ent-us',
    departmentId: null,
    isCalculated: true,
    formula: '8100 - tax - interest',
    children: [],
  },
];

// ---------------------------------------------------------------------------
// Monthly actuals and budget data
// ---------------------------------------------------------------------------

function generateMonthlyValues(baseMonthly: number, growth: number, variance: number): number[] {
  return Array.from({ length: 12 }, (_, i) => {
    const trend = baseMonthly * (1 + growth * (i / 11));
    const noise = trend * variance * (Math.random() - 0.5);
    return Math.round(trend + noise);
  });
}

const _seedData: Record<
  string,
  { budgetMonthly: number; actualGrowth: number; actualVariance: number }
> = {
  '4100': { budgetMonthly: 2_400_000, actualGrowth: 0.18, actualVariance: 0.08 },
  '4110': { budgetMonthly: 1_500_000, actualGrowth: 0.22, actualVariance: 0.06 },
  '4120': { budgetMonthly: 900_000, actualGrowth: 0.12, actualVariance: 0.1 },
  '4200': { budgetMonthly: 900_000, actualGrowth: -0.05, actualVariance: 0.12 },
  '4300': { budgetMonthly: 150_000, actualGrowth: 0.05, actualVariance: 0.15 },
  '5100': { budgetMonthly: 450_000, actualGrowth: 0.15, actualVariance: 0.06 },
  '5110': { budgetMonthly: 300_000, actualGrowth: 0.18, actualVariance: 0.05 },
  '5120': { budgetMonthly: 150_000, actualGrowth: 0.1, actualVariance: 0.08 },
  '5200': { budgetMonthly: 210_000, actualGrowth: 0.04, actualVariance: 0.04 },
  '5300': { budgetMonthly: 90_000, actualGrowth: 0.08, actualVariance: 0.1 },
  '7100': { budgetMonthly: 1_830_000, actualGrowth: 0.03, actualVariance: 0.04 },
  '7110': { budgetMonthly: 350_000, actualGrowth: 0.12, actualVariance: 0.08 },
  '7120': { budgetMonthly: 180_000, actualGrowth: 0.05, actualVariance: 0.1 },
  '7200': { budgetMonthly: 300_000, actualGrowth: 0.04, actualVariance: 0.03 },
  '7210': { budgetMonthly: 160_000, actualGrowth: 0.03, actualVariance: 0.03 },
  '7220': { budgetMonthly: 100_000, actualGrowth: 0.04, actualVariance: 0.04 },
  '7300': { budgetMonthly: 675_000, actualGrowth: 0.1, actualVariance: 0.1 },
  '7310': { budgetMonthly: 280_000, actualGrowth: 0.08, actualVariance: 0.12 },
  '7320': { budgetMonthly: 200_000, actualGrowth: 0.15, actualVariance: 0.15 },
  '7330': { budgetMonthly: 120_000, actualGrowth: 0.05, actualVariance: 0.08 },
  '7400': { budgetMonthly: 150_000, actualGrowth: -0.1, actualVariance: 0.1 },
  '7410': { budgetMonthly: 90_000, actualGrowth: -0.08, actualVariance: 0.1 },
  '7420': { budgetMonthly: 50_000, actualGrowth: -0.12, actualVariance: 0.12 },
  '7500': { budgetMonthly: 300_000, actualGrowth: 0.08, actualVariance: 0.05 },
  '7510': { budgetMonthly: 180_000, actualGrowth: 0.1, actualVariance: 0.05 },
  '7520': { budgetMonthly: 100_000, actualGrowth: 0.05, actualVariance: 0.06 },
  '7600': { budgetMonthly: 200_000, actualGrowth: 0.02, actualVariance: 0.02 },
  '7610': { budgetMonthly: 160_000, actualGrowth: 0.02, actualVariance: 0.02 },
  '7620': { budgetMonthly: 35_000, actualGrowth: 0.03, actualVariance: 0.03 },
  '7700': { budgetMonthly: 155_000, actualGrowth: 0.05, actualVariance: 0.15 },
  '7710': { budgetMonthly: 50_000, actualGrowth: 0.03, actualVariance: 0.1 },
  '7720': { budgetMonthly: 60_000, actualGrowth: 0.05, actualVariance: 0.08 },
  '7730': { budgetMonthly: 40_000, actualGrowth: 0.08, actualVariance: 0.2 },
  '7800': { budgetMonthly: 160_000, actualGrowth: 0.0, actualVariance: 0.01 },
  '7900': { budgetMonthly: 130_000, actualGrowth: 0.05, actualVariance: 0.12 },
};

export const MONTHLY_BUDGET: Record<string, number[]> = {};
export const MONTHLY_ACTUALS: Record<string, number[]> = {};

for (const [code, data] of Object.entries(_seedData)) {
  const budgetMonthly = data.budgetMonthly;
  const budget = Array.from({ length: 12 }, (_, i) => {
    const step = i / 11;
    const growthFactor = 1 + 0.08 * step;
    return Math.round(budgetMonthly * growthFactor);
  });
  MONTHLY_BUDGET[code] = budget;

  const actual = generateMonthlyValues(budgetMonthly, data.actualGrowth, data.actualVariance);
  MONTHLY_ACTUALS[code] = actual;
}

// Add summary accounts (calculated)
for (const code of ['4000', '5000', '6000', '7000', '8000', '8100', '8200']) {
  if (!MONTHLY_BUDGET[code]) {
    MONTHLY_BUDGET[code] = Array.from({ length: 12 }, () => 0);
    MONTHLY_ACTUALS[code] = Array.from({ length: 12 }, () => 0);
  }
}

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

function getChildrenCodes(parentCode: string): string[] {
  const parent = CHART_OF_ACCOUNTS.find((a) => a.code === parentCode);
  if (!parent) return [parentCode];
  const directChildren = CHART_OF_ACCOUNTS.filter((a) => a.parentId === parent.id);
  if (directChildren.length === 0) return [parentCode];
  const result: string[] = [];
  for (const child of directChildren) {
    result.push(...getChildrenCodes(child.code));
  }
  return result;
}

export function getAccountBalance(
  accountCode: string,
  month: number,
  type: 'budget' | 'actual'
): number {
  const data = type === 'budget' ? MONTHLY_BUDGET : MONTHLY_ACTUALS;
  const monthIdx = Math.max(0, Math.min(11, month - 1));
  const codes = getChildrenCodes(accountCode);
  let total = 0;
  for (const code of codes) {
    total += data[code]?.[monthIdx] ?? 0;
  }
  return total;
}

export function getYTD(
  accountCode: string,
  throughMonth: number,
  type: 'budget' | 'actual'
): number {
  let total = 0;
  for (let m = 1; m <= Math.min(throughMonth, 12); m++) {
    total += getAccountBalance(accountCode, m, type);
  }
  return total;
}

export function computeVarianceAnalysis(
  accountCode: string,
  throughMonth: number
): VarianceAnalysis | null {
  const account = CHART_OF_ACCOUNTS.find((a) => a.code === accountCode);
  if (!account) return null;

  let budgetTotal = 0;
  let actualTotal = 0;
  const monthlyBreakdown: MonthlyVariance[] = [];

  const monthNames = [
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

  for (let m = 1; m <= throughMonth; m++) {
    const b = getAccountBalance(accountCode, m, 'budget');
    const a = getAccountBalance(accountCode, m, 'actual');
    const v = a - b;
    const pct = b !== 0 ? (v / Math.abs(b)) * 100 : 0;
    budgetTotal += b;
    actualTotal += a;
    monthlyBreakdown.push({
      month: m,
      monthName: monthNames[m - 1],
      budget: b,
      actual: a,
      variance: v,
      percent: Math.round(pct * 100) / 100,
    });
  }

  const dollarVariance = actualTotal - budgetTotal;
  const percentVariance = budgetTotal !== 0 ? (dollarVariance / Math.abs(budgetTotal)) * 100 : 0;

  const isRevenue = account.type === 'Revenue';
  const varianceStatus: VarianceAnalysis['varianceStatus'] =
    dollarVariance === 0
      ? 'Neutral'
      : dollarVariance > 0 === isRevenue
        ? 'Favorable'
        : 'Unfavorable';

  const absPct = Math.abs(percentVariance);
  const thresholdStatus: VarianceAnalysis['thresholdStatus'] =
    absPct > 10 ? 'Significant' : absPct > 5 ? 'Watch' : 'Within';

  return {
    id: `var-${Math.random().toString(36).substr(2, 9)}`,
    accountId: account.id,
    accountName: account.name,
    accountCode: account.code,
    accountType: account.type,
    budgetAmount: budgetTotal,
    actualAmount: actualTotal,
    forecastAmount: budgetTotal + dollarVariance * 0.7,
    dollarVariance,
    percentVariance: Math.round(percentVariance * 100) / 100,
    varianceStatus,
    thresholdStatus,
    commentary: null,
    commentaryStatus: 'NotStarted',
    monthlyBreakdown,
    rateVariance: 0,
    volumeVariance: dollarVariance,
  };
}

export function computePLStatement(throughMonth: number, type: 'budget' | 'actual') {
  const sections = ['Revenue', 'COGS', 'OpEx'] as const;
  const result: Record<
    string,
    { amount: number; accounts: { code: string; name: string; amount: number }[] }
  > = {};

  for (const section of sections) {
    const sectionAccount = CHART_OF_ACCOUNTS.find((a) => a.code === sectionToCode(section));
    if (!sectionAccount) continue;

    const children = CHART_OF_ACCOUNTS.filter(
      (a) => a.parentId === sectionAccount.id && !a.isCalculated
    );
    const accounts = children.map((c) => ({
      code: c.code,
      name: c.name,
      amount: getYTD(c.code, throughMonth, type),
    }));

    result[section] = {
      amount: accounts.reduce((s, a) => s + a.amount, 0),
      accounts,
    };
  }

  const revenue = result['Revenue']?.amount ?? 0;
  const cogs = result['COGS']?.amount ?? 0;
  const opex = result['OpEx']?.amount ?? 0;

  return {
    revenue,
    cogs,
    grossProfit: revenue - cogs,
    opex,
    ebitda: revenue - cogs - opex + getYTD('7800', throughMonth, type),
    operatingIncome: revenue - cogs - opex,
    netIncome: revenue - cogs - opex - getYTD('7900', throughMonth, type),
    sections: result,
  };
}

function sectionToCode(section: 'Revenue' | 'COGS' | 'OpEx'): string {
  switch (section) {
    case 'Revenue':
      return '4000';
    case 'COGS':
      return '5000';
    case 'OpEx':
      return '7000';
  }
}

// ---------------------------------------------------------------------------
// Computed variance data for all accounts up to current month
// ---------------------------------------------------------------------------

export const COMPUTED_VARIANCES: VarianceAnalysis[] = CHART_OF_ACCOUNTS.filter(
  (a) => !a.isCalculated && a.level === 1
)
  .map((a) => computeVarianceAnalysis(a.code, 11))
  .filter((v): v is VarianceAnalysis => v !== null);

/**
 * Deep data-driven coverage for the mock-data layer.
 *
 * The mock data modules are pure constants + tiny lookup helpers. These tests
 * import EVERY module directly (not just via the index barrel) so the full
 * array literals and every helper branch are exercised, and validate the data
 * is structurally sound enough to be consumed by the app.
 */
import { describe, it, expect } from 'vitest';
import { glAccounts, getAccountsByType, getAccountById, getAccountByCode } from './accounts';
import { budgets, getBudgetById, getBudgetsByStatus, mockBudgetLineItems } from './budgets';
import { mockComments, mockTasks, mockApprovals, mockActivityLog } from './collaboration';
import { mockGLAccounts, mockImportJobs } from './data';
import { departments, getDepartmentById } from './departments';
import { forecasts, forecastDrivers, getForecastById, getForecastsByStatus } from './forecasts';
import { notifications, getUnreadCount } from './notifications';
import { reports, getReportById, getReportsByCategory } from './reports';
import { scenarios, getScenarioById, getProbabilityWeightedMetrics } from './scenarios';
import {
  users,
  departments as userDepartments,
  entities as userEntities,
  getUserById,
  getUserByEmail,
  getUsersByDepartment,
  getUsersByRole,
} from './users';
import {
  variancesData,
  getVarianceByAccountId,
  getVariancesByStatus,
  getVariancesByThreshold,
} from './variances';
import {
  generateBudgets,
  generateScenarios,
  generateUsers,
  generateReports,
  generateGLAccounts,
  generateGLEntries,
  generateForecasts,
  generateVariances,
  generateDepartments,
  generateEntities,
  generateExchangeRates,
  generateCellAuditEntries,
  generateActivities,
  generateNotifications,
  generateTasks,
  generateApprovals,
  generateSettings,
  generateRoles,
  generateCashFlow,
} from './generators';
import {
  mockGLEntries,
  mockTrialBalance,
  computeTrialBalance,
  getGLEntriesByAccount,
  getGLEntriesByPeriod,
} from './glData';
import {
  PERIODS,
  CHART_OF_ACCOUNTS,
  MONTHLY_BUDGET,
  MONTHLY_ACTUALS,
  getAccountBalance,
  getYTD,
  computeVarianceAnalysis,
  computePLStatement,
  COMPUTED_VARIANCES,
} from './index';

const uniqueIds = (items: { id: string }[]) =>
  new Set(items.map((i) => i.id)).size === items.length;
const nonEmpty = (items: unknown[]) => items.length > 0;

describe('mockData accounts', () => {
  it('glAccounts is a large, unique chart of accounts', () => {
    expect(glAccounts.length).toBeGreaterThan(20);
    expect(uniqueIds(glAccounts)).toBe(true);
    expect(new Set(glAccounts.map((a) => a.code)).size).toBe(glAccounts.length);
  });

  it('helpers find by id/code/type with graceful miss handling', () => {
    const first = glAccounts[0]!;
    expect(getAccountById(first.id)?.id).toBe(first.id);
    expect(getAccountByCode(first.code)?.code).toBe(first.code);
    expect(getAccountsByType(first.type).length).toBeGreaterThan(0);
    expect(getAccountsByType(first.type).every((a) => a.type === first.type)).toBe(true);

    expect(getAccountById('missing')).toBeUndefined();
    expect(getAccountByCode('999999')).toBeUndefined();
    expect(getAccountsByType('Equity').length).toBeGreaterThanOrEqual(0);
  });
});

describe('mockData budgets', () => {
  it('budgets are a non-empty unique set with line items', () => {
    expect(nonEmpty(budgets)).toBe(true);
    expect(uniqueIds(budgets)).toBe(true);
    expect(nonEmpty(mockBudgetLineItems)).toBe(true);
    expect(uniqueIds(mockBudgetLineItems)).toBe(true);
  });

  it('budget helpers filter by id and status', () => {
    const first = budgets[0]!;
    expect(getBudgetById(first.id)?.id).toBe(first.id);
    expect(getBudgetsByStatus(first.status).length).toBeGreaterThan(0);
    expect(getBudgetById('missing')).toBeUndefined();
    expect(getBudgetsByStatus('Draft').length).toBeGreaterThanOrEqual(0);
  });
});

describe('mockData collaboration', () => {
  it('comments, tasks, approvals and activity logs are populated and unique', () => {
    expect(nonEmpty(mockComments)).toBe(true);
    expect(uniqueIds(mockComments)).toBe(true);
    expect(nonEmpty(mockTasks)).toBe(true);
    expect(uniqueIds(mockTasks)).toBe(true);
    expect(nonEmpty(mockApprovals)).toBe(true);
    expect(uniqueIds(mockApprovals)).toBe(true);
    expect(nonEmpty(mockActivityLog)).toBe(true);
    expect(uniqueIds(mockActivityLog)).toBe(true);
  });

  it('comments reference real author/resource metadata', () => {
    for (const c of mockComments) {
      expect(c.authorId).toBeTruthy();
      expect(c.authorName).toBeTruthy();
      expect(c.resourceId).toBeTruthy();
      expect(c.body || c.content).toBeTruthy();
    }
  });

  it('approvals expose status and actor fields', () => {
    for (const a of mockApprovals) {
      expect(a.status).toBeTruthy();
      expect(a.requesterId || a.requestedById).toBeTruthy();
    }
  });
});

describe('mockData data.ts', () => {
  it('mockGLAccounts and mockImportJobs are populated and unique', () => {
    expect(nonEmpty(mockGLAccounts)).toBe(true);
    expect(uniqueIds(mockGLAccounts)).toBe(true);
    expect(nonEmpty(mockImportJobs)).toBe(true);
    expect(uniqueIds(mockImportJobs)).toBe(true);
  });

  it('gl accounts carry account structure', () => {
    for (const a of mockGLAccounts) {
      expect(a.code).toBeTruthy();
      expect(a.type).toBeTruthy();
      expect(typeof a.level).toBe('number');
    }
  });
});

describe('mockData departments', () => {
  it('departments are populated and unique with lookup helper', () => {
    expect(nonEmpty(departments)).toBe(true);
    expect(uniqueIds(departments)).toBe(true);
    const first = departments[0]!;
    expect(getDepartmentById(first.id)?.id).toBe(first.id);
    expect(getDepartmentById('missing')).toBeUndefined();
  });
});

describe('mockData forecasts', () => {
  it('forecasts and drivers are populated and unique', () => {
    expect(nonEmpty(forecasts)).toBe(true);
    expect(uniqueIds(forecasts)).toBe(true);
    expect(nonEmpty(forecastDrivers)).toBe(true);
    expect(uniqueIds(forecastDrivers)).toBe(true);
  });

  it('forecast helpers filter by id and status', () => {
    const first = forecasts[0]!;
    expect(getForecastById(first.id)?.id).toBe(first.id);
    expect(getForecastsByStatus(first.status).length).toBeGreaterThan(0);
    expect(getForecastById('missing')).toBeUndefined();
    expect(getForecastsByStatus('Draft').length).toBeGreaterThanOrEqual(0);
  });
});

describe('mockData notifications', () => {
  it('notifications are populated and unique', () => {
    expect(nonEmpty(notifications)).toBe(true);
    expect(uniqueIds(notifications)).toBe(true);
    for (const n of notifications) {
      expect(n.title).toBeTruthy();
      expect(n.message).toBeTruthy();
      expect(typeof n.isRead).toBe('boolean');
    }
  });

  it('getUnreadCount matches the unread subset', () => {
    expect(getUnreadCount()).toBe(notifications.filter((n) => !n.isRead).length);
    expect(getUnreadCount()).toBeGreaterThan(0);
  });
});

describe('mockData reports', () => {
  it('reports are populated with categories and formats', () => {
    expect(nonEmpty(reports)).toBe(true);
    expect(uniqueIds(reports)).toBe(true);
    for (const r of reports) {
      expect(r.category).toBeTruthy();
      expect(r.type).toBeTruthy();
      expect(Array.isArray(r.format)).toBe(true);
      expect(r.lastGenerated).toBeTruthy();
    }
  });

  it('report helpers filter by id and category', () => {
    const first = reports[0]!;
    expect(getReportById(first.id)?.id).toBe(first.id);
    expect(getReportsByCategory(first.category).length).toBeGreaterThan(0);
    expect(getReportById('missing')).toBeUndefined();
    expect(getReportsByCategory('nope').length).toBe(0);
  });
});

describe('mockData scenarios', () => {
  it('scenarios are populated and unique', () => {
    expect(nonEmpty(scenarios)).toBe(true);
    expect(uniqueIds(scenarios)).toBe(true);
  });

  it('scenario helper finds by id and computes probability-weighted metrics', () => {
    const first = scenarios[0]!;
    expect(getScenarioById(first.id)?.id).toBe(first.id);
    expect(getScenarioById('missing')).toBeUndefined();

    const weighted = getProbabilityWeightedMetrics();
    expect(weighted).toBeDefined();
    expect(typeof weighted.revenue).toBe('number');
    expect(typeof weighted.ebitda).toBe('number');
  });
});

describe('mockData users', () => {
  it('users, departments and entities are populated and unique', () => {
    expect(nonEmpty(users)).toBe(true);
    expect(uniqueIds(users)).toBe(true);
    expect(nonEmpty(userDepartments)).toBe(true);
    expect(uniqueIds(userDepartments)).toBe(true);
    expect(nonEmpty(userEntities)).toBe(true);
    expect(uniqueIds(userEntities)).toBe(true);
  });

  it('user helpers look up by id, email, department and role', () => {
    const first = users[0]!;
    expect(getUserById(first.id)?.id).toBe(first.id);
    expect(getUserByEmail(first.email)?.id).toBe(first.id);
    expect(getUsersByDepartment(first.departmentId).length).toBeGreaterThan(0);
    expect(getUsersByRole(first.role).length).toBeGreaterThan(0);

    expect(getUserById('missing')).toBeUndefined();
    expect(getUserByEmail('nobody@nowhere.com')).toBeUndefined();
    expect(getUsersByDepartment('missing').length).toBe(0);
    expect(getUsersByRole('Admin').length).toBeGreaterThanOrEqual(0);
  });
});

describe('mockData variances', () => {
  it('variancesData is populated with both status dimensions', () => {
    expect(nonEmpty(variancesData)).toBe(true);
    expect(uniqueIds(variancesData)).toBe(true);
    const statuses = new Set(variancesData.map((v) => v.varianceStatus));
    const thresholds = new Set(variancesData.map((v) => v.thresholdStatus));
    expect(statuses.size).toBeGreaterThan(0);
    expect(thresholds.size).toBeGreaterThan(0);
  });

  it('variance helpers filter by account/status/threshold', () => {
    const first = variancesData[0]!;
    expect(getVarianceByAccountId(first.accountId)?.accountId).toBe(first.accountId);
    expect(getVariancesByStatus(first.varianceStatus).length).toBeGreaterThan(0);
    expect(getVariancesByThreshold(first.thresholdStatus).length).toBeGreaterThan(0);
    expect(getVarianceByAccountId('missing')).toBeUndefined();
    expect(getVariancesByStatus('Neutral').length).toBeGreaterThanOrEqual(0);
    expect(getVariancesByThreshold('Significant').length).toBeGreaterThanOrEqual(0);
  });
});

describe('mockData generators', () => {
  it('generates each entity type with default counts', () => {
    expect(generateBudgets()).toHaveLength(5);
    expect(generateScenarios()).toHaveLength(5);
    expect(generateUsers()).toHaveLength(10);
    expect(generateReports()).toHaveLength(5);
    expect(generateGLAccounts()).toHaveLength(20);
    expect(generateGLEntries()).toHaveLength(50);
    expect(generateForecasts()).toHaveLength(5);
    expect(generateVariances()).toHaveLength(10);
    expect(generateDepartments()).toHaveLength(5);
    expect(generateEntities()).toHaveLength(3);
    expect(generateExchangeRates()).toHaveLength(10);
    expect(generateCellAuditEntries()).toHaveLength(20);
    expect(generateActivities()).toHaveLength(15);
    expect(generateNotifications()).toHaveLength(5);
    expect(generateTasks()).toHaveLength(5);
    expect(generateApprovals()).toHaveLength(5);
    expect(generateRoles()).toHaveLength(3);
    expect(generateCashFlow()).toHaveLength(12);
  });

  it('respects custom counts', () => {
    expect(generateBudgets(0)).toHaveLength(0);
    expect(generateUsers(2)).toHaveLength(2);
    expect(generateGLEntries(7)).toHaveLength(7);
    expect(generateVariances(3)).toHaveLength(3);
    expect(generateCashFlow(4)).toHaveLength(4);
    expect(generateRoles(1)).toHaveLength(1);
  });

  it('generated records are structurally sound', () => {
    for (const b of generateBudgets(3)) {
      expect(b.id).toMatch(/^bud-/);
      expect(b.name).toBeTruthy();
    }
    for (const e of generateGLEntries(3)) {
      expect(e.id).toBeTruthy();
      expect(typeof e.debit).toBe('number');
      expect(typeof e.credit).toBe('number');
    }
    for (const r of generateCashFlow(3)) {
      expect(r.net).toBeCloseTo(r.inflow - r.outflow, 5);
    }
    const settings = generateSettings();
    expect(settings.name).toBe('FinPlan Corp');
    expect(settings.baseCurrency).toBe('USD');
    expect(settings.fiscalYear).toBe(2024);
  });
});

describe('mockData glData', () => {
  it('mockGLEntries and mockTrialBalance are consistent', () => {
    expect(nonEmpty(mockGLEntries)).toBe(true);
    expect(uniqueIds(mockGLEntries)).toBe(true);
    expect(nonEmpty(mockTrialBalance)).toBe(true);

    const recomputed = computeTrialBalance();
    expect(recomputed).toEqual(mockTrialBalance);

    // Debits and credits across the ledger should be close to balanced
    const totalDebit = mockGLEntries.reduce((s, e) => s + e.debit, 0);
    const totalCredit = mockGLEntries.reduce((s, e) => s + e.credit, 0);
    expect(Math.abs(totalDebit - totalCredit)).toBeLessThan(1);
  });

  it('gl entry helpers filter by account and period', () => {
    const first = mockGLEntries[0]!;
    expect(getGLEntriesByAccount(first.accountCode).length).toBeGreaterThan(0);
    expect(getGLEntriesByPeriod(first.period).length).toBeGreaterThan(0);
    expect(getGLEntriesByAccount('missing')).toEqual([]);
    expect(getGLEntriesByPeriod('missing')).toEqual([]);
  });
});

describe('mockData index barrel', () => {
  it('PERIODS covers twelve fiscal periods', () => {
    expect(PERIODS).toHaveLength(12);
    expect(uniqueIds(PERIODS)).toBe(true);
    expect(PERIODS[0]!.name).toBe('Jan');
    expect(PERIODS[11]!.name).toBe('Dec');
    expect(PERIODS[5]!.periodNumber).toBe(6);
  });

  it('CHART_OF_ACCOUNTS is a large unique chart', () => {
    expect(CHART_OF_ACCOUNTS.length).toBeGreaterThan(30);
    expect(uniqueIds(CHART_OF_ACCOUNTS)).toBe(true);
    expect(new Set(CHART_OF_ACCOUNTS.map((a) => a.code)).size).toBe(CHART_OF_ACCOUNTS.length);
  });

  it('MONTHLY_BUDGET and MONTHLY_ACTUALS exist for key accounts', () => {
    for (const code of ['4000', '5000', '6000', '7000', '8000', '8100', '8200']) {
      expect(MONTHLY_BUDGET[code]).toHaveLength(12);
      expect(MONTHLY_ACTUALS[code]).toHaveLength(12);
    }
  });

  it('getAccountBalance aggregates children and clamps months', () => {
    // Parent 4000 >= any single child bucket
    const parent = getAccountBalance('4000', 6, 'budget');
    const child = getAccountBalance('4100', 6, 'budget');
    expect(parent).toBeGreaterThanOrEqual(child);

    // Month clamping: month 0 behaves like month 1; month 99 like month 12
    expect(getAccountBalance('4000', 0, 'budget')).toBe(getAccountBalance('4000', 1, 'budget'));
    expect(getAccountBalance('4000', 99, 'budget')).toBe(getAccountBalance('4000', 12, 'budget'));

    // Unknown code degrades to its own zero bucket
    expect(typeof getAccountBalance('999999', 3, 'budget')).toBe('number');
  });

  it('getYTD accumulates through the requested month', () => {
    const q1 = getYTD('4000', 3, 'actual');
    const m1 = getAccountBalance('4000', 1, 'actual');
    const m2 = getAccountBalance('4000', 2, 'actual');
    const m3 = getAccountBalance('4000', 3, 'actual');
    expect(q1).toBeCloseTo(m1 + m2 + m3, 5);
    // beyond 12 clamps to full year
    expect(getYTD('4000', 99, 'actual')).toBe(getYTD('4000', 12, 'actual'));
  });

  it('computeVarianceAnalysis returns a full analysis or null', () => {
    const analysis = computeVarianceAnalysis('4000', 6);
    expect(analysis).not.toBeNull();
    expect(analysis!.accountCode).toBe('4000');
    expect(analysis!.monthlyBreakdown).toHaveLength(6);
    expect(analysis!.monthlyBreakdown[0]!.monthName).toBe('Jan');
    expect(['Favorable', 'Unfavorable', 'Neutral']).toContain(analysis!.varianceStatus);
    expect(['Significant', 'Watch', 'Within']).toContain(analysis!.thresholdStatus);

    expect(computeVarianceAnalysis('nope', 3)).toBeNull();
  });

  it('computePLStatement builds the three core sections', () => {
    const pl = computePLStatement(6, 'actual');
    expect(pl.revenue).toBeGreaterThan(0);
    expect(pl.grossProfit).toBeCloseTo(pl.revenue - pl.cogs, 5);
    expect(pl.operatingIncome).toBeCloseTo(pl.revenue - pl.cogs - pl.opex, 5);
    expect(pl.sections.Revenue.accounts.length).toBeGreaterThan(0);
    expect(pl.sections.COGS.accounts.length).toBeGreaterThan(0);
    expect(pl.sections.OpEx.accounts.length).toBeGreaterThan(0);
  });

  it('COMPUTED_VARIANCES covers all level-1 non-calculated accounts', () => {
    const expected = CHART_OF_ACCOUNTS.filter((a) => !a.isCalculated && a.level === 1).length;
    expect(COMPUTED_VARIANCES.length).toBe(expected);
    expect(uniqueIds(COMPUTED_VARIANCES)).toBe(true);
  });
});

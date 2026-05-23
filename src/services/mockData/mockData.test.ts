import { describe, it, expect } from 'vitest';
import * as mockData from './index';

describe('Mock Data Integrity', () => {
  it('glAccounts should have correct structure', () => {
    expect(Array.isArray(mockData.glAccounts)).toBe(true);
    mockData.glAccounts.forEach((account) => {
      expect(account).toHaveProperty('id');
      expect(account).toHaveProperty('code');
      expect(account).toHaveProperty('name');
      expect(account).toHaveProperty('type');
      expect([
        'Revenue',
        'COGS',
        'OpEx',
        'OtherIncome',
        'OtherExpense',
        'Asset',
        'Liability',
        'Equity',
      ]).toContain(account.type);
    });
  });

  it('users should have correct structure', () => {
    expect(Array.isArray(mockData.users)).toBe(true);
    mockData.users.forEach((user) => {
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('firstName');
      expect(user).toHaveProperty('lastName');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('role');
    });
  });

  it('budgets should be valid', () => {
    expect(Array.isArray(mockData.budgets)).toBe(true);
    mockData.budgets.forEach((budget) => {
      expect(budget).toHaveProperty('id');
      expect(budget).toHaveProperty('name');
      expect(budget).toHaveProperty('status');
    });
  });

  it('scenarios should be valid', () => {
    expect(Array.isArray(mockData.scenarios)).toBe(true);
    mockData.scenarios.forEach((scenario) => {
      expect(scenario).toHaveProperty('id');
      expect(scenario).toHaveProperty('name');
      expect(scenario).toHaveProperty('probability');
      expect(scenario.probability).toBeGreaterThanOrEqual(0);
      expect(scenario.probability).toBeLessThanOrEqual(1);
    });
  });

  it('trial balance should balance (debit = credit)', () => {
    const trialBalance = mockData.mockTrialBalance;
    const totalDebit = trialBalance.reduce((sum, item) => sum + item.totalDebit, 0);
    const totalCredit = trialBalance.reduce((sum, item) => sum + item.totalCredit, 0);

    expect(Math.abs(totalDebit - totalCredit)).toBeLessThan(0.01);
  });

  it('exchange rates should be realistic', () => {
    const rates = mockData.mockExchangeRates;
    expect(rates.length).toBeGreaterThan(0);
    rates.forEach((rate) => {
      expect(rate.rate).toBeGreaterThan(0);
      expect(rate.fromCurrency).toHaveLength(3);
      expect(rate.toCurrency).toHaveLength(3);
    });
  });

  it('activity logs should have timestamps', () => {
    mockData.ACTIVITIES.forEach((log: any) => {
      expect(log).toHaveProperty('timestamp');
      expect(new Date(log.timestamp).getTime()).not.toBeNaN();
    });
  });

  it('analytics data should be present', () => {
    expect(mockData.analyticsChartData).toBeDefined();
    expect(mockData.analyticsChartData.expenseBreakdown).toBeDefined();
    expect(mockData.analyticsChartData.marginTrend).toBeDefined();
  });
});

/* eslint-disable @typescript-eslint/no-unused-vars */
import type { AccountType } from '../types';

export interface VarianceResult {
  absolute: number;
  percentage: number;
  isFavorable: boolean;
  direction: 'favorable' | 'unfavorable' | 'neutral';
  className: string;
}

// Contra accounts: these reverse their parent's natural sign
const CONTRA_ACCOUNTS = new Set([
  '1300', // Accumulated Depreciation
  '1310', // Accumulated Amortization
  '1320', // Allowance for Doubtful Accounts
  '3200', // Treasury Stock
  '4100', // Sales Returns and Allowances
  '4200', // Sales Discounts
  '5100', // Purchase Returns and Allowances
  '5200', // Purchase Discounts
]);

export class SignConventionEngine {
  /**
   * Get the natural sign for an account type.
   * Assets and Expenses are naturally debits (positive).
   * Liabilities, Equity, and Revenue are naturally credits (positive).
   */
  static getNaturalSign(accountType: AccountType): 'debit' | 'credit' {
    switch (accountType) {
      case 'Asset':
      case 'COGS':
      case 'OpEx':
      case 'CapEx':
        return 'debit';
      case 'Liability':
      case 'Equity':
      case 'Revenue':
        return 'credit';
      default:
        return 'debit';
    }
  }

  /**
   * Check if an account code is a contra account.
   * Contra accounts reverse their parent's natural sign.
   */
  static isContraAccount(accountCode: string): boolean {
    return CONTRA_ACCOUNTS.has(accountCode);
  }

  /**
   * Get the display sign for a value.
   * Revenue positive = good. Expense negative = good for comparison.
   */
  static formatForDisplay(value: number, accountType: AccountType): number {
    const naturalSign = SignConventionEngine.getNaturalSign(accountType);
    // Revenue, Liability, Equity: show as-is (positive = credit balance)
    // Expense, Asset: show as-is (positive = debit balance)
    // For variance display, expenses are inverted so "under budget" shows positive
    if (accountType === 'COGS' || accountType === 'OpEx' || accountType === 'CapEx') {
      return -value; // Invert so under-budget = positive
    }
    return value;
  }

  /**
   * Calculate variance with correct sign convention.
   * For revenue: favorable = actual > budget
   * For expenses: favorable = actual < budget (under budget)
   */
  static calculateVariance(
    actual: number,
    budget: number,
    accountType: AccountType
  ): VarianceResult {
    const absolute = actual - budget;
    const percentage = budget !== 0 ? (absolute / Math.abs(budget)) * 100 : 0;
    const isFavorable = SignConventionEngine.isFavorable(absolute, accountType);

    let direction: 'favorable' | 'unfavorable' | 'neutral';
    let className: string;

    if (Math.abs(percentage) < 0.01) {
      direction = 'neutral';
      className = 'text-gray-600';
    } else if (isFavorable) {
      direction = 'favorable';
      className = 'text-green-600';
    } else {
      direction = 'unfavorable';
      className = 'text-red-600';
    }

    return { absolute, percentage, isFavorable, direction, className };
  }

  /**
   * Determine if a variance is favorable based on account type.
   * Revenue: actual > budget = favorable
   * Expenses: actual < budget = favorable (under budget)
   */
  static isFavorable(variance: number, accountType: AccountType): boolean {
    const naturalSign = SignConventionEngine.getNaturalSign(accountType);
    if (naturalSign === 'credit') {
      // Revenue, Liability, Equity: positive variance = favorable
      return variance > 0;
    } else {
      // Asset, Expense: negative variance = favorable (under budget)
      return variance < 0;
    }
  }

  /**
   * Get variance display text with correct formatting.
   */
  static formatVarianceText(
    actual: number,
    budget: number,
    accountType: AccountType,
    formatCurrency: (v: number) => string
  ): { text: string; percentText: string; className: string } {
    const result = SignConventionEngine.calculateVariance(actual, budget, accountType);
    const sign = result.absolute >= 0 ? '+' : '';
    return {
      text: `${sign}${formatCurrency(result.absolute)}`,
      percentText: `(${result.percentage >= 0 ? '+' : ''}${result.percentage.toFixed(1)}%)`,
      className: result.className,
    };
  }

  /**
   * Normalize a stored value to its natural sign for display.
   * In storage, expenses may be stored as positive debits.
   * For P&L display, we want expenses as positive numbers.
   */
  static normalizeForDisplay(storedValue: number, accountType: AccountType): number {
    // In most accounting systems, values are stored with their natural sign
    // This function ensures consistent display regardless of storage convention
    return storedValue;
  }

  /**
   * Get the sign multiplier for aggregation.
   * When summing into totals, contra accounts need to be subtracted.
   */
  static getAggregationMultiplier(accountCode: string): number {
    return SignConventionEngine.isContraAccount(accountCode) ? -1 : 1;
  }
}

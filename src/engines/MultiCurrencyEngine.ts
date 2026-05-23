import type { ExchangeRate } from '@/types';

export interface TranslationResult {
  translatedAmount: number;
  fxGainLoss: number;
  effectiveRate: number;
}

export class MultiCurrencyEngine {
  static translate(amount: number, fromCurrency: string, toCurrency: string, rate: number): number {
    // Input validation
    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
      throw new Error('amount must be a finite number');
    }
    if (typeof fromCurrency !== 'string' || !/^[A-Z]{3}$/.test(fromCurrency)) {
      throw new Error('fromCurrency must be a valid 3-letter currency code');
    }
    if (typeof toCurrency !== 'string' || !/^[A-Z]{3}$/.test(toCurrency)) {
      throw new Error('toCurrency must be a valid 3-letter currency code');
    }
    if (typeof rate !== 'number' || !Number.isFinite(rate)) {
      throw new Error('rate must be a finite number');
    }
    if (rate < 0) {
      throw new Error('rate cannot be negative');
    }
    if (fromCurrency === toCurrency) return amount;
    if (rate === 0) return 0;
    return amount * rate;
  }

  static calculateTranslationGainLoss(amount: number, oldRate: number, newRate: number): number {
    // Input validation
    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
      throw new Error('amount must be a finite number');
    }
    if (typeof oldRate !== 'number' || !Number.isFinite(oldRate)) {
      throw new Error('oldRate must be a finite number');
    }
    if (typeof newRate !== 'number' || !Number.isFinite(newRate)) {
      throw new Error('newRate must be a finite number');
    }
    if (oldRate < 0 || newRate < 0) {
      throw new Error('rates cannot be negative');
    }
    if (oldRate === 0) return 0;
    return amount * (newRate - oldRate);
  }

  static getWeightedAverageRate(rates: ExchangeRate[]): number {
    // Input validation
    if (!Array.isArray(rates)) {
      throw new Error('rates must be an array');
    }
    if (rates.length === 0) return 0;
    for (const rate of rates) {
      if (typeof rate.rate !== 'number' || !Number.isFinite(rate.rate)) {
        throw new Error('Each rate must have a finite rate value');
      }
      if (rate.rate < 0) {
        throw new Error('Exchange rates cannot be negative');
      }
    }
    const total = rates.reduce((acc, r) => acc + r.rate, 0);
    return total / rates.length;
  }

  static convertIncomeStatement(
    revenue: number,
    expenses: number,
    avgRate: number,
    closeRate: number
  ): { revenueUSD: number; expensesUSD: number; translationGainLoss: number } {
    // Input validation
    if (typeof revenue !== 'number' || !Number.isFinite(revenue)) {
      throw new Error('revenue must be a finite number');
    }
    if (typeof expenses !== 'number' || !Number.isFinite(expenses)) {
      throw new Error('expenses must be a finite number');
    }
    if (typeof avgRate !== 'number' || !Number.isFinite(avgRate)) {
      throw new Error('avgRate must be a finite number');
    }
    if (typeof closeRate !== 'number' || !Number.isFinite(closeRate)) {
      throw new Error('closeRate must be a finite number');
    }
    if (avgRate < 0 || closeRate < 0) {
      throw new Error('rates cannot be negative');
    }
    const revenueUSD = revenue * avgRate;
    const expensesUSD = expenses * avgRate;
    const netIncomeLocal = revenue - expenses;
    const translationGainLoss = netIncomeLocal * (closeRate - avgRate);

    return {
      revenueUSD,
      expensesUSD,
      translationGainLoss,
    };
  }
}

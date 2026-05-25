import type { ExchangeRate } from '@/types';

export type RateType = 'closing' | 'average' | 'historical' | 'transaction';

export interface FXRateEntry {
  from: string;
  to: string;
  rate: number;
  date: string;
  source: 'manual' | 'api' | 'feed';
}

export interface HistoricalRate {
  date: string;
  rate: number;
}

export interface TranslationInput {
  amount: number;
  rateType: RateType;
  entityCurrency: string;
  parentCurrency: string;
  period: string;
}

export class FXEngine {
  private static rates: Map<string, FXRateEntry[]> = new Map();

  private static rateKey(from: string, to: string): string {
    return `${from}_${to}`;
  }

  static getRate(from: string, to: string, date?: string): number {
    if (from === to) return 1;
    const key = this.rateKey(from, to);
    const entries = this.rates.get(key) ?? [];
    if (entries.length === 0) return 0;
    if (date) {
      const entry = entries.find((e) => e.date <= date) ?? entries[entries.length - 1];
      return entry.rate;
    }
    return entries[entries.length - 1].rate;
  }

  static convert(amount: number, from: string, to: string, date?: string): number {
    if (!Number.isFinite(amount)) return 0;
    const rate = this.getRate(from, to, date);
    return rate === 0 ? 0 : amount * rate;
  }

  static setRate(
    from: string,
    to: string,
    rate: number,
    date: string,
    source: FXRateEntry['source'] = 'manual'
  ): void {
    if (!Number.isFinite(rate) || rate < 0) return;
    const key = this.rateKey(from, to);
    const entries = this.rates.get(key) ?? [];
    entries.push({ from, to, rate, date, source });
    entries.sort((a, b) => a.date.localeCompare(b.date));
    this.rates.set(key, entries);
  }

  static getHistoricalRates(
    from: string,
    to: string,
    startDate: string,
    endDate: string
  ): HistoricalRate[] {
    const key = this.rateKey(from, to);
    const entries = this.rates.get(key) ?? [];
    return entries
      .filter((e) => e.date >= startDate && e.date <= endDate)
      .map((e) => ({ date: e.date, rate: e.rate }));
  }

  static translateForConsolidation(input: TranslationInput): {
    translated: number;
    rateUsed: number;
    rateType: RateType;
  } {
    const { amount, rateType, entityCurrency, parentCurrency, period } = input;
    let rate = 0;

    switch (rateType) {
      case 'closing':
        rate = this.getRate(entityCurrency, parentCurrency, period);
        break;
      case 'average':
        rate = this.getAverageRate(entityCurrency, parentCurrency, period);
        break;
      case 'historical':
        rate = this.getRate(entityCurrency, parentCurrency);
        break;
      case 'transaction':
        rate = this.getRate(entityCurrency, parentCurrency, period);
        break;
    }

    return {
      translated: rate === 0 ? 0 : amount * rate,
      rateUsed: rate,
      rateType,
    };
  }

  static getAverageRate(from: string, to: string, period?: string): number {
    const key = this.rateKey(from, to);
    const entries = this.rates.get(key) ?? [];
    if (entries.length === 0) return 0;

    let filtered = entries;
    if (period) {
      const year = period.substring(0, 4);
      filtered = entries.filter((e) => e.date.startsWith(year));
    }

    if (filtered.length === 0) return entries[entries.length - 1].rate;
    const sum = filtered.reduce((acc, e) => acc + e.rate, 0);
    return sum / filtered.length;
  }

  static calculateFXGainLoss(
    baseAmount: number,
    functionalAmount: number,
    currentRate: number,
    historicalRate: number
  ): number {
    if (!Number.isFinite(baseAmount) || !Number.isFinite(functionalAmount)) return 0;
    const translatedAtCurrent = baseAmount * currentRate;
    const translatedAtHistorical = baseAmount * historicalRate;
    return translatedAtCurrent - translatedAtHistorical;
  }

  static loadRates(rates: ExchangeRate[]): void {
    for (const r of rates) {
      this.setRate(
        r.fromCurrency ?? 'USD',
        r.toCurrency ?? 'EUR',
        r.rate,
        r.effectiveDate ?? new Date().toISOString(),
        'api'
      );
    }
  }

  static clearRates(): void {
    this.rates.clear();
  }

  static getAllRates(): FXRateEntry[] {
    const all: FXRateEntry[] = [];
    for (const entries of this.rates.values()) {
      all.push(...entries);
    }
    return all.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * ASC 830 Temporal Method — determines the correct rate type for an account.
   * Monetary items (cash, receivables, payables) use closing rate.
   * Non-monetary items (inventory, fixed assets, equity) use historical rate.
   * Income/expense items use average rate for the period.
   */
  static getASC830RateType(
    accountCategory: 'monetary' | 'non-monetary' | 'income' | 'expense'
  ): RateType {
    switch (accountCategory) {
      case 'monetary':
        return 'closing';
      case 'non-monetary':
        return 'historical';
      case 'income':
      case 'expense':
        return 'average';
    }
  }

  /**
   * ASC 830 translation using the temporal method.
   * Returns translated amount and the rate used.
   */
  static translateTemporal(
    amount: number,
    entityCurrency: string,
    parentCurrency: string,
    accountCategory: 'monetary' | 'non-monetary' | 'income' | 'expense',
    period: string
  ): { translated: number; rateUsed: number; rateType: RateType } {
    const rateType = this.getASC830RateType(accountCategory);
    return this.translateForConsolidation({
      amount,
      rateType,
      entityCurrency,
      parentCurrency,
      period,
    });
  }

  /**
   * Calculate Cumulative Translation Adjustment (CTA) per ASC 830.
   * CTA = translated at current rate - translated at historical rate.
   * This captures the equity impact of exchange rate changes.
   */
  static calculateCTA(amount: number, currentRate: number, historicalRate: number): number {
    if (
      !Number.isFinite(amount) ||
      !Number.isFinite(currentRate) ||
      !Number.isFinite(historicalRate)
    ) {
      return 0;
    }
    return amount * (currentRate - historicalRate);
  }

  /**
   * Full ASC 830 translation report for a set of accounts.
   * Categorizes accounts, applies correct rates, calculates CTA.
   */
  static generateASC830Report(
    accounts: Array<{
      code: string;
      name: string;
      category: 'monetary' | 'non-monetary' | 'income' | 'expense';
      localAmount: number;
    }>,
    entityCurrency: string,
    parentCurrency: string,
    period: string
  ): Array<{
    code: string;
    name: string;
    localAmount: number;
    rateType: RateType;
    rateUsed: number;
    translatedAmount: number;
    ctaAdjustment: number;
  }> {
    const closingRate = this.getRate(entityCurrency, parentCurrency, `${period}-12-31`);
    const historicalRate = this.getRate(entityCurrency, parentCurrency);

    return accounts.map((acct) => {
      const { translated, rateUsed, rateType } = this.translateTemporal(
        acct.localAmount,
        entityCurrency,
        parentCurrency,
        acct.category,
        period
      );
      const cta = this.calculateCTA(acct.localAmount, closingRate, historicalRate);
      return {
        code: acct.code,
        name: acct.name,
        localAmount: acct.localAmount,
        rateType,
        rateUsed,
        translatedAmount: translated,
        ctaAdjustment: acct.category === 'non-monetary' ? 0 : cta,
      };
    });
  }
}

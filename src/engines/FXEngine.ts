import type Decimal from 'decimal.js';
import type { ExchangeRate } from '@/types';
// N-0009: currency translation must not use raw IEEE-754 multiplication.
import { multiplyMoney, toDecimal } from '@/utils/money';

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

/**
 * Thrown when no FX rate exists for the requested currency pair and date
 * policy. NEVER substitute 0 or 1 for a missing rate (F-0001).
 */
export class MissingFXRateError extends Error {
  readonly from: string;
  readonly to: string;
  readonly date?: string;
  readonly context?: string;

  constructor(from: string, to: string, date?: string, context?: string) {
    super(
      `Missing FX rate ${from}->${to}` +
        (date ? ` for ${date} (latest-on-or-before policy)` : '') +
        (context ? ` [${context}]` : '')
    );
    this.name = 'MissingFXRateError';
    this.from = from;
    this.to = to;
    this.date = date;
    this.context = context;
  }
}

/** Thrown when a financial input is NaN, infinite, or otherwise invalid. */
export class InvalidFinancialInputError extends Error {
  readonly field: string;
  readonly value: unknown;

  constructor(field: string, value: unknown, reason: string) {
    super(`Invalid financial input "${field}" (${reason}): ${String(value)}`);
    this.name = 'InvalidFinancialInputError';
    this.field = field;
    this.value = value;
  }
}

/**
 * Policy for getRate when the requested date precedes every known rate.
 * - 'throw' (default): raise MissingFXRateError. Safe and visible.
 * - 'use-earliest': explicitly opt in to the earliest available rate.
 *   Must only be used where the caller documents and surfaces that choice.
 */
export type BeforeEarliestPolicy = 'throw' | 'use-earliest';

export interface GetRateOptions {
  onDateBeforeEarliest?: BeforeEarliestPolicy;
  context?: string;
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}/;
const YEAR_ONLY = /^\d{4}$/;
const YEAR_MONTH = /^\d{4}-\d{2}$/;

/**
 * Normalizes a date or fiscal period to YYYY-MM-DD:
 *  - 'YYYY-MM-DD' (optionally with ISO time suffix) → the calendar date
 *  - 'YYYY-MM' → last day of that month (period-end convention)
 *  - 'YYYY' → December 31 of that year (fiscal-year-end convention)
 * Anything else throws InvalidFinancialInputError.
 */
function normalizeDate(date: string, field: string): string {
  if (typeof date !== 'string' || date.length === 0) {
    throw new InvalidFinancialInputError(field, date, 'expected YYYY[-MM[-DD]] or ISO datetime');
  }
  let normalized: string;
  if (YEAR_ONLY.test(date)) {
    normalized = `${date}-12-31`;
  } else if (YEAR_MONTH.test(date)) {
    const year = Number(date.slice(0, 4));
    const month = Number(date.slice(5, 7));
    if (month < 1 || month > 12) {
      throw new InvalidFinancialInputError(field, date, 'month must be 01-12');
    }
    // Day 0 of month (month+1) is the last day of `month`.
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    normalized = `${date}-${String(lastDay).padStart(2, '0')}`;
  } else if (DATE_ONLY.test(date)) {
    normalized = date.slice(0, 10);
  } else {
    throw new InvalidFinancialInputError(field, date, 'expected YYYY[-MM[-DD]] or ISO datetime');
  }
  // Verify it is a real calendar date (rejects e.g. 2026-13-40).
  const parsed = new Date(`${normalized}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== normalized) {
    throw new InvalidFinancialInputError(field, date, 'not a valid calendar date');
  }
  return normalized;
}

function assertCurrency(code: unknown, field: string): asserts code is string {
  if (typeof code !== 'string' || code.trim().length === 0) {
    throw new InvalidFinancialInputError(field, code, 'currency code must be a non-empty string');
  }
}

export class FXEngine {
  private static rates: Map<string, FXRateEntry[]> = new Map();

  private static rateKey(from: string, to: string): string {
    return `${from}_${to}`;
  }

  /**
   * Returns the rate for a pair. With a date, returns the LATEST rate with
   * date <= requested date (latest-on-or-before, F-0002). Without a date,
   * returns the most recent rate. Same-currency is the identity rate (1).
   * Throws MissingFXRateError when no rate exists — never returns 0 (F-0001).
   */
  static getRate(from: string, to: string, date?: string, options: GetRateOptions = {}): number {
    assertCurrency(from, 'from');
    assertCurrency(to, 'to');
    const normalizedDate = date !== undefined ? normalizeDate(date, 'date') : undefined;
    if (from === to) return 1;
    const key = this.rateKey(from, to);
    const entries = this.rates.get(key) ?? [];
    if (entries.length === 0) {
      throw new MissingFXRateError(from, to, normalizedDate, options.context);
    }
    if (normalizedDate) {
      let latest: FXRateEntry | undefined;
      for (const entry of entries) {
        if (entry.date <= normalizedDate && (!latest || entry.date > latest.date)) {
          latest = entry;
        }
      }
      if (latest) return latest.rate;
      // Requested date precedes all known rates.
      if (options.onDateBeforeEarliest === 'use-earliest') {
        return entries.reduce((a, b) => (a.date <= b.date ? a : b)).rate;
      }
      throw new MissingFXRateError(from, to, normalizedDate, options.context);
    }
    return entries.reduce((a, b) => (a.date >= b.date ? a : b)).rate;
  }

  /**
   * Converts an amount between currencies. Non-finite amounts are rejected;
   * missing rates propagate as MissingFXRateError. Never silently returns 0.
   *
   * N-0009: the multiplication is performed with the canonical money
   * primitive (decimal.js), NOT raw IEEE-754. The audit reproduced
   * `convert(0.07, 'XXX','YYY')` at rate 1.1 returning 0.07700000000000001
   * instead of 0.077. Currency translation feeds consolidation and every
   * translated statement, so drift here propagates into reported figures.
   *
   * Use `convertExact` when the caller needs the full-precision Decimal.
   */
  static convert(
    amount: number,
    from: string,
    to: string,
    date?: string,
    options: GetRateOptions = {}
  ): number {
    return this.convertExact(amount, from, to, date, options).toNumber();
  }

  /**
   * Exact-precision conversion. Returns a Decimal so callers composing
   * multiple FX operations do not round-trip through a float at each step.
   */
  static convertExact(
    amount: number,
    from: string,
    to: string,
    date?: string,
    options: GetRateOptions = {}
  ): Decimal {
    if (!Number.isFinite(amount)) {
      throw new InvalidFinancialInputError('amount', amount, 'must be a finite number');
    }
    if (from === to) {
      assertCurrency(from, 'from');
      assertCurrency(to, 'to');
      return toDecimal(amount, 'amount');
    }
    const rate = this.getRate(from, to, date, options);
    return multiplyMoney(amount, rate);
  }

  /**
   * Records a rate. Invalid rates (non-finite or <= 0) and invalid dates are
   * rejected loudly — a stored 0/negative rate silently corrupts every
   * downstream translation (F-0001).
   */
  static setRate(
    from: string,
    to: string,
    rate: number,
    date: string,
    source: FXRateEntry['source'] = 'manual'
  ): void {
    assertCurrency(from, 'from');
    assertCurrency(to, 'to');
    if (!Number.isFinite(rate) || rate <= 0) {
      throw new InvalidFinancialInputError('rate', rate, 'must be a positive finite number');
    }
    const normalizedDate = normalizeDate(date, 'date');
    const key = this.rateKey(from, to);
    const entries = this.rates.get(key) ?? [];
    entries.push({ from, to, rate, date: normalizedDate, source });
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
    if (!Number.isFinite(amount)) {
      throw new InvalidFinancialInputError('amount', amount, 'must be a finite number');
    }
    const context = `translateForConsolidation:${rateType}:${period}`;
    let rate: number;

    switch (rateType) {
      case 'closing':
        rate = this.getRate(entityCurrency, parentCurrency, period, { context });
        break;
      case 'average':
        rate = this.getAverageRate(entityCurrency, parentCurrency, period);
        break;
      case 'historical':
        rate = this.getRate(entityCurrency, parentCurrency, undefined, { context });
        break;
      case 'transaction':
        rate = this.getRate(entityCurrency, parentCurrency, period, { context });
        break;
    }

    return {
      translated: amount * rate,
      rateUsed: rate,
      rateType,
    };
  }

  /**
   * Average rate over a period's calendar year. Throws MissingFXRateError
   * when the pair has no rates at all, or no rates in the requested year —
   * silently substituting another period's rate is a misstatement.
   */
  static getAverageRate(from: string, to: string, period?: string): number {
    assertCurrency(from, 'from');
    assertCurrency(to, 'to');
    if (from === to) return 1;
    const key = this.rateKey(from, to);
    const entries = this.rates.get(key) ?? [];
    if (entries.length === 0) {
      throw new MissingFXRateError(from, to, period, 'average rate');
    }

    let filtered = entries;
    if (period) {
      const year = period.substring(0, 4);
      filtered = entries.filter((e) => e.date.startsWith(year));
    }

    if (filtered.length === 0) {
      throw new MissingFXRateError(from, to, period, 'average rate: no rates in requested year');
    }
    const sum = filtered.reduce((acc, e) => acc + e.rate, 0);
    return sum / filtered.length;
  }

  static calculateFXGainLoss(
    baseAmount: number,
    functionalAmount: number,
    currentRate: number,
    historicalRate: number
  ): number {
    if (!Number.isFinite(baseAmount)) {
      throw new InvalidFinancialInputError('baseAmount', baseAmount, 'must be finite');
    }
    if (!Number.isFinite(functionalAmount)) {
      throw new InvalidFinancialInputError('functionalAmount', functionalAmount, 'must be finite');
    }
    if (!Number.isFinite(currentRate) || !Number.isFinite(historicalRate)) {
      throw new InvalidFinancialInputError(
        'rate',
        { currentRate, historicalRate },
        'must be finite'
      );
    }
    const translatedAtCurrent = baseAmount * currentRate;
    const translatedAtHistorical = baseAmount * historicalRate;
    return translatedAtCurrent - translatedAtHistorical;
  }

  /**
   * Bulk-loads rates from an exchange feed. Every record must carry an
   * explicit currency pair and effective date — defaulting a missing date to
   * "today" silently files the rate under the wrong period (F-0001 class).
   * Invalid records abort the load before any partial state is written.
   */
  static loadRates(rates: ExchangeRate[]): void {
    if (!Array.isArray(rates)) {
      throw new InvalidFinancialInputError('rates', rates, 'must be an array');
    }
    // Validate everything first: a bulk load must be all-or-nothing.
    const validated: FXRateEntry[] = rates.map((r, index) => {
      if (!r.fromCurrency || !r.toCurrency) {
        throw new InvalidFinancialInputError(
          `rates[${index}]`,
          { from: r.fromCurrency, to: r.toCurrency },
          'currency pair is required'
        );
      }
      if (!r.effectiveDate) {
        throw new InvalidFinancialInputError(
          `rates[${index}].effectiveDate`,
          r.effectiveDate,
          'effective date is required; refusing to default to today'
        );
      }
      if (!Number.isFinite(r.rate) || r.rate <= 0) {
        throw new InvalidFinancialInputError(
          `rates[${index}].rate`,
          r.rate,
          'must be a positive finite number'
        );
      }
      return {
        from: r.fromCurrency,
        to: r.toCurrency,
        rate: r.rate,
        date: normalizeDate(r.effectiveDate, `rates[${index}].effectiveDate`),
        source: 'api' as const,
      };
    });
    for (const entry of validated) {
      this.setRate(entry.from, entry.to, entry.rate, entry.date, entry.source);
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
    if (!Number.isFinite(amount)) {
      throw new InvalidFinancialInputError('amount', amount, 'must be finite');
    }
    if (!Number.isFinite(currentRate) || !Number.isFinite(historicalRate)) {
      throw new InvalidFinancialInputError(
        'rate',
        { currentRate, historicalRate },
        'must be finite'
      );
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
        // ASC 830 (F-0007): CTA captures the translation effect on the NET
        // ASSET position. Income/expense lines are translated at the average
        // rate and must NOT carry CTA; non-monetary items are translated at
        // the historical rate, so their CTA is zero by construction.
        ctaAdjustment: acct.category === 'monetary' ? cta : 0,
      };
    });
  }
}

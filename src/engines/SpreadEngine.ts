import type { AccountType } from '../types';

export type SpreadMethod =
  | 'even'
  | 'frontLoaded'
  | 'backLoaded'
  | 'seasonal'
  | 'driverBased'
  | 'custom';

export interface SpreadConfig {
  method: SpreadMethod;
  periods: number;
  weights?: number[];
  driverValues?: number[];
  percentages?: number[];
}

export interface PeriodAmounts {
  periods: string[];
  amounts: number[];
  total: number;
}

export interface BudgetLineItem {
  id: string;
  annualAmount: number;
  accountId?: string;
  accountType?: AccountType;
  periods?: Record<string, number>;
}

export class SpreadEngine {
  /**
   * Even spread: equal distribution across all periods
   * $1,200,000 / 12 = $100,000/month
   */
  static even(annual: number, periods: number): number[] {
    if (periods <= 0) return [];
    const perPeriod = annual / periods;
    return Array.from({ length: periods }, () => perPeriod);
  }

  /**
   * Front-loaded: heavier in early periods
   * Q1: 35%, Q2: 25%, Q3: 22%, Q4: 18% (typical aggressive ramp)
   */
  static frontLoaded(annual: number, periods: number): number[] {
    if (periods <= 0) return [];
    const quarterly = [0.35, 0.25, 0.22, 0.18];
    const weights = SpreadEngine.expandToPeriods(quarterly, periods);
    return weights.map((w) => annual * w);
  }

  /**
   * Back-loaded: heavier in later periods
   * Q1: 18%, Q2: 22%, Q3: 25%, Q4: 35% (new product launch)
   */
  static backLoaded(annual: number, periods: number): number[] {
    if (periods <= 0) return [];
    const quarterly = [0.18, 0.22, 0.25, 0.35];
    const weights = SpreadEngine.expandToPeriods(quarterly, periods);
    return weights.map((w) => annual * w);
  }

  /**
   * Seasonal: weighted by historical ratios
   * Retail example: Nov 11%, Dec 16%, rest ~7-8%
   */
  static seasonal(annual: number, weights: number[]): number[] {
    if (weights.length === 0) return [];
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    if (totalWeight === 0) return SpreadEngine.even(annual, weights.length);
    return weights.map((w) => annual * (w / totalWeight));
  }

  /**
   * Driver-based: distributed by operational driver
   * Example: distribute $1.2M by headcount [10, 15, 20, 25, 12, 8, 10, 15, 20, 25, 12, 8]
   */
  static driverBased(annual: number, driverValues: number[]): number[] {
    if (driverValues.length === 0) return [];
    const totalDriver = driverValues.reduce((sum, v) => sum + v, 0);
    if (totalDriver === 0) return SpreadEngine.even(annual, driverValues.length);
    return driverValues.map((v) => annual * (v / totalDriver));
  }

  /**
   * Custom: user-defined percentages
   * Must sum to 1.0 (or will be normalized)
   */
  static custom(annual: number, percentages: number[]): number[] {
    if (percentages.length === 0) return [];
    const total = percentages.reduce((sum, p) => sum + p, 0);
    if (total === 0) return SpreadEngine.even(annual, percentages.length);
    return percentages.map((p) => annual * (p / total));
  }

  /**
   * Apply spread to a budget line item
   */
  static applyToLineItem(lineItem: BudgetLineItem, config: SpreadConfig): PeriodAmounts {
    const amounts = SpreadEngine.spread(lineItem.annualAmount, config);
    const periodLabels = SpreadEngine.generatePeriodLabels(config.periods);

    return {
      periods: periodLabels,
      amounts,
      total: amounts.reduce((sum, a) => sum + a, 0),
    };
  }

  /**
   * Dispatch to the correct spread method
   */
  static spread(annual: number, config: SpreadConfig): number[] {
    switch (config.method) {
      case 'even':
        return SpreadEngine.even(annual, config.periods);
      case 'frontLoaded':
        return SpreadEngine.frontLoaded(annual, config.periods);
      case 'backLoaded':
        return SpreadEngine.backLoaded(annual, config.periods);
      case 'seasonal':
        return SpreadEngine.seasonal(annual, config.weights ?? []);
      case 'driverBased':
        return SpreadEngine.driverBased(annual, config.driverValues ?? []);
      case 'custom':
        return SpreadEngine.custom(annual, config.percentages ?? []);
      default:
        return SpreadEngine.even(annual, config.periods);
    }
  }

  /**
   * Generate period labels (M1, M2, ... or Q1, Q2, ...)
   */
  static generatePeriodLabels(periods: number): string[] {
    if (periods <= 12) {
      return Array.from({ length: periods }, (_, i) => `M${i + 1}`);
    }
    return Array.from({ length: periods }, (_, i) => `P${i + 1}`);
  }

  /**
   * Expand quarterly weights to monthly (or arbitrary period count)
   */
  private static expandToPeriods(quarterly: number[], periods: number): number[] {
    if (periods === 4) return quarterly;
    if (periods === 12) {
      return quarterly.flatMap((q) => [q / 3, q / 3, q / 3]);
    }
    // For other counts, distribute quarterly weight evenly
    const perQuarter = periods / 4;
    return quarterly
      .flatMap((q) => Array.from({ length: Math.ceil(perQuarter) }, () => q / perQuarter))
      .slice(0, periods);
  }

  /**
   * Round amounts to avoid floating point issues while preserving total
   */
  static roundToTotal(amounts: number[], targetTotal: number): number[] {
    const rounded = amounts.map((a) => Math.round(a * 100) / 100);
    const diff = Math.round((targetTotal - rounded.reduce((s, a) => s + a, 0)) * 100) / 100;
    if (diff !== 0 && rounded.length > 0) {
      rounded![rounded.length - 1]! += diff;
    }
    return rounded;
  }
}

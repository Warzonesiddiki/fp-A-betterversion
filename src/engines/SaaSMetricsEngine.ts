import type { CohortData } from '@/types/sector-types';
import { roundTo, sumMoney, multiplyMoney, divideMoney } from '../utils/money';

/**
 * SaaS revenue metrics are reported figures, so MRR/ARR arithmetic runs through
 * the canonical money primitive (decimal.js, ROUND_HALF_UP) instead of raw
 * IEEE-754 math. Currency amounts round to cents; ratios keep more precision.
 *
 * NOTE: the documented Infinity returns (zero churn => infinite LTV, zero S&M
 * spend => infinite magic number) are a deliberate part of this API's contract
 * and are preserved exactly. They are guarded BEFORE any division, so no
 * division by zero ever reaches the money primitive.
 */
const CURRENCY_PLACES = 2;
const RATIO_PLACES = 10;

export interface MRRData {
  period: string;
  openingMRR: number;
  newMRR: number;
  expansionMRR: number;
  contractionMRR: number;
  churnMRR: number;
  closingMRR: number;
  customerCount: number;
}

export class SaaSMetricsEngine {
  /**
   * Calculates Annual Recurring Revenue (ARR)
   * @param monthlyMRR Current Monthly Recurring Revenue
   */
  static calculateARR(monthlyMRR: number): number {
    return roundTo(multiplyMoney(monthlyMRR, 12), CURRENCY_PLACES);
  }

  /**
   * Calculates Net Revenue Retention (NRR)
   * GAAP compliant: (Starting MRR + Expansion - Contraction - Churn) / Starting MRR
   */
  static calculateNRR(
    openingMRR: number,
    expansionMRR: number,
    contractionMRR: number,
    churnMRR: number
  ): number {
    if (openingMRR < 0) throw new Error('Opening MRR cannot be negative');
    if (openingMRR === 0) return 0; // Technically undefined for the cohort, but 0 is common for empty start

    const netRetention = sumMoney([openingMRR, expansionMRR]).minus(
      sumMoney([contractionMRR, churnMRR])
    );
    return roundTo(divideMoney(netRetention, openingMRR).times(100), RATIO_PLACES);
  }

  /**
   * Calculates Customer Churn Rate
   */
  static calculateChurnRate(lostCustomers: number, totalAtStart: number): number {
    if (totalAtStart < 0) throw new Error('Total customers at start cannot be negative');
    if (totalAtStart === 0) return lostCustomers > 0 ? Infinity : 0;
    return roundTo(divideMoney(lostCustomers, totalAtStart).times(100), RATIO_PLACES);
  }

  /**
   * Calculates LTV to CAC Ratio
   * LTV = (ARPU * Gross Margin) / Churn Rate
   * Precision: Handle 0 churn (infinite LTV)
   */
  static calculateLTVtoCAC(
    avgRevenue: number,
    grossMargin: number,
    churnRate: number,
    cac: number
  ): number {
    if (cac < 0) throw new Error('CAC cannot be negative');
    if (grossMargin < 0 || grossMargin > 100)
      throw new Error('Gross margin must be between 0 and 100');

    if (cac === 0) {
      return avgRevenue > 0 ? Infinity : 0;
    }

    if (churnRate <= 0) {
      // 0 churn means infinite LTV, thus infinite LTV:CAC if CAC > 0
      return avgRevenue > 0 ? Infinity : 0;
    }

    // LTV = (ARPU x gross margin %) / churn %. Both rates are divided by 100 in
    // exact decimals, so the ratio does not inherit binary drift.
    const ltv = divideMoney(
      multiplyMoney(avgRevenue, divideMoney(grossMargin, 100)),
      divideMoney(churnRate, 100)
    );
    return roundTo(divideMoney(ltv, cac), RATIO_PLACES);
  }

  static buildCohortTable(data: MRRData[]): CohortData[] {
    return data.map((d) => ({
      cohort: d.period,
      periods: [d.openingMRR, d.newMRR, d.expansionMRR, d.contractionMRR, d.churnMRR, d.closingMRR],
      customerCount: d.customerCount,
      averageRevenuePerCustomer:
        d.customerCount > 0
          ? roundTo(divideMoney(d.closingMRR, d.customerCount), CURRENCY_PLACES)
          : 0,
    }));
  }

  /**
   * Calculates the SaaS Magic Number
   * (Net New ARR in Quarter) / (S&M Spend in Prior Quarter)
   */
  static calculateMagicNumber(netNewARR: number, priorQuarterSAndM: number): number {
    if (priorQuarterSAndM < 0) throw new Error('Sales and Marketing spend cannot be negative');
    if (priorQuarterSAndM === 0) {
      return netNewARR > 0 ? Infinity : 0;
    }
    return roundTo(divideMoney(netNewARR, priorQuarterSAndM), RATIO_PLACES);
  }

  /**
   * Calculates the SaaS Quick Ratio
   * (New MRR + Expansion MRR) / (Contraction MRR + Churn MRR)
   */
  static calculateQuickRatio(
    newMRR: number,
    expansionMRR: number,
    contractionMRR: number,
    churnMRR: number
  ): number {
    const churnTotal = sumMoney([contractionMRR, churnMRR]);
    const growthTotal = sumMoney([newMRR, expansionMRR]);

    if (churnTotal.isNegative()) throw new Error('Churn/Contraction MRR cannot be negative');
    if (growthTotal.isNegative()) throw new Error('New/Expansion MRR cannot be negative');

    if (churnTotal.isZero()) {
      return growthTotal.gt(0) ? Infinity : 0;
    }

    return roundTo(divideMoney(growthTotal, churnTotal), RATIO_PLACES);
  }
}

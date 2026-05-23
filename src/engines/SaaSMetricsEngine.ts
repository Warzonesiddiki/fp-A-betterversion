import type { CohortData } from '@/types/sector-types';

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
    return monthlyMRR * 12;
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

    const netRetention = openingMRR + expansionMRR - contractionMRR - churnMRR;
    return (netRetention / openingMRR) * 100;
  }

  /**
   * Calculates Customer Churn Rate
   */
  static calculateChurnRate(lostCustomers: number, totalAtStart: number): number {
    if (totalAtStart < 0) throw new Error('Total customers at start cannot be negative');
    if (totalAtStart === 0) return lostCustomers > 0 ? Infinity : 0;
    return (lostCustomers / totalAtStart) * 100;
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

    const ltv = (avgRevenue * (grossMargin / 100)) / (churnRate / 100);
    return ltv / cac;
  }

  static buildCohortTable(data: MRRData[]): CohortData[] {
    return data.map((d) => ({
      cohort: d.period,
      periods: [d.openingMRR, d.newMRR, d.expansionMRR, d.contractionMRR, d.churnMRR, d.closingMRR],
      customerCount: d.customerCount,
      averageRevenuePerCustomer: d.customerCount > 0 ? d.closingMRR / d.customerCount : 0,
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
    return netNewARR / priorQuarterSAndM;
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
    const churnTotal = contractionMRR + churnMRR;
    const growthTotal = newMRR + expansionMRR;

    if (churnTotal < 0) throw new Error('Churn/Contraction MRR cannot be negative');
    if (growthTotal < 0) throw new Error('New/Expansion MRR cannot be negative');

    if (churnTotal === 0) {
      return growthTotal > 0 ? Infinity : 0;
    }

    return growthTotal / churnTotal;
  }
}

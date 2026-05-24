import type { GLEntry } from '@/types';

export class COGSVarianceEngine {
  static computePurchasePriceVariance(
    standardPrice: number,
    actualPrice: number,
    actualQuantity: number
  ): number {
    return (standardPrice - actualPrice) * actualQuantity;
  }

  static computeUsageVariance(
    standardQuantity: number,
    actualQuantity: number,
    standardPrice: number
  ): number {
    return (standardQuantity - actualQuantity) * standardPrice;
  }

  static computeEfficiencyVariance(
    actualHours: number,
    standardHours: number,
    standardRate: number
  ): number {
    return (standardHours - actualHours) * standardRate;
  }

  static computeVolumeVariance(
    actualVolume: number,
    budgetedVolume: number,
    standardOverheadRate: number
  ): number {
    return (actualVolume - budgetedVolume) * standardOverheadRate;
  }

  static computeTotalCOGSVariance(params: {
    standardCost: number;
    actualCost: number;
    priceVariance: number;
    usageVariance: number;
    efficiencyVariance: number;
    volumeVariance: number;
  }): { totalVariance: number; accountedFor: boolean; unexplained: number } {
    const totalVariance = params.standardCost - params.actualCost;
    const identified =
      params.priceVariance +
      params.usageVariance +
      params.efficiencyVariance +
      params.volumeVariance;
    const unexplained = totalVariance - identified;

    return {
      totalVariance,
      accountedFor: Math.abs(unexplained) < 0.01,
      unexplained,
    };
  }

  /**
   * Calculates Manufacturing variances from GL entries
   * Assumption:
   * - 5xxx: Actual COGS
   * - Standards are mocked based on 95% efficiency for now
   */
  static calculateGLVariances(entries: GLEntry[]): {
    actualCOGS: number;
    standardCOGS: number;
    variance: number;
    variancePercent: number;
    totalVariance: number;
    breakdown: Array<{ name: string; value: number }>;
  } {
    const actualCOGS = Math.abs(
      entries.filter((e) => e.accountCode.startsWith('5')).reduce((acc, e) => acc + e.amount, 0)
    );
    const standardCOGS = actualCOGS * 0.95; // Assuming 5% unfavorable variance default

    // Decompose mock variances for UI
    const priceVar = -actualCOGS * 0.02;
    const usageVar = -actualCOGS * 0.015;
    const efficiencyVar = actualCOGS * 0.005;
    const volumeVar = standardCOGS - actualCOGS - (priceVar + usageVar + efficiencyVar);

    const variance = standardCOGS - actualCOGS;
    const variancePercent = standardCOGS > 0 ? (variance / standardCOGS) * 100 : 0;

    return {
      actualCOGS,
      standardCOGS,
      variance,
      variancePercent,
      totalVariance: variance,
      breakdown: [
        { name: 'Price', value: priceVar },
        { name: 'Usage', value: usageVar },
        { name: 'Efficiency', value: efficiencyVar },
        { name: 'Volume', value: volumeVar },
      ],
    };
  }
}

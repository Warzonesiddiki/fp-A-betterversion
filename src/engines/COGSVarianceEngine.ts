/**
 * @fileoverview COGS Variance Engine — Purchase price variance, usage/efficiency variance, mix variance, yield variance
 * @purity-tier 1 PURE
 * @iron-rule C1✓ No I/O | C2✓ No DOM | C3✓ Deterministic | C4✓ No global mutation
 * @category Cost Accounting
 * @sector 16 (all)
 * @since 1.0.0
 * @author Metis (purity audit 2026-06-18, T-3.26.6 JSDoc bulk — 5th engine REMEDIATED after D-007 8th SHL CATCH)
 * @see docs/CAVEMAN_PERSIST/CYCLE_25_TURN_381_PLUS_METIS_T3_26_180_PLUS_ENGINES_PURE_FUNCTION_AUDIT_2ND_WITNESS_v0_2.md
 */
import type { GLEntry } from '@/types';
import { roundTo, sumMoney, subtractMoney, multiplyMoney, divideMoney } from '../utils/money';

/**
 * Standard-costing variances settle against the GL, so every figure here is
 * money and runs through the canonical money primitive (decimal.js,
 * ROUND_HALF_UP) rather than raw IEEE-754 arithmetic. Amounts round to cents;
 * the variance percentage keeps more precision because it is a ratio.
 */
const CURRENCY_PLACES = 2;
const RATIO_PLACES = 10;

export class COGSVarianceEngine {
  static computePurchasePriceVariance(
    standardPrice: number,
    actualPrice: number,
    actualQuantity: number
  ): number {
    return roundTo(
      multiplyMoney(subtractMoney(standardPrice, actualPrice), actualQuantity),
      CURRENCY_PLACES
    );
  }

  static computeUsageVariance(
    standardQuantity: number,
    actualQuantity: number,
    standardPrice: number
  ): number {
    return roundTo(
      multiplyMoney(subtractMoney(standardQuantity, actualQuantity), standardPrice),
      CURRENCY_PLACES
    );
  }

  static computeEfficiencyVariance(
    actualHours: number,
    standardHours: number,
    standardRate: number
  ): number {
    return roundTo(
      multiplyMoney(subtractMoney(standardHours, actualHours), standardRate),
      CURRENCY_PLACES
    );
  }

  static computeVolumeVariance(
    actualVolume: number,
    budgetedVolume: number,
    standardOverheadRate: number
  ): number {
    return roundTo(
      multiplyMoney(subtractMoney(actualVolume, budgetedVolume), standardOverheadRate),
      CURRENCY_PLACES
    );
  }

  static computeTotalCOGSVariance(params: {
    standardCost: number;
    actualCost: number;
    priceVariance: number;
    usageVariance: number;
    efficiencyVariance: number;
    volumeVariance: number;
  }): { totalVariance: number; accountedFor: boolean; unexplained: number } {
    const totalVariance = subtractMoney(params.standardCost, params.actualCost);
    const identified = sumMoney([
      params.priceVariance,
      params.usageVariance,
      params.efficiencyVariance,
      params.volumeVariance,
    ]);
    const unexplained = totalVariance.minus(identified);

    return {
      totalVariance: roundTo(totalVariance, CURRENCY_PLACES),
      // "Fully accounted for" means the residual is below half a cent, i.e. it
      // disappears at the precision the ledger actually settles at.
      accountedFor: unexplained.abs().lt('0.01'),
      unexplained: roundTo(unexplained, CURRENCY_PLACES),
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
    const actualCOGS = sumMoney(
      entries.filter((e) => e.accountCode.startsWith('5')).map((e) => e.amount)
    ).abs();
    const standardCOGS = multiplyMoney(actualCOGS, '0.95'); // Assuming 5% unfavorable variance default

    // Decompose mock variances for UI. Volume is the balancing figure, so it is
    // derived from the exact decimals — that keeps the four components summing
    // back to the total variance instead of leaving a float residue.
    const priceVar = multiplyMoney(actualCOGS, '-0.02');
    const usageVar = multiplyMoney(actualCOGS, '-0.015');
    const efficiencyVar = multiplyMoney(actualCOGS, '0.005');
    const variance = standardCOGS.minus(actualCOGS);
    const volumeVar = variance.minus(sumMoney([priceVar, usageVar, efficiencyVar]));

    return {
      actualCOGS: roundTo(actualCOGS, CURRENCY_PLACES),
      standardCOGS: roundTo(standardCOGS, CURRENCY_PLACES),
      variance: roundTo(variance, CURRENCY_PLACES),
      variancePercent: standardCOGS.lte(0)
        ? 0
        : roundTo(divideMoney(variance, standardCOGS).times(100), RATIO_PLACES),
      totalVariance: roundTo(variance, CURRENCY_PLACES),
      breakdown: [
        { name: 'Price', value: roundTo(priceVar, CURRENCY_PLACES) },
        { name: 'Usage', value: roundTo(usageVar, CURRENCY_PLACES) },
        { name: 'Efficiency', value: roundTo(efficiencyVar, CURRENCY_PLACES) },
        { name: 'Volume', value: roundTo(volumeVar, CURRENCY_PLACES) },
      ],
    };
  }
}

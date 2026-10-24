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

/**
 * Posted standard-cost inputs for the same scope/period as the 5xxx actuals.
 * Every field is optional because the general ledger does not carry a
 * standard-cost layer; each figure must be posted by the user before the
 * corresponding variance can exist.
 */
export interface GLStandardCostInputs {
  /** Posted standard cost total for the period/scope of the 5xxx postings. */
  standardCost?: number;
  /** Posted purchase-price variance (needs posted standard prices × actual quantities). */
  priceVariance?: number;
  /** Posted material/labour usage variance. */
  usageVariance?: number;
  /** Posted efficiency variance. */
  efficiencyVariance?: number;
  /** Posted production-volume (overhead absorption) variance. */
  volumeVariance?: number;
}

export interface GLCOGSVarianceResult {
  /** Measured from the ledger: absolute signed sum of 5xxx postings. Always present. */
  actualCOGS: number;
  /**
   * The posted standard cost, echoed back at cent precision. `null` means no
   * standard-cost layer is posted for this scope — the GL alone cannot
   * produce a baseline, and inventing one (e.g. actual × 0.95) is prohibited.
   */
  standardCOGS: number | null;
  /**
   * Total variance = standardCOGS − actualCOGS. `null` when no standard cost
   * is posted.
   */
  variance: number | null;
  /**
   * variance ÷ standardCOGS × 100. `null` when no standard cost is posted or
   * when the posted standard is ≤ 0 (a percentage against a non-positive
   * baseline is meaningless, not zero).
   */
  variancePercent: number | null;
  /** Alias of {@link variance} kept for existing callers. `null` likewise. */
  totalVariance: number | null;
  /**
   * Price / Usage / Efficiency / Volume decomposition, cent-rounded, built
   * exclusively from posted component variances. `null` unless all four are
   * posted — the previous balancing-figure derivation fabricated the mix.
   */
  breakdown: Array<{ name: string; value: number }> | null;
}

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
   * Sums actual COGS from GL 5xxx postings and settles it against POSTED
   * standard costs when the caller supplies them.
   *
   * Standards are never inferred: the ledger has no standard-cost layer, so an
   * absent posting yields `null` variance outputs (disclosed downstream as
   * "standard-cost layer required"), never an estimate such as
   * actual × 0.95 with an invented −2%/−1.5%/+0.5% decomposition.
   */
  static calculateGLVariances(
    entries: GLEntry[],
    standards?: GLStandardCostInputs
  ): GLCOGSVarianceResult {
    const actualCOGS = sumMoney(
      entries.filter((e) => e.accountCode.startsWith('5')).map((e) => e.amount)
    ).abs();
    const roundedActual = roundTo(actualCOGS, CURRENCY_PLACES);

    const standardCost = standards?.standardCost;
    if (standardCost === undefined || standardCost === null) {
      return {
        actualCOGS: roundedActual,
        standardCOGS: null,
        variance: null,
        variancePercent: null,
        totalVariance: null,
        breakdown: null,
      };
    }

    const standardCOGS = roundTo(standardCost, CURRENCY_PLACES);
    const variance = roundTo(subtractMoney(standardCOGS, roundedActual), CURRENCY_PLACES);
    const variancePercent =
      standardCOGS <= 0
        ? null
        : roundTo(divideMoney(variance, standardCOGS).times(100), RATIO_PLACES);

    const components: Array<{ name: string; value: number | undefined }> = [
      { name: 'Price', value: standards?.priceVariance },
      { name: 'Usage', value: standards?.usageVariance },
      { name: 'Efficiency', value: standards?.efficiencyVariance },
      { name: 'Volume', value: standards?.volumeVariance },
    ];
    const allPosted = components.every(
      (c): c is { name: string; value: number } => typeof c.value === 'number'
    );
    const breakdown = allPosted
      ? components.map((c) => ({ name: c.name, value: roundTo(c.value, CURRENCY_PLACES) }))
      : null;

    return {
      actualCOGS: roundedActual,
      standardCOGS,
      variance,
      variancePercent,
      totalVariance: variance,
      breakdown,
    };
  }
}

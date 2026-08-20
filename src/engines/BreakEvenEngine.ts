/**
 * @fileoverview Break-Even Engine — Break-even units/revenue, contribution margin, margin of safety, operating leverage
 * @purity-tier 1 PURE
 * @iron-rule C1✓ No I/O | C2✓ No DOM | C3✓ Deterministic | C4✓ No global mutation
 * @category Cost Accounting
 * @sector 16 (all)
 * @since 1.0.0
 * @author Metis (purity audit 2026-06-18, T-3.26.6 JSDoc bulk — 3rd engine REMEDIATED after D-007 8th SHL CATCH)
 * @see docs/CAVEMAN_PERSIST/CYCLE_25_TURN_381_PLUS_METIS_T3_26_180_PLUS_ENGINES_PURE_FUNCTION_AUDIT_2ND_WITNESS_v0_2.md
 */
// =============================================================================
// BREAK-EVEN ENGINE — Break-even analysis and margin of safety
// Pure TypeScript, deterministic, testable
// =============================================================================

import {
  addMoney,
  divideMoney,
  multiplyMoney,
  roundTo,
  subtractMoney,
  sumMoney,
  toDecimal,
} from '../utils/money';

export interface CostStructure {
  fixedCosts: number;
  variableCostPerUnit: number;
}

export interface BreakEvenResult {
  breakEvenUnits: number;
  breakEvenRevenue: number;
  contributionMargin: number;
  contributionMarginRatio: number;
  marginOfSafetyUnits: number;
  marginOfSafetyPercent: number;
  operatingLeverage: number;
  valid: boolean;
}

export interface ProfitTargetResult {
  requiredUnits: number;
  requiredRevenue: number;
  valid: boolean;
}

export interface MultiProductBreakEven {
  products: Array<{
    name: string;
    price: number;
    variableCost: number;
    salesMix: number;
    contributionMargin: number;
  }>;
  weightedContributionMargin: number;
  breakEvenRevenue: number;
  breakEvenByProduct: Array<{ name: string; units: number; revenue: number }>;
  valid: boolean;
}

export class BreakEvenEngine {
  /**
   * Calculate break-even point for a single product.
   */
  static calculate(
    pricePerUnit: number,
    cost: CostStructure,
    actualUnits?: number
  ): BreakEvenResult {
    // All monetary arithmetic is routed through the canonical money primitive
    // (decimal.js-backed) to avoid IEEE-754 drift on currency values.
    const contributionMargin = subtractMoney(pricePerUnit, cost.variableCostPerUnit).toNumber();
    const contributionMarginRatio =
      pricePerUnit > 0 ? divideMoney(contributionMargin, pricePerUnit).toNumber() : 0;

    if (contributionMargin <= 0) {
      return {
        breakEvenUnits: 0,
        breakEvenRevenue: 0,
        contributionMargin,
        contributionMarginRatio,
        marginOfSafetyUnits: 0,
        marginOfSafetyPercent: 0,
        operatingLeverage: 0,
        valid: false,
      };
    }

    const breakEvenUnits = divideMoney(cost.fixedCosts, contributionMargin).toNumber();
    const breakEvenRevenue = multiplyMoney(breakEvenUnits, pricePerUnit).toNumber();

    const marginOfSafetyUnits =
      actualUnits != null ? subtractMoney(actualUnits, breakEvenUnits).toNumber() : 0;
    const marginOfSafetyPercent =
      actualUnits != null && actualUnits > 0
        ? divideMoney(marginOfSafetyUnits, actualUnits).times(100).toNumber()
        : 0;

    const operatingLeverage =
      actualUnits != null && marginOfSafetyUnits !== 0
        ? divideMoney(
            multiplyMoney(actualUnits, contributionMargin).toNumber(),
            subtractMoney(
              multiplyMoney(actualUnits, contributionMargin).toNumber(),
              cost.fixedCosts
            ).toNumber()
          ).toNumber()
        : 0;

    return {
      breakEvenUnits,
      breakEvenRevenue,
      contributionMargin,
      contributionMarginRatio,
      marginOfSafetyUnits,
      marginOfSafetyPercent,
      operatingLeverage,
      valid: true,
    };
  }

  /**
   * Calculate units needed to achieve a target profit.
   */
  static targetProfit(
    pricePerUnit: number,
    cost: CostStructure,
    targetProfit: number
  ): ProfitTargetResult {
    const contributionMargin = subtractMoney(pricePerUnit, cost.variableCostPerUnit).toNumber();
    if (contributionMargin <= 0) {
      return { requiredUnits: 0, requiredRevenue: 0, valid: false };
    }
    const requiredUnits = divideMoney(
      addMoney(cost.fixedCosts, targetProfit).toNumber(),
      contributionMargin
    ).toNumber();
    return {
      requiredUnits,
      requiredRevenue: multiplyMoney(requiredUnits, pricePerUnit).toNumber(),
      valid: true,
    };
  }

  /**
   * Multi-product break-even analysis using weighted average contribution margin.
   */
  static multiProduct(
    products: Array<{ name: string; price: number; variableCost: number; salesMix: number }>,
    totalFixedCosts: number
  ): MultiProductBreakEven {
    // Contribution margins, weighted sums, break-even revenue, and
    // per-product revenue are currency: exact decimal (F-0006). Sales mixes
    // are unitless ratios; units are counts.
    const enriched = products.map((p) => ({
      ...p,
      contributionMargin: roundTo(subtractMoney(p.price, p.variableCost)),
    }));

    const weightedCM = roundTo(
      sumMoney(enriched.map((p) => multiplyMoney(p.contributionMargin, p.salesMix)))
    );
    if (weightedCM <= 0) {
      return {
        products: enriched,
        weightedContributionMargin: 0,
        breakEvenRevenue: 0,
        breakEvenByProduct: [],
        valid: false,
      };
    }

    const priceWeighted = roundTo(
      sumMoney(enriched.map((p) => multiplyMoney(p.price, p.salesMix)))
    );
    const breakEvenRevenue = roundTo(
      divideMoney(totalFixedCosts, divideMoney(weightedCM, priceWeighted))
    );
    const breakEvenByProduct = enriched.map((p) => {
      const revenue = roundTo(multiplyMoney(breakEvenRevenue, p.salesMix));
      return {
        name: p.name,
        units: p.price > 0 ? divideMoney(revenue, p.price).toNumber() : 0,
        revenue,
      };
    });

    return {
      products: enriched,
      weightedContributionMargin: weightedCM,
      breakEvenRevenue,
      breakEvenByProduct,
      valid: true,
    };
  }

  /**
   * Sensitivity analysis: how does break-even change with price/cost variations?
   */
  static sensitivity(
    basePrice: number,
    baseCost: CostStructure,
    variations: Array<{ priceChange: number; fixedCostChange: number; variableCostChange: number }>
  ): Array<{ label: string; breakEvenUnits: number; change: number }> {
    const base = this.calculate(basePrice, baseCost);
    return variations.map((v, i) => {
      const result = this.calculate(addMoney(toDecimal(basePrice), v.priceChange).toNumber(), {
        fixedCosts: addMoney(toDecimal(baseCost.fixedCosts), v.fixedCostChange).toNumber(),
        variableCostPerUnit: addMoney(
          toDecimal(baseCost.variableCostPerUnit),
          v.variableCostChange
        ).toNumber(),
      });
      return {
        label: `Scenario ${i + 1}`,
        breakEvenUnits: result.breakEvenUnits,
        // % change of break-even units: dimensionless ratio × 100.
        change:
          base.breakEvenUnits > 0
            ? roundTo(
                multiplyMoney(
                  divideMoney(
                    subtractMoney(result.breakEvenUnits, base.breakEvenUnits),
                    base.breakEvenUnits
                  ),
                  100
                ),
                2
              )
            : 0,
      };
    });
  }
}

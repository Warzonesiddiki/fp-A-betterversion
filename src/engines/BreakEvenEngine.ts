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
    const contributionMargin = pricePerUnit - cost.variableCostPerUnit;
    const contributionMarginRatio = pricePerUnit > 0 ? contributionMargin / pricePerUnit : 0;

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

    const breakEvenUnits = cost.fixedCosts / contributionMargin;
    const breakEvenRevenue = breakEvenUnits * pricePerUnit;

    const marginOfSafetyUnits = actualUnits != null ? actualUnits - breakEvenUnits : 0;
    const marginOfSafetyPercent =
      actualUnits != null && actualUnits > 0 ? (marginOfSafetyUnits / actualUnits) * 100 : 0;

    const operatingLeverage =
      actualUnits != null && marginOfSafetyUnits !== 0
        ? (actualUnits * contributionMargin) / (actualUnits * contributionMargin - cost.fixedCosts)
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
    const contributionMargin = pricePerUnit - cost.variableCostPerUnit;
    if (contributionMargin <= 0) {
      return { requiredUnits: 0, requiredRevenue: 0, valid: false };
    }
    const requiredUnits = (cost.fixedCosts + targetProfit) / contributionMargin;
    return { requiredUnits, requiredRevenue: requiredUnits * pricePerUnit, valid: true };
  }

  /**
   * Multi-product break-even analysis using weighted average contribution margin.
   */
  static multiProduct(
    products: Array<{ name: string; price: number; variableCost: number; salesMix: number }>,
    totalFixedCosts: number
  ): MultiProductBreakEven {
    const enriched = products.map((p) => ({
      ...p,
      contributionMargin: p.price - p.variableCost,
    }));

    const weightedCM = enriched.reduce((sum, p) => sum + p.contributionMargin * p.salesMix, 0);
    if (weightedCM <= 0) {
      return {
        products: enriched,
        weightedContributionMargin: 0,
        breakEvenRevenue: 0,
        breakEvenByProduct: [],
        valid: false,
      };
    }

    const breakEvenRevenue =
      totalFixedCosts / (weightedCM / enriched.reduce((s, p) => s + p.price * p.salesMix, 0));
    const breakEvenByProduct = enriched.map((p) => {
      const revenue = breakEvenRevenue * p.salesMix;
      return { name: p.name, units: p.price > 0 ? revenue / p.price : 0, revenue };
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
      const result = this.calculate(basePrice + v.priceChange, {
        fixedCosts: baseCost.fixedCosts + v.fixedCostChange,
        variableCostPerUnit: baseCost.variableCostPerUnit + v.variableCostChange,
      });
      return {
        label: `Scenario ${i + 1}`,
        breakEvenUnits: result.breakEvenUnits,
        change:
          base.breakEvenUnits > 0
            ? ((result.breakEvenUnits - base.breakEvenUnits) / base.breakEvenUnits) * 100
            : 0,
      };
    });
  }
}

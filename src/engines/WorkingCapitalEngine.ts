// =============================================================================
// WORKING CAPITAL ENGINE — Working capital optimization
// DSO, DPO, DIO, cash conversion cycle
// Pure TypeScript, deterministic, testable
//
// F-0001 MONEY MIGRATION: All monetary amounts and calculations now use the
// canonical decimal.js money primitive from @/utils/money. Raw IEEE-754
// arithmetic is eliminated from financial truth paths. The `number` fields
// in the output types are retained for display/API compatibility but are
// derived from Decimal computations, not raw float arithmetic.
// =============================================================================

import Decimal from 'decimal.js';
import { toDecimal, subtractMoney, type MoneyInput } from '@/utils/money';

export interface WorkingCapitalMetrics {
  dso: number; // Days Sales Outstanding
  dio: number; // Days Inventory Outstanding
  dpo: number; // Days Payable Outstanding
  cashConversionCycle: number;
  workingCapital: number;
  currentRatio: number;
  quickRatio: number;
}

export interface WorkingCapitalInput {
  revenue: MoneyInput;
  cogs: MoneyInput;
  accountsReceivable: MoneyInput;
  inventory: MoneyInput;
  accountsPayable: MoneyInput;
  currentAssets: MoneyInput;
  currentLiabilities: MoneyInput;
  cash: MoneyInput;
  periodDays: number;
}

export interface WorkingCapitalOptimization {
  current: WorkingCapitalMetrics;
  target: WorkingCapitalMetrics;
  recommendations: Array<{
    metric: string;
    current: number;
    target: number;
    impact: number;
    action: string;
  }>;
  cashFreed: number;
}

export class WorkingCapitalEngine {
  /**
   * Calculate all working capital metrics using the money primitive.
   * Division by zero is handled explicitly — returns 0 when the denominator
   * is zero, rather than throwing (financial convention: undefined ratio = 0).
   */
  static calculate(input: WorkingCapitalInput): WorkingCapitalMetrics {
    const revenue = toDecimal(input.revenue, 'revenue');
    const cogs = toDecimal(input.cogs, 'cogs');
    const ar = toDecimal(input.accountsReceivable, 'accountsReceivable');
    const inventory = toDecimal(input.inventory, 'inventory');
    const ap = toDecimal(input.accountsPayable, 'accountsPayable');
    const currentAssets = toDecimal(input.currentAssets, 'currentAssets');
    const currentLiabilities = toDecimal(input.currentLiabilities, 'currentLiabilities');
    const periodDays = input.periodDays;

    // DSO = (AR / Revenue) * PeriodDays
    const dso = revenue.isZero() ? 0 : ar.div(revenue).times(periodDays).toNumber();

    // DIO = (Inventory / COGS) * PeriodDays
    const dio = cogs.isZero() ? 0 : inventory.div(cogs).times(periodDays).toNumber();

    // DPO = (AP / COGS) * PeriodDays
    const dpo = cogs.isZero() ? 0 : ap.div(cogs).times(periodDays).toNumber();

    const cashConversionCycle = dso + dio - dpo;

    const workingCapital = subtractMoney(currentAssets, currentLiabilities).toNumber();

    // Current Ratio = Current Assets / Current Liabilities
    const currentRatio = currentLiabilities.isZero()
      ? 0
      : currentAssets.div(currentLiabilities).toNumber();

    // Quick Ratio = (Current Assets - Inventory) / Current Liabilities
    const quickAssets = subtractMoney(currentAssets, inventory);
    const quickRatio = currentLiabilities.isZero()
      ? 0
      : quickAssets.div(currentLiabilities).toNumber();

    return { dso, dio, dpo, cashConversionCycle, workingCapital, currentRatio, quickRatio };
  }

  /**
   * Suggest optimizations to improve working capital.
   */
  static optimize(
    input: WorkingCapitalInput,
    targetDso: number,
    targetDio: number,
    targetDpo: number
  ): WorkingCapitalOptimization {
    const current = this.calculate(input);
    const periodDays = input.periodDays;
    const revenue = toDecimal(input.revenue, 'revenue');
    const cogs = toDecimal(input.cogs, 'cogs');
    const ar = toDecimal(input.accountsReceivable, 'accountsReceivable');
    const inventory = toDecimal(input.inventory, 'inventory');
    const ap = toDecimal(input.accountsPayable, 'accountsPayable');
    const currentAssets = toDecimal(input.currentAssets, 'currentAssets');
    const currentLiabilities = toDecimal(input.currentLiabilities, 'currentLiabilities');

    // Calculate target values using money primitive
    const targetAR = revenue.times(targetDso).div(periodDays);
    const targetInventory = cogs.times(targetDio).div(periodDays);
    const targetAP = cogs.times(targetDpo).div(periodDays);
    const targetCurrentAssets = currentAssets
      .minus(ar)
      .plus(targetAR)
      .minus(inventory)
      .plus(targetInventory);
    const targetCurrentLiabilities = currentLiabilities.minus(ap).plus(targetAP);

    const target = this.calculate({
      ...input,
      accountsReceivable: targetAR.toString(),
      inventory: targetInventory.toString(),
      accountsPayable: targetAP.toString(),
      currentAssets: targetCurrentAssets.toString(),
      currentLiabilities: targetCurrentLiabilities.toString(),
    });

    const recommendations: WorkingCapitalOptimization['recommendations'] = [];

    if (current.dso > targetDso) {
      const impact = ar.minus(targetAR).toNumber();
      recommendations.push({
        metric: 'DSO',
        current: current.dso,
        target: targetDso,
        impact,
        action: `Reduce DSO from ${Math.round(current.dso)} to ${Math.round(targetDso)} days by improving collections`,
      });
    }

    if (current.dio > targetDio) {
      const impact = inventory.minus(targetInventory).toNumber();
      recommendations.push({
        metric: 'DIO',
        current: current.dio,
        target: targetDio,
        impact,
        action: `Reduce DIO from ${Math.round(current.dio)} to ${Math.round(targetDio)} days by optimizing inventory`,
      });
    }

    if (current.dpo < targetDpo) {
      const impact = targetAP.minus(ap).toNumber();
      recommendations.push({
        metric: 'DPO',
        current: current.dpo,
        target: targetDpo,
        impact,
        action: `Increase DPO from ${Math.round(current.dpo)} to ${Math.round(targetDpo)} days by extending payment terms`,
      });
    }

    const cashFreed = recommendations.reduce((sum, r) => sum + r.impact, 0);

    return { current, target, recommendations, cashFreed };
  }

  /**
   * Project working capital needs for future periods.
   */
  static project(
    base: WorkingCapitalInput,
    revenueGrowthRate: number,
    cogsGrowthRate: number,
    periods: number
  ): Array<{ period: number; workingCapital: number; metrics: WorkingCapitalMetrics }> {
    const projections: Array<{
      period: number;
      workingCapital: number;
      metrics: WorkingCapitalMetrics;
    }> = [];

    const baseRevenue = toDecimal(base.revenue, 'revenue');
    const baseCogs = toDecimal(base.cogs, 'cogs');
    const baseAR = toDecimal(base.accountsReceivable, 'accountsReceivable');
    const baseInventory = toDecimal(base.inventory, 'inventory');
    const baseAP = toDecimal(base.accountsPayable, 'accountsPayable');

    for (let i = 1; i <= periods; i++) {
      const growthFactor = new (toDecimal('1').constructor as typeof Decimal)(
        1 + revenueGrowthRate
      ).pow(i);
      const cogsGrowthFactor = new (toDecimal('1').constructor as typeof Decimal)(
        1 + cogsGrowthRate
      ).pow(i);

      const projected: WorkingCapitalInput = {
        ...base,
        revenue: baseRevenue.times(growthFactor).toString(),
        cogs: baseCogs.times(cogsGrowthFactor).toString(),
        accountsReceivable: baseAR.times(growthFactor).toString(),
        inventory: baseInventory.times(cogsGrowthFactor).toString(),
        accountsPayable: baseAP.times(cogsGrowthFactor).toString(),
      };
      const metrics = this.calculate(projected);
      projections.push({ period: i, workingCapital: metrics.workingCapital, metrics });
    }

    return projections;
  }
}

// =============================================================================
// WORKING CAPITAL ENGINE — Working capital optimization
// DSO, DPO, DIO, cash conversion cycle
// Pure TypeScript, deterministic, testable
// =============================================================================

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
  revenue: number;
  cogs: number;
  accountsReceivable: number;
  inventory: number;
  accountsPayable: number;
  currentAssets: number;
  currentLiabilities: number;
  cash: number;
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
   * Calculate all working capital metrics.
   */
  static calculate(input: WorkingCapitalInput): WorkingCapitalMetrics {
    const dso =
      input.revenue > 0 ? (input.accountsReceivable / input.revenue) * input.periodDays : 0;
    const dio = input.cogs > 0 ? (input.inventory / input.cogs) * input.periodDays : 0;
    const dpo = input.cogs > 0 ? (input.accountsPayable / input.cogs) * input.periodDays : 0;
    const cashConversionCycle = dso + dio - dpo;
    const workingCapital = input.currentAssets - input.currentLiabilities;
    const currentRatio =
      input.currentLiabilities > 0 ? input.currentAssets / input.currentLiabilities : 0;
    const quickRatio =
      input.currentLiabilities > 0
        ? (input.currentAssets - input.inventory) / input.currentLiabilities
        : 0;

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

    // Calculate target values
    const targetAR = (targetDso * input.revenue) / periodDays;
    const targetInventory = (targetDio * input.cogs) / periodDays;
    const targetAP = (targetDpo * input.cogs) / periodDays;
    const targetCurrentAssets =
      input.currentAssets - input.accountsReceivable + targetAR - input.inventory + targetInventory;
    const targetCurrentLiabilities = input.currentLiabilities - input.accountsPayable + targetAP;

    const target = this.calculate({
      ...input,
      accountsReceivable: targetAR,
      inventory: targetInventory,
      accountsPayable: targetAP,
      currentAssets: targetCurrentAssets,
      currentLiabilities: targetCurrentLiabilities,
    });

    const recommendations: WorkingCapitalOptimization['recommendations'] = [];

    if (current.dso > targetDso) {
      recommendations.push({
        metric: 'DSO',
        current: current.dso,
        target: targetDso,
        impact: input.accountsReceivable - targetAR,
        action: `Reduce DSO from ${current.dso.toFixed(0)} to ${targetDso.toFixed(0)} days by improving collections`,
      });
    }

    if (current.dio > targetDio) {
      recommendations.push({
        metric: 'DIO',
        current: current.dio,
        target: targetDio,
        impact: input.inventory - targetInventory,
        action: `Reduce DIO from ${current.dio.toFixed(0)} to ${targetDio.toFixed(0)} days by optimizing inventory`,
      });
    }

    if (current.dpo < targetDpo) {
      recommendations.push({
        metric: 'DPO',
        current: current.dpo,
        target: targetDpo,
        impact: targetAP - input.accountsPayable,
        action: `Increase DPO from ${current.dpo.toFixed(0)} to ${targetDpo.toFixed(0)} days by extending payment terms`,
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

    for (let i = 1; i <= periods; i++) {
      const projected: WorkingCapitalInput = {
        ...base,
        revenue: base.revenue * Math.pow(1 + revenueGrowthRate, i),
        cogs: base.cogs * Math.pow(1 + cogsGrowthRate, i),
        accountsReceivable: base.accountsReceivable * Math.pow(1 + revenueGrowthRate, i),
        inventory: base.inventory * Math.pow(1 + cogsGrowthRate, i),
        accountsPayable: base.accountsPayable * Math.pow(1 + cogsGrowthRate, i),
      };
      const metrics = this.calculate(projected);
      projections.push({ period: i, workingCapital: metrics.workingCapital, metrics });
    }

    return projections;
  }
}

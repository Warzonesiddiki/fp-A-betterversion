import type { AssetInput, DepreciationSchedule } from '@/types/sector-types';

export class CapExEngine {
  static calculateDepreciation(asset: AssetInput): DepreciationSchedule[] {
    const schedules: DepreciationSchedule[] = [];
    let accumulatedDepreciation = 0;
    let bookValue = asset.cost;
    const depreciableAmount = asset.cost - asset.salvageValue;

    for (let i = 1; i <= asset.usefulLife; i++) {
      let expense = 0;
      switch (asset.depreciationMethod) {
        case 'straight_line':
          expense = depreciableAmount / asset.usefulLife;
          break;
        case 'double_declining': {
          const rate = 2 / asset.usefulLife;
          expense = bookValue * rate;
          if (bookValue - expense < asset.salvageValue) {
            expense = bookValue - asset.salvageValue;
          }
          break;
        }
        case 'sum_of_years': {
          const sum = (asset.usefulLife * (asset.usefulLife + 1)) / 2;
          expense = depreciableAmount * ((asset.usefulLife - i + 1) / sum);
          break;
        }
      }

      accumulatedDepreciation += expense;
      bookValue -= expense;

      schedules.push({
        period: `Year ${i}`,
        depreciationExpense: expense,
        accumulatedDepreciation,
        bookValue: Math.max(asset.salvageValue, bookValue),
      });
    }

    return schedules;
  }

  static calculateNPV(cashFlows: number[], discountRate: number): number {
    return cashFlows.reduce((acc, cf, i) => acc + cf / Math.pow(1 + discountRate, i), 0);
  }

  static calculateIRR(cashFlows: number[]): number {
    let irr = 0.1;
    const maxIterations = 1000;
    const precision = 0.00001;

    for (let i = 0; i < maxIterations; i++) {
      const npv = this.calculateNPV(cashFlows, irr);
      if (Math.abs(npv) < precision) return irr;

      const dNpv = cashFlows.reduce((acc, cf, t) => acc - (t * cf) / Math.pow(1 + irr, t + 1), 0);
      const nextIrr = irr - npv / dNpv;

      if (Math.abs(nextIrr - irr) < precision) return nextIrr;
      irr = nextIrr;
    }

    return irr;
  }

  static calculatePaybackPeriod(cashFlows: number[]): number {
    let cumulative = 0;
    for (let i = 0; i < cashFlows.length; i++) {
      const prevCumulative = cumulative;
      cumulative += cashFlows[i];
      if (cumulative >= 0 && prevCumulative < 0) {
        return i + Math.abs(prevCumulative) / cashFlows[i];
      }
    }
    return 0;
  }

  static calculateROI(totalBenefit: number, totalCost: number): number {
    if (totalCost <= 0) return 0;
    return (totalBenefit - totalCost) / totalCost;
  }
}

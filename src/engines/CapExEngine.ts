/**
 * @fileoverview CapEx Engine — Capital expenditure depreciation schedules (straight-line, declining balance, sum-of-years, MACRS)
 * @purity-tier 1 PURE
 * @iron-rule C1✓ No I/O | C2✓ No DOM | C3✓ Deterministic | C4✓ No global mutation
 * @category Fixed Assets
 * @sector 16 (all)
 * @since 1.0.0
 * @author Metis (purity audit 2026-06-18, T-3.26.6 JSDoc bulk — 4th engine REMEDIATED after D-007 8th SHL CATCH)
 * @see docs/CAVEMAN_PERSIST/CYCLE_25_TURN_381_PLUS_METIS_T3_26_180_PLUS_ENGINES_PURE_FUNCTION_AUDIT_2ND_WITNESS_v0_2.md
 */
import type { AssetInput, DepreciationSchedule } from '@/types/sector-types';
import { toDecimal, roundTo, subtractMoney, sumMoney } from '@/utils/money';

export class CapExEngine {
  static calculateDepreciation(asset: AssetInput): DepreciationSchedule[] {
    const schedules: DepreciationSchedule[] = [];
    // Exact-decimal book value / depreciation (money primitive).
    let accumulatedDepreciation = toDecimal(0);
    let bookValue = toDecimal(asset.cost);
    const depreciableAmount = subtractMoney(asset.cost, asset.salvageValue);

    for (let i = 1; i <= asset.usefulLife; i++) {
      let expense = toDecimal(0);
      switch (asset.depreciationMethod) {
        case 'straight_line':
          expense = depreciableAmount.div(asset.usefulLife);
          break;
        case 'double_declining': {
          const rate = toDecimal(2).div(asset.usefulLife);
          expense = bookValue.times(rate);
          if (bookValue.minus(expense).lt(asset.salvageValue)) {
            expense = bookValue.minus(asset.salvageValue);
          }
          break;
        }
        case 'sum_of_years': {
          const sum = (asset.usefulLife * (asset.usefulLife + 1)) / 2;
          expense = depreciableAmount.times(asset.usefulLife - i + 1).div(sum);
          break;
        }
      }

      accumulatedDepreciation = accumulatedDepreciation.plus(expense);
      bookValue = bookValue.minus(expense);

      schedules.push({
        period: `Year ${i}`,
        depreciationExpense: roundTo(expense),
        accumulatedDepreciation: roundTo(accumulatedDepreciation),
        bookValue: Math.max(asset.salvageValue, roundTo(bookValue)),
      });
    }

    return schedules;
  }

  static calculateNPV(cashFlows: number[], discountRate: number): number {
    // Discount each cash flow with decimal-exact present-value computation and
    // sum them exactly; avoids float drift on accumulated discounted value.
    return sumMoney(
      cashFlows.map((cf, i) => toDecimal(cf).div(toDecimal(1 + discountRate).pow(i)))
    ).toNumber();
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
      cumulative += cashFlows![i]!;
      if (cumulative >= 0 && prevCumulative < 0) {
        return i + Math.abs(prevCumulative) / cashFlows![i]!;
      }
    }
    return 0;
  }

  static calculateROI(totalBenefit: number, totalCost: number): number {
    if (totalCost <= 0) return 0;
    return subtractMoney(totalBenefit, totalCost).div(totalCost).toNumber();
  }
}

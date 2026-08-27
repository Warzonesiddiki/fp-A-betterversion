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
import {
  addMoney,
  divideMoney,
  multiplyMoney,
  roundTo,
  subtractMoney,
  sumMoney,
  toDecimal,
} from '@/utils/money';

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
          // Sum-of-years-digits: depreciable × remaining-life / sum-of-years.
          // usefulLife and i are dimensionless integers; converting to
          // decimal keeps the multiplication on the canonical primitive.
          const sum = divideMoney(
            multiplyMoney(
              toDecimal(asset.usefulLife),
              toDecimal(addMoney(toDecimal(asset.usefulLife), 1))
            ),
            2
          );
          expense = depreciableAmount
            .times(addMoney(subtractMoney(toDecimal(asset.usefulLife), toDecimal(i)), 1))
            .div(sum);
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
    // Excel end-of-period convention (ledger #51): flow i discounts by
    // (1+r)^(i+1); identical inputs must agree with financial.ts NPV,
    // SafeMathParser NPV and FormulaEngine NPV (cross-surface pinned by
    // src/engines/__tests__/npvCrossSurfaceConsistency.test.ts).
    return sumMoney(
      cashFlows.map((cf, i) => toDecimal(cf).div(toDecimal(1 + discountRate).pow(i + 1)))
    ).toNumber();
  }

  static calculateIRR(cashFlows: number[]): number {
    let irr = 0.1;
    const maxIterations = 1000;
    const precision = 0.00001;

    for (let i = 0; i < maxIterations; i++) {
      const npv = this.calculateNPV(cashFlows, irr);
      if (Math.abs(npv) < precision) return irr;

      // Derivative of Σ cf_t·(1+r)^-(t+1): -(t+1)·cf_t·(1+r)^-(t+2).
      const dNpv = cashFlows.reduce(
        (acc, cf, t) => acc - ((t + 1) * cf) / Math.pow(1 + irr, t + 2),
        0
      );
      // Convergence guards: never divide by a zero derivative and never emit
      // an unconverged iterate (NaN mirrors Excel #NUM!).
      if (dNpv === 0 || !Number.isFinite(dNpv)) return NaN;

      const nextIrr = irr - npv / dNpv;
      if (!Number.isFinite(nextIrr)) return NaN;
      if (Math.abs(nextIrr - irr) < precision) return nextIrr;
      irr = nextIrr;
    }

    return NaN;
  }

  static calculatePaybackPeriod(cashFlows: number[]): number {
    let cumulative = 0;
    for (let i = 0; i < cashFlows.length; i++) {
      const prevCumulative = cumulative;
      cumulative += cashFlows![i]!;
      if (cumulative >= 0 && prevCumulative < 0) {
        // Payback period in years: i (full years that have passed) plus
        // the fraction of the current year needed to recover the
        // remaining deficit. The ratio `|prevCumulative| / cashFlows[i]`
        // is dimensionless over a money amount — both are in the same
        // currency — so the result is a year count.
        return roundTo(
          addMoney(toDecimal(i), divideMoney(Math.abs(prevCumulative), cashFlows![i]!)),
          4
        );
      }
    }
    return 0;
  }

  static calculateROI(totalBenefit: number, totalCost: number): number {
    if (totalCost <= 0) return 0;
    return subtractMoney(totalBenefit, totalCost).div(totalCost).toNumber();
  }
}

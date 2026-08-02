/**
 * @fileoverview Cash Engine — 13-week cash flow forecasting + DSO/DPO/DIO/CCC working capital metrics
 * @purity-tier 1 PURE
 * @iron-rule C1✓ No I/O | C2✓ No DOM | C3✓ Deterministic | C4✓ No global mutation
 * @category Treasury
 * @sector 16 (all)
 * @since 1.0.0
 * @author Metis (purity audit 2026-06-18, T-3.26.6 JSDoc bulk — 1st engine REMEDIATED after D-007 8th SHL CATCH)
 * @see docs/CAVEMAN_PERSIST/CYCLE_25_TURN_381_PLUS_METIS_T3_26_180_PLUS_ENGINES_PURE_FUNCTION_AUDIT_2ND_WITNESS_v0_2.md
 */
import { toDecimal, roundTo, sumMoney, subtractMoney, divideMoney, addMoney } from '../utils/money';
export interface WeeklyCashFlow {
  week: string;
  openingBalance: number;
  inflows: number;
  outflows: number;
  netCashFlow: number;
  closingBalance: number;
  isBelowTarget: boolean;
}

export class CashEngine {
  static forecast13Week(
    startingBalance: number,
    inflows: { week: string; amount: number }[],
    outflows: { week: string; amount: number }[],
    minimumTarget: number = 0
  ): WeeklyCashFlow[] {
    const weeks = Array.from(
      new Set([...inflows.map((i) => i.week), ...outflows.map((o) => o.week)])
    ).sort();
    const forecast: WeeklyCashFlow[] = [];
    let balance = toDecimal(startingBalance);
    const minimumTargetD = toDecimal(minimumTarget);

    weeks.forEach((week) => {
      const openingBalance = balance.toNumber();
      const weeklyInflows = sumMoney(
        inflows.filter((i) => i.week === week).map((i) => i.amount)
      ).toNumber();
      const weeklyOutflows = sumMoney(
        outflows.filter((o) => o.week === week).map((o) => o.amount)
      ).toNumber();
      const netCashFlow = subtractMoney(weeklyInflows, weeklyOutflows);
      balance = balance.plus(netCashFlow);

      forecast.push({
        week,
        openingBalance,
        inflows: weeklyInflows,
        outflows: weeklyOutflows,
        netCashFlow: roundTo(netCashFlow),
        closingBalance: roundTo(balance),
        isBelowTarget: balance.lt(minimumTargetD),
      });
    });

    return forecast;
  }

  static calculateDSO(receivables: number, revenue: number, days: number): number {
    if (revenue <= 0) return 0;
    return roundTo(divideMoney(receivables, revenue).times(days), 4);
  }

  static calculateDPO(payables: number, cogs: number, days: number): number {
    if (cogs <= 0) return 0;
    return roundTo(divideMoney(payables, cogs).times(days), 4);
  }

  static calculateDIO(inventory: number, cogs: number, days: number): number {
    if (cogs <= 0) return 0;
    return roundTo(divideMoney(inventory, cogs).times(days), 4);
  }

  static calculateCCC(dso: number, dio: number, dpo: number): number {
    return roundTo(addMoney(dso, dio).minus(dpo), 4);
  }
}

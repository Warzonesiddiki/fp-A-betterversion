// =============================================================================
// WATERFALL BRIDGE ENGINE — Revenue/cost bridge analysis
// Start → Components → End visualization
// Pure TypeScript, deterministic, testable
//
// MONEY MIGRATION (2026-08-03): bridge values (start, components, running
// totals, increases/decreases, net change) are money and flow through the
// canonical money primitive (src/utils/money.ts, decimal.js, ROUND_HALF_UP),
// cent-rounded on output. percentChange is a metric (not money). No raw
// + - * / on currency values remains.
// =============================================================================

import { addMoney, divideMoney, roundTo, subtractMoney, sumMoney, toDecimal } from '../utils/money';

export interface BridgeItem {
  label: string;
  value: number;
  type: 'start' | 'increase' | 'decrease' | 'subtotal' | 'end';
  category?: string;
}

export interface BridgeResult {
  items: BridgeItem[];
  startValue: number;
  endValue: number;
  totalIncrease: number;
  totalDecrease: number;
  netChange: number;
  percentChange: number;
}

export interface ProfitBridgeResult extends BridgeResult {
  revenue?: BridgeItem;
  cogs?: BridgeItem;
  grossProfit?: BridgeItem;
  opex?: BridgeItem;
  ebitda?: BridgeItem;
}

export class WaterfallBridgeEngine {
  /**
   * Build a generic waterfall bridge from start to end with components.
   */
  static build(
    startLabel: string,
    startValue: number,
    components: Array<{ label: string; value: number; category?: string }>,
    endLabel: string
  ): BridgeResult {
    const items: BridgeItem[] = [{ label: startLabel, value: roundTo(startValue), type: 'start' }];

    let running = toDecimal(startValue);
    let totalIncrease = toDecimal(0);
    let totalDecrease = toDecimal(0);

    for (const comp of components) {
      if (comp.value > 0) {
        items.push({
          label: comp.label,
          value: roundTo(comp.value),
          type: 'increase',
          category: comp.category,
        });
        totalIncrease = addMoney(totalIncrease, comp.value);
      } else if (comp.value < 0) {
        items.push({
          label: comp.label,
          value: roundTo(Math.abs(comp.value)),
          type: 'decrease',
          category: comp.category,
        });
        totalDecrease = addMoney(totalDecrease, Math.abs(comp.value));
      }
      running = addMoney(running, comp.value);
    }

    const endValue = running;
    items.push({ label: endLabel, value: roundTo(endValue), type: 'end' });

    const netChange = subtractMoney(endValue, startValue);

    return {
      items,
      startValue: roundTo(startValue),
      endValue: roundTo(endValue),
      totalIncrease: roundTo(totalIncrease),
      totalDecrease: roundTo(totalDecrease),
      netChange: roundTo(netChange),
      percentChange:
        startValue !== 0 ? divideMoney(netChange, Math.abs(startValue)).times(100).toNumber() : 0,
    };
  }

  /**
   * Build a P&L bridge (Revenue → COGS → Gross Profit → OpEx → EBITDA).
   */
  static profitBridge(
    revenue: number,
    cogs: number,
    opex: number,
    _priorRevenue?: number,
    priorCogs?: number,
    priorOpex?: number
  ): ProfitBridgeResult {
    const gp = subtractMoney(revenue, cogs);
    const ebitda = subtractMoney(gp, opex);

    const items: BridgeItem[] = [{ label: 'Revenue', value: roundTo(revenue), type: 'start' }];

    if (priorCogs != null) {
      const cogsDelta = subtractMoney(cogs, priorCogs);
      if (!cogsDelta.isZero()) {
        items.push({
          label: 'COGS Change',
          value: roundTo(cogsDelta),
          type: cogsDelta.greaterThan(0) ? 'decrease' : 'increase',
        });
      }
    }
    items.push({ label: 'Gross Profit', value: roundTo(gp), type: 'subtotal' });

    if (priorOpex != null) {
      const opexDelta = subtractMoney(opex, priorOpex);
      if (!opexDelta.isZero()) {
        items.push({
          label: 'OpEx Change',
          value: roundTo(opexDelta),
          type: opexDelta.greaterThan(0) ? 'decrease' : 'increase',
        });
      }
    }
    items.push({ label: 'EBITDA', value: roundTo(ebitda), type: 'end' });

    return {
      items,
      startValue: roundTo(revenue),
      endValue: roundTo(ebitda),
      totalIncrease: 0,
      totalDecrease: roundTo(addMoney(cogs, opex)),
      netChange: roundTo(subtractMoney(ebitda, revenue)),
      percentChange: revenue !== 0 ? divideMoney(ebitda, revenue).times(100).toNumber() : 0,
    };
  }

  /**
   * Build a variance bridge (Budget → Variances → Actual).
   */
  static varianceBridge(
    budget: number,
    variances: Array<{ label: string; amount: number }>,
    actual: number
  ): BridgeResult {
    const items: BridgeItem[] = [{ label: 'Budget', value: roundTo(budget), type: 'start' }];

    for (const v of variances) {
      items.push({
        label: v.label,
        value: roundTo(Math.abs(v.amount)),
        type: v.amount >= 0 ? 'increase' : 'decrease',
      });
    }

    items.push({ label: 'Actual', value: roundTo(actual), type: 'end' });

    const totalIncrease = sumMoney(variances.filter((v) => v.amount > 0).map((v) => v.amount));
    const totalDecrease = sumMoney(
      variances.filter((v) => v.amount < 0).map((v) => Math.abs(v.amount))
    );

    return {
      items,
      startValue: roundTo(budget),
      endValue: roundTo(actual),
      totalIncrease: roundTo(totalIncrease),
      totalDecrease: roundTo(totalDecrease),
      netChange: roundTo(subtractMoney(actual, budget)),
      percentChange:
        budget !== 0
          ? divideMoney(subtractMoney(actual, budget), Math.abs(budget)).times(100).toNumber()
          : 0,
    };
  }
}

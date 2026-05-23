// =============================================================================
// WATERFALL BRIDGE ENGINE — Revenue/cost bridge analysis
// Start → Components → End visualization
// Pure TypeScript, deterministic, testable
// =============================================================================

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
    const items: BridgeItem[] = [{ label: startLabel, value: startValue, type: 'start' }];

    let running = startValue;
    let totalIncrease = 0;
    let totalDecrease = 0;

    for (const comp of components) {
      if (comp.value > 0) {
        items.push({
          label: comp.label,
          value: comp.value,
          type: 'increase',
          category: comp.category,
        });
        totalIncrease += comp.value;
      } else if (comp.value < 0) {
        items.push({
          label: comp.label,
          value: Math.abs(comp.value),
          type: 'decrease',
          category: comp.category,
        });
        totalDecrease += Math.abs(comp.value);
      }
      running += comp.value;
    }

    items.push({ label: endLabel, value: running, type: 'end' });

    return {
      items,
      startValue,
      endValue: running,
      totalIncrease,
      totalDecrease,
      netChange: running - startValue,
      percentChange: startValue !== 0 ? ((running - startValue) / Math.abs(startValue)) * 100 : 0,
    };
  }

  /**
   * Build a P&L bridge (Revenue → COGS → Gross Profit → OpEx → EBITDA).
   */
  static profitBridge(
    revenue: number,
    cogs: number,
    opex: number,
    priorRevenue?: number,
    priorCogs?: number,
    priorOpex?: number
  ): ProfitBridgeResult {
    const gp = revenue - cogs;
    const ebitda = gp - opex;

    const items: BridgeItem[] = [{ label: 'Revenue', value: revenue, type: 'start' }];

    if (priorCogs != null) {
      const cogsDelta = cogs - priorCogs;
      if (cogsDelta !== 0) {
        items.push({
          label: 'COGS Change',
          value: cogsDelta,
          type: cogsDelta > 0 ? 'decrease' : 'increase',
        });
      }
    }
    items.push({ label: 'Gross Profit', value: gp, type: 'subtotal' });

    if (priorOpex != null) {
      const opexDelta = opex - priorOpex;
      if (opexDelta !== 0) {
        items.push({
          label: 'OpEx Change',
          value: opexDelta,
          type: opexDelta > 0 ? 'decrease' : 'increase',
        });
      }
    }
    items.push({ label: 'EBITDA', value: ebitda, type: 'end' });

    return {
      items,
      startValue: revenue,
      endValue: ebitda,
      totalIncrease: 0,
      totalDecrease: cogs + opex,
      netChange: ebitda - revenue,
      percentChange: revenue !== 0 ? (ebitda / revenue) * 100 : 0,
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
    const items: BridgeItem[] = [{ label: 'Budget', value: budget, type: 'start' }];

    for (const v of variances) {
      items.push({
        label: v.label,
        value: Math.abs(v.amount),
        type: v.amount >= 0 ? 'increase' : 'decrease',
      });
    }

    items.push({ label: 'Actual', value: actual, type: 'end' });

    const totalIncrease = variances.filter((v) => v.amount > 0).reduce((s, v) => s + v.amount, 0);
    const totalDecrease = Math.abs(
      variances.filter((v) => v.amount < 0).reduce((s, v) => s + v.amount, 0)
    );

    return {
      items,
      startValue: budget,
      endValue: actual,
      totalIncrease,
      totalDecrease,
      netChange: actual - budget,
      percentChange: budget !== 0 ? ((actual - budget) / Math.abs(budget)) * 100 : 0,
    };
  }
}

/**
 * @fileoverview Cash Flow Waterfall Engine — Cash flow bridge analysis (Operating → Investing → Financing → Net Change)
 * @purity-tier 1 PURE
 * @iron-rule C1✓ No I/O | C2✓ No DOM | C3✓ Deterministic | C4✓ No global mutation
 * @category Cash Flow Analytics
 * @sector 16 (Cross-sector — cash flow waterfall)
 * @since 1.0.0
 * @author Metis (purity audit 2026-06-18, T-3.26.6 JSDoc bulk — 28th engine)
 * @see docs/CAVEMAN_PERSIST/CYCLE_25_TURN_381_PLUS_METIS_T3_26_180_PLUS_ENGINES_PURE_FUNCTION_AUDIT_2ND_WITNESS_v0_2.md
 */

export interface CashFlowCategory {
  name: string;
  items: CashFlowItem[];
}

export interface CashFlowItem {
  label: string;
  amount: number;
  type: 'inflow' | 'outflow';
}

export interface CashFlowWaterfallResult {
  openingCash: number;
  operating: { total: number; items: CashFlowItem[] };
  investing: { total: number; items: CashFlowItem[] };
  financing: { total: number; items: CashFlowItem[] };
  netChange: number;
  closingCash: number;
  freeCashFlow: number;
  operatingCashFlowRatio: number;
  monthsOfCash: number;
  burnRate: number;
}

export interface CashFlowProjection {
  period: string;
  openingBalance: number;
  inflows: number;
  outflows: number;
  netFlow: number;
  closingBalance: number;
}

export class CashFlowWaterfallEngine {
  /**
   * Build a cash flow waterfall from categories.
   */
  static build(
    openingCash: number,
    operating: CashFlowCategory,
    investing: CashFlowCategory,
    financing: CashFlowCategory,
    monthlyOpEx?: number
  ): CashFlowWaterfallResult {
    const calcTotal = (cat: CashFlowCategory) =>
      cat.items.reduce(
        (sum, item) => sum + (item.type === 'inflow' ? item.amount : -item.amount),
        0
      );

    const operatingTotal = calcTotal(operating);
    const investingTotal = calcTotal(investing);
    const financingTotal = calcTotal(financing);
    const netChange = operatingTotal + investingTotal + financingTotal;
    const closingCash = openingCash + netChange;
    const freeCashFlow = operatingTotal + investingTotal;

    const operatingCashFlowRatio =
      monthlyOpEx && monthlyOpEx > 0 ? operatingTotal / monthlyOpEx : 0;
    const monthsOfCash = monthlyOpEx && monthlyOpEx > 0 ? closingCash / monthlyOpEx : 0;
    const burnRate = netChange < 0 ? Math.abs(netChange) : 0;

    return {
      openingCash,
      operating: { total: operatingTotal, items: operating.items },
      investing: { total: investingTotal, items: investing.items },
      financing: { total: financingTotal, items: financing.items },
      netChange,
      closingCash,
      freeCashFlow,
      operatingCashFlowRatio,
      monthsOfCash,
      burnRate,
    };
  }

  /**
   * Project cash flow forward for N periods.
   */
  static project(
    openingBalance: number,
    periods: Array<{ inflows: number; outflows: number }>
  ): CashFlowProjection[] {
    const projections: CashFlowProjection[] = [];
    let balance = openingBalance;

    periods.forEach((p, i) => {
      const netFlow = p.inflows - p.outflows;
      const closingBalance = balance + netFlow;
      projections.push({
        period: `Period ${i + 1}`,
        openingBalance: balance,
        inflows: p.inflows,
        outflows: p.outflows,
        netFlow,
        closingBalance,
      });
      balance = closingBalance;
    });

    return projections;
  }

  /**
   * Cash runway analysis: how long until cash runs out?
   */
  static runway(
    currentCash: number,
    monthlyBurn: number,
    monthlyRevenue: number
  ): { monthsRemaining: number; runwayDate: string; sustainable: boolean } {
    const netBurn = monthlyBurn - monthlyRevenue;
    if (netBurn <= 0) {
      return { monthsRemaining: Infinity, runwayDate: 'Sustainable', sustainable: true };
    }
    const monthsRemaining = currentCash / netBurn;
    const runwayDate = new Date();
    runwayDate.setMonth(runwayDate.getMonth() + Math.round(monthsRemaining));
    return {
      monthsRemaining,
      runwayDate: runwayDate.toISOString().slice(0, 7),
      sustainable: false,
    };
  }
}

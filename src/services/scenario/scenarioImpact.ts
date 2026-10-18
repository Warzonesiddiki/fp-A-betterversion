import {
  deriveThreeStatement,
  type ThreeStatementDerivation,
  type ThreeStatementGLEntry,
} from '@/pages/reports/threeStatementData';
import { toDecimal, addMoney, subtractMoney, roundTo } from '@/utils/money';

/**
 * Phase 7 — scenario → 3-statement impact.
 *
 * A scenario is a list of percentage adjustments targeted at an exact
 * account code or an account prefix. The adjustments scale the GL
 * entries themselves (both debit and credit, cent-rounded via money
 * utils), and both the base and adjusted three statements are then
 * DERIVED from entries by the same `deriveThreeStatement` the reports
 * use — so the impact can never drift from what the statements would
 * show if those entries were posted.
 *
 * Double-entry honesty: a scenario that scales revenue without saying
 * where the cash/receivable lands breaks the entry balance. That is
 * reported as the exact `adjustedImbalance` (debits − credits) with
 * `balanced: false` — the difference is never plugged into a suspense
 * account to force the balance sheet to balance.
 */

export interface ScenarioAdjustment {
  /** Exact account code to scale (wins over prefix when both are set). */
  accountCode?: string;
  /** Account-code prefix to scale, e.g. '4' for all revenue accounts. */
  accountPrefix?: string;
  /** Percentage change: +25 means ×1.25, −10 means ×0.90. */
  pctChange: number;
}

export interface ScenarioDelta {
  revenue: number;
  grossProfit: number;
  operatingIncome: number;
  netIncome: number;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  netChangeInCash: number;
}

export interface ScenarioImpactResult {
  base: ThreeStatementDerivation;
  adjusted: ThreeStatementDerivation;
  delta: ScenarioDelta;
  /** Debits − credits of the adjusted entry set inside the period. */
  adjustedImbalance: number;
  /** True when the adjusted entries still balance to the cent. */
  balanced: boolean;
  /** How many entries each adjustment actually scaled. */
  appliedCounts: number[];
}

function matches(entry: ThreeStatementGLEntry, adjustment: ScenarioAdjustment): boolean {
  const code = entry.accountCode ?? '';
  if (adjustment.accountCode !== undefined) return code === adjustment.accountCode;
  if (adjustment.accountPrefix !== undefined) return code.startsWith(adjustment.accountPrefix);
  return false;
}

function scaleAmount(
  value: number | string | null | undefined,
  factor: ReturnType<typeof toDecimal>
) {
  if (value === null || value === undefined) return value;
  return roundTo(toDecimal(value).times(factor), 2);
}

/** Scale entries by the FIRST matching adjustment (list order wins). */
export function applyScenarioAdjustments(
  entries: readonly ThreeStatementGLEntry[],
  adjustments: readonly ScenarioAdjustment[]
): ThreeStatementGLEntry[] {
  return entries.map((entry) => {
    const adjustment = adjustments.find((a) => matches(entry, a));
    if (!adjustment) return { ...entry };
    const factor = toDecimal(1).plus(toDecimal(adjustment.pctChange).div(100));
    return {
      ...entry,
      debit: scaleAmount(entry.debit as number, factor),
      credit: scaleAmount(entry.credit as number, factor),
    };
  });
}

function entryImbalance(entries: readonly ThreeStatementGLEntry[], period: string): number {
  let total = toDecimal(0);
  for (const e of entries) {
    const entryPeriod = e.period || (e.date ?? '').slice(0, 7);
    if (entryPeriod > period) continue;
    total = addMoney(total, subtractMoney(toDecimal(e.debit ?? 0), toDecimal(e.credit ?? 0)));
  }
  return roundTo(total, 2);
}

export function scenarioImpact(
  entries: readonly ThreeStatementGLEntry[],
  period: string,
  adjustments: readonly ScenarioAdjustment[]
): ScenarioImpactResult {
  const adjustedEntries = applyScenarioAdjustments(entries, adjustments);
  const base = deriveThreeStatement(entries, period);
  const adjusted = deriveThreeStatement(adjustedEntries, period);
  const adjustedImbalance = entryImbalance(adjustedEntries, period);

  const appliedCounts = adjustments.map(
    (a) => entries.filter((e) => adjustments.find((x) => matches(e, x)) === a).length
  );

  return {
    base,
    adjusted,
    delta: {
      revenue: roundTo(subtractMoney(adjusted.totals.revenue, base.totals.revenue), 2),
      grossProfit: roundTo(subtractMoney(adjusted.totals.grossProfit, base.totals.grossProfit), 2),
      operatingIncome: roundTo(
        subtractMoney(adjusted.totals.operatingIncome, base.totals.operatingIncome),
        2
      ),
      netIncome: roundTo(subtractMoney(adjusted.totals.netIncome, base.totals.netIncome), 2),
      totalAssets: roundTo(
        subtractMoney(adjusted.balanceSheet.totalAssets, base.balanceSheet.totalAssets),
        2
      ),
      totalLiabilities: roundTo(
        subtractMoney(adjusted.balanceSheet.totalLiabilities, base.balanceSheet.totalLiabilities),
        2
      ),
      totalEquity: roundTo(
        subtractMoney(adjusted.balanceSheet.totalEquity, base.balanceSheet.totalEquity),
        2
      ),
      netChangeInCash: roundTo(
        subtractMoney(adjusted.cashFlow.netChangeInCash, base.cashFlow.netChangeInCash),
        2
      ),
    },
    adjustedImbalance,
    balanced: Math.abs(adjustedImbalance) <= 0.01,
    appliedCounts,
  };
}

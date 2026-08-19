/**
 * Insurance dashboard derivation.
 *
 * WHY THIS MODULE EXISTS (W0.1.7 — fabrication)
 * ---------------------------------------------
 * `InsuranceDashboardPage` read no store and called no engine. Every figure on
 * it was a module literal: a combined ratio of `84.7%`, net written premium of
 * `$51.7M`, a `58.9%` loss ratio, a policy count of `142,800`, six months of
 * hand-typed loss/expense ratios, five premium lines, and a five-row
 * "Underwriting Results" table of named products with typed loss ratios and a
 * `Improving` / `Stable` / `Worsening` trend word. The KPI deltas
 * (`change={-6.2}`, `change={14.2}`, `changeLabel="YTD growth 12%"`) were
 * invented too — the fabrication detector only sees the displayed
 * `$…M` / `…%` strings, not those.
 *
 * Everything here is derived from posted GL entries by `InsuranceEngine`, which
 * was itself de-fabricated in session 022 (natural balance, no `× 0.85`
 * cession, no `/ 360` policy count, no `sin()`-seeded trend).
 *
 * WHAT IS DELIBERATELY NOT PRODUCED (K18 — an absence is not a zero)
 * ------------------------------------------------------------------
 * - **Policy count.** A ledger records amounts, not policies. `null` always.
 * - **Per-line loss and combined ratios.** The engine's line split reads the
 *   last two digits of premium accounts (41xx/42xx). Loss and expense accounts
 *   (51xx–53xx) carry no line-of-business dimension in this chart of accounts,
 *   so a per-line loss ratio would require inventing an allocation. The table
 *   reports written, earned and the written-less-earned difference only.
 * - **Net written premium without posted cessions.** `null` unless 43xx exists.
 * - **Period-over-period deltas as a single percentage.** Ratio movements are
 *   percentage points, not percent change; the prior period's own value is
 *   shown instead of an arrow that would silently relabel pp as %.
 */

import {
  InsuranceEngine,
  type CombinedRatioTrend,
  type InsuranceStats,
  type PremiumByLine,
} from '@/engines/InsuranceEngine';
import type { GLEntry } from '@/types';
import { roundTo, subtractMoney } from '@/utils/money';

/**
 * Account-code prefixes this dashboard can read.
 * 41 written premium · 42 earned premium · 43 reinsurance ceded ·
 * 44 investment income · 51 loss & LAE · 52 commission · 53 underwriting expense.
 */
export const INSURANCE_ACCOUNT_PREFIXES = ['41', '42', '43', '44', '51', '52', '53'] as const;

export interface UnderwritingLineRow {
  readonly id: string;
  readonly line: string;
  readonly written: number;
  readonly earned: number;
  /** `written − earned`. Labelled as the difference it is, not as "unearned reserve". */
  readonly writtenLessEarned: number;
}

export interface TrendPoint {
  readonly month: string;
  readonly lossRatio: number;
  readonly expenseRatio: number | null;
  readonly combined: number | null;
}

export interface InsuranceDashboardModel {
  /** True when at least one entry posts to an insurance account prefix. */
  readonly hasData: boolean;
  readonly stats: InsuranceStats;
  readonly premiumByLine: readonly PremiumByLine[];
  readonly trend: readonly TrendPoint[];
  readonly lineRows: readonly UnderwritingLineRow[];
  /** Combined-ratio points, in period order, for the KPI sparkline. */
  readonly combinedSparkline: readonly number[];
  /** Loss-ratio points, in period order, for the KPI sparkline. */
  readonly lossRatioSparkline: readonly number[];
  /** The period immediately before the latest one, or `null` with fewer than two. */
  readonly priorPeriod: TrendPoint | null;
  /** First and last period present in the trend, or `null` when it is empty. */
  readonly periodsCovered: { readonly first: string; readonly last: string } | null;
}

function hasInsuranceAccounts(entries: readonly GLEntry[]): boolean {
  return entries.some((e) =>
    INSURANCE_ACCOUNT_PREFIXES.some((p) => (e.accountCode ?? '').startsWith(p))
  );
}

export function buildInsuranceDashboardModel(entries: readonly GLEntry[]): InsuranceDashboardModel {
  const list = [...entries];
  const stats = InsuranceEngine.calculateStats(list);
  const premiumByLine = InsuranceEngine.getPremiumByLine(list);
  const trend: CombinedRatioTrend[] = InsuranceEngine.getCombinedRatioTrend(list);

  const lineRows: UnderwritingLineRow[] = premiumByLine.map((line, idx) => ({
    id: `line-${String(idx + 1).padStart(2, '0')}`,
    line: line.name,
    written: line.written,
    earned: line.earned,
    writtenLessEarned: roundTo(subtractMoney(line.written, line.earned), 2),
  }));

  const combinedSparkline = trend
    .map((point) => point.combined)
    .filter((value): value is number => value !== null);
  const lossRatioSparkline = trend.map((point) => point.lossRatio);

  return {
    hasData: hasInsuranceAccounts(list),
    stats,
    premiumByLine,
    trend,
    lineRows,
    combinedSparkline,
    lossRatioSparkline,
    priorPeriod: trend.length >= 2 ? (trend.at(-2) ?? null) : null,
    periodsCovered: trend.length > 0 ? { first: trend[0]!.month, last: trend.at(-1)!.month } : null,
  };
}

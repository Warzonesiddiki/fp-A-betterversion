/**
 * Promotion analysis from promotions the user has actually recorded.
 *
 * CORRECTNESS CONTRACT (K18 — wrong numbers are Severity-0):
 *
 * 1. **No fixture campaigns.** The page previously shipped five invented
 *    promotions — Summer Sale 320,000 revenue on 45,000 spend against a
 *    210,000 baseline, Back to School, Holiday Bundle, and two more — computed
 *    every KPI from them, and exported them to PDF and Excel. It read the
 *    ledger only to discard it (`const { entries: _entries } = useGLStore()`).
 *    Promotions are not general-ledger objects; they come from
 *    `retailStore.promotions`, which defaults to empty.
 * 2. **Return on spend is stated on the basis it was computed.** The old ROI
 *    was `(revenue − baseline − cost) / cost`, i.e. incremental REVENUE less
 *    spend over spend, presented simply as "ROI" — that treats every
 *    incremental dollar of revenue as profit. Here `roiPercent` is computed on
 *    gross margin when the promotion records a margin, and the basis is
 *    reported alongside it so a revenue-basis figure can never be read as
 *    profit.
 * 3. **A lift can be negative.** The old table hardcoded a `+` in front of
 *    every lift, so a promotion that destroyed revenue displayed `+-12%`.
 * 4. A ratio is `null` when its denominator is absent — never 0, and never a
 *    stand-in.
 * 5. All arithmetic is decimal.js via `@/utils/money`.
 */

import Decimal from 'decimal.js';
import { divideMoney, sumMoney, toDecimal, type MoneyInput } from '@/utils/money';

export interface PromotionInput {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly discountPercent: number;
  readonly startDate: string;
  readonly endDate: string;
  readonly cost: number;
  readonly revenue: number;
  readonly baselineRevenue: number;
  readonly grossMarginPercent?: number;
  readonly status: 'planned' | 'active' | 'completed';
}

/** Which measure a return figure was computed on. */
export type ReturnBasis = 'gross-margin' | 'incremental-revenue';

export interface PromotionRow {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly discountPercent: number;
  readonly status: PromotionInput['status'];
  readonly cost: number;
  readonly revenue: number;
  readonly baselineRevenue: number;
  readonly incrementalRevenue: number;
  /** Percent versus baseline; `null` without a baseline to compare against. */
  readonly liftPercent: number | null;
  /** Incremental margin (or revenue) less spend, over spend; `null` without spend. */
  readonly roiPercent: number | null;
  readonly roiBasis: ReturnBasis;
}

export interface CategoryAmountRow {
  readonly name: string;
  readonly value: number;
}

export interface UnavailableLine {
  readonly label: string;
  readonly reason: string;
}

export interface PromoAnalysis {
  readonly promotions: readonly PromotionRow[];
  readonly totalCost: number;
  readonly totalRevenue: number;
  readonly totalBaseline: number;
  readonly incrementalRevenue: number;
  readonly liftPercent: number | null;
  readonly roiPercent: number | null;
  readonly roiBasis: ReturnBasis;
  /** How many promotions carried a margin, so the basis is auditable. */
  readonly marginCoverage: number;
  readonly revenueByType: readonly CategoryAmountRow[];
  readonly unavailable: readonly UnavailableLine[];
}

const ZERO = new Decimal(0);
const HUNDRED = new Decimal(100);
const CURRENCY_PLACES = 2;
const PERCENT_PLACES = 2;

function money(value: MoneyInput | null | undefined): Decimal {
  if (value === null || value === undefined) return ZERO;
  return toDecimal(value);
}

function cash(value: Decimal): number {
  return value.toDecimalPlaces(CURRENCY_PLACES).toNumber();
}

/** Percent, or `null` when the denominator is not positive. */
function percentOf(numer: Decimal, denom: Decimal): number | null {
  if (!denom.greaterThan(0)) return null;
  return divideMoney(numer, denom).times(100).toDecimalPlaces(PERCENT_PLACES).toNumber();
}

/**
 * Incremental value a promotion returned, on the best basis available.
 *
 * With a recorded gross margin the incremental revenue is converted to margin;
 * without one the incremental revenue is used and the basis says so.
 */
function incrementalValue(
  incremental: Decimal,
  grossMarginPercent: number | undefined
): { value: Decimal; basis: ReturnBasis } {
  if (grossMarginPercent === undefined) {
    return { value: incremental, basis: 'incremental-revenue' };
  }
  return {
    value: incremental.times(divideMoney(money(grossMarginPercent), HUNDRED)),
    basis: 'gross-margin',
  };
}

/**
 * Derive promotion analysis.
 *
 * Returns `null` when no promotion has been recorded — the page must then ask
 * for campaigns rather than demonstrate five.
 */
export function derivePromoAnalysis(promotions: readonly PromotionInput[]): PromoAnalysis | null {
  if (promotions.length === 0) return null;

  const rows: PromotionRow[] = promotions.map((p) => {
    const cost = money(p.cost);
    const revenue = money(p.revenue);
    const baseline = money(p.baselineRevenue);
    const incremental = revenue.minus(baseline);
    const { value, basis } = incrementalValue(incremental, p.grossMarginPercent);
    return {
      id: p.id,
      name: p.name,
      type: p.type,
      discountPercent: p.discountPercent,
      status: p.status,
      cost: cash(cost),
      revenue: cash(revenue),
      baselineRevenue: cash(baseline),
      incrementalRevenue: cash(incremental),
      liftPercent: percentOf(incremental, baseline),
      roiPercent: percentOf(value.minus(cost), cost),
      roiBasis: basis,
    };
  });

  const totalCost = sumMoney(rows.map((r) => r.cost));
  const totalRevenue = sumMoney(rows.map((r) => r.revenue));
  const totalBaseline = sumMoney(rows.map((r) => r.baselineRevenue));
  const incremental = totalRevenue.minus(totalBaseline);

  const withMargin = promotions.filter((p) => p.grossMarginPercent !== undefined);
  // The portfolio basis is only 'gross-margin' when EVERY promotion carries a
  // margin; a mixed set would silently blend profit and revenue.
  const portfolioBasis: ReturnBasis =
    withMargin.length === promotions.length ? 'gross-margin' : 'incremental-revenue';
  const portfolioValue = sumMoney(
    rows.map((r, i) =>
      portfolioBasis === 'gross-margin'
        ? incrementalValue(money(r.incrementalRevenue), promotions[i]!.grossMarginPercent).value
        : money(r.incrementalRevenue)
    )
  );

  const typeTotals = new Map<string, Decimal>();
  for (const r of rows) {
    typeTotals.set(r.type, (typeTotals.get(r.type) ?? ZERO).plus(money(r.revenue)));
  }

  const unavailable: UnavailableLine[] = [];
  if (portfolioBasis === 'incremental-revenue') {
    unavailable.push({
      label: 'Return on promotion spend as profit',
      reason:
        'Return is shown on incremental revenue because not every promotion records a gross margin. Incremental revenue is not profit; add a margin to each campaign to see profit-based return.',
    });
  }
  if (rows.some((r) => r.liftPercent === null)) {
    unavailable.push({
      label: 'Lift for every promotion',
      reason:
        'A promotion with no baseline revenue has no lift to measure; those rows are left blank rather than shown as zero.',
    });
  }
  unavailable.push({
    label: 'Attribution of ledger revenue to a campaign',
    reason:
      'The general ledger records revenue by account and period, not by campaign. Baseline and promotional revenue come from what you record here, or from a POS or campaign-management import.',
  });

  return {
    promotions: rows,
    totalCost: cash(totalCost),
    totalRevenue: cash(totalRevenue),
    totalBaseline: cash(totalBaseline),
    incrementalRevenue: cash(incremental),
    liftPercent: percentOf(incremental, totalBaseline),
    roiPercent: percentOf(portfolioValue.minus(totalCost), totalCost),
    roiBasis: portfolioBasis,
    marginCoverage: withMargin.length,
    revenueByType: [...typeTotals.entries()]
      .map(([name, value]) => ({ name, value: cash(value) }))
      .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name)),
    unavailable,
  };
}

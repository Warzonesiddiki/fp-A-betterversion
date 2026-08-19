/**
 * Construction-dashboard figures derivable from the recorded construction
 * workspace (`constructionStore`).
 *
 * CORRECTNESS CONTRACT (K18 — wrong numbers are Severity-0):
 *
 * 1. Every total routes through decimal.js via `@/utils/money`. No float
 *    `+`/`-` over a currency value.
 * 2. Figures come ONLY from recorded cost breakdowns, change orders and cost
 *    ledger rows. Backlog, project pipeline, resource allocation and fleet
 *    telemetry are NOT recorded objects in this workspace, so this module
 *    derives nothing for them — the page discloses the gap instead of
 *    rendering a fictional contractor.
 * 3. Money strings are parsed strictly (`parseMoneyText`): currency symbols,
 *    thousands separators and the repo-wide k/M suffixes. An unparseable
 *    amount is NEVER coerced to 0 — it is excluded from totals and counted,
 *    so the page can disclose how many rows could not be read.
 */

import Decimal from 'decimal.js';
import { subtractMoney, sumMoney, toDecimal } from '@/utils/money';

export interface CostBreakdownInput {
  readonly name: string;
  readonly budget: number;
  readonly actual: number;
}

export interface ChangeOrderInput {
  readonly id: string;
  readonly project: string;
  readonly description: string;
  readonly amount: string;
  readonly status: 'Approved' | 'Pending' | 'Rejected';
}

export interface CostLedgerInput {
  readonly id: string;
  readonly code: string;
  readonly category: string;
  readonly budget: string;
  readonly actual: string;
  readonly variance: string;
  readonly status: 'Under' | 'Over';
}

export interface BreakdownRow {
  readonly name: string;
  readonly budget: number;
  readonly actual: number;
  /** budget − actual; positive means under budget. */
  readonly variance: number;
}

export interface ConstructionDashboardData {
  readonly totalBudget: number;
  readonly totalActual: number;
  /** totalBudget − totalActual; positive means under budget. */
  readonly totalVariance: number;
  readonly breakdown: readonly BreakdownRow[];
  readonly approvedChangeOrderTotal: number | null;
  readonly pendingChangeOrders: number;
  readonly costLedgerRows: readonly CostLedgerInput[];
  /** Recorded amounts that could not be parsed as money. */
  readonly unparseableAmounts: number;
}

const CURRENCY_PLACES = 2;

/**
 * Parse a recorded money string. Accepts an optional leading currency symbol,
 * thousands separators, an optional sign and the k/M magnitude suffixes used
 * across this app's inputs. Returns `null` for anything else — silent
 * coercion to zero would launder a bad row into the totals.
 */
export function parseMoneyText(value: string): Decimal | null {
  const cleaned = value.trim().replace(/[$,\s]/g, '');
  if (cleaned.length === 0) return null;
  const match = /^([+-]?\d+(?:\.\d+)?)([kM]?)$/.exec(cleaned);
  if (!match) return null;
  try {
    const base = toDecimal(match[1]!);
    const suffix = match[2]!;
    if (suffix === 'k') return base.times(1_000);
    if (suffix === 'M') return base.times(1_000_000);
    return base;
  } catch {
    return null;
  }
}

/**
 * Returns `null` when the workspace has recorded nothing — the page must
 * empty-state instead of rendering invented backlog and projects.
 */
export function deriveConstructionDashboard(
  costBreakdown: readonly CostBreakdownInput[],
  changeOrders: readonly ChangeOrderInput[],
  costLedger: readonly CostLedgerInput[]
): ConstructionDashboardData | null {
  if (costBreakdown.length === 0 && changeOrders.length === 0 && costLedger.length === 0) {
    return null;
  }

  let unparseableAmounts = 0;

  const breakdown: BreakdownRow[] = costBreakdown.map((item) => ({
    name: item.name,
    budget: toDecimal(item.budget).toDecimalPlaces(CURRENCY_PLACES).toNumber(),
    actual: toDecimal(item.actual).toDecimalPlaces(CURRENCY_PLACES).toNumber(),
    variance: subtractMoney(item.budget, item.actual).toDecimalPlaces(CURRENCY_PLACES).toNumber(),
  }));

  const totalBudget = sumMoney(costBreakdown.map((i) => i.budget))
    .toDecimalPlaces(CURRENCY_PLACES)
    .toNumber();
  const totalActual = sumMoney(costBreakdown.map((i) => i.actual))
    .toDecimalPlaces(CURRENCY_PLACES)
    .toNumber();
  const totalVariance = subtractMoney(totalBudget, totalActual)
    .toDecimalPlaces(CURRENCY_PLACES)
    .toNumber();

  const approvedAmounts: Decimal[] = [];
  let pendingChangeOrders = 0;
  for (const order of changeOrders) {
    if (order.status === 'Pending') pendingChangeOrders += 1;
    if (order.status !== 'Approved') continue;
    const parsed = parseMoneyText(order.amount);
    if (parsed === null) {
      unparseableAmounts += 1;
    } else {
      approvedAmounts.push(parsed);
    }
  }

  for (const row of costLedger) {
    if (parseMoneyText(row.budget) === null) unparseableAmounts += 1;
    if (parseMoneyText(row.actual) === null) unparseableAmounts += 1;
  }

  return {
    totalBudget,
    totalActual,
    totalVariance,
    breakdown,
    approvedChangeOrderTotal:
      approvedAmounts.length > 0
        ? sumMoney(approvedAmounts).toDecimalPlaces(CURRENCY_PLACES).toNumber()
        : null,
    pendingChangeOrders,
    costLedgerRows: costLedger,
    unparseableAmounts,
  };
}

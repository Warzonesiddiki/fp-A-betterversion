/**
 * Logistics-sector dashboard figures the posted ledger and logistics store
 * can support.
 *
 * CORRECTNESS CONTRACT (K18 — wrong numbers are Severity-0):
 *
 * 1. **Nothing on this page was derived before.** `revenueByServiceLine`
 *    (FTL 4,820,000 … 3PL 720,000), `costDistribution` (Fuel 28% … Admin 5%)
 *    and `monthlyVolume` (Jan 12,400 … Dec 18,400) were module constants, and
 *    the KPI strip was seven literals — `$11.77M` freight revenue, `$842` per
 *    shipment, `82.6%` fleet utilisation, `78.3%` warehouse capacity, `3.2`
 *    day transit, `$2.84` per mile. Every tenant saw the same carrier.
 * 2. **A demo fallback is a fabrication.** On-time delivery read
 *    `onTimeRate > 0 ? formatPercent(onTimeRate) : '96.4%'` — an empty store
 *    silently produced a 96.4% service level.
 * 3. **A cost is not a revenue.** The "Top Shipping Lanes" list mapped
 *    `RouteCost.cost` into a field called `revenue` and rendered it where a
 *    lane's revenue belongs. Route economics here are labelled cost, and cost
 *    per load is derived from the same record.
 * 4. Revenue and cost come from the posted ledger grouped by account
 *    (4 revenue, 5–8 cost), signed by natural balance. Operational counts come
 *    from the logistics store. Anything needing telematics, a WMS or mileage
 *    is declared unavailable.
 * 5. All arithmetic is decimal.js via `@/utils/money`; ratios are `null`
 *    unless their denominator genuinely exists.
 */

import Decimal from 'decimal.js';
import { divideMoney, sumMoney, toDecimal, type MoneyInput } from '@/utils/money';

export interface LogisticsGLEntry {
  readonly accountCode?: string | null;
  readonly accountName?: string | null;
  readonly debit?: number | string | Decimal | null;
  readonly credit?: number | string | Decimal | null;
  readonly amount?: number | string | Decimal | null;
}

export interface LogisticsShipment {
  readonly id: string;
  readonly status: 'In Transit' | 'Delivered' | 'Delayed' | 'Exception';
  readonly cost: number;
}

export interface LogisticsRouteCost {
  readonly route: string;
  readonly cost: number;
  readonly volume: number;
}

export interface AccountAmountRow {
  readonly name: string;
  readonly value: number;
  /** Share of the posted total for this side, 0..100. */
  readonly sharePercent: number;
}

export interface LaneRow {
  readonly route: string;
  readonly volume: number;
  readonly cost: number;
  /** Cost per load; `null` when the route posts no volume. */
  readonly costPerLoad: number | null;
}

export interface UnavailableLine {
  readonly label: string;
  readonly reason: string;
}

export interface LogisticsDashboard {
  readonly postedRevenue: number;
  readonly postedCost: number;
  readonly netResult: number;
  readonly revenueByAccount: readonly AccountAmountRow[];
  readonly costDistribution: readonly AccountAmountRow[];
  readonly lanes: readonly LaneRow[];
  readonly shipmentCount: number;
  /** Delivered ÷ (delivered + delayed); `null` when neither is recorded. */
  readonly onTimeRatePercent: number | null;
  /** Posted cost ÷ shipments recorded; `null` without shipments. */
  readonly costPerShipment: number | null;
  readonly unavailable: readonly UnavailableLine[];
}

const ZERO = new Decimal(0);
const CURRENCY_PLACES = 2;
const PERCENT_PLACES = 2;

const REVENUE_PREFIX = '4';
const COST_PREFIXES = ['5', '6', '7', '8'] as const;

function money(value: MoneyInput | null | undefined): Decimal {
  if (value === null || value === undefined) return ZERO;
  return toDecimal(value);
}

function code(entry: LogisticsGLEntry): string {
  return entry.accountCode ?? '';
}

function hasDebitCredit(entry: LogisticsGLEntry): boolean {
  const { debit, credit } = entry;
  if (debit == null && credit == null) return false;
  const debitN = debit == null ? 0 : Number(debit);
  const creditN = credit == null ? 0 : Number(credit);
  if (debitN === 0 && creditN === 0 && entry.amount != null && Number(entry.amount) !== 0) {
    return false;
  }
  return true;
}

function debitNormal(entry: LogisticsGLEntry): Decimal {
  if (hasDebitCredit(entry)) return money(entry.debit).minus(money(entry.credit));
  return money(entry.amount);
}

function creditNormal(entry: LogisticsGLEntry): Decimal {
  if (hasDebitCredit(entry)) return money(entry.credit).minus(money(entry.debit));
  return money(entry.amount);
}

function isRevenue(entry: LogisticsGLEntry): boolean {
  return code(entry).startsWith(REVENUE_PREFIX);
}

function isCost(entry: LogisticsGLEntry): boolean {
  return COST_PREFIXES.some((p) => code(entry).startsWith(p));
}

function cash(value: Decimal): number {
  return value.toDecimalPlaces(CURRENCY_PLACES).toNumber();
}

function groupByAccount(
  entries: readonly LogisticsGLEntry[],
  sign: (e: LogisticsGLEntry) => Decimal
): AccountAmountRow[] {
  const map = new Map<string, { name: string; value: Decimal }>();
  for (const entry of entries) {
    const key = code(entry);
    const existing = map.get(key) ?? { name: entry.accountName || key, value: ZERO };
    existing.value = existing.value.plus(sign(entry));
    map.set(key, existing);
  }
  const total = sumMoney([...map.values()].map((v) => v.value));
  return [...map.values()]
    .map((v) => ({
      name: v.name,
      value: cash(v.value),
      sharePercent: total.isZero()
        ? 0
        : divideMoney(v.value, total).times(100).toDecimalPlaces(PERCENT_PLACES).toNumber(),
    }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
}

/**
 * Derive the logistics dashboard.
 *
 * Returns `null` when neither the ledger nor the logistics store carries
 * anything to report.
 */
export function deriveLogisticsDashboard(
  entries: readonly LogisticsGLEntry[],
  shipments: readonly LogisticsShipment[] = [],
  routeCosts: readonly LogisticsRouteCost[] = []
): LogisticsDashboard | null {
  const revenueEntries = entries.filter(isRevenue);
  const costEntries = entries.filter(isCost);
  if (
    revenueEntries.length === 0 &&
    costEntries.length === 0 &&
    shipments.length === 0 &&
    routeCosts.length === 0
  ) {
    return null;
  }

  const postedRevenue = sumMoney(revenueEntries.map(creditNormal));
  const postedCost = sumMoney(costEntries.map(debitNormal));

  const delivered = shipments.filter((s) => s.status === 'Delivered').length;
  const delayed = shipments.filter((s) => s.status === 'Delayed').length;
  const settled = delivered + delayed;

  const lanes: LaneRow[] = routeCosts.map((rc) => ({
    route: rc.route,
    volume: rc.volume,
    cost: cash(money(rc.cost)),
    costPerLoad:
      rc.volume > 0
        ? divideMoney(money(rc.cost), rc.volume).toDecimalPlaces(CURRENCY_PLACES).toNumber()
        : null,
  }));

  const unavailable: UnavailableLine[] = [];
  if (settled === 0) {
    unavailable.push({
      label: 'On-time delivery rate',
      reason:
        'No shipment is recorded as delivered or delayed, so no service level can be measured. It is left blank rather than defaulted.',
    });
  }
  if (shipments.length === 0) {
    unavailable.push({
      label: 'Cost per shipment',
      reason: 'No shipments are recorded in the logistics workspace.',
    });
  }
  unavailable.push(
    {
      label: 'Fleet utilisation and average transit time',
      reason:
        'Both need telematics or dispatch data (vehicle hours, departure and arrival times). Neither is a ledger fact.',
    },
    {
      label: 'Warehouse capacity',
      reason: 'Needs a warehouse management system feed of slots occupied against slots available.',
    },
    {
      label: 'Revenue per mile',
      reason: 'Needs distance per load. The ledger records amounts, not miles.',
    },
    {
      label: 'Service-line revenue split (FTL / LTL / 3PL)',
      reason:
        'Service lines are not carried on the chart of accounts in this workspace, so revenue is grouped by posted account instead.',
    }
  );

  return {
    postedRevenue: cash(postedRevenue),
    postedCost: cash(postedCost),
    netResult: cash(postedRevenue.minus(postedCost)),
    revenueByAccount: groupByAccount(revenueEntries, creditNormal),
    costDistribution: groupByAccount(costEntries, debitNormal),
    lanes,
    shipmentCount: shipments.length,
    onTimeRatePercent:
      settled === 0
        ? null
        : divideMoney(delivered, settled).times(100).toDecimalPlaces(PERCENT_PLACES).toNumber(),
    costPerShipment:
      shipments.length === 0
        ? null
        : divideMoney(postedCost, shipments.length).toDecimalPlaces(CURRENCY_PLACES).toNumber(),
    unavailable,
  };
}

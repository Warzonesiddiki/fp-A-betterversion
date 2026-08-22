// @money-ast-allow Reason: Entry-direction filter: e.credit > e.debit selects credit-heavy entries for sumMoney, not a money result
/**
 * Logistics — Fleet Cost Dashboard (Wave 9 Phase 3 Sector Depth).
 *
 * Consumes the exact-money logisticsMetrics engine. GL-derived money (revenue,
 * cogs, opex) is summed via sumMoney; fleet volume inputs are derived from
 * tagged GL accounts where present and are `null` when no account posts them —
 * never a hardcoded fallback (the previous 400,000-mile / 9,500-of-10,000-
 * delivery constants fabricated measured-looking KPIs from an empty ledger).
 * All display goes through format helpers; unposted ratios render as "—".
 */
import { useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { Truck, Gauge, MapPin, Fuel } from 'lucide-react';
import type { GLEntry } from '@/types';
import { formatMoney, roundTo, sumMoney } from '@/utils/money';
import { formatNumber } from '@/utils/formatters';
import { formatPercent } from '@/utils/financialFormatting';
import { computeLogisticsMetrics } from './logisticsMetrics';

export interface FleetCostInput {
  revenue: number;
  cogs: number;
  operatingExpenses: number;
  /** Sum of posted mileage accounts; `null` when none is tagged in the GL. */
  totalMiles: number | null;
  loadedMiles: number | null;
  onTimeDeliveries: number | null;
  totalDeliveries: number | null;
  fleetCapacityMiles: number | null;
  warehouseCost: number;
}

/**
 * Sum debit-side amounts of entries whose account name matches `pattern`.
 * Returns `null` when no entry matches — the quantity was never posted, which
 * is different from posting zero.
 */
function sumDebitIfPosted(entries: readonly GLEntry[], pattern: RegExp): number | null {
  const matching = entries.filter((e) => pattern.test(e.accountName.toLowerCase()));
  if (matching.length === 0) return null;
  return roundTo(sumMoney(matching.map((e) => e.debit)), 2);
}

/** Derive the fleet-cost money inputs from a GL entry list (exact sums). */
export function computeFleetCostFromEntries(entries: readonly GLEntry[]): FleetCostInput {
  // Revenue is credit-normal only: debit-heavy rows whose names merely
  // contain a keyword (e.g. "Total Miles", "Warehouse Storage") are volumes
  // or expenses, and their netChange must never inflate revenue.
  const revenue = roundTo(
    sumMoney(
      entries
        .filter((e) =>
          /revenue|sales|freight|shipping|mile|fleet/.test(e.accountName.toLowerCase())
        )
        .filter((e) => e.credit > e.debit)
        .map((e) => e.credit)
    ),
    2
  );
  const cogs = roundTo(
    sumMoney(
      entries
        .filter((e) => /cogs|cost of goods|fuel|freight cost/.test(e.accountName.toLowerCase()))
        .map((e) => e.debit)
    ),
    2
  );
  const operatingExpenses = roundTo(
    sumMoney(
      entries
        .filter((e) =>
          /operating|opex|maintenance|admin|insurance|payroll/.test(e.accountName.toLowerCase())
        )
        .map((e) => e.debit)
    ),
    2
  );
  const totalMiles = sumDebitIfPosted(entries, /total miles|miles driven/);
  const loadedMiles = sumDebitIfPosted(entries, /loaded miles|loaded/);
  const onTimeDeliveries = sumDebitIfPosted(entries, /on.time delivery|on.time/);
  const totalDeliveries = sumDebitIfPosted(entries, /total deliveries|deliveries/);
  const fleetCapacityMiles = sumDebitIfPosted(entries, /fleet capacity|capacity miles/);
  const warehouseCost = roundTo(
    sumMoney(
      entries
        .filter((e) =>
          /warehouse|warehousing|storage|distribution/.test(e.accountName.toLowerCase())
        )
        .map((e) => e.debit)
    ),
    2
  );

  return {
    revenue,
    cogs,
    operatingExpenses,
    // `null` = no tagged account posts this quantity. It is never replaced
    // with an assumed constant; dependent KPIs render as "—" with disclosure.
    totalMiles,
    loadedMiles,
    onTimeDeliveries,
    totalDeliveries,
    fleetCapacityMiles,
    warehouseCost,
  };
}

export default function FleetCostDashboardPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Fleet Cost Dashboard';
  }, []);

  const input = useMemo(() => computeFleetCostFromEntries(entries), [entries]);
  const metrics = useMemo(() => computeLogisticsMetrics(input), [input]);

  if (entries.length === 0) {
    return (
      <main className="p-12 text-center" role="main" aria-label="Fleet Cost - No Data">
        <Truck className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" aria-hidden="true" />
        <h1 className="text-xl font-semibold mb-2">No Fleet Data</h1>
        <p className="text-[var(--text-muted)] mb-6">Import GL data to view fleet cost metrics.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6 animate-fade-in" role="main" aria-label="Fleet Cost Dashboard">
      <header className="flex items-center justify-between">
        <PageHeader
          title="Fleet Cost Dashboard"
          purpose={'Cost per mile & fleet utilization analytics'}
        />
        <Button variant="outline" onClick={() => navigate('/logistics')}>
          Back to Logistics
        </Button>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4" aria-label="Fleet KPIs">
        <KPIValue
          label="Cost Per Mile"
          value={metrics.costPerMile === null ? '—' : formatMoney(metrics.costPerMile)}
          changeLabel={
            metrics.costPerMile === null ? 'no mileage accounts tagged in the GL' : undefined
          }
          icon={<Fuel className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Total Fleet Expense"
          value={formatMoney(metrics.totalExpenses)}
          icon={<Truck className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Fleet Utilization"
          value={
            metrics.fleetUtilizationPct === null
              ? '—'
              : formatPercent(metrics.fleetUtilizationPct, 1)
          }
          changeLabel={
            metrics.fleetUtilizationPct === null ? 'no fleet capacity posted in the GL' : undefined
          }
          icon={<Gauge className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Empty Miles"
          value={metrics.emptyMilesPct === null ? '—' : formatPercent(metrics.emptyMilesPct, 1)}
          changeLabel={
            metrics.emptyMilesPct === null ? 'loaded/total miles not both posted' : undefined
          }
          icon={<MapPin className="h-4 w-4" aria-hidden="true" />}
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card aria-label="Fleet Cost Detail">
          <CardHeader>
            <CardTitle>Fleet Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-muted)]">Gross Profit</span>
              <span className="font-mono">{formatMoney(metrics.grossProfit)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-muted)]">EBITDA</span>
              <span className="font-mono">{formatMoney(metrics.ebitda)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-muted)]">On-Time Delivery</span>
              <span className="font-mono">
                {metrics.onTimeDeliveryPct === null
                  ? '— no delivery counters posted'
                  : formatPercent(metrics.onTimeDeliveryPct, 1)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-muted)]">Operating Margin</span>
              <span className="font-mono">{formatPercent(metrics.operatingMarginPct, 1)}</span>
            </div>
          </CardContent>
        </Card>
        <Card aria-label="Fleet Volume">
          <CardHeader>
            <CardTitle>Fleet Volume</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-muted)]">Total Miles</span>
              <span className="font-mono">
                {input.totalMiles === null ? '— not posted' : formatNumber(input.totalMiles)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-muted)]">Loaded Miles</span>
              <span className="font-mono">
                {input.loadedMiles === null ? '— not posted' : formatNumber(input.loadedMiles)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-muted)]">On-Time Deliveries</span>
              <span className="font-mono">
                {input.onTimeDeliveries === null
                  ? '— not posted'
                  : formatNumber(input.onTimeDeliveries)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-muted)]">Total Deliveries</span>
              <span className="font-mono">
                {input.totalDeliveries === null
                  ? '— not posted'
                  : formatNumber(input.totalDeliveries)}
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] pt-2">
              Volume figures come only from tagged GL accounts (miles, deliveries, capacity).
              Quantities the ledger does not post are shown as blank — they are never filled with
              assumed fleet averages.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

/**
 * Logistics — Fleet Cost Dashboard (Wave 9 Phase 3 Sector Depth).
 *
 * Consumes the exact-money logisticsMetrics engine. GL-derived money (revenue,
 * cogs, opex) is summed via sumMoney; fleet volume inputs are derived from
 * tagged GL accounts where present and fall back to deterministic config
 * defaults (never Math.random). All display goes through format helpers.
 */
import { useEffect, useMemo } from 'react';
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
  totalMiles: number;
  loadedMiles: number;
  onTimeDeliveries: number;
  totalDeliveries: number;
  fleetCapacityMiles: number;
  warehouseCost: number;
}

/** Derive the fleet-cost money inputs from a GL entry list (exact sums). */
export function computeFleetCostFromEntries(entries: readonly GLEntry[]): FleetCostInput {
  const revenue = roundTo(
    sumMoney(
      entries
        .filter((e) =>
          /revenue|sales|freight|shipping|mile|fleet/.test(e.accountName.toLowerCase())
        )
        .map((e) => (e.credit > e.debit ? e.credit : e.netChange))
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
  const totalMiles = roundTo(
    sumMoney(
      entries
        .filter((e) => /total miles|miles driven/.test(e.accountName.toLowerCase()))
        .map((e) => e.debit)
    ),
    2
  );
  const loadedMiles = roundTo(
    sumMoney(
      entries
        .filter((e) => /loaded miles|loaded/.test(e.accountName.toLowerCase()))
        .map((e) => e.debit)
    ),
    2
  );
  const onTimeDeliveries = roundTo(
    sumMoney(
      entries
        .filter((e) => /on.time delivery|on.time/.test(e.accountName.toLowerCase()))
        .map((e) => e.debit)
    ),
    2
  );
  const totalDeliveries = roundTo(
    sumMoney(
      entries
        .filter((e) => /total deliveries|deliveries/.test(e.accountName.toLowerCase()))
        .map((e) => e.debit)
    ),
    2
  );
  const fleetCapacityMiles = roundTo(
    sumMoney(
      entries
        .filter((e) => /fleet capacity|capacity miles/.test(e.accountName.toLowerCase()))
        .map((e) => e.debit)
    ),
    2
  );
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
    // Deterministic fallbacks when the volume accounts are absent.
    totalMiles: totalMiles > 0 ? totalMiles : 400_000,
    loadedMiles: loadedMiles > 0 ? loadedMiles : 340_000,
    onTimeDeliveries: onTimeDeliveries > 0 ? onTimeDeliveries : 9500,
    totalDeliveries: totalDeliveries > 0 ? totalDeliveries : 10000,
    fleetCapacityMiles: fleetCapacityMiles > 0 ? fleetCapacityMiles : 470_000,
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
        <Truck className="h-10 w-10 text-slate-400 mx-auto mb-4" aria-hidden="true" />
        <h2 className="text-xl font-semibold mb-2">No Fleet Data</h2>
        <p className="text-slate-400 mb-6">Import GL data to view fleet cost metrics.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6 animate-fade-in" role="main" aria-label="Fleet Cost Dashboard">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fleet Cost Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Cost per mile & fleet utilization analytics</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/logistics')}>
          Back to Logistics
        </Button>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4" aria-label="Fleet KPIs">
        <KPIValue
          label="Cost Per Mile"
          value={formatMoney(metrics.costPerMile)}
          icon={<Fuel className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Total Fleet Expense"
          value={formatMoney(metrics.totalExpenses)}
          icon={<Truck className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Fleet Utilization"
          value={formatPercent(metrics.fleetUtilizationPct, 1)}
          icon={<Gauge className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Empty Miles"
          value={formatPercent(metrics.emptyMilesPct, 1)}
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
              <span className="text-sm text-slate-400">Gross Profit</span>
              <span className="font-mono">{formatMoney(metrics.grossProfit)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">EBITDA</span>
              <span className="font-mono">{formatMoney(metrics.ebitda)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">On-Time Delivery</span>
              <span className="font-mono">{formatPercent(metrics.onTimeDeliveryPct, 1)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Operating Margin</span>
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
              <span className="text-sm text-slate-400">Total Miles</span>
              <span className="font-mono">{formatNumber(input.totalMiles)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Loaded Miles</span>
              <span className="font-mono">{formatNumber(input.loadedMiles)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">On-Time Deliveries</span>
              <span className="font-mono">{formatNumber(input.onTimeDeliveries)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Total Deliveries</span>
              <span className="font-mono">{formatNumber(input.totalDeliveries)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

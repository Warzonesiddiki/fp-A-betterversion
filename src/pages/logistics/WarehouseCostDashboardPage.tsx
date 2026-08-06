/**
 * Logistics — Warehouse Cost Dashboard (Wave 9 Phase 3 Sector Depth).
 *
 * Consumes the exact-money logisticsMetrics engine with a warehouse focus:
 * warehouse cost % revenue, operating margin, and warehousing cost model.
 */
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { Package, Warehouse, Percent, TrendingUp } from 'lucide-react';
import type { GLEntry } from '@/types';
import { formatMoney, roundTo, sumMoney } from '@/utils/money';
import { formatPercent } from '@/utils/financialFormatting';
import { computeLogisticsMetrics } from './logisticsMetrics';

export interface WarehouseCostInput {
  revenue: number;
  cogs: number;
  operatingExpenses: number;
  warehouseCost: number;
  totalMiles: number;
  loadedMiles: number;
  onTimeDeliveries: number;
  totalDeliveries: number;
  fleetCapacityMiles: number;
}

/** Derive warehouse-cost inputs from GL entries (exact sums). */
export function computeWarehouseCostFromEntries(entries: readonly GLEntry[]): WarehouseCostInput {
  const revenue = roundTo(
    sumMoney(
      entries
        .filter((e) =>
          /revenue|sales|freight|shipping|warehouse|storage/.test(e.accountName.toLowerCase())
        )
        .map((e) => (e.credit > e.debit ? e.credit : e.netChange))
    ),
    2
  );
  const cogs = roundTo(
    sumMoney(
      entries
        .filter((e) => /cogs|cost of goods/.test(e.accountName.toLowerCase()))
        .map((e) => e.debit)
    ),
    2
  );
  const operatingExpenses = roundTo(
    sumMoney(
      entries
        .filter((e) =>
          /operating|opex|admin|insurance|maintenance/.test(e.accountName.toLowerCase())
        )
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
    warehouseCost,
    totalMiles: 400_000,
    loadedMiles: 340_000,
    onTimeDeliveries: 9500,
    totalDeliveries: 10000,
    fleetCapacityMiles: 470_000,
  };
}

export default function WarehouseCostDashboardPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Warehouse Cost Dashboard';
  }, []);

  const input = useMemo(() => computeWarehouseCostFromEntries(entries), [entries]);
  const metrics = useMemo(() => computeLogisticsMetrics(input), [input]);

  if (entries.length === 0) {
    return (
      <main className="p-12 text-center" role="main" aria-label="Warehouse Cost - No Data">
        <Warehouse className="h-10 w-10 text-slate-400 mx-auto mb-4" aria-hidden="true" />
        <h2 className="text-xl font-semibold mb-2">No Warehouse Data</h2>
        <p className="text-slate-400 mb-6">Import GL data to view warehouse cost metrics.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </main>
    );
  }

  return (
    <main
      className="p-6 space-y-6 animate-fade-in"
      role="main"
      aria-label="Warehouse Cost Dashboard"
    >
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Warehouse Cost Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Warehousing cost % revenue analytics</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/logistics')}>
          Back to Logistics
        </Button>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4" aria-label="Warehouse KPIs">
        <KPIValue
          label="Warehouse Cost"
          value={formatMoney(input.warehouseCost)}
          icon={<Package className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Warehouse Cost % Revenue"
          value={formatPercent(metrics.warehouseCostPct, 1)}
          icon={<Percent className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Revenue"
          value={formatMoney(input.revenue)}
          icon={<TrendingUp className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Operating Margin"
          value={formatPercent(metrics.operatingMarginPct, 1)}
          icon={<Warehouse className="h-4 w-4" aria-hidden="true" />}
        />
      </section>

      <Card aria-label="Warehouse Cost Detail">
        <CardHeader>
          <CardTitle>Warehouse Cost Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-400">Total Expenses</span>
            <span className="font-mono">{formatMoney(metrics.totalExpenses)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-400">Gross Profit</span>
            <span className="font-mono">{formatMoney(metrics.grossProfit)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-400">EBITDA</span>
            <span className="font-mono">{formatMoney(metrics.ebitda)}</span>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

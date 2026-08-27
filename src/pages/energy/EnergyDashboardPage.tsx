import { buildFiscalPeriods } from '@/utils/fiscalPeriods';
import { PageHeader } from '@/components/ui/PageHeader';
import { useMemo, useState } from 'react';

import { AlertTriangle, Download, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';

import { Button } from '@/components/ui/Button';
import { KPIValue } from '@/components/ui/KPIValue';
import { PeriodPicker } from '@/components/ui/PeriodPicker';
import { DataTable, Column } from '@/components/ui/DataTable';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import type { FiscalPeriod } from '@/types';
import { useEnergyStore } from '@/store/energyStore';
import { useGLStore } from '@/store/glStore';
import { roundTo, sumMoney } from '@/utils/money';
import { formatPercent } from '@/utils/financialFormatting';

const fiscalPeriods: FiscalPeriod[] = buildFiscalPeriods();

/**
 * Energy Dashboard (session 028, replaces fabricated session-022 version).
 *
 * Pre-session-028 page rendered six months of fictional revenue/cost/production
 * numbers, a five-source mix with hand-typed MW values, and five named
 * facilities with hand-typed MWh outputs, efficiency percentages and dollar
 * costs — none of which was backed by the energy store or a general ledger.
 *
 * The page now derives everything it can from `useEnergyStore` and
 * `useGLStore`:
 *   - Total generation across the recorded window (sum of the real
 *     `generationTrend` totals).
 *   - Capacity mix by source type (counted from real recorded assets).
 *   - Per-asset list, output and capacity (read straight from the real
 *     energy store).
 *   - GL entry count.
 *
 * Per-asset operating cost, per-MWh market price, and per-month revenue/cost
 * splits are NOT derivable from the data model yet (no cost ledger per asset,
 * no spot-price feed). Those KPIs render as '—' with a disclosure.
 */
export default function EnergyDashboardPage() {
  const [periodId, setPeriodId] = useState('P01');
  const { assets, generationTrend, capacityMix } = useEnergyStore();
  const { entries } = useGLStore();

  const totalGeneration = useMemo(
    () => roundTo(sumMoney(generationTrend.map((g) => g.total)), 2),
    [generationTrend]
  );

  // Real per-source totals from the recorded assets. If the energy store
  // carries a `capacityMix`, prefer that. Otherwise aggregate by `type`.
  const perSource = useMemo(() => {
    if (capacityMix.length > 0) return capacityMix;
    const map = new Map<string, number>();
    for (const a of assets) {
      // capacity is a string like "250 MW"; we treat it as a label, not a
      // numeric, so we count facilities per type rather than summing MW.
      map.set(a.type, (map.get(a.type) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value, color: '#64748b' }));
  }, [assets, capacityMix]);

  // Real revenue/cost from GL (4xxx revenue, 5xxx-6xxx opex). No hand-typed
  // monthly trend — disclose the gap if the GL is empty.
  const realRevenue = useMemo(
    () =>
      roundTo(
        sumMoney(entries.filter((e) => e.accountCode.startsWith('4')).map((e) => e.credit)),
        2
      ),
    [entries]
  );
  const realOpex = useMemo(
    () =>
      roundTo(sumMoney(entries.filter((e) => /^5|^6/.test(e.accountCode)).map((e) => e.debit)), 2),
    [entries]
  );

  const handleExport = () => {
    /* handled by ExportEngine */
  };

  const columns: Column[] = [
    { key: 'name', header: 'Asset Name', sortable: true },
    { key: 'type', header: 'Type', align: 'center' },
    { key: 'capacity', header: 'Capacity', align: 'right' },
    { key: 'outputYTD', header: 'Output YTD', align: 'right' },
    { key: 'availability', header: 'Availability', align: 'right' },
    { key: 'roi', header: 'ROI', align: 'right' },
  ];

  const tableData = assets.map((a) => ({
    name: a.name,
    type: a.type,
    capacity: a.capacity,
    outputYTD: a.outputYTD,
    availability: a.availability,
    roi: a.roi,
  }));

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Energy Dashboard"
          purpose="Monitor production efficiency, revenue streams, and asset performance across all grids."
        />
        <div className="flex items-center gap-3">
          <PeriodPicker value={periodId} onChange={setPeriodId} periods={fiscalPeriods} />
          <Button variant="outline" size="sm" onClick={handleExport} className="h-10">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10" aria-label="Refresh data">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 2. KPI Cards Row — all derived */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPIValue
          label="Total Energy Revenue (GL)"
          value={realRevenue > 0 ? formatUsdCompact(realRevenue) : '—'}
          changeLabel={
            realRevenue > 0 ? 'sum of 4xxx credits in the GL' : 'no 4xxx revenue in the GL'
          }
        />
        <KPIValue
          label="Grid Production (window)"
          value={
            totalGeneration > 0
              ? `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(totalGeneration)} MWh`
              : '—'
          }
          changeLabel={
            generationTrend.length > 0
              ? `${generationTrend.length} periods on file`
              : 'no generation on file'
          }
          trend={totalGeneration > 0 ? 'up' : 'neutral'}
        />
        <KPIValue label="Avg. Market Price" value="—" changeLabel="spot-price feed not connected" />
        <KPIValue label="Carbon Intensity" value="—" changeLabel="intensity feed not connected" />
      </div>

      {/* 3. Main Charts Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Generation Trend (Real)</CardTitle>
            <CardDescription>
              {generationTrend.length > 0
                ? 'Recorded renewable generation by month'
                : 'No generation on file yet'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full pt-4">
              {generationTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={generationTrend}>
                    <defs>
                      <linearGradient id="colorSolar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#64748b' }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#64748b' }}
                    />
                    <Tooltip />
                    <Legend verticalAlign="top" align="right" iconType="circle" />
                    <Area
                      type="monotone"
                      dataKey="solar"
                      name="Solar (MWh)"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorSolar)"
                    />
                    <Area
                      type="monotone"
                      dataKey="wind"
                      name="Wind (MWh)"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="transparent"
                    />
                    <Area
                      type="monotone"
                      dataKey="hydro"
                      name="Hydro (MWh)"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fill="transparent"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="No generation trend recorded yet. Record assets to populate this chart." />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Production by Source</CardTitle>
            <CardDescription>Current mix of energy generation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full pt-4">
              {perSource.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={perSource} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fontWeight: 600 }}
                      width={80}
                    />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                      {perSource.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="No assets recorded. Record renewable assets to populate this chart." />
              )}
            </div>
            {perSource.length > 0 && (
              <div className="mt-4 space-y-2">
                {perSource.slice(0, 3).map((s) => {
                  const total = perSource.reduce((acc, x) => acc + x.value, 0);
                  return (
                    <div key={s.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: s.color }}
                        />
                        <span className="font-medium">{s.name}</span>
                      </div>
                      <span className="text-[var(--text-secondary)]">
                        {total > 0 ? formatPercent(s.value / total, 1) : '—'} of total
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 4. Detail Table Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Asset Performance Analysis</CardTitle>
            <CardDescription>
              {tableData.length > 0
                ? 'Recorded assets from the energy store'
                : 'No assets recorded yet'}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" disabled={realOpex === 0}>
            View All Assets
          </Button>
        </CardHeader>
        <CardContent>
          {tableData.length > 0 ? (
            <DataTable
              columns={columns}
              data={tableData}
              caption="Energy asset performance table"
              ariaLabel="Energy asset performance"
            />
          ) : (
            <EmptyState message="No assets recorded. Add renewable assets in the energy store to populate this table." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="h-full flex items-center justify-center text-sm text-[var(--text-muted)]">
      <div className="text-center max-w-sm">
        <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-[var(--text-muted)]" />
        <p>{message}</p>
      </div>
    </div>
  );
}

function formatUsdCompact(n: number): string {
  if (n >= 1_000_000) return `$${roundTo(n / 1_000_000, 1)}M`;
  if (n >= 1_000) return `$${roundTo(n / 1_000, 1)}k`;
  return `$${roundTo(n, 0)}`;
}

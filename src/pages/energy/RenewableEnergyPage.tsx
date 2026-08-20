import { buildFiscalPeriods } from '@/utils/fiscalPeriods';
import { PageHeader } from '@/components/ui/PageHeader';
import { useMemo, useState } from 'react';
import { Sun, Wind, Droplets, Battery, Download, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KPIValue } from '@/components/ui/KPIValue';
import { PeriodPicker } from '@/components/ui/PeriodPicker';
import { DataTable, Column } from '@/components/ui/DataTable';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import type { FiscalPeriod } from '@/types';
import { useEnergyStore } from '@/store/energyStore';
import { roundTo, sumMoney } from '@/utils/money';

const mockPeriods: FiscalPeriod[] = buildFiscalPeriods();

/**
 * Renewable Energy (session 028, replaces fabricated session-022 version).
 *
 * Pre-session-028 page rendered seven hand-typed daily generation points,
 * five fictional capacity-mix slices, five named facilities with hand-typed
 * capacity / outputYTD / availability / ROI, and four literal KPIs
 * (Solar 1.2 GW, Wind 850 MW, RECs 4,250, ROI 11.8%) plus a fabricated
 * "124,500 tons CO2" sustainability card. None of it was backed by the
 * energy store.
 *
 * The page now derives everything it can from the real `useEnergyStore`:
 *   - Asset count and per-type asset mix.
 *   - Generation trend (real recorded points).
 *   - Total generation across the recorded window.
 *
 * RECs, carbon offset, and per-asset ROI are NOT derivable from a
 * generation store and are disclosed.
 */
export default function RenewableEnergyPage() {
  const [periodId, setPeriodId] = useState('P01');
  const { assets, generationTrend, capacityMix } = useEnergyStore();

  const totalGeneration = useMemo(
    () => roundTo(sumMoney(generationTrend.map((g) => g.total)), 2),
    [generationTrend]
  );
  const latestPoint = generationTrend.at(-1);
  const solarNow = latestPoint?.solar ?? null;
  const windNow = latestPoint?.wind ?? null;
  const hydroNow = latestPoint?.hydro ?? null;

  // Per-type mix: prefer capacityMix; otherwise count assets per type.
  const perSource = useMemo(() => {
    if (capacityMix.length > 0) return capacityMix;
    const map = new Map<string, number>();
    for (const a of assets) map.set(a.type, (map.get(a.type) ?? 0) + 1);
    return Array.from(map.entries()).map(([name, value]) => ({ name, value, color: '#64748b' }));
  }, [assets, capacityMix]);

  const columns: Column[] = [
    { key: 'name', header: 'Asset Name', sortable: true },
    {
      key: 'type',
      header: 'Type',
      render: (value) => (
        <div className="flex items-center gap-2">
          {String(value) === 'Solar' && <Sun className="h-3 w-3 text-amber-700" />}
          {String(value) === 'Wind' && <Wind className="h-3 w-3 text-emerald-700" />}
          {String(value) === 'Hydro' && <Droplets className="h-3 w-3 text-blue-600" />}
          {String(value) === 'Storage' && <Battery className="h-3 w-3 text-purple-600" />}
          <span>{String(value ?? '')}</span>
        </div>
      ),
    },
    { key: 'capacity', header: 'Capacity', align: 'right' },
    { key: 'outputYTD', header: 'Output YTD', align: 'right' },
    { key: 'availability', header: 'Availability', align: 'right' },
    { key: 'roi', header: 'ROI', align: 'right' },
  ];

  return (
    <div className="p-6 space-y-6 animate-in slide-in-from-bottom-2 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Renewable Energy"
          purpose="Performance analytics for zero-emission assets and portfolio diversification."
        />
        <div className="flex items-center gap-3">
          <PeriodPicker value={periodId} onChange={setPeriodId} periods={mockPeriods} />
          <Button variant="outline" size="sm" className="h-10" disabled={assets.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
        </div>
      </div>

      {/* KPIs — all derived */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPIValue
          label="Solar (latest period)"
          value={solarNow == null ? '—' : formatMwh(solarNow)}
          changeLabel={latestPoint ? `as of ${latestPoint.date}` : 'no generation on file'}
        />
        <KPIValue
          label="Wind (latest period)"
          value={windNow == null ? '—' : formatMwh(windNow)}
          changeLabel={latestPoint ? `as of ${latestPoint.date}` : 'no generation on file'}
        />
        <KPIValue
          label="Hydro (latest period)"
          value={hydroNow == null ? '—' : formatMwh(hydroNow)}
          changeLabel={latestPoint ? `as of ${latestPoint.date}` : 'no generation on file'}
        />
        <KPIValue
          label="Total Generation (window)"
          value={totalGeneration > 0 ? formatMwh(totalGeneration) : '—'}
          changeLabel={
            generationTrend.length > 0
              ? `${generationTrend.length} periods on file`
              : 'no generation on file'
          }
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Daily Generation Mix (MW)</CardTitle>
            <CardDescription>
              {generationTrend.length > 0
                ? 'Recorded renewable generation over time'
                : 'No generation recorded yet'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full pt-4">
              {generationTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={generationTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      tickFormatter={(v) => (typeof v === 'string' ? v.split('-')[2] : v)}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#64748b' }}
                    />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                    <Legend verticalAlign="top" align="right" />
                    <Line
                      type="monotone"
                      dataKey="solar"
                      name="Solar"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="wind"
                      name="Wind"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="hydro"
                      name="Hydro"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      name="Total Mix"
                      stroke="#64748b"
                      strokeWidth={3}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="No generation trend recorded yet." />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Capacity Distribution</CardTitle>
            <CardDescription>
              {perSource.length > 0 ? 'Distribution by technology' : 'No assets recorded'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full pt-4">
              {perSource.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={perSource}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      nameKey="name"
                    >
                      {perSource.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend layout="vertical" align="right" verticalAlign="middle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="No assets to chart." />
              )}
            </div>
            <div className="mt-6 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase tracking-wider">
                <AlertTriangle className="h-3 w-3" />
                Sustainability Impact
              </div>
              <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                Renewable Energy Credits (RECs) and CO2 offset are not derivable from a generation
                store. Connect a REC registry feed to populate this card.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Asset Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Asset Portfolio</CardTitle>
            <CardDescription>
              {assets.length > 0
                ? `Recorded assets (${assets.length} facilities)`
                : 'No assets recorded'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {assets.length > 0 ? (
            <DataTable
              columns={columns}
              data={assets}
              caption="Renewable energy asset portfolio"
              ariaLabel="Renewable assets table"
            />
          ) : (
            <div className="text-sm text-[var(--text-muted)]">
              <p>No renewable assets recorded yet.</p>
              <p>Add assets in the energy store to populate this table.</p>
            </div>
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

function formatMwh(n: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(n);
}

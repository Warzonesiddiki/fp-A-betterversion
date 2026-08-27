/**
 * Energy production — every figure is derived from recorded energy data.
 *
 * CORRECTNESS CONTRACT (K18):
 *
 * 1. NEVER render a figure the workspace cannot support. Removed in this
 *    pass:
 *    - the hand-typed `SOURCES` fixture (Solar 4,200 MWh @ $28/MWh, Wind
 *      3,800 @ $22, Hydro 2,100 @ $15, Gas 1,900 @ $45, with revenue
 *      literals $168k / $152k / $84k / $95k) charted as measured output and
 *      exported to PDF as if it were posted data;
 *    - the `MONTHLY` Jan–Jun generation fixture charted as a measured
 *      trend;
 *    - the "capacity factor" computed against a hardcoded 15,000 MWh × 6
 *      benchmark presented as though it were nameplate capacity;
 *    - the GL-entry gate that implied this dashboard was derived from the
 *      general ledger while showing store-independent fixtures.
 * 2. Everything shown comes from the real `useEnergyStore`: recorded
 *    generation points (per-source MWh over time), recorded assets and the
 *    recorded capacity mix. Figures that need feeds this workspace does not
 *    have — per-source operating cost, per-source revenue, capacity factor
 *    without a stated theoretical maximum — are disclosed, never estimated.
 * 3. The empty gate now reflects the actual data source: the page renders
 *    content only when the energy store holds something.
 */
import { useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { EmptyState } from '@/components/ui/EmptyState';
import { Download, Zap, TrendingUp, Gauge, Layers, Info } from 'lucide-react';
import { ExportEngine } from '@/engines/ExportEngine';
import { reportExportFailure } from '@/utils/exportErrorHandler';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useEnergyStore } from '@/store/energyStore';
import { roundTo, sumMoney } from '@/utils/money';
import { formatNumber } from '@/utils/financialFormatting';

const SOURCE_COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#64748b'];

export default function EnergyProductionDashboard() {
  const { assets, generationTrend, capacityMix } = useEnergyStore();

  useEffect(() => {
    document.title = 'FinPlan Pro — Energy Production';
  }, []);

  // Total recorded generation across the window (MWh — a unit, not money).
  const totalGeneration = useMemo(
    () => roundTo(sumMoney(generationTrend.map((g) => g.total)), 2),
    [generationTrend]
  );
  const latestPoint = generationTrend.at(-1);

  const hasEnergyData = assets.length > 0 || generationTrend.length > 0 || capacityMix.length > 0;

  // Source mix: prefer the recorded capacityMix; otherwise count assets per
  // type (capacity strings are labels, not summable numbers).
  const perSource = useMemo(() => {
    if (capacityMix.length > 0) return capacityMix;
    const map = new Map<string, number>();
    for (const a of assets) map.set(a.type, (map.get(a.type) ?? 0) + 1);
    return Array.from(map.entries()).map(([name, value], i) => ({
      name,
      value,
      color: SOURCE_COLORS[i % SOURCE_COLORS.length] as string,
    }));
  }, [assets, capacityMix]);

  // Exports exactly what is recorded: one row per recorded generation point.
  const handleExport = () => {
    void ExportEngine.exportToPDF(
      {
        headers: ['Date', 'Solar MWh', 'Wind MWh', 'Hydro MWh', 'Total MWh'],
        rows: generationTrend.map((g) => [g.date, g.solar, g.wind, g.hydro, g.total]),
      },
      { title: 'Energy Production' }
    ).catch(reportExportFailure);
  };

  if (!hasEnergyData) {
    // K30 four-states: shared EmptyState under the page-level h1 (PageHeader
    // stays mounted in this branch). Nothing is invented while the store is
    // empty.
    return (
      <div className="p-6 space-y-6 max-w-7xl" aria-labelledby="energy-production-heading">
        <PageHeader
          title="Energy Production"
          titleId="energy-production-heading"
          purpose="Recorded generation output and capacity mix from the energy workspace."
        />
        <EmptyState
          variant="no-data"
          title="No energy production data"
          description="No renewable assets or generation points are recorded in this workspace. Record assets and generation to track output here. Production cost, revenue and capacity factor require their own feeds and are never estimated."
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" aria-labelledby="energy-production-heading">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Energy Production"
          titleId="energy-production-heading"
          purpose="Recorded generation output and capacity mix from the energy workspace."
        />
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={generationTrend.length === 0}
          aria-label="Export recorded generation as PDF"
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* KPIs — derived from recorded energy data; non-derivable disclosed */}
      <div className="grid gap-4 md:grid-cols-4" aria-label="Energy production KPIs">
        <KPIValue
          label="Total Generation (window)"
          value={`${formatNumber(totalGeneration)} MWh`}
          changeLabel={
            generationTrend.length > 0
              ? `${generationTrend.length} periods on file`
              : 'no generation on file'
          }
          trend={totalGeneration > 0 ? 'up' : 'neutral'}
          icon={<Zap className="h-4 w-4" />}
        />
        <KPIValue
          label="Latest Recorded Period"
          value={latestPoint ? `${formatNumber(latestPoint.total)} MWh` : '—'}
          changeLabel={latestPoint ? `as of ${latestPoint.date}` : 'no generation on file'}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <KPIValue
          label="Recorded Assets"
          value={formatNumber(assets.length)}
          changeLabel={
            assets.length > 0 ? `${assets.length} facilities on file` : 'no assets on file'
          }
          icon={<Layers className="h-4 w-4" />}
        />
        <KPIValue
          label="Capacity Factor"
          value="—"
          changeLabel="requires each asset's stated theoretical maximum output"
          icon={<Gauge className="h-4 w-4" />}
        />
      </div>

      {/* Charts — recorded points only */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Generation Output (MWh)</CardTitle>
            <CardDescription>
              {generationTrend.length > 0
                ? 'Recorded renewable generation over time'
                : 'No generation recorded yet'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generationTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={[...generationTrend]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="solar"
                    name="Solar"
                    stackId="1"
                    fill="#f59e0b"
                    fillOpacity={0.6}
                    stroke="#f59e0b"
                  />
                  <Area
                    type="monotone"
                    dataKey="wind"
                    name="Wind"
                    stackId="1"
                    fill="#10b981"
                    fillOpacity={0.6}
                    stroke="#10b981"
                  />
                  <Area
                    type="monotone"
                    dataKey="hydro"
                    name="Hydro"
                    stackId="1"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                    stroke="#3b82f6"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-[var(--text-muted)] py-8 text-center">
                No generation points are recorded yet. Record generation in the energy workspace to
                populate this chart — no synthetic trend is shown.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Production by Source</CardTitle>
            <CardDescription>
              {perSource.length > 0
                ? 'From the recorded capacity mix'
                : 'No assets or capacity mix recorded'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {perSource.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={perSource.map((s) => ({ ...s }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    nameKey="name"
                  >
                    {perSource.map((entry, i) => (
                      <Cell key={`cell-${entry.name ?? i}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-[var(--text-muted)] py-8 text-center">
                No assets are recorded yet, so no source mix can be shown.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Non-derivable figures — disclosed, never estimated */}
      <Card>
        <CardHeader>
          <CardTitle>Not derivable from recorded energy data</CardTitle>
          <CardDescription>Omitted rather than estimated</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-[var(--text-muted)]">
          <p className="flex items-start gap-1">
            <Info className="h-3 w-3 mt-0.5 shrink-0" />
            <span>
              <span className="font-medium text-[var(--text-secondary)]">Avg cost / MWh</span> —
              requires a per-asset operating-cost ledger (fuel, purchase agreements); none is
              recorded.
            </span>
          </p>
          <p className="flex items-start gap-1">
            <Info className="h-3 w-3 mt-0.5 shrink-0" />
            <span>
              <span className="font-medium text-[var(--text-secondary)]">
                Per-source revenue and cost
              </span>{' '}
              — requires a tariff or PPA feed; none is connected.
            </span>
          </p>
          <p className="flex items-start gap-1">
            <Info className="h-3 w-3 mt-0.5 shrink-0" />
            <span>
              <span className="font-medium text-[var(--text-secondary)]">Capacity factor</span> —
              requires each asset&apos;s stated theoretical maximum output; no nameplate register
              exists in this workspace.
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

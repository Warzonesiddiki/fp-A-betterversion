import { useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ChartCard } from '@/components/ui/ChartCard';
import { KPIValue } from '@/components/ui/KPIValue';
import { useLogisticsStore } from '@/store/logisticsStore';

import { Truck, Package, DollarSign, MapPin, TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { formatPercent } from '@/utils/financialFormatting';
import { useGLStore } from '@/store/glStore';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import {
  deriveLogisticsDashboard,
  type AccountAmountRow,
  type LaneRow,
} from '@/pages/sectors/logisticsDashboardData';
import { PageHeader } from '@/components/ui/PageHeader';

const COLORS = [
  'var(--accent-primary)',
  'var(--accent-secondary)',
  '#16A34A',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
];

/**
 * Logistics sector dashboard.
 *
 * Every figure comes from `@/pages/sectors/logisticsDashboardData` — see its
 * correctness contract. This page previously shipped three module-level
 * fixtures (service-line revenue, a cost-share pie, twelve months of shipment
 * volume), a seven-literal KPI strip, an on-time rate that fell back to 96.4%
 * for an empty store, and a lane list that rendered route COST in a field it
 * called revenue.
 */
export function LogisticsDashboardPage() {
  const { routeCosts, shipments } = useLogisticsStore();
  const { entries } = useGLStore();
  const fmt = useCurrencyFormatter();

  useEffect(() => {
    document.title = 'FinPlan Pro — Logistics Dashboard';
  }, []);

  const data = useMemo(
    () => deriveLogisticsDashboard(entries, shipments, routeCosts),
    [entries, shipments, routeCosts]
  );

  if (!data) {
    return (
      <main
        className="p-12 text-center max-w-md mx-auto"
        role="main"
        aria-label="Logistics Sector Dashboard"
      >
        <Truck className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" />
        <h1 className="text-xl font-semibold mb-2">No Logistics Data</h1>
        <p className="text-[var(--text-muted)]">
          Import ledger activity, shipments or route costs to see freight revenue, cost distribution
          and lane economics.
        </p>
      </main>
    );
  }

  const kpis = [
    {
      label: 'Posted Freight Revenue',
      value: fmt.currency0(data.postedRevenue),
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      label: 'Posted Operating Cost',
      value: fmt.currency0(data.postedCost),
      icon: <Package className="h-4 w-4" />,
    },
    {
      label: 'Cost per Shipment',
      value: data.costPerShipment === null ? '\u2014' : fmt.currency0(data.costPerShipment),
      icon: <Package className="h-4 w-4" />,
    },
    {
      label: 'On-Time Delivery %',
      value: formatPercent(data.onTimeRatePercent, 1),
      icon: <Truck className="h-4 w-4" />,
    },
    {
      label: 'Shipments Recorded',
      value: data.shipmentCount.toLocaleString(),
      icon: <MapPin className="h-4 w-4" />,
    },
    {
      label: 'Net Result',
      value: fmt.currency0(data.netResult),
      icon: <TrendingUp className="h-4 w-4" />,
    },
  ];

  return (
    <main className="p-6 space-y-6" role="main" aria-label="Logistics Sector Dashboard">
      <PageHeader
        title="Logistics Dashboard"
        purpose="Freight operations, fleet performance, and supply chain analytics"
      />

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KPIValue key={kpi.label} label={kpi.label} value={kpi.value} icon={kpi.icon} />
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Revenue by Account" height={300}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[...data.revenueByAccount]}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <YAxis
                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                tickFormatter={(v) => fmt.compact(v)}
              />
              <Tooltip
                formatter={(v) => [fmt.currency0(Number(v)), 'Revenue']}
                contentStyle={{
                  background: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 8,
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {data.revenueByAccount.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Cost Distribution" height={300}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[...data.costDistribution]}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={110}
                paddingAngle={2}
                dataKey="value"
              >
                {data.costDistribution.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => [fmt.currency0(Number(v)), 'Amount']}
                contentStyle={{
                  background: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 8,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {data.costDistribution.map((item: AccountAmountRow, i) => (
              <div key={item.name} className="flex items-center gap-1 text-xs">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: COLORS[i % COLORS.length] }}
                />
                <span style={{ color: 'var(--text-secondary)' }}>
                  {item.name} ({formatPercent(item.sharePercent, 1)})
                </span>
              </div>
            ))}
          </div>
        </ChartCard>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Route Costs by Lane</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.lanes.map((lane: LaneRow) => (
                <div
                  key={lane.route}
                  className="flex items-center justify-between py-2 border-b"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  <div>
                    <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                      {lane.route}
                    </span>
                    <span className="text-xs ml-2" style={{ color: 'var(--text-secondary)' }}>
                      {lane.volume.toLocaleString()} loads
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>
                      {fmt.currency0(lane.cost)}
                    </span>
                    <span className="text-xs ml-2" style={{ color: 'var(--text-secondary)' }}>
                      {lane.costPerLoad === null
                        ? '\u2014'
                        : `${fmt.currency0(lane.costPerLoad)}/load`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Not derivable from the general ledger</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {data.unavailable.map((u) => (
                <li key={u.label}>
                  <span className="font-semibold">{u.label}</span>
                  <span style={{ color: 'var(--text-secondary)' }}> — {u.reason}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

export default LogisticsDashboardPage;

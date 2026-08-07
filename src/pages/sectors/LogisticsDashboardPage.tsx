import { useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ChartCard } from '@/components/ui/ChartCard';
import { KPIValue } from '@/components/ui/KPIValue';
import { useLogisticsStore } from '@/store/logisticsStore';

import { Truck, Package, DollarSign, MapPin, TrendingUp, BarChart3 } from 'lucide-react';
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
import { formatCompact, formatNumber, formatPercent } from '@/utils/financialFormatting';

const COLORS = [
  'var(--accent-primary)',
  'var(--accent-secondary)',
  '#16A34A',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
];

const revenueByServiceLine = [
  { name: 'FTL', revenue: 4820000 },
  { name: 'LTL', revenue: 2150000 },
  { name: 'Warehousing', revenue: 1780000 },
  { name: 'Last-Mile', revenue: 1340000 },
  { name: 'Freight Forwarding', revenue: 960000 },
  { name: '3PL', revenue: 720000 },
];

const costDistribution = [
  { name: 'Fuel', value: 28 },
  { name: 'Labor', value: 24 },
  { name: 'Equipment', value: 15 },
  { name: 'Warehousing', value: 13 },
  { name: 'Insurance', value: 8 },
  { name: 'Maintenance', value: 7 },
  { name: 'Admin', value: 5 },
];

// Mock fallback — replaced by store routeCosts when populated
const mockTopLanes = [
  { route: 'LA → Chicago', volume: 1240, revenue: 2_980_000, margin: 18.2 },
  { route: 'NYC → Miami', volume: 980, revenue: 1_860_000, margin: 15.7 },
  { route: 'Dallas → Atlanta', volume: 870, revenue: 1_640_000, margin: 21.3 },
  { route: 'Seattle → Denver', volume: 620, revenue: 1_120_000, margin: 14.9 },
  { route: 'Houston → Phoenix', volume: 540, revenue: 980_000, margin: 17.6 },
];

const monthlyVolume = [
  { month: 'Jan', shipments: 12400 },
  { month: 'Feb', shipments: 11800 },
  { month: 'Mar', shipments: 13200 },
  { month: 'Apr', shipments: 14100 },
  { month: 'May', shipments: 15300 },
  { month: 'Jun', shipments: 14800 },
  { month: 'Jul', shipments: 16200 },
  { month: 'Aug', shipments: 15900 },
  { month: 'Sep', shipments: 14600 },
  { month: 'Oct', shipments: 16800 },
  { month: 'Nov', shipments: 17200 },
  { month: 'Dec', shipments: 18400 },
];

export function LogisticsDashboardPage() {
  const { routeCosts, getOnTimeRate } = useLogisticsStore();

  const onTimeRate = getOnTimeRate();

  const topLanes =
    routeCosts.length > 0
      ? routeCosts.map((rc) => ({
          route: rc.route,
          volume: rc.volume,
          revenue: rc.cost,
          margin: 0,
        }))
      : mockTopLanes;

  useEffect(() => {
    document.title = 'FinPlan Pro — Logistics Dashboard';
  }, []);

  const kpis = useMemo(
    () => [
      {
        label: 'Total Freight Revenue',
        value: '$11.77M',
        change: 8.4,
        icon: <DollarSign className="h-4 w-4" />,
      },
      {
        label: 'Cost per Shipment',
        value: '$842',
        change: -3.1,
        icon: <Package className="h-4 w-4" />,
      },
      {
        label: 'On-Time Delivery %',
        value: onTimeRate > 0 ? `${formatPercent(onTimeRate, 1)}` : '96.4%',
        change: 1.2,
        icon: <Truck className="h-4 w-4" />,
      },
      {
        label: 'Fleet Utilization %',
        value: '82.6%',
        change: 2.8,
        icon: <BarChart3 className="h-4 w-4" />,
      },
      {
        label: 'Warehouse Capacity %',
        value: '78.3%',
        change: -1.5,
        icon: <Package className="h-4 w-4" />,
      },
      {
        label: 'Avg Transit Time (days)',
        value: '3.2',
        change: -0.4,
        icon: <MapPin className="h-4 w-4" />,
      },
      {
        label: 'Revenue per Mile',
        value: '$2.84',
        change: 5.6,
        icon: <TrendingUp className="h-4 w-4" />,
      },
    ],
    [onTimeRate]
  );

  return (
    <main className="p-6 space-y-6" role="main" aria-label="Logistics Sector Dashboard">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Logistics Dashboard
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Freight operations, fleet performance, and supply chain analytics
        </p>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KPIValue
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            change={kpi.change}
            icon={kpi.icon}
          />
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Revenue by Service Line" height={300}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueByServiceLine}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <YAxis
                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                tickFormatter={(v) => `$${formatCompact(v)}`}
              />
              <Tooltip
                formatter={(v) => [`$${formatCompact(Number(v))}`, 'Revenue']}
                contentStyle={{
                  background: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 8,
                }}
              />
              <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                {revenueByServiceLine.map((_, i) => (
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
                data={costDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={110}
                paddingAngle={2}
                dataKey="value"
              >
                {costDistribution.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => [`${v}%`, 'Share']}
                contentStyle={{
                  background: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 8,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {costDistribution.map((item, i) => (
              <div key={item.name} className="flex items-center gap-1 text-xs">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: COLORS[i % COLORS.length] }}
                />
                <span style={{ color: 'var(--text-secondary)' }}>
                  {item.name} ({item.value}%)
                </span>
              </div>
            ))}
          </div>
        </ChartCard>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Shipping Lanes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topLanes.map((lane) => (
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
                      ${formatCompact(lane.revenue)}
                    </span>
                    <span className="text-xs ml-2 text-green-600">{lane.margin}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <ChartCard title="Monthly Shipment Volume" height={240}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyVolume}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="month" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <YAxis
                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                tickFormatter={(v) => formatNumber(v / 1000, 0)}
              />
              <Tooltip
                formatter={(v) => [Number(v).toLocaleString(), 'Shipments']}
                contentStyle={{
                  background: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 8,
                }}
              />
              <Bar dataKey="shipments" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>
    </main>
  );
}

export default LogisticsDashboardPage;

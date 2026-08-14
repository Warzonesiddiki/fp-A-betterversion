import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ChartCard } from '@/components/ui/ChartCard';
import { KPIValue } from '@/components/ui/KPIValue';
import { Wifi, Users, DollarSign, Signal, TrendingUp, BarChart3 } from 'lucide-react';
import { useTelecomStore } from '@/store/telecomStore';
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
import { PageHeader } from '@/components/ui/PageHeader';

const COLORS = [
  'var(--accent-primary)',
  'var(--accent-secondary)',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
];

const revenueBySegment = [
  { name: 'Mobile', value: 48.2 },
  { name: 'Broadband', value: 22.6 },
  { name: 'Enterprise', value: 18.4 },
  { name: 'IoT', value: 6.1 },
  { name: 'Content/Media', value: 4.7 },
];

const capexDistribution = [
  { name: 'Network Infrastructure', value: 38 },
  { name: 'Spectrum', value: 22 },
  { name: '5G Rollout', value: 20 },
  { name: 'IT Systems', value: 12 },
  { name: 'Customer Equipment', value: 8 },
];

const subscriberGrowth = [
  { quarter: 'Q1 2024', subscribers: 82.4 },
  { quarter: 'Q2 2024', subscribers: 84.1 },
  { quarter: 'Q3 2024', subscribers: 86.3 },
  { quarter: 'Q4 2024', subscribers: 88.7 },
  { quarter: 'Q1 2025', subscribers: 90.2 },
  { quarter: 'Q2 2025', subscribers: 92.5 },
];

export function TelecomDashboardPage() {
  const [_activeSegment, setActiveSegment] = useState<string | null>(null);
  const { arpuTrends, getTotalSubscribers, getAverageARPU } = useTelecomStore();

  const totalSubscribers = getTotalSubscribers();
  const avgARPU = getAverageARPU();
  // WIRED (C-3): ARPU trend straight from telecomStore — no fabricated
  // fallback; the panel renders an honest empty state until data is imported.
  const displayArpuTrend = arpuTrends.map((t) => ({ month: t.month, arpu: t.arpu }));

  useEffect(() => {
    document.title = 'FinPlan Pro — Telecom Dashboard';
  }, []);

  const kpis = useMemo(
    () => [
      {
        label: 'Total Subscribers',
        value: totalSubscribers > 0 ? `${formatCompact(totalSubscribers)}` : '—',
        change: 2.5,
        icon: Users,
      },
      {
        label: 'ARPU',
        value: avgARPU > 0 ? `$${formatNumber(avgARPU, 2)}` : '—',
        change: 1.8,
        icon: DollarSign,
      },
      { label: 'Churn Rate', value: '1.4%', change: -0.3, icon: Signal },
      { label: 'Network CapEx', value: '$4.8B', change: 12.0, icon: Wifi },
      { label: 'EBITDA Margin', value: '36.2%', change: 1.1, icon: TrendingUp },
      { label: '5G Coverage', value: '78.5%', change: 8.2, icon: Signal },
      { label: 'Customer Acquisition Cost', value: '$142', change: -5.4, icon: BarChart3 },
    ],
    [totalSubscribers, avgARPU]
  );

  return (
    <main className="p-6 space-y-6" role="main" aria-label="Telecom Sector Dashboard">
      <PageHeader
        title="Telecom Dashboard"
        purpose="Subscriber metrics, ARPU trends, network investment, and segment performance"
      />

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KPIValue key={kpi.label} label={kpi.label} value={kpi.value} change={kpi.change} />
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Revenue by Segment ($B)" height={280}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueBySegment} onMouseLeave={() => setActiveSegment(null)}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 8,
                }}
              />
              <Bar
                dataKey="value"
                radius={[4, 4, 0, 0]}
                onMouseEnter={(_, index) => setActiveSegment(revenueBySegment![index]!.name)}
              >
                {revenueBySegment.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="CapEx Distribution (%)" height={280}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={capexDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                label={({ name, percent }) => `${name} ${formatPercent(percent ?? 0, 0)}`}
              >
                {capexDistribution.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Subscriber Growth (Millions)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {subscriberGrowth.map((row) => (
                <div key={row.quarter} className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {row.quarter}
                  </span>
                  <div className="flex items-center gap-3">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${(row.subscribers / 95) * 120}px`,
                        backgroundColor: 'var(--accent-primary)',
                      }}
                    />
                    <span className="font-mono text-sm w-14 text-right">
                      {formatNumber(row.subscribers / 1_000_000, 1)}M
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue per User Trend (Monthly ARPU)</CardTitle>
          </CardHeader>
          <CardContent>
            {displayArpuTrend.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Import subscriber data to view the ARPU trend.
              </p>
            ) : (
              <div className="space-y-2">
                {displayArpuTrend.map((row) => (
                  <div key={row.month} className="flex justify-between items-center">
                    <span className="text-sm w-10" style={{ color: 'var(--text-secondary)' }}>
                      {row.month}
                    </span>
                    <div className="flex-1 mx-3">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${((row.arpu - 40) / 6) * 100}%`,
                          backgroundColor: 'var(--accent-secondary)',
                        }}
                      />
                    </div>
                    <span className="font-mono text-sm w-14 text-right">
                      ${formatNumber(row.arpu, 2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

export default TelecomDashboardPage;

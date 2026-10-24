import { useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ChartCard } from '@/components/ui/ChartCard';
import { KPIValue } from '@/components/ui/KPIValue';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Wifi, Users, DollarSign, Signal, ShieldAlert } from 'lucide-react';
import { useTelecomStore } from '@/store/telecomStore';
import { reportingCurrency } from '@/store/financialContextStore';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { currencyFormatter, formatNumber } from '@/utils/financialFormatting';
import { PageHeader } from '@/components/ui/PageHeader';
import { deriveTelecomDashboard } from './telecomDashboardData';

function formatArpu(value: number | null): string {
  if (value === null) return '—';
  return currencyFormatter(reportingCurrency(), { minDecimals: 2 })(value);
}

const networkColumns: Column[] = [
  { key: 'region', header: 'Region', sortable: true },
  { key: 'uptime', header: 'Uptime %', align: 'right', render: (v) => formatNumber(Number(v), 2) },
  {
    key: 'avgSpeed',
    header: 'Avg Speed (Mbps)',
    align: 'right',
    render: (v) => formatNumber(Number(v), 1),
  },
  {
    key: 'subscribers',
    header: 'Subscribers',
    align: 'right',
    render: (v) => formatNumber(Number(v)),
  },
];

export function TelecomDashboardPage() {
  const { subscribers, networkMetrics, arpuTrends } = useTelecomStore();

  useEffect(() => {
    document.title = 'FinPlan Pro — Telecom Dashboard';
  }, []);

  const data = useMemo(
    () => deriveTelecomDashboard(subscribers, networkMetrics, arpuTrends),
    [subscribers, networkMetrics, arpuTrends]
  );

  if (!data) {
    return (
      <main
        className="p-12 text-center max-w-md mx-auto"
        role="main"
        aria-label="Telecom Sector Dashboard"
      >
        <Wifi className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" />
        <h1 className="text-xl font-semibold mb-2">No Telecom Data</h1>
        <p className="text-[var(--text-muted)]">
          Import subscriber records, network metrics or monthly revenue-per-user history to populate
          this dashboard.
        </p>
      </main>
    );
  }

  const kpis = [
    {
      label: 'Active Subscribers',
      value: formatNumber(data.activeSubscribers),
      icon: Users,
    },
    {
      label: 'ARPU',
      value: formatArpu(data.arpu),
      icon: DollarSign,
    },
    {
      label: 'High Churn Risk',
      value: formatNumber(data.churnRisk.high),
      icon: Signal,
    },
  ];

  return (
    <main className="p-6 space-y-6" role="main" aria-label="Telecom Sector Dashboard">
      <PageHeader
        title="Telecom Dashboard"
        purpose="Recorded subscriber, ARPU and network metrics only — no industry placeholders"
      />

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <KPIValue key={kpi.label} label={kpi.label} value={kpi.value} />
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Monthly ARPU (recorded)" height={280}>
          {data.arpuTrends.length === 0 ? (
            <p className="text-sm p-4" style={{ color: 'var(--text-secondary)' }}>
              No ARPU history recorded yet.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.arpuTrends as unknown as Record<string, unknown>[]}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                <Tooltip />
                <Bar
                  dataKey="arpu"
                  name="ARPU"
                  fill="var(--accent-primary)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Subscriber History (recorded)" height={280}>
          {data.subscriberHistory.length === 0 ? (
            <p className="text-sm p-4" style={{ color: 'var(--text-secondary)' }}>
              No subscriber history recorded yet.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.subscriberHistory as unknown as Record<string, unknown>[]}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                <Tooltip />
                <Bar
                  dataKey="subscribers"
                  name="Subscribers"
                  fill="var(--accent-secondary)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Churn Risk Mix (active subscribers)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(
              [
                ['Low', data.churnRisk.low],
                ['Medium', data.churnRisk.medium],
                ['High', data.churnRisk.high],
              ] as const
            ).map(([label, count]) => (
              <div key={label} className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>{label} risk</span>
                <span className="font-mono">{formatNumber(count)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Network by Region (recorded)</CardTitle>
          </CardHeader>
          <CardContent>
            {data.networkMetrics.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                No network metrics recorded yet.
              </p>
            ) : (
              <DataTable
                columns={networkColumns}
                data={data.networkMetrics.map((m) => ({ ...m }))}
                caption="Recorded network uptime, speed and subscribers by region"
                ariaLabel="Network metrics by region"
              />
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            Not shown on this dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Segment revenue, network capital expenditure, realized churn rate, EBITDA margin,
            coverage and customer-acquisition cost are not recorded in this workspace, so no figure
            is displayed for them. Record the underlying data to surface those metrics.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

export default TelecomDashboardPage;

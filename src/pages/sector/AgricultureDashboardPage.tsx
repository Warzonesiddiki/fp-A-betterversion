import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { agricultureConfig } from '@/config/sectors/agriculture';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { Wheat } from 'lucide-react';
import { sumMoney, roundTo } from '@/utils/money';
import { formatPercent } from '@/utils/financialFormatting';
import { PageHeader } from '@/components/ui/PageHeader';

export default function AgricultureDashboardPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Agriculture Dashboard';
  }, []);

  const stats = useMemo(() => {
    const revenue = roundTo(
      sumMoney(entries.filter((e) => e.credit > e.debit).map((e) => e.credit)),
      2
    );
    const costs = roundTo(
      sumMoney(entries.filter((e) => e.debit > e.credit).map((e) => e.debit)),
      2
    );
    const margin = revenue > 0 ? ((revenue - costs) / revenue) * 100 : 0;
    return { revenue, costs, margin };
  }, [entries]);

  const kpis = agricultureConfig.defaultKPIs;

  if (entries.length === 0) {
    return (
      <main className="p-12 text-center" role="main" aria-label="Agriculture Dashboard - No Data">
        <Wheat className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" />
        <h1 className="text-xl font-semibold mb-2">Agriculture — No Data</h1>
        <p className="text-[var(--text-muted)] mb-6">Import GL data to view agriculture KPIs.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6" role="main">
      <PageHeader
        title="Agriculture Dashboard"
        purpose="Crop production, livestock, and agribusiness metrics"
      />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KPIValue
            key={kpi.id}
            label={kpi.label}
            value={formatCurrency(kpi.target * 0.92)}
            change={-4}
          />
        ))}
      </section>

      <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KPIValue label="Revenue" value={formatCurrency(stats.revenue)} />
        <KPIValue label="Costs" value={formatCurrency(stats.costs)} />
        <KPIValue label="Margin" value={`${formatPercent(stats.margin, 1)}`} />
        <KPIValue label="Entries" value={formatNumber(entries.length)} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Crop Production</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Yield per Hectare</span>
                <span className="font-mono">8.5 tons</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Revenue per Acre</span>
                <span className="font-mono">{formatCurrency(4600)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Water Usage</span>
                <span className="font-mono text-blue-600">4,200 m3</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Equipment Utilization</span>
                <span className="font-mono text-green-600">78%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Livestock & Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Labor Cost %</span>
                <span className="font-mono">22%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Cost per Unit</span>
                <span className="font-mono">{formatCurrency(95)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Gross Margin</span>
                <span className="font-mono text-green-600">33%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Active Farms</span>
                <span className="font-mono">8</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

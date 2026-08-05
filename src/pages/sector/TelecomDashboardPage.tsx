import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { telecomConfig } from '@/config/sectors/telecom';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { Wifi } from 'lucide-react';
import { sumMoney, roundTo } from '@/utils/money';
import { formatPercent } from '@/utils/financialFormatting';

export function TelecomDashboardPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Telecom Dashboard';
  }, []);

  const stats = useMemo(() => {
    const revenue = roundTo(
      sumMoney(entries.filter((e) => e.credit > e.debit).map((e) => e.credit)),
      2
    );
    const capex = roundTo(
      sumMoney(
        entries
          .filter(
            (e) =>
              e.accountName.toLowerCase().includes('capital') ||
              e.accountName.toLowerCase().includes('capex') ||
              e.accountName.toLowerCase().includes('network')
          )
          .map((e) => e.debit)
      ),
      2
    );
    const opex = roundTo(
      sumMoney(
        entries
          .filter((e) => e.debit > e.credit && !e.accountName.toLowerCase().includes('capital'))
          .map((e) => e.debit)
      ),
      2
    );
    const subscribers = roundTo(
      sumMoney(
        entries
          .filter((e) => e.accountName.toLowerCase().includes('subscriber'))
          .map((e) => e.credit)
      ),
      2
    );
    return { revenue, capex, opex, subscribers };
  }, [entries]);

  const kpis = telecomConfig.defaultKPIs;

  if (entries.length === 0) {
    return (
      <main className="p-12 text-center" role="main" aria-label="Telecom Dashboard - No Data">
        <Wifi className="h-10 w-10 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Telecom — No Data</h2>
        <p className="text-slate-400 mb-6">Import GL data to view telecom KPIs.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6" role="main">
      <h1 className="text-2xl font-bold">Telecom Dashboard</h1>
      <p className="text-sm text-slate-400">ARPU, churn, subscriber growth, and network metrics</p>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KPIValue
            key={kpi.id}
            label={kpi.label}
            value={formatCurrency(kpi.target * 0.95)}
            change={-1}
          />
        ))}
      </section>

      <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KPIValue label="Total Revenue" value={formatCurrency(stats.revenue)} />
        <KPIValue label="Network CapEx" value={formatCurrency(stats.capex)} />
        <KPIValue label="Operating Expenses" value={formatCurrency(stats.opex)} />
        <KPIValue label="Entries" value={formatNumber(entries.length)} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Subscriber Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">ARPU</span>
                <span className="font-mono">$42.80</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Churn Rate</span>
                <span className="font-mono text-red-600">1.8%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Subscriber Growth</span>
                <span className="font-mono text-green-600">+3.2%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Subscriber Acquisition Cost</span>
                <span className="font-mono">{formatCurrency(185)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Network &amp; Financial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Network Utilization</span>
                <span className="font-mono">78.4%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">CAPEX / Revenue</span>
                <span className="font-mono">
                  {stats.revenue > 0
                    ? `${formatPercent((stats.capex / stats.revenue) * 100, 1)}`
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Avg Data Usage (GB)</span>
                <span className="font-mono">16.8</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">EBITDA Per User</span>
                <span className="font-mono text-green-600">$11.40</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

export default TelecomDashboardPage;

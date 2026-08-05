import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { governmentConfig } from '@/config/sectors/government';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { Building2 } from 'lucide-react';
import { sumMoney, roundTo } from '@/utils/money';

export function GovernmentDashboardPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Government Dashboard';
  }, []);

  const stats = useMemo(() => {
    const fundBalance = roundTo(
      sumMoney(
        entries
          .filter((e) => e.accountName.toLowerCase().includes('fund'))
          .map((e) => e.credit - e.debit)
      ),
      2
    );
    const revenue = roundTo(
      sumMoney(entries.filter((e) => e.credit > e.debit).map((e) => e.credit)),
      2
    );
    const expenses = roundTo(
      sumMoney(entries.filter((e) => e.debit > e.credit).map((e) => e.debit)),
      2
    );
    const grants = roundTo(
      sumMoney(
        entries
          .filter((e) => e.accountName.toLowerCase().includes('grant') && e.debit > 0)
          .map((e) => e.debit)
      ),
      2
    );
    return { fundBalance, revenue, expenses, grants };
  }, [entries]);

  const kpis = governmentConfig.defaultKPIs;

  if (entries.length === 0) {
    return (
      <main className="p-12 text-center" role="main" aria-label="Government Dashboard - No Data">
        <Building2 className="h-10 w-10 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Government — No Data</h2>
        <p className="text-slate-400 mb-6">Import GL data to view government KPIs.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6" role="main">
      <h1 className="text-2xl font-bold">Government Dashboard</h1>
      <p className="text-sm text-slate-400">
        Budget execution, public services, and compliance metrics
      </p>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KPIValue
            key={kpi.id}
            label={kpi.label}
            value={formatCurrency(kpi.target * 0.93)}
            change={-1}
          />
        ))}
      </section>

      <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KPIValue label="Fund Balance" value={formatCurrency(stats.fundBalance)} />
        <KPIValue label="Total Revenue" value={formatCurrency(stats.revenue)} />
        <KPIValue label="Total Expenses" value={formatCurrency(stats.expenses)} />
        <KPIValue label="Entries" value={formatNumber(entries.length)} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Budget &amp; Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Budget Utilization</span>
                <span className="font-mono text-green-600">93.7%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Grant Compliance Rate</span>
                <span className="font-mono text-green-600">96.2%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Procurement Cycle (Days)</span>
                <span className="font-mono">42</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Compliance Audit Score</span>
                <span className="font-mono text-green-600">98.5%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Public Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Cost Per Citizen Served</span>
                <span className="font-mono">{formatCurrency(420)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Service Efficiency Score</span>
                <span className="font-mono">8.2 / 10</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Capital Project Spend</span>
                <span className="font-mono">{formatCurrency(stats.expenses * 0.18)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Debt Ratio</span>
                <span className="font-mono">0.42</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

export default GovernmentDashboardPage;

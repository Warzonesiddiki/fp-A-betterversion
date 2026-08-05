import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { insuranceConfig } from '@/config/sectors/insurance';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { Shield } from 'lucide-react';
import { sumMoney, roundTo, divideMoney } from '@/utils/money';
import { formatPercent } from '@/utils/financialFormatting';

export default function InsuranceDashboardPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Insurance Dashboard';
  }, []);

  const stats = useMemo(() => {
    const revenue = roundTo(
      sumMoney(entries.filter((e) => e.credit > e.debit).map((e) => e.credit)),
      2
    );
    const claims = roundTo(
      sumMoney(
        entries.filter((e) => e.accountName.toLowerCase().includes('claim')).map((e) => e.debit)
      ),
      2
    );
    const expenses = roundTo(
      sumMoney(
        entries
          .filter((e) => e.debit > e.credit && !e.accountName.toLowerCase().includes('claim'))
          .map((e) => e.debit)
      ),
      2
    );
    const lossRatio = revenue > 0 ? roundTo(divideMoney(claims, revenue).times(100), 2) : 0;
    const expenseRatio = revenue > 0 ? roundTo(divideMoney(expenses, revenue).times(100), 2) : 0;
    return {
      revenue,
      claims,
      expenses,
      lossRatio,
      expenseRatio,
      combinedRatio: lossRatio + expenseRatio,
    };
  }, [entries]);

  const kpis = insuranceConfig.defaultKPIs;

  if (entries.length === 0) {
    return (
      <main className="p-12 text-center" role="main" aria-label="Insurance Dashboard - No Data">
        <Shield className="h-10 w-10 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Insurance — No Data</h2>
        <p className="text-slate-400 mb-6">Import GL data to view insurance KPIs.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6" role="main">
      <h1 className="text-2xl font-bold">Insurance Dashboard</h1>
      <p className="text-sm text-slate-400">Underwriting and claims metrics</p>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KPIValue
            key={kpi.id}
            label={kpi.label}
            value={formatCurrency(kpi.target * 0.9)}
            change={-5}
          />
        ))}
      </section>

      <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KPIValue label="GWP" value={formatCurrency(stats.revenue)} />
        <KPIValue label="Claims Paid" value={formatCurrency(stats.claims)} />
        <KPIValue label="Combined Ratio" value={`${formatPercent(stats.combinedRatio, 1)}`} />
        <KPIValue label="Loss Ratio" value={`${formatPercent(stats.lossRatio, 1)}`} />
        <KPIValue label="Expense Ratio" value={`${formatPercent(stats.expenseRatio, 1)}`} />
        <KPIValue label="Accounts" value={formatNumber(entries.length)} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Underwriting Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Loss Ratio</span>
                <span
                  className={`font-mono ${stats.lossRatio < 65 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {formatPercent(stats.lossRatio, 1)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Expense Ratio</span>
                <span className="font-mono">{formatPercent(stats.expenseRatio, 1)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Combined Ratio</span>
                <span
                  className={`font-mono ${stats.combinedRatio < 100 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {formatPercent(stats.combinedRatio, 1)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Retention Rate</span>
                <span className="font-mono text-green-600">92.4%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Claims Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Total Claims</span>
                <span className="font-mono">{formatCurrency(stats.claims)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Avg Claim Size</span>
                <span className="font-mono">
                  {formatCurrency(stats.claims / Math.max(entries.length, 1))}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Claim Frequency</span>
                <span className="font-mono">3.2%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Settlement Ratio</span>
                <span className="font-mono">88.5%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

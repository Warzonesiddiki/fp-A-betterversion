import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { educationConfig } from '@/config/sectors/education';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { GraduationCap } from 'lucide-react';

export function EducationDashboardPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Education Dashboard';
  }, []);

  const stats = useMemo(() => {
    const tuitionRevenue = entries
      .filter((e) => e.accountName.toLowerCase().includes('tuition') && e.credit > 0)
      .reduce((s, e) => s + e.credit, 0);
    const grantIncome = entries
      .filter(
        (e) =>
          (e.accountName.toLowerCase().includes('grant') ||
            e.accountName.toLowerCase().includes('research')) &&
          e.credit > 0
      )
      .reduce((s, e) => s + e.credit, 0);
    const expenses = entries.filter((e) => e.debit > e.credit).reduce((s, e) => s + e.debit, 0);
    const endowment = entries
      .filter((e) => e.accountName.toLowerCase().includes('endowment'))
      .reduce((s, e) => s + e.credit, 0);
    return { tuitionRevenue, grantIncome, expenses, endowment };
  }, [entries]);

  const kpis = educationConfig.defaultKPIs;

  if (entries.length === 0) {
    return (
      <main className="p-12 text-center" role="main" aria-label="Education Dashboard - No Data">
        <GraduationCap className="h-10 w-10 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Education — No Data</h2>
        <p className="text-slate-400 mb-6">Import GL data to view education KPIs.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6" role="main">
      <h1 className="text-2xl font-bold">Education Dashboard</h1>
      <p className="text-sm text-slate-400">Enrollment, retention, and research funding metrics</p>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KPIValue
            key={kpi.id}
            label={kpi.label}
            value={formatCurrency(kpi.target * 0.91)}
            change={-2}
          />
        ))}
      </section>

      <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KPIValue label="Tuition Revenue" value={formatCurrency(stats.tuitionRevenue)} />
        <KPIValue label="Grant Income" value={formatCurrency(stats.grantIncome)} />
        <KPIValue label="Total Expenses" value={formatCurrency(stats.expenses)} />
        <KPIValue label="Entries" value={formatNumber(entries.length)} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Enrollment &amp; Retention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Enrollment Rate</span>
                <span className="font-mono text-green-500">94.2%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Student Retention Rate</span>
                <span className="font-mono">88.0%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Graduation Rate</span>
                <span className="font-mono text-green-500">76.5%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Faculty to Student Ratio</span>
                <span className="font-mono">1:15</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Financial Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Tuition Revenue</span>
                <span className="font-mono">{formatCurrency(stats.tuitionRevenue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Grant Utilization</span>
                <span className="font-mono text-green-500">87.3%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Endowment Return</span>
                <span className="font-mono text-green-500">8.2%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Cost Per Student</span>
                <span className="font-mono">{formatCurrency(stats.expenses / 12500)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

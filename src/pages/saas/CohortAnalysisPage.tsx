import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { Download, BarChart4, Users, TrendingDown, DollarSign } from 'lucide-react';
import { ExportEngine } from '@/engines/ExportEngine';
import { sumMoney, roundTo } from '@/utils/money';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { reportExportFailure } from '@/utils/exportErrorHandler';
import { formatPercent } from '@/utils/financialFormatting';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
function formatPct(n: number): string {
  return `${formatPercent(n, 1)}`;
}

const COHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

function buildRetentionMatrix() {
  return COHORT_MONTHS.map((month, i) => {
    const base = 100 - i * 3;
    const row: Record<string, string | number> = { cohort: `${month} 2026` };
    for (let m = 0; m <= 5 - i; m++) {
      row[`M${m}`] = Math.max(40, base - m * (5 + i));
    }
    return row;
  });
}

function buildCohortSizes() {
  return COHORT_MONTHS.map((month, i) => ({
    month,
    size: 120 + ((i * 37) % 80) - i * 10,
  }));
}

export default function CohortAnalysisPage() {
  const fmt = useCurrencyFormatter();
  const { entries } = useGLStore();
  const navigate = useNavigate();
  useEffect(() => {
    document.title = 'FinPlan Pro — Cohort Analysis';
  }, []);

  const retentionMatrix = useMemo(() => buildRetentionMatrix(), []);
  const cohortSizes = useMemo(() => buildCohortSizes(), []);

  const metrics = useMemo(() => {
    const totalCustomers = cohortSizes.reduce((s, c) => s + c.size, 0);
    const avgRetention =
      retentionMatrix.reduce((s, row) => {
        const vals = Object.values(row).filter((v): v is number => typeof v === 'number');
        return s + (vals.length > 0 ? vals[vals.length - 1] : 0)!;
      }, 0) / retentionMatrix.length;
    const avgChurn = 100 - avgRetention;
    const avgRevPerCohort =
      entries.length > 0
        ? roundTo(
            sumMoney(entries.map((e) => Math.abs((e.debit ?? 0) - (e.credit ?? 0)))).toNumber() /
              cohortSizes.length,
            2
          )
        : 250000;
    return { totalCustomers, avgRetention, avgChurn, avgRevPerCohort };
  }, [retentionMatrix, cohortSizes, entries]);

  const handleExport = () => {
    void ExportEngine.exportToPDF(
      {
        headers: ['Cohort', 'Size', 'M0 Retention', 'Final Retention'],
        rows: retentionMatrix.map((row) => [
          row.cohort!,
          cohortSizes.find((c) => c.month === String(row.cohort).split(' ')[0])?.size || 0,
          `${row.M0 || 100}%`,
          `${
            Object.values(row)
              .filter((v): v is number => typeof v === 'number')
              .pop()! || 0
          }%`,
        ]) as (string | number | boolean | null)[][],
      },
      { title: 'Cohort Retention Analysis' }
    ).catch(reportExportFailure);
  };

  if (entries.length === 0)
    return (
      <div className="p-12 text-center">
        <BarChart4 className="h-10 w-10 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No SaaS Data</h2>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cohort Analysis</h1>
          <p className="text-sm text-slate-400">Customer retention by monthly cohort</p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <KPIValue
          label="Total Customers"
          value={metrics.totalCustomers.toLocaleString()}
          icon={<Users className="h-4 w-4" />}
        />
        <KPIValue
          label="Avg Retention"
          value={formatPct(metrics.avgRetention)}
          icon={<TrendingDown className="h-4 w-4" />}
          trend="up"
        />
        <KPIValue
          label="Avg Churn"
          value={formatPct(metrics.avgChurn)}
          icon={<TrendingDown className="h-4 w-4" />}
          trend="down"
        />
        <KPIValue
          label="Avg Revenue / Cohort"
          value={fmt.currency0(metrics.avgRevPerCohort)}
          icon={<DollarSign className="h-4 w-4" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cohort Size</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={cohortSizes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: 8,
                }}
              />
              <Bar dataKey="size" name="Customers" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Retention Matrix (%)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="SaaS cohort analysis">
              <caption className="sr-only">Detailed breakdown of saas cohort analysis</caption>
              <thead>
                <tr className="border-b border-slate-700">
                  <th scope="col" className="text-left py-2 px-3 text-slate-400 font-medium">
                    Cohort
                  </th>
                  {Array.from({ length: 6 }, (_, i) => (
                    <th
                      key={i}
                      className="text-center py-2 px-3 text-slate-400 font-medium"
                      scope="col"
                    >
                      M{i}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {retentionMatrix.map((row) => (
                  <tr key={String(row.cohort)} className="border-b border-slate-800">
                    <td className="py-2 px-3 font-medium">{String(row.cohort)}</td>
                    {Array.from({ length: 6 }, (_, i) => {
                      const val = row[`M${i}`];
                      const numVal = typeof val === 'number' ? val : null;
                      const bg =
                        numVal !== null
                          ? numVal >= 80
                            ? 'bg-green-900/40 text-green-300'
                            : numVal >= 60
                              ? 'bg-yellow-900/40 text-yellow-300'
                              : 'bg-red-900/40 text-red-300'
                          : 'text-slate-600';
                      return (
                        <td key={i} className={`text-center py-2 px-3 rounded ${bg}`}>
                          {numVal !== null ? `${numVal}%` : '—'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

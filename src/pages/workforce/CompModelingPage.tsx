import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { Download, BarChart3, DollarSign, Users, TrendingUp } from 'lucide-react';
import { ExportEngine } from '@/engines/ExportEngine';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { reportExportFailure } from '@/utils/exportErrorHandler';
import { roundTo, sumMoney, multiplyMoney, subtractMoney } from '@/utils/money';
import { formatCompact } from '@/utils/financialFormatting';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { useWorkforceStore } from '@/store/workforceStore';
import { useShallow } from 'zustand/react/shallow';
import { derivePositionComp, applyMeritIncrease } from './compModelData';

export default function CompModelingPage() {
  const fmt = useCurrencyFormatter();
  const employees = useWorkforceStore(useShallow((s) => s.employees));
  const navigate = useNavigate();
  const [meritPct, setMeritPct] = useState(3.5);
  useEffect(() => {
    document.title = 'FinPlan Pro — Compensation Modeling';
  }, []);

  // Phase 10 decontamination: every figure derives from ACTUAL active
  // employees in the workforce store. The previous hardcoded LEVELS
  // table (invented bands, headcounts and performance ratings) is gone.
  const compData = useMemo(
    () => applyMeritIncrease(derivePositionComp(employees ?? []), meritPct),
    [employees, meritPct]
  );

  const projections = useMemo(() => {
    const years = [2026, 2027, 2028, 2029, 2030];
    const currentSum = roundTo(sumMoney(compData.map((l) => l.totalCost)), 2);
    const newSum = roundTo(sumMoney(compData.map((l) => l.newCost)), 2);
    return years.map((year, i) => ({
      year: String(year),
      current: multiplyMoney(currentSum, Math.pow(1 + meritPct / 100, i)).toNumber(),
      projected: multiplyMoney(newSum, Math.pow(1 + meritPct / 100, i)).toNumber(),
    }));
  }, [compData, meritPct]);

  const totals = useMemo(() => {
    const currentTotal = roundTo(sumMoney(compData.map((l) => l.totalCost)), 2);
    const newTotal = roundTo(sumMoney(compData.map((l) => l.newCost)), 2);
    return {
      currentTotal,
      newTotal,
      budgetImpact: roundTo(subtractMoney(newTotal, currentTotal)),
      totalHeadcount: compData.reduce((s, l) => s + l.headcount, 0),
    };
  }, [compData]);

  const handleExport = () => {
    void ExportEngine.exportToExcel(
      {
        headers: [
          'Position',
          'Headcount',
          'Min Salary',
          'Max Salary',
          'Avg Salary',
          'Current Cost',
          'New Cost',
          'Increase',
        ],
        rows: compData.map((l) => [
          l.position,
          l.headcount,
          l.minSalary,
          l.maxSalary,
          l.avgSalary,
          l.totalCost,
          l.newCost,
          l.increase,
        ]),
      },
      { title: 'Compensation_Model' }
    ).catch(reportExportFailure);
  };

  if (compData.length === 0)
    return (
      <main className="p-12 text-center" role="main" aria-label="Compensation Modeling - No Data">
        <BarChart3 className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" aria-hidden="true" />
        <h1 className="text-xl font-semibold mb-2">No Compensation Data</h1>
        <p className="text-[var(--text-muted)] mb-6 max-w-md mx-auto">
          Compensation modelling derives from your actual workforce records. Add active employees
          with positions and salaries in Workforce Planning to model merit scenarios — no sample
          bands are shown.
        </p>
        <Button onClick={() => navigate('/workforce/headcount')}>Open Workforce Planning</Button>
      </main>
    );

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Compensation Modeling"
        purpose="Model merit increases and budget impact"
        actions={
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <KPIValue
          label="Total Headcount"
          value={totals.totalHeadcount.toString()}
          icon={<Users className="h-4 w-4" />}
        />
        <KPIValue
          label="Current Total Comp"
          value={fmt.currency0(totals.currentTotal)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KPIValue
          label="Budget Impact"
          value={fmt.currency0(totals.budgetImpact)}
          icon={<TrendingUp className="h-4 w-4" />}
          trend="down"
        />
        <KPIValue
          label="Merit Increase"
          value={`${meritPct}%`}
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Merit Increase: {meritPct}%</CardTitle>
        </CardHeader>
        <CardContent>
          <input
            type="range"
            min={0}
            max={10}
            step={0.5}
            value={meritPct}
            onChange={(e) => setMeritPct(parseFloat(e.target.value))}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
            <span>0%</span>
            <span>5%</span>
            <span>10%</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Compensation by Position</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Compensation modeling scenarios">
              <caption className="sr-only">
                Detailed breakdown of compensation modeling scenarios
              </caption>
              <thead>
                <tr className="border-b border-slate-700">
                  <th
                    scope="col"
                    className="text-left py-2 px-3 text-[var(--text-muted)] font-medium"
                  >
                    Position
                  </th>
                  <th
                    scope="col"
                    className="text-right py-2 px-3 text-[var(--text-muted)] font-medium"
                  >
                    HC
                  </th>
                  <th
                    scope="col"
                    className="text-right py-2 px-3 text-[var(--text-muted)] font-medium"
                  >
                    Band
                  </th>
                  <th
                    scope="col"
                    className="text-right py-2 px-3 text-[var(--text-muted)] font-medium"
                  >
                    Current Cost
                  </th>
                  <th
                    scope="col"
                    className="text-right py-2 px-3 text-[var(--text-muted)] font-medium"
                  >
                    New Cost
                  </th>
                  <th
                    scope="col"
                    className="text-right py-2 px-3 text-[var(--text-muted)] font-medium"
                  >
                    Increase
                  </th>
                </tr>
              </thead>
              <tbody>
                {compData.map((l) => (
                  <tr key={l.position} className="border-b border-slate-800">
                    <td className="py-2 px-3 font-medium">{l.position}</td>
                    <td className="text-right py-2 px-3">{l.headcount}</td>
                    <td className="text-right py-2 px-3">
                      {fmt.currency0(l.minSalary)} – {fmt.currency0(l.maxSalary)}
                    </td>
                    <td className="text-right py-2 px-3">{fmt.currency0(l.totalCost)}</td>
                    <td className="text-right py-2 px-3 text-blue-400">
                      {fmt.currency0(l.newCost)}
                    </td>
                    <td className="text-right py-2 px-3 text-green-400">
                      +{fmt.currency0(l.increase)}
                    </td>
                  </tr>
                ))}
                <tr className="font-bold border-t border-slate-600">
                  <td className="py-2 px-3">Total</td>
                  <td className="text-right py-2 px-3">{totals.totalHeadcount}</td>
                  <td className="text-right py-2 px-3">—</td>
                  <td className="text-right py-2 px-3">{fmt.currency0(totals.currentTotal)}</td>
                  <td className="text-right py-2 px-3 text-blue-400">
                    {fmt.currency0(totals.newTotal)}
                  </td>
                  <td className="text-right py-2 px-3 text-green-400">
                    +{fmt.currency0(totals.budgetImpact)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5-Year Cost Projection</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={projections}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="year" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" tickFormatter={(v) => `$${formatCompact(v)}`} />
              <Tooltip
                contentStyle={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: 8,
                }}
                formatter={(v) => fmt.currency0(Number(v))}
              />
              <Legend />
              <Line dataKey="current" name="Current Path" stroke="#64748b" strokeDasharray="5 5" />
              <Line dataKey="projected" name="With Merit" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

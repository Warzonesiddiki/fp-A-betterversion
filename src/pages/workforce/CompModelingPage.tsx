import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
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
import {
  roundTo,
  sumMoney,
  multiplyMoney,
  addMoney,
  subtractMoney,
  divideMoney,
} from '@/utils/money';
import { formatCompact } from '@/utils/financialFormatting';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
const LEVELS = [
  { level: 'Junior', min: 50000, max: 75000, headcount: 45, avgPerf: 3.2 },
  { level: 'Mid', min: 75000, max: 110000, headcount: 80, avgPerf: 3.5 },
  { level: 'Senior', min: 110000, max: 160000, headcount: 55, avgPerf: 3.8 },
  { level: 'Staff', min: 160000, max: 220000, headcount: 25, avgPerf: 4.0 },
  { level: 'Principal', min: 220000, max: 300000, headcount: 10, avgPerf: 4.2 },
  { level: 'Director', min: 280000, max: 400000, headcount: 8, avgPerf: 4.1 },
];

export default function CompModelingPage() {
  const fmt = useCurrencyFormatter();
  const { entries } = useGLStore();
  const navigate = useNavigate();
  const [meritPct, setMeritPct] = useState(3.5);
  useEffect(() => {
    document.title = 'FinPlan Pro — Compensation Modeling';
  }, []);

  const compData = useMemo(
    () =>
      LEVELS.map((l) => {
        const midpoint = divideMoney(addMoney(l.min, l.max), 2).toNumber();
        const totalCost = multiplyMoney(midpoint, l.headcount).toNumber();
        const newCost = multiplyMoney(totalCost, 1 + meritPct / 100).toNumber();
        return {
          ...l,
          midpoint,
          totalCost,
          newCost,
          increase: roundTo(subtractMoney(newCost, totalCost)),
        };
      }),
    [meritPct]
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
          'Level',
          'Headcount',
          'Min',
          'Max',
          'Midpoint',
          'Current Cost',
          'New Cost',
          'Increase',
        ],
        rows: compData.map((l) => [
          l.level,
          l.headcount,
          l.min,
          l.max,
          l.midpoint,
          l.totalCost,
          l.newCost,
          l.increase,
        ]),
      },
      { title: 'Compensation_Model' }
    ).catch(reportExportFailure);
  };

  if (entries.length === 0)
    return (
      <main className="p-12 text-center" role="main" aria-label="Compensation Modeling - No Data">
        <BarChart3 className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" aria-hidden="true" />
        <h1 className="text-xl font-semibold mb-2">No Compensation Data</h1>
        <p className="text-[var(--text-muted)] mb-6 max-w-md mx-auto">
          Import payroll or general ledger data with compensation accounts to model salary, bonus
          and merit scenarios.
        </p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
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
          <CardTitle>Compensation Bands</CardTitle>
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
                    Level
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
                  <tr key={l.level} className="border-b border-slate-800">
                    <td className="py-2 px-3 font-medium">{l.level}</td>
                    <td className="text-right py-2 px-3">{l.headcount}</td>
                    <td className="text-right py-2 px-3">
                      {fmt.currency0(l.min)} – {fmt.currency0(l.max)}
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

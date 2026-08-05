/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { Download, Leaf, TrendingDown, Target, Factory } from 'lucide-react';
import { ExportEngine } from '@/engines/ExportEngine';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { reportExportFailure } from '@/utils/exportErrorHandler';
import { formatCompact, formatNumber, formatPercent } from '@/utils/financialFormatting';

function formatTons(n: number): string {
  return `${n.toLocaleString()} tCO₂e`;
}

const SCOPE_DATA = [
  { scope: 'Scope 1 (Direct)', current: 12500, target: 10000, prev: 14200 },
  { scope: 'Scope 2 (Energy)', current: 8200, target: 6500, prev: 9100 },
  { scope: 'Scope 3 (Value Chain)', current: 35800, target: 28000, prev: 38500 },
];

const MONTHLY_EMISSIONS = [
  { month: 'Jan', scope1: 1100, scope2: 720, scope3: 3100 },
  { month: 'Feb', scope1: 1050, scope2: 690, scope3: 3000 },
  { month: 'Mar', scope1: 1080, scope2: 710, scope3: 2950 },
  { month: 'Apr', scope1: 1020, scope2: 680, scope3: 2900 },
  { month: 'May', scope1: 980, scope2: 650, scope3: 2850 },
  { month: 'Jun', scope1: 950, scope2: 620, scope3: 2800 },
];

const SOURCES = [
  { source: 'Natural Gas Combustion', scope: 1, tons: 7200, pct: 12.7 },
  { source: 'Company Vehicles', scope: 1, tons: 3800, pct: 6.7 },
  { source: 'Refrigerants', scope: 1, tons: 1500, pct: 2.7 },
  { source: 'Purchased Electricity', scope: 2, tons: 6200, pct: 11.0 },
  { source: 'Purchased Heat/Steam', scope: 2, tons: 2000, pct: 3.5 },
  { source: 'Business Travel', scope: 3, tons: 8500, pct: 15.1 },
  { source: 'Employee Commuting', scope: 3, tons: 4200, pct: 7.4 },
  { source: 'Supply Chain', scope: 3, tons: 18600, pct: 33.0 },
  { source: 'Product End-of-Life', scope: 3, tons: 4500, pct: 8.0 },
];

export default function CarbonDashboardPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();
  useEffect(() => {
    document.title = 'FinPlan Pro — Carbon Dashboard';
  }, []);

  const metrics = useMemo(() => {
    const totalEmissions = SCOPE_DATA.reduce((s, sc) => s + sc.current, 0);
    const totalTarget = SCOPE_DATA.reduce((s, sc) => s + sc.target, 0);
    const totalPrev = SCOPE_DATA.reduce((s, sc) => s + sc.prev, 0);
    const yoyChange = ((totalEmissions - totalPrev) / totalPrev) * 100;
    const targetGap = ((totalEmissions - totalTarget) / totalTarget) * 100;
    const revenue = entries.reduce((s, e) => s + Math.abs(e.debit - e.credit), 0) || 50000000;
    const intensity = totalEmissions / (revenue / 1000000);
    return { totalEmissions, totalTarget, yoyChange, targetGap, intensity };
  }, [entries]);

  const handleExport = () => {
    void ExportEngine.exportToPDF(
      {
        headers: ['Source', 'Scope', 'tCO₂e', '% of Total'],
        rows: SOURCES.map((s) => [s.source, s.scope, s.tons, `${s.pct}%`]),
      },
      { title: 'Carbon Emissions Report' }
    ).catch(reportExportFailure);
  };

  if (entries.length === 0)
    return (
      <div className="p-12 text-center">
        <Leaf className="h-10 w-10 text-green-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Data</h2>
        <p className="text-slate-400 mb-6">Import data to track ESG metrics.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Carbon Dashboard</h1>
          <p className="text-sm text-slate-400">
            Track environmental metrics from your financial data
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <KPIValue
          label="Total Emissions"
          value={formatTons(metrics.totalEmissions)}
          icon={<Leaf className="h-4 w-4" />}
        />
        <KPIValue
          label="YoY Change"
          value={`${formatPercent(metrics.yoyChange, 1)}`}
          icon={<TrendingDown className="h-4 w-4" />}
          trend="down"
        />
        <KPIValue
          label="vs Target"
          value={`${metrics.targetGap > 0 ? '+' : ''}${formatPercent(metrics.targetGap, 1)}`}
          icon={<Target className="h-4 w-4" />}
          trend={metrics.targetGap > 0 ? 'down' : 'up'}
        />
        <KPIValue
          label="Carbon Intensity"
          value={`${formatNumber(metrics.intensity, 0)} tCO₂e/$M`}
          icon={<Factory className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Emissions by Scope</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={SCOPE_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="scope" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={(v) => `${v ? formatCompact(v) : '—'}`} />
                <Tooltip
                  contentStyle={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: 8,
                  }}
                  formatter={(v: any) => formatTons(v)}
                />
                <Legend />
                <Bar dataKey="current" name="Current" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="target" name="Target" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="prev" name="Previous Year" fill="#64748b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Emissions Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={MONTHLY_EMISSIONS}>
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
                <Legend />
                <Area
                  type="monotone"
                  dataKey="scope1"
                  name="Scope 1"
                  stackId="1"
                  fill="#ef4444"
                  fillOpacity={0.6}
                  stroke="#ef4444"
                />
                <Area
                  type="monotone"
                  dataKey="scope2"
                  name="Scope 2"
                  stackId="1"
                  fill="#f59e0b"
                  fillOpacity={0.6}
                  stroke="#f59e0b"
                />
                <Area
                  type="monotone"
                  dataKey="scope3"
                  name="Scope 3"
                  stackId="1"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                  stroke="#3b82f6"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Emission Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Carbon emissions by source and scope">
              <caption className="sr-only">
                Carbon emissions summary showing source, scope, tCO2e, and percentage of total
                emissions
              </caption>
              <thead>
                <tr className="border-b border-slate-700">
                  <th scope="col" className="text-left py-2 px-3 text-slate-400 font-medium">
                    Source
                  </th>
                  <th scope="col" className="text-center py-2 px-3 text-slate-400 font-medium">
                    Scope
                  </th>
                  <th scope="col" className="text-right py-2 px-3 text-slate-400 font-medium">
                    tCO₂e
                  </th>
                  <th scope="col" className="text-right py-2 px-3 text-slate-400 font-medium">
                    % of Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {SOURCES.map((s) => (
                  <tr key={s.source} className="border-b border-slate-800">
                    <td className="py-2 px-3 font-medium">{s.source}</td>
                    <td className="text-center py-2 px-3">
                      <span className="px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-300">
                        {s.scope}
                      </span>
                    </td>
                    <td className="text-right py-2 px-3">{s.tons.toLocaleString()}</td>
                    <td className="text-right py-2 px-3">{s.pct}%</td>
                  </tr>
                ))}
                <tr className="font-bold border-t border-slate-600">
                  <td className="py-2 px-3" colSpan={2}>
                    Total
                  </td>
                  <td className="text-right py-2 px-3">
                    {metrics.totalEmissions.toLocaleString()}
                  </td>
                  <td className="text-right py-2 px-3">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { Download, BarChart3, DollarSign, Users, TrendingUp } from 'lucide-react';
import { ExportEngine } from '@/engines/ExportEngine';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts';

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

const LEVELS = [
  { level: 'Junior', min: 50000, max: 75000, headcount: 45, avgPerf: 3.2 },
  { level: 'Mid', min: 75000, max: 110000, headcount: 80, avgPerf: 3.5 },
  { level: 'Senior', min: 110000, max: 160000, headcount: 55, avgPerf: 3.8 },
  { level: 'Staff', min: 160000, max: 220000, headcount: 25, avgPerf: 4.0 },
  { level: 'Principal', min: 220000, max: 300000, headcount: 10, avgPerf: 4.2 },
  { level: 'Director', min: 280000, max: 400000, headcount: 8, avgPerf: 4.1 },
];

export default function CompModelingPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();
  const [meritPct, setMeritPct] = useState(3.5);
  useEffect(() => {
    document.title = 'FinPlan Pro — Compensation Modeling';
  }, []);

  const compData = useMemo(
    () =>
      LEVELS.map((l) => {
        const midpoint = (l.min + l.max) / 2;
        const totalCost = midpoint * l.headcount;
        const newCost = totalCost * (1 + meritPct / 100);
        return { ...l, midpoint, totalCost, newCost, increase: newCost - totalCost };
      }),
    [meritPct]
  );

  const projections = useMemo(() => {
    const years = [2026, 2027, 2028, 2029, 2030];
    return years.map((year, i) => ({
      year: String(year),
      current: compData.reduce((s, l) => s + l.totalCost, 0) * Math.pow(1 + meritPct / 100, i),
      projected: compData.reduce((s, l) => s + l.newCost, 0) * Math.pow(1 + meritPct / 100, i),
    }));
  }, [compData, meritPct]);

  const totals = useMemo(() => {
    const currentTotal = compData.reduce((s, l) => s + l.totalCost, 0);
    const newTotal = compData.reduce((s, l) => s + l.newCost, 0);
    return {
      currentTotal,
      newTotal,
      budgetImpact: newTotal - currentTotal,
      totalHeadcount: compData.reduce((s, l) => s + l.headcount, 0),
    };
  }, [compData]);

  const handleExport = () => {
    ExportEngine.exportToExcel(
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
    );
  };

  if (entries.length === 0)
    return (
      <div className="p-12 text-center">
        <BarChart3 className="h-10 w-10 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Compensation Data</h2>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Compensation Modeling</h1>
          <p className="text-sm text-slate-400">Model merit increases and budget impact</p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <KPIValue
          label="Total Headcount"
          value={totals.totalHeadcount.toString()}
          icon={<Users className="h-4 w-4" />}
        />
        <KPIValue
          label="Current Total Comp"
          value={formatCurrency(totals.currentTotal)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KPIValue
          label="Budget Impact"
          value={formatCurrency(totals.budgetImpact)}
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
          <div className="flex justify-between text-xs text-slate-400 mt-1">
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
                  <th scope="col" className="text-left py-2 px-3 text-slate-400 font-medium">
                    Level
                  </th>
                  <th scope="col" className="text-right py-2 px-3 text-slate-400 font-medium">
                    HC
                  </th>
                  <th scope="col" className="text-right py-2 px-3 text-slate-400 font-medium">
                    Band
                  </th>
                  <th scope="col" className="text-right py-2 px-3 text-slate-400 font-medium">
                    Current Cost
                  </th>
                  <th scope="col" className="text-right py-2 px-3 text-slate-400 font-medium">
                    New Cost
                  </th>
                  <th scope="col" className="text-right py-2 px-3 text-slate-400 font-medium">
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
                      {formatCurrency(l.min)} – {formatCurrency(l.max)}
                    </td>
                    <td className="text-right py-2 px-3">{formatCurrency(l.totalCost)}</td>
                    <td className="text-right py-2 px-3 text-blue-400">
                      {formatCurrency(l.newCost)}
                    </td>
                    <td className="text-right py-2 px-3 text-green-400">
                      +{formatCurrency(l.increase)}
                    </td>
                  </tr>
                ))}
                <tr className="font-bold border-t border-slate-600">
                  <td className="py-2 px-3">Total</td>
                  <td className="text-right py-2 px-3">{totals.totalHeadcount}</td>
                  <td className="text-right py-2 px-3">—</td>
                  <td className="text-right py-2 px-3">{formatCurrency(totals.currentTotal)}</td>
                  <td className="text-right py-2 px-3 text-blue-400">
                    {formatCurrency(totals.newTotal)}
                  </td>
                  <td className="text-right py-2 px-3 text-green-400">
                    +{formatCurrency(totals.budgetImpact)}
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
              <YAxis stroke="#94a3b8" tickFormatter={(v) => `$${(v / 1000000).toFixed(0)}M`} />
              <Tooltip
                contentStyle={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: 8,
                }}
                formatter={(v: any) => formatCurrency(v)}
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

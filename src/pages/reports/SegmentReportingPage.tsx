import { useState, useMemo } from 'react';


import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KPIValue } from '@/components/ui/KPIValue';
import { ExportEngine } from '@/engines/ExportEngine';
import { SegmentReportingEngine } from '@/engines/SegmentReportingEngine';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { PieChart, Pie } from 'recharts';
import { Layers, TrendingUp, Download } from 'lucide-react';
import { reportExportFailure } from '@/utils/exportErrorHandler';
import { sumMoney, subtractMoney, roundTo } from '@/utils/money';
import { formatCompact, formatPercent } from '@/utils/financialFormatting';;

const COLORS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#F97316',
];

export default function SegmentReportingPage() {
 
 
  const [segmentType, setSegmentType] = useState<'geographic' | 'product' | 'customer'>(
    'geographic'
  );

  const segmentData = useMemo(() => {
    const report = SegmentReportingEngine.getSegmentReport(new Date().toISOString().slice(0, 7));
    return report.map((r) => ({
      name: r.segment.name,
      revenue: r.revenue,
      expenses: r.expenses,
      netIncome: r.netIncome,
      margin: r.margin,
    }));
// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segmentType]);
 

  const totalRevenue = roundTo(sumMoney(segmentData.map((d) => d.revenue)), 2);
  const totalExpenses = roundTo(sumMoney(segmentData.map((d) => d.expenses)), 2);
  const totalNetIncome = roundTo(subtractMoney(totalRevenue, totalExpenses), 2);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Segment Reporting</h1>
          <p className="text-muted-foreground">ASC 280 compliant segment analysis</p>
        </div>
        <div className="flex gap-2">
          {(['geographic', 'product', 'customer'] as const).map((t) => (
            <Button
              key={t}
              variant={segmentType === t ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSegmentType(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void ExportEngine.exportToPDF(
                {
                  headers: ['Segment', 'Revenue', 'Expenses', 'Net Income'],
                  rows: segmentData.map((s) => [s.name, s.revenue, s.expenses, s.netIncome]),
                },
                { title: 'Segment Report' }
              ).catch(reportExportFailure);
            }}
          >
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <KPIValue
              label="Total Revenue"
              value={totalRevenue}
              icon={<TrendingUp className="h-4 w-4" />}
              format="currency"
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <KPIValue
              label="Total Expenses"
              value={totalExpenses}
              icon={<Layers className="h-4 w-4" />}
              format="currency"
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <KPIValue label="Net Income" value={totalNetIncome} format="currency" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Revenue by Segment</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={segmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => `$${formatCompact(Number(v))}`} />
                <Bar dataKey="revenue" name="Revenue">
                  {segmentData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Revenue Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={segmentData}
                  dataKey="revenue"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                >
                  {segmentData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `$${formatCompact(Number(v))}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Segment P&L</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm" aria-label="Segment reporting breakdown">
              <caption className="sr-only">Detailed breakdown of segment reporting breakdown</caption>
            <thead>
              <tr className="border-b border-[var(--border-subtle)]">
                <th scope="col" className="text-left px-3 py-2 text-xs font-medium text-[var(--text-muted)]">
                  Segment
                </th>
                <th scope="col" className="text-right px-3 py-2 text-xs font-medium text-[var(--text-muted)]">
                  Revenue
                </th>
                <th scope="col" className="text-right px-3 py-2 text-xs font-medium text-[var(--text-muted)]">
                  Expenses
                </th>
                <th scope="col" className="text-right px-3 py-2 text-xs font-medium text-[var(--text-muted)]">
                  Net Income
                </th>
                <th scope="col" className="text-right px-3 py-2 text-xs font-medium text-[var(--text-muted)]">
                  Margin
                </th>
              </tr>
            </thead>
            <tbody>
              {segmentData.map((seg, i) => (
                <tr
                  key={i}
                  className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-hover)]"
                >
                  <td className="px-3 py-2 font-medium">{seg.name}</td>
                  <td className="px-3 py-2 text-right font-mono">
                    ${formatCompact(seg.revenue)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    ${formatCompact(seg.expenses)}
                  </td>
                  <td
                    className={`px-3 py-2 text-right font-mono ${seg.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {formatCompact(Math.abs(seg.netIncome))}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">{formatPercent(seg.margin, 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

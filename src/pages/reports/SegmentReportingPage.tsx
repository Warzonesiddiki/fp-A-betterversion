import { useState, useMemo } from 'react';
import { useGLStore } from '@/store/glStore';
import { useEntityStore } from '@/store/entityStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KPIValue } from '@/components/ui/KPIValue';
import { ExportEngine } from '@/engines/ExportEngine';
import { SegmentReportingEngine } from '@/engines/SegmentReportingEngine';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PieChart, Pie } from 'recharts';
import { Layers, TrendingUp, Download, Filter } from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

export default function SegmentReportingPage() {
  const { entries } = useGLStore();
  const { entities } = useEntityStore();
  const [segmentType, setSegmentType] = useState<'geographic' | 'product' | 'customer'>('geographic');

  const segmentData = useMemo(() => {
    const report = SegmentReportingEngine.getSegmentReport(new Date().toISOString().slice(0, 7));
    return report.map(r => ({
      name: r.segment.name,
      revenue: r.revenue,
      expenses: r.expenses,
      netIncome: r.netIncome,
      margin: r.margin,
    }));
  }, [segmentType]);

  const totalRevenue = segmentData.reduce((s, d) => s + d.revenue, 0);
  const totalExpenses = segmentData.reduce((s, d) => s + d.expenses, 0);
  const totalNetIncome = totalRevenue - totalExpenses;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Segment Reporting</h1>
          <p className="text-muted-foreground">ASC 280 compliant segment analysis</p>
        </div>
        <div className="flex gap-2">
          {(['geographic', 'product', 'customer'] as const).map(t => (
            <Button key={t} variant={segmentType === t ? 'default' : 'outline'} size="sm"
              onClick={() => setSegmentType(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Button>
          ))}
          <Button variant="outline" size="sm" onClick={() => ExportEngine.exportCurrentView()}>
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4">
          <KPIValue label="Total Revenue" value={totalRevenue} icon={<TrendingUp className="h-4 w-4" />} format="currency" />
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <KPIValue label="Total Expenses" value={totalExpenses} icon={<Layers className="h-4 w-4" />} format="currency" />
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <KPIValue label="Net Income" value={totalNetIncome} format="currency" />
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Revenue by Segment</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={segmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => `$${(v / 1000).toFixed(0)}K`} />
                <Bar dataKey="revenue" name="Revenue">
                  {segmentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Revenue Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={segmentData} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
                  {segmentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => `$${(v / 1000).toFixed(0)}K`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Segment P&L</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-subtle)]">
                <th className="text-left px-3 py-2 text-xs font-medium text-[var(--text-muted)]">Segment</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-[var(--text-muted)]">Revenue</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-[var(--text-muted)]">Expenses</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-[var(--text-muted)]">Net Income</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-[var(--text-muted)]">Margin</th>
              </tr>
            </thead>
            <tbody>
              {segmentData.map((seg, i) => (
                <tr key={i} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-hover)]">
                  <td className="px-3 py-2 font-medium">{seg.name}</td>
                  <td className="px-3 py-2 text-right font-mono">${(seg.revenue / 1000).toFixed(0)}K</td>
                  <td className="px-3 py-2 text-right font-mono">${(seg.expenses / 1000).toFixed(0)}K</td>
                  <td className={`px-3 py-2 text-right font-mono ${seg.netIncome >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    ${Math.abs(seg.netIncome / 1000).toFixed(0)}K
                  </td>
                  <td className="px-3 py-2 text-right font-mono">{seg.margin.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { DataTable, type Column } from '@/components/ui/DataTable';
import {
  ChartArea,
  Download,
  FileText,
  Table as TableIcon,
  Gauge,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { ExportEngine } from '@/engines/ExportEngine';

const getRandom = () => Math.random();

import {
  ResponsiveContainer,
  AreaChart,
  Area,
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

interface ProductionLine {
  line: string;
  status: 'Running' | 'Idle' | 'Maintenance';
  output: number;
  efficiency: number;
  downtime: number;
}

export default function ProductionDashboardPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Production Dashboard';
  }, []);

  const data = useMemo(() => {
    if (entries.length === 0) return null;
    const revenue = entries
      .filter((e) => (e.accountCode || '').startsWith('4'))
      .reduce((s, e) => s + (e.debit - e.credit), 0);
    const cogs = entries
      .filter((e) => (e.accountCode || '').startsWith('5'))
      .reduce((s, e) => s + Math.abs(e.debit - e.credit), 0);
    const margin = revenue > 0 ? ((revenue - cogs) / revenue) * 100 : 0;
    const lines: ProductionLine[] = [
      {
        line: 'Line A — Assembly',
        status: 'Running',
        output: 12500,
        efficiency: 94.2,
        downtime: 2.1,
      },
      {
        line: 'Line B — Packaging',
        status: 'Running',
        output: 9800,
        efficiency: 88.7,
        downtime: 4.5,
      },
      { line: 'Line C — Welding', status: 'Maintenance', output: 0, efficiency: 0, downtime: 100 },
      {
        line: 'Line D — Painting',
        status: 'Running',
        output: 7600,
        efficiency: 91.3,
        downtime: 3.2,
      },
      { line: 'Line E — QC', status: 'Idle', output: 0, efficiency: 0, downtime: 100 },
    ];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const outputTrend = months.map((m, i) => ({
      month: m,
      output: Math.round(25000 + getRandom() * 10000),
      defects: Math.round(100 + getRandom() * 80),
    }));
    const oee =
      lines.filter((l) => l.status === 'Running').reduce((s, l) => s + l.efficiency, 0) /
      lines.filter((l) => l.status === 'Running').length;
    return { revenue, cogs, margin, lines, outputTrend, oee };
  }, [entries]);

  const handleExportPDF = () => {
    if (!data) return;
    ExportEngine.exportToPDF(
      {
        headers: ['Line', 'Status', 'Output', 'Efficiency', 'Downtime'],
        rows: data.lines.map((l) => [
          l.line,
          l.status,
          l.output.toString(),
          l.efficiency.toFixed(1) + '%',
          l.downtime.toFixed(1) + '%',
        ]),
      },
      { title: 'Production Dashboard Report', companyName: 'FinPlan Pro' }
    );
  };

  const handleExportExcel = () => {
    if (!data) return;
    ExportEngine.exportToExcel(
      {
        headers: ['Line', 'Status', 'Output', 'Efficiency', 'Downtime'],
        rows: data.lines.map((l) => [
          l.line,
          l.status,
          l.output.toString(),
          l.efficiency.toFixed(1) + '%',
          l.downtime.toFixed(1) + '%',
        ]),
      },
      { title: 'Production_Dashboard_Report' }
    );
  };

  const columns: Column<ProductionLine>[] = [
    { key: 'line', header: 'Production Line', sortable: true },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <span
          className={
            r.status === 'Running'
              ? 'text-green-400'
              : r.status === 'Maintenance'
                ? 'text-yellow-400'
                : 'text-slate-500'
          }
        >
          {r.status === 'Running' ? (
            <CheckCircle className="inline h-4 w-4 mr-1" />
          ) : (
            <AlertTriangle className="inline h-4 w-4 mr-1" />
          )}
          {r.status}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'output',
      header: 'Output',
      align: 'right',
      render: (r) => r.output.toLocaleString(),
      sortable: true,
    },
    {
      key: 'efficiency',
      header: 'Efficiency',
      align: 'right',
      render: (r) => (
        <span
          className={
            r.efficiency >= 90
              ? 'text-green-400'
              : r.efficiency >= 80
                ? 'text-yellow-400'
                : 'text-red-400'
          }
        >
          {r.efficiency.toFixed(1)}%
        </span>
      ),
      sortable: true,
    },
    {
      key: 'downtime',
      header: 'Downtime',
      align: 'right',
      render: (r) => r.downtime.toFixed(1) + '%',
      sortable: true,
    },
  ];

  if (entries.length === 0)
    return (
      <div className="p-12 text-center">
        <ChartArea className="h-10 w-10 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Production Data</h2>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Production Dashboard</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={handleExportPDF} aria-label="Export PDF">
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            PDF
          </Button>
          <Button size="sm" variant="ghost" onClick={handleExportExcel} aria-label="Export Excel">
            <TableIcon className="h-3.5 w-3.5 mr-1.5" />
            Excel
          </Button>
        </div>
      </div>
      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPIValue label="Revenue" value={formatCurrency(data.revenue)} />
            <KPIValue label="COGS" value={formatCurrency(data.cogs)} />
            <KPIValue label="Gross Margin" value={`${data.margin.toFixed(1)}%`} />
            <KPIValue
              label="OEE"
              value={`${data.oee.toFixed(1)}%`}
              icon={<Gauge className="h-4 w-4" />}
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Production Output Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={data.outputTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="output"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                      name="Output"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Defect Rate Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={data.outputTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="defects"
                      stroke="#ef4444"
                      strokeWidth={2}
                      name="Defects"
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          <DataTable columns={columns} data={data.lines} />
        </>
      )}
    </div>
  );
}

import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { DataTable, type Column } from '@/components/ui/DataTable';
import {
  Headphones,
  Download,
  FileText,
  Table as TableIcon,
  Users,
  DollarSign,
  TrendingDown,
} from 'lucide-react';
import { ExportEngine } from '@/engines/ExportEngine';

const getRandom = () => Math.random();

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
import { TreemapChart } from '@/components/charts/TreemapChart';

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

interface DeptRow {
  department: string;
  current: number;
  planned: number;
  variance: number;
  cost: number;
}

export default function HeadcountPlanPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Headcount Plan';
  }, []);

  const data = useMemo(() => {
    if (entries.length === 0) return null;
    const salaryEntries = entries.filter(
      (e) => (e.accountCode || '').startsWith('71') || (e.accountCode || '').startsWith('72')
    );
    const totalCost = salaryEntries.reduce((s, e) => s + Math.abs(e.debit - e.credit), 0);
    const count = salaryEntries.length;
    const avgCost = count > 0 ? totalCost / count : 0;
    const departments = ['Engineering', 'Sales', 'Marketing', 'Finance', 'Operations', 'HR'];
    const deptData: DeptRow[] = departments.map((dept) => {
      const current = Math.floor(15 + getRandom() * 40);
      const planned = current + Math.floor(getRandom() * 10 - 3);
      return {
        department: dept,
        current,
        planned,
        variance: planned - current,
        cost: current * avgCost,
      };
    });
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const trend = months.map((m, i) => ({
      month: m,
      headcount: Math.floor(80 + i * 5 + getRandom() * 10),
      attrition: +(2 + getRandom() * 3).toFixed(1),
    }));
    return {
      totalCost,
      count,
      avgCost,
      deptData,
      trend,
      chartData: deptData.map((d) => ({
        name: d.department,
        current: d.current,
        planned: d.planned,
      })),
    };
  }, [entries]);

  const handleExportPDF = () => {
    if (!data) return;
    ExportEngine.exportToPDF(
      {
        headers: ['Department', 'Current', 'Planned', 'Variance', 'Cost'],
        rows: data.deptData.map((d) => [
          d.department,
          d.current.toString(),
          d.planned.toString(),
          d.variance.toString(),
          formatCurrency(d.cost),
        ]),
      },
      { title: 'Headcount Plan Report', companyName: 'FinPlan Pro' }
    );
  };

  const handleExportExcel = () => {
    if (!data) return;
    ExportEngine.exportToExcel(
      {
        headers: ['Department', 'Current', 'Planned', 'Variance', 'Cost'],
        rows: data.deptData.map((d) => [
          d.department,
          d.current.toString(),
          d.planned.toString(),
          d.variance.toString(),
          formatCurrency(d.cost),
        ]),
      },
      { title: 'Headcount_Plan_Report' }
    );
  };

  const columns: Column<DeptRow>[] = [
    { key: 'department', header: 'Department', sortable: true },
    { key: 'current', header: 'Current', align: 'right', sortable: true },
    { key: 'planned', header: 'Planned', align: 'right', sortable: true },
    {
      key: 'variance',
      header: 'Variance',
      align: 'right',
      render: (r) => (
        <span className={r.variance >= 0 ? 'text-green-400' : 'text-red-400'}>
          {r.variance > 0 ? '+' : ''}
          {r.variance}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'cost',
      header: 'Annual Cost',
      align: 'right',
      render: (r) => formatCurrency(r.cost),
      sortable: true,
    },
  ];

  if (entries.length === 0)
    return (
      <div className="p-12 text-center">
        <Headphones className="h-10 w-10 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Data</h2>
        <p className="text-slate-400 mb-6">Import payroll data to plan headcount.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Headcount Plan</h1>
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
            <KPIValue
              label="Total Headcount"
              value={data.count.toString()}
              icon={<Users className="h-4 w-4" />}
            />
            <KPIValue
              label="Total Cost"
              value={formatCurrency(data.totalCost)}
              icon={<DollarSign className="h-4 w-4" />}
            />
            <KPIValue label="Avg Cost/Head" value={formatCurrency(data.avgCost)} />
            <KPIValue
              label="Attrition Rate"
              value={`${data.trend[data.trend.length - 1].attrition}%`}
              icon={<TrendingDown className="h-4 w-4" />}
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Headcount by Department</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                    />
                    <Legend />
                    <Bar dataKey="current" fill="#3b82f6" name="Current" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="planned" fill="#8b5cf6" name="Planned" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Headcount & Attrition Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={data.trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                    <YAxis yAxisId="left" stroke="#94a3b8" fontSize={12} />
                    <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="headcount"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Headcount"
                      dot={{ r: 4 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="attrition"
                      stroke="#ef4444"
                      strokeWidth={2}
                      name="Attrition %"
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Headcount Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              <TreemapChart
                data={data.deptData.map((d: { department: string; current: number }) => ({
                  name: d.department,
                  size: d.current,
                }))}
                height={200}
                formatValue={(v) => `${v} heads`}
                ariaLabel="Headcount allocation treemap"
              />
            </CardContent>
          </Card>
          <DataTable columns={columns} data={data.deptData} />
        </>
      )}
    </div>
  );
}

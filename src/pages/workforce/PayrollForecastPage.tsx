/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Download, Users, DollarSign, TrendingUp, Percent } from 'lucide-react';
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
  AreaChart,
  Area,
} from 'recharts';
import { ExportEngine } from '@/engines/ExportEngine';
import { reportExportFailure } from '@/utils/exportErrorHandler';

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

interface DepartmentPayroll {
  department: string;
  headcount: number;
  baseSalary: number;
  benefits: number;
  totalCost: number;
  costPerHead: number;
  yoyChange: number;
}

const mockDepartments: DepartmentPayroll[] = [
  {
    department: 'Engineering',
    headcount: 45,
    baseSalary: 5400000,
    benefits: 1620000,
    totalCost: 7020000,
    costPerHead: 156000,
    yoyChange: 8.2,
  },
  {
    department: 'Sales',
    headcount: 32,
    baseSalary: 3200000,
    benefits: 960000,
    totalCost: 4160000,
    costPerHead: 130000,
    yoyChange: 5.1,
  },
  {
    department: 'Marketing',
    headcount: 18,
    baseSalary: 1800000,
    benefits: 540000,
    totalCost: 2340000,
    costPerHead: 130000,
    yoyChange: 3.8,
  },
  {
    department: 'Operations',
    headcount: 28,
    baseSalary: 2520000,
    benefits: 756000,
    totalCost: 3276000,
    costPerHead: 117000,
    yoyChange: 4.2,
  },
  {
    department: 'Finance',
    headcount: 12,
    baseSalary: 1560000,
    benefits: 468000,
    totalCost: 2028000,
    costPerHead: 169000,
    yoyChange: 6.5,
  },
  {
    department: 'HR',
    headcount: 8,
    baseSalary: 880000,
    benefits: 264000,
    totalCost: 1144000,
    costPerHead: 143000,
    yoyChange: 2.9,
  },
  {
    department: 'Legal',
    headcount: 6,
    baseSalary: 900000,
    benefits: 270000,
    totalCost: 1170000,
    costPerHead: 195000,
    yoyChange: 7.1,
  },
  {
    department: 'IT Support',
    headcount: 15,
    baseSalary: 1350000,
    benefits: 405000,
    totalCost: 1755000,
    costPerHead: 117000,
    yoyChange: 3.5,
  },
];

const monthlyForecast = [
  { month: 'Jan', basePay: 1800000, benefits: 540000, bonus: 0, total: 2340000 },
  { month: 'Feb', basePay: 1800000, benefits: 540000, bonus: 0, total: 2340000 },
  { month: 'Mar', basePay: 1820000, benefits: 546000, bonus: 120000, total: 2486000 },
  { month: 'Apr', basePay: 1820000, benefits: 546000, bonus: 0, total: 2366000 },
  { month: 'May', basePay: 1840000, benefits: 552000, bonus: 0, total: 2392000 },
  { month: 'Jun', basePay: 1840000, benefits: 552000, bonus: 250000, total: 2642000 },
  { month: 'Jul', basePay: 1860000, benefits: 558000, bonus: 0, total: 2418000 },
  { month: 'Aug', basePay: 1860000, benefits: 558000, bonus: 0, total: 2418000 },
  { month: 'Sep', basePay: 1880000, benefits: 564000, bonus: 0, total: 2444000 },
  { month: 'Oct', basePay: 1880000, benefits: 564000, bonus: 0, total: 2444000 },
  { month: 'Nov', basePay: 1900000, benefits: 570000, bonus: 0, total: 2470000 },
  { month: 'Dec', basePay: 1900000, benefits: 570000, bonus: 500000, total: 2970000 },
];

const headcountTrend = [
  { month: 'Jan', headcount: 158, costPerHead: 14810 },
  { month: 'Feb', headcount: 160, costPerHead: 14625 },
  { month: 'Mar', headcount: 162, costPerHead: 15345 },
  { month: 'Apr', headcount: 162, costPerHead: 14605 },
  { month: 'May', headcount: 164, costPerHead: 14585 },
  { month: 'Jun', headcount: 164, costPerHead: 16110 },
  { month: 'Jul', headcount: 166, costPerHead: 14566 },
  { month: 'Aug', headcount: 166, costPerHead: 14566 },
  { month: 'Sep', headcount: 168, costPerHead: 14548 },
  { month: 'Oct', headcount: 168, costPerHead: 14548 },
  { month: 'Nov', headcount: 170, costPerHead: 14529 },
  { month: 'Dec', headcount: 170, costPerHead: 17471 },
];

export default function PayrollForecastPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro - Payroll Forecast';
  }, []);

  const _glPayroll = useMemo(() => {
    const payrollEntries = entries.filter(
      (e) =>
        (e.accountCode || '').startsWith('71') ||
        (e.description || '').toLowerCase().includes('salary')
    );
    return payrollEntries.reduce((s, e) => s + Math.abs(e.debit - e.credit), 0);
  }, [entries]);

  const totalPayroll = mockDepartments.reduce((s, d) => s + d.totalCost, 0);
  const totalHeadcount = mockDepartments.reduce((s, d) => s + d.headcount, 0);
  const avgCostPerHead = totalHeadcount > 0 ? totalPayroll / totalHeadcount : 0;
  const totalBenefits = mockDepartments.reduce((s, d) => s + d.benefits, 0);
  const benefitsRatio = totalPayroll > 0 ? (totalBenefits / totalPayroll) * 100 : 0;

  const deptColumns: Column<DepartmentPayroll>[] = [
    { key: 'department', header: 'Department', sortable: true },
    { key: 'headcount', header: 'Headcount', sortable: true },
    {
      key: 'baseSalary',
      header: 'Base Salary',
      render: (r) => formatCurrency(r.baseSalary),
      sortable: true,
    },
    {
      key: 'benefits',
      header: 'Benefits',
      render: (r) => formatCurrency(r.benefits),
      sortable: true,
    },
    {
      key: 'totalCost',
      header: 'Total Cost',
      render: (r) => formatCurrency(r.totalCost),
      sortable: true,
    },
    {
      key: 'costPerHead',
      header: 'Cost/Head',
      render: (r) => formatCurrency(r.costPerHead),
      sortable: true,
    },
    {
      key: 'yoyChange',
      header: 'YoY Change',
      render: (r) => (
        <span className={r.yoyChange > 5 ? 'text-red-400' : 'text-green-400'}>
          {r.yoyChange > 0 ? '+' : ''}
          {r.yoyChange}%
        </span>
      ),
      sortable: true,
    },
  ];

  const handleExport = () => {
    void ExportEngine.exportToPDF(
      {
        headers: [
          'Department',
          'Headcount',
          'Base Salary',
          'Benefits',
          'Total Cost',
          'Cost/Head',
          'YoY %',
        ],
        rows: mockDepartments.map((d) => [
          d.department,
          d.headcount,
          d.baseSalary,
          d.benefits,
          d.totalCost,
          d.costPerHead,
          d.yoyChange,
        ]),
      },
      { title: 'Payroll Forecast Report' }
    ).catch(reportExportFailure);
  };

  const hasData = entries.length > 0 || mockDepartments.length > 0;

  if (!hasData) {
    return (
      <div className="p-12 text-center">
        <Users className="h-10 w-10 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Payroll Data</h2>
        <p className="text-slate-400 mb-6">Import GL data with payroll accounts to forecast.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payroll Forecast</h1>
          <p className="text-sm text-slate-400">
            {totalHeadcount} employees across {mockDepartments.length} departments
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-1" /> Export
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPIValue
          label="Annual Payroll"
          value={formatCurrency(totalPayroll)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KPIValue
          label="Headcount"
          value={String(totalHeadcount)}
          icon={<Users className="h-4 w-4" />}
        />
        <KPIValue
          label="Avg Cost/Head"
          value={formatCurrency(avgCostPerHead)}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <KPIValue
          label="Benefits Cost"
          value={formatCurrency(totalBenefits)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KPIValue
          label="Benefits Ratio"
          value={`${benefitsRatio.toFixed(1)}%`}
          icon={<Percent className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Payroll Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyForecast}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  formatter={(v: any) => formatCurrency(v)}
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                />
                <Legend />
                <Bar dataKey="basePay" fill="#3b82f6" name="Base Pay" stackId="a" />
                <Bar dataKey="benefits" fill="#10b981" name="Benefits" stackId="a" />
                <Bar dataKey="bonus" fill="#f59e0b" name="Bonus" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Headcount vs Cost per Employee</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={headcountTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis yAxisId="left" stroke="#94a3b8" fontSize={12} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="headcount"
                  stroke="#3b82f6"
                  name="Headcount"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="costPerHead"
                  stroke="#f59e0b"
                  name="Cost/Head"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Benefits Cost Projection</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyForecast}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
              />
              <Tooltip
                formatter={(v: any) => formatCurrency(v)}
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
              />
              <Area
                type="monotone"
                dataKey="benefits"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.15}
                name="Benefits"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Department Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={mockDepartments}
            columns={deptColumns}
            pageSize={8}
            caption="Department breakdown table"
            ariaLabel="Department breakdown data table for payroll forecast"
          />
        </CardContent>
      </Card>
    </div>
  );
}

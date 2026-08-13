import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { useWorkforceStore } from '@/store/workforceStore';
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
import { roundTo, sumMoney, divideMoney } from '@/utils/money';
import { formatCompact, formatPercent } from '@/utils/financialFormatting';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
interface DepartmentPayroll {
  department: string;
  headcount: number;
  baseSalary: number;
  benefits: number;
  totalCost: number;
  costPerHead: number;
  yoyChange: number;
}

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
  const fmt = useCurrencyFormatter();
  const { entries } = useGLStore();
  const workforceState = useWorkforceStore();
  const storeDepartments = workforceState.departments ?? [];
  const storeEmployees = workforceState.employees ?? [];

  // WIRED (C-3): payroll departments come from the real workforceStore.
  // Headcount and base salary are derived from active employees (exact money
  // sums via sumMoney); benefits and YoY change are not modeled in the store
  // yet, so they render as zero until a benefits/prior-year source is
  // imported — never fabricated figures.
  const departments: DepartmentPayroll[] = storeDepartments.map((d) => {
    const members = storeEmployees.filter((e) => e.department === d.name && e.status === 'active');
    const baseSalary = roundTo(sumMoney(members.map((e) => e.salary)), 2);
    return {
      department: d.name,
      headcount: members.length,
      baseSalary,
      benefits: 0,
      totalCost: baseSalary,
      costPerHead: members.length > 0 ? roundTo(divideMoney(baseSalary, members.length), 2) : 0,
      yoyChange: 0,
    };
  });
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
    return roundTo(sumMoney(payrollEntries.map((e) => Math.abs(e.debit - e.credit))), 2);
  }, [entries]);

  const totalPayroll = roundTo(sumMoney(departments.map((d) => d.totalCost)), 2);
  const totalHeadcount = roundTo(sumMoney(departments.map((d) => d.headcount)), 2);
  const avgCostPerHead = totalHeadcount > 0 ? totalPayroll / totalHeadcount : 0;
  const totalBenefits = roundTo(sumMoney(departments.map((d) => d.benefits)), 2);
  const benefitsRatio = totalPayroll > 0 ? (totalBenefits / totalPayroll) * 100 : 0;

  const deptColumns: Column<DepartmentPayroll>[] = [
    { key: 'department', header: 'Department', sortable: true },
    { key: 'headcount', header: 'Headcount', sortable: true },
    {
      key: 'baseSalary',
      header: 'Base Salary',
      render: (_, r) => fmt.currency0(r.baseSalary),
      sortable: true,
    },
    {
      key: 'benefits',
      header: 'Benefits',
      render: (_, r) => fmt.currency0(r.benefits),
      sortable: true,
    },
    {
      key: 'totalCost',
      header: 'Total Cost',
      render: (_, r) => fmt.currency0(r.totalCost),
      sortable: true,
    },
    {
      key: 'costPerHead',
      header: 'Cost/Head',
      render: (_, r) => fmt.currency0(r.costPerHead),
      sortable: true,
    },
    {
      key: 'yoyChange',
      header: 'YoY Change',
      render: (_, r) => (
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
        rows: departments.map((d) => [
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

  const hasData = entries.length > 0 || departments.length > 0;

  if (!hasData) {
    return (
      <div className="p-12 text-center">
        <Users className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Payroll Data</h2>
        <p className="text-[var(--text-muted)] mb-6">
          Import GL data with payroll accounts to forecast.
        </p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payroll Forecast</h1>
          <p className="text-sm text-[var(--text-muted)]">
            {totalHeadcount} employees across {departments.length} departments
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-1" /> Export
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPIValue
          label="Annual Payroll"
          value={fmt.currency0(totalPayroll)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KPIValue
          label="Headcount"
          value={String(totalHeadcount)}
          icon={<Users className="h-4 w-4" />}
        />
        <KPIValue
          label="Avg Cost/Head"
          value={fmt.currency0(avgCostPerHead)}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <KPIValue
          label="Benefits Cost"
          value={fmt.currency0(totalBenefits)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KPIValue
          label="Benefits Ratio"
          value={`${formatPercent(benefitsRatio, 1)}`}
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
                  tickFormatter={(v) => `$${formatCompact(v)}`}
                />
                <Tooltip
                  formatter={(v) => fmt.currency0(Number(v))}
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
                  tickFormatter={(v) => `$${v ? formatCompact(v) : '—'}`}
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
                tickFormatter={(v) => `$${v ? formatCompact(v) : '—'}`}
              />
              <Tooltip
                formatter={(v) => fmt.currency0(Number(v))}
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
            data={departments}
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

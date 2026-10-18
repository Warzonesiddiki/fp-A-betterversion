import { useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Headphones, FileText, Table as TableIcon, Users, DollarSign } from 'lucide-react';
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
import { TreemapChart } from '@/components/charts/TreemapChart';
import { reportExportFailure } from '@/utils/exportErrorHandler';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { useWorkforceStore } from '@/store/workforceStore';
import { useShallow } from 'zustand/react/shallow';
import { todayISO } from '@/utils/clock';
import { deriveHeadcountPlan, type DepartmentHeadcount } from './headcountPlanData';

/**
 * Phase 10 decontamination: this page previously multiplied a real
 * GL average cost by invented department headcounts and an invented
 * attrition trend. It now derives entirely from actual workforce
 * records (see headcountPlanData). Planned headcount and attrition
 * are not displayed — no plan or termination-date data exists to
 * derive them from.
 */
export default function HeadcountPlanPage() {
  const fmt = useCurrencyFormatter();
  const employees = useWorkforceStore(useShallow((s) => s.employees));
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Headcount Plan';
  }, []);

  const data = useMemo(
    () => deriveHeadcountPlan(employees ?? [], todayISO().slice(0, 7)),
    [employees]
  );
  const hasData = data.totalHeadcount > 0;

  const handleExportPDF = () => {
    void ExportEngine.exportToPDF(
      {
        headers: ['Department', 'Current Headcount', 'Annual Salary Cost'],
        rows: data.departments.map((d) => [
          d.department,
          d.current.toString(),
          fmt.currency0(d.cost),
        ]),
      },
      { title: 'Headcount Plan Report', companyName: 'FinPlan Pro' }
    ).catch(reportExportFailure);
  };

  const handleExportExcel = () => {
    void ExportEngine.exportToExcel(
      {
        headers: ['Department', 'Current Headcount', 'Annual Salary Cost'],
        rows: data.departments.map((d) => [d.department, d.current, d.cost]),
      },
      { title: 'Headcount_Plan_Report' }
    ).catch(reportExportFailure);
  };

  const columns: Column<DepartmentHeadcount>[] = [
    { key: 'department', header: 'Department', sortable: true },
    { key: 'current', header: 'Current', align: 'right', sortable: true },
    {
      key: 'cost',
      header: 'Annual Cost',
      align: 'right',
      render: (_, r) => fmt.currency0(r.cost),
      sortable: true,
    },
  ];

  if (!hasData)
    return (
      <div className="p-12 text-center">
        <Headphones className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Workforce Data</h2>
        <p className="text-[var(--text-muted)] mb-6">
          Headcount planning derives from your actual employee records. Add active employees with
          departments, salaries and start dates — no sample headcounts are shown.
        </p>
        <Button onClick={() => navigate('/workforce/headcount')}>Open Workforce Planning</Button>
      </div>
    );

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Headcount Plan"
        actions={
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
        }
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPIValue
          label="Total Headcount"
          value={data.totalHeadcount.toString()}
          icon={<Users className="h-4 w-4" />}
        />
        <KPIValue
          label="Total Cost"
          value={fmt.currency0(data.totalCost)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KPIValue label="Avg Cost/Head" value={fmt.currency0(data.avgCostPerHead)} />
        <KPIValue label="Departments" value={data.departments.length.toString()} />
      </div>
      <p className="text-xs text-[var(--text-muted)]">
        Current headcount and salary cost derive from active employee records. Planned headcount and
        attrition are not shown: no plan or termination-date data exists to derive them from.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Headcount by Department</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={data.departments.map((d) => ({ name: d.department, current: d.current }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                />
                <Legend />
                <Bar dataKey="current" fill="#3b82f6" name="Current" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Headcount Trend (by start date)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="headcount"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Headcount"
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
            data={data.departments.map((d) => ({
              name: d.department,
              size: d.current,
            }))}
            height={200}
            formatValue={(v) => `${v} heads`}
            ariaLabel="Headcount allocation treemap"
          />
        </CardContent>
      </Card>
      <DataTable
        columns={columns}
        data={data.departments}
        caption="Headcount allocation table"
        ariaLabel="Headcount allocation data table for headcount plan"
      />
    </div>
  );
}

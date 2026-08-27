// =============================================================================
// PAYROLL FORECAST — workforce-derived payroll rollup (fabrication removal,
// zero-fabrication honesty charter).
// -----------------------------------------------------------------------------
// The previous revision rendered genuine per-department payroll alongside
// three invented exhibits:
//   - `monthlyForecast`: twelve hand-typed Jan-Dec rows of basePay/benefits/
//     bonus/total dollar literals (base pay stepping $1.8M to $1.9M, benefits
//     $540k to $570k, bonus spikes of $120k/$250k/$500k);
//   - `headcountTrend`: twelve hand-typed Jan-Dec rows of headcount (158 up
//     to 170) and cost-per-head ($14.5k to $17.5k);
//   - the bar chart ("Monthly Payroll Forecast"), line chart ("Headcount vs
//     Cost per Employee") and area chart ("Benefits Cost Projection") built
//     from those arrays and presented as if they were projections.
// No store carries the inputs a month-by-month projection needs (a payroll
// calendar, scheduled raises/bonus events, monthly headcount plans), so those
// exhibits are removed and disclosed instead of replaced with new guesses.
// What remains is derived: department headcount/base-salary/cost-per-head
// sums from workforceStore active employees, KPIs computed from those rows,
// and the posted-payroll total signed-summed from GL entries (71xx accounts
// or salary-described postings). Benefits and YoY change stay at honest zeros
// until a benefits/prior-year source is imported.
// =============================================================================

import { useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { PageHeader } from '@/components/ui/PageHeader';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { useWorkforceStore } from '@/store/workforceStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Download, Users, DollarSign, TrendingUp, Percent } from 'lucide-react';
import { ExportEngine } from '@/engines/ExportEngine';
import { reportExportFailure } from '@/utils/exportErrorHandler';
import {
  roundTo,
  sumMoney,
  divideMoney,
  subtractMoney,
  multiplyMoney,
  compareMoney,
} from '@/utils/money';
import { formatPercent } from '@/utils/financialFormatting';
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

export default function PayrollForecastPage() {
  const fmt = useCurrencyFormatter();
  const entries = useGLStore((s) => s.entries);
  const workforceState = useWorkforceStore(
    useShallow((s) => ({ departments: s.departments, employees: s.employees }))
  );
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

  // Posted payroll actually sitting in the ledger: signed |debit − credit|
  // over 71xx accounts and salary-described postings (previously computed but
  // never displayed; now surfaced in the projection-disclosure card).
  const glPayroll = useMemo(() => {
    const payrollEntries = entries.filter(
      (e) =>
        (e.accountCode || '').startsWith('71') ||
        (e.description || '').toLowerCase().includes('salary')
    );
    return {
      postings: payrollEntries.length,
      total: roundTo(
        sumMoney(payrollEntries.map((e) => Math.abs(roundTo(subtractMoney(e.debit, e.credit))))),
        2
      ),
    };
  }, [entries]);

  const totalPayroll = roundTo(sumMoney(departments.map((d) => d.totalCost)), 2);
  const totalHeadcount = departments.reduce((s, d) => s + d.headcount, 0);
  const avgCostPerHead =
    totalHeadcount > 0 ? roundTo(divideMoney(totalPayroll, totalHeadcount)) : 0;
  const totalBenefits = roundTo(sumMoney(departments.map((d) => d.benefits)), 2);
  const benefitsRatio =
    compareMoney(totalPayroll, 0) > 0
      ? multiplyMoney(divideMoney(totalBenefits, totalPayroll), 100).toNumber()
      : 0;

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
      <PageHeader
        title="Payroll Forecast"
        purpose={
          <>
            {totalHeadcount}employees across {departments.length}departments
          </>
        }
        actions={
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
        }
      />

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

      <Card>
        <CardHeader>
          <CardTitle>Monthly Projection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-[var(--text-muted)]">
              Posted payroll in the current ledger:{' '}
              <span className="font-medium">{fmt.currency0(glPayroll.total)}</span> across{' '}
              {glPayroll.postings} GL posting{glPayroll.postings === 1 ? '' : 's'}.
            </p>
            <p className="text-sm text-[var(--text-muted)]">
              No month-by-month forecast is shown because its inputs are not recorded yet: the
              payroll calendar (pay dates and periods), scheduled raises and bonus events, and
              monthly headcount plans. Connect a payroll/HR data feed or enter these schedules
              manually to build the projection.
            </p>
          </div>
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

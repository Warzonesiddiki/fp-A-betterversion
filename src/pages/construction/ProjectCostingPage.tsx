import { buildFiscalPeriods } from '@/utils/fiscalPeriods';
import { PageHeader } from '@/components/ui/PageHeader';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, Download, BarChart3 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KPIValue } from '@/components/ui/KPIValue';
import { PeriodPicker } from '@/components/ui/PeriodPicker';
import { DataTable, type Column } from '@/components/ui/DataTable';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useGLStore } from '@/store/glStore';
import { formatCompact, formatPercent } from '@/utils/financialFormatting';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { deriveProjectCosting, type CostAccountRow } from './projectCostingData';

const fiscalPeriods = buildFiscalPeriods();

export default function ProjectCostingPage() {
  const fmt = useCurrencyFormatter();
  const navigate = useNavigate();
  const { entries } = useGLStore();
  const [periodId, setPeriodId] = useState('P01');

  const derivation = useMemo(() => deriveProjectCosting(entries), [entries]);

  const columns: Column<CostAccountRow>[] = [
    { key: 'code', header: 'Account', sortable: true },
    { key: 'category', header: 'Category' },
    {
      key: 'actual',
      header: 'Posted actual',
      align: 'right',
      render: (_v, r) => fmt.currency0(r.actual),
      sortable: true,
    },
  ];

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <Calculator className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Project Costing Data</h2>
        <p className="text-[var(--text-muted)] mb-6">
          Import General Ledger entries to view posted construction cost, revenue and WIP. Change
          orders, CSI budgets and CPI are not invented.
        </p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Project Costing"
          purpose="Posted construction cost, contract revenue and WIP from the General Ledger. Change orders, CSI budgets and CPI require project-control feeds the GL does not carry — they are omitted, not estimated."
        />
        <div className="flex items-center gap-3">
          <PeriodPicker value={periodId} onChange={setPeriodId} periods={fiscalPeriods} />
          <Button variant="default" size="sm" className="h-10">
            <Calculator className="h-4 w-4 mr-2" />
            Analyze Variance
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPIValue
          label="Posted Construction Costs"
          value={fmt.currency0(derivation.constructionCosts)}
        />
        <KPIValue label="Contract Revenue" value={fmt.currency0(derivation.revenue)} />
        <KPIValue
          label="WIP"
          value={derivation.wip === null ? '—' : fmt.currency0(derivation.wip)}
        />
        <KPIValue
          label="Over / Under Billed"
          value={
            derivation.overUnderBilled === null ? '—' : fmt.currency0(derivation.overUnderBilled)
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <CardTitle>Posted cost by account</CardTitle>
            </div>
            <CardDescription>
              Actuals only. A budget column is not invented when no project-control budget is
              posted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {derivation.costAccounts.length > 0 ? (
              <div className="h-[350px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[...derivation.costAccounts]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => formatCompact(Number(v))}
                    />
                    <Tooltip formatter={(v) => fmt.currency0(Number(v))} />
                    <Legend verticalAlign="top" align="right" />
                    <Bar
                      dataKey="actual"
                      name="Posted actual"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-[var(--text-muted)] py-8 text-center">
                No posted cost accounts (prefixes 5 and 6). A labor / materials / equipment split is
                not invented.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Not derivable from the posted GL</CardTitle>
            <CardDescription>Omitted rather than estimated</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-[var(--text-muted)]">
            {derivation.unavailable.map((item) => (
              <p key={item.label}>
                <span className="font-medium text-[var(--text-secondary)]">{item.label}</span> —{' '}
                {item.reason}
              </p>
            ))}
            {derivation.grossMarginPct !== null && (
              <p>
                <span className="font-medium text-[var(--text-secondary)]">Gross margin</span> —{' '}
                {formatPercent(derivation.grossMarginPct, 1)} from posted revenue and cost.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Posted cost accounts</CardTitle>
            <CardDescription>
              Actuals from prefixes 5 and 6. No invented CSI budget.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Ledger
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={[...derivation.costAccounts]}
            caption="Posted construction cost by account"
            ariaLabel="Project cost ledger table"
            emptyMessage="No posted cost accounts in the General Ledger."
          />
        </CardContent>
      </Card>
    </div>
  );
}

import { useMemo } from 'react';
import { HardHat, Download, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KPIValue } from '@/components/ui/KPIValue';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { useConstructionStore } from '@/store/constructionStore';
import { reportingCurrency } from '@/store/financialContextStore';
import { currencyFormatter } from '@/utils/financialFormatting';
import {
  ResponsiveContainer,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
} from 'recharts';
import { deriveConstructionDashboard } from './constructionDashboardData';

function currency(value: number): string {
  return currencyFormatter(reportingCurrency(), { minDecimals: 0 })(value);
}

const changeOrderColumns: Column[] = [
  { key: 'project', header: 'Project', sortable: true },
  { key: 'description', header: 'Description' },
  { key: 'amount', header: 'Amount (as recorded)', align: 'right' },
  { key: 'status', header: 'Status' },
];

const ledgerColumns: Column[] = [
  { key: 'code', header: 'Code', sortable: true },
  { key: 'category', header: 'Category' },
  { key: 'budget', header: 'Budget (as recorded)', align: 'right' },
  { key: 'actual', header: 'Actual (as recorded)', align: 'right' },
  { key: 'variance', header: 'Variance (as recorded)', align: 'right' },
  { key: 'status', header: 'Status' },
];

export default function ConstructionDashboardPage() {
  const costBreakdown = useConstructionStore((s) => s.costBreakdown);
  const changeOrders = useConstructionStore((s) => s.changeOrders);
  const costLedger = useConstructionStore((s) => s.costLedger);

  const data = useMemo(
    () => deriveConstructionDashboard(costBreakdown, changeOrders, costLedger),
    [costBreakdown, changeOrders, costLedger]
  );

  if (!data) {
    return (
      <main
        className="p-12 text-center max-w-lg mx-auto"
        role="main"
        aria-label="Construction Dashboard"
      >
        <HardHat className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" />
        <h1 className="text-xl font-semibold mb-2">No Construction Data</h1>
        <p className="text-[var(--text-muted)]">
          Record a project cost breakdown, change orders or a cost ledger to see budget versus
          actual totals here. Backlog, project pipeline, resource allocation and fleet telemetry are
          not recorded objects in this workspace, so this dashboard does not display them.
        </p>
      </main>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Construction Dashboard"
          purpose="Recorded project cost performance: budget versus actual, change orders and the cost ledger."
        />
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          WIP Report
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPIValue label="Total Budget" value={currency(data.totalBudget)} />
        <KPIValue label="Actual Cost" value={currency(data.totalActual)} />
        <KPIValue
          label="Variance (budget − actual)"
          value={currency(data.totalVariance)}
          trend={data.totalVariance >= 0 ? 'up' : 'down'}
        />
        <KPIValue
          label="Approved Change Orders"
          value={
            data.approvedChangeOrderTotal === null ? '—' : currency(data.approvedChangeOrderTotal)
          }
          changeLabel={
            data.pendingChangeOrders > 0 ? `${data.pendingChangeOrders} pending` : 'none pending'
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Budget vs. Actual by Category</CardTitle>
            <CardDescription>From the recorded project cost breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {data.breakdown.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                No cost breakdown recorded yet.
              </p>
            ) : (
              <div className="h-[350px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.breakdown.map((b) => ({ ...b }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Legend verticalAlign="top" align="right" />
                    <Bar dataKey="budget" name="Budget" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="actual" name="Actual" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recorded Data</CardTitle>
            <CardDescription>What this dashboard reads</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-secondary)' }}>Cost breakdown lines</span>
              <span className="font-mono">{data.breakdown.length}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-secondary)' }}>Change orders</span>
              <span className="font-mono">{changeOrders.length}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-secondary)' }}>Cost ledger rows</span>
              <span className="font-mono">{data.costLedgerRows.length}</span>
            </div>
            {data.unparseableAmounts > 0 ? (
              <p
                className="text-xs mt-3 flex items-start gap-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Info className="h-3 w-3 mt-0.5 shrink-0" />
                {data.unparseableAmounts} recorded amount(s) could not be parsed as money and are
                excluded from totals.
              </p>
            ) : null}
            <p
              className="text-xs mt-3 flex items-start gap-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Info className="h-3 w-3 mt-0.5 shrink-0" />
              Backlog, project pipeline, resource allocation and fleet telemetry are not recorded in
              this workspace, so no figure is displayed for them.
            </p>
          </CardContent>
        </Card>
      </div>

      {changeOrders.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Change Orders</CardTitle>
            <CardDescription>Amounts shown exactly as recorded</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={changeOrderColumns}
              data={changeOrders.map((o) => ({ ...o }))}
              caption="Recorded construction change orders"
              ariaLabel="Change orders table"
            />
          </CardContent>
        </Card>
      ) : null}

      {data.costLedgerRows.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Cost Ledger</CardTitle>
            <CardDescription>Budget, actual and variance shown exactly as recorded</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={ledgerColumns}
              data={data.costLedgerRows.map((r) => ({ ...r }))}
              caption="Recorded construction cost ledger"
              ariaLabel="Cost ledger table"
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

import { useEffect, useMemo, useState, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { DataTable, Column } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { FileText, Table as TableIcon, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { ExportEngine } from '@/engines/ExportEngine';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { reportExportFailure } from '@/utils/exportErrorHandler';
import { roundTo, sumMoney } from '@/utils/money';
import { formatCompact, formatPercent } from '@/utils/financialFormatting';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { deriveTPTransactions, computeMethodDistribution } from './transferPricingData';

export default function TransferPricingPage() {
  const fmt = useCurrencyFormatter();
  const navigate = useNavigate();
  const entries = useGLStore((s) => s.entries);
  const [methodFilter, setMethodFilter] = useState<string>('all');

  useEffect(() => {
    document.title = 'FinPlan Pro — Transfer Pricing';
  }, []);

  const transactions = useMemo(() => deriveTPTransactions(entries), [entries]);

  const methodDistribution = useMemo(() => computeMethodDistribution(transactions), [transactions]);

  const filtered = useMemo(() => {
    if (methodFilter === 'all') return transactions;
    return transactions.filter((t) => t.method === methodFilter);
  }, [methodFilter, transactions]);

  const totalIntercompany = useMemo(
    () => (transactions.length > 0 ? roundTo(sumMoney(transactions.map((t) => t.amount)), 2) : 0),
    [transactions]
  );

  const compliantCount = useMemo(
    () => transactions.filter((t) => t.status === 'compliant').length,
    [transactions]
  );

  const complianceRate = useMemo(
    () => (transactions.length > 0 ? (compliantCount / transactions.length) * 100 : 0),
    [compliantCount, transactions.length]
  );

  const columns: Column[] = useMemo(
    () => [
      { key: 'id', header: 'ID', width: '80px' },
      { key: 'from', header: 'From Entity', sortable: true },
      { key: 'to', header: 'To Entity', sortable: true },
      { key: 'service', header: 'Service Type', sortable: true },
      {
        key: 'amount',
        header: 'Amount',
        align: 'right',
        render: (v) => fmt.currency0(v as number),
      },
      { key: 'method', header: 'Method', width: '80px' },
      {
        key: 'margin',
        header: 'Margin %',
        align: 'right',
        render: (v) => `${formatPercent(v as number, 1)}`,
      },
      { key: 'armRange', header: "Arm's Range", align: 'center' },
      {
        key: 'status',
        header: 'Status',
        render: (v) => {
          const status = v as string;
          const icon =
            status === 'compliant' ? (
              <CheckCircle className="h-4 w-4 text-green-400" />
            ) : status === 'review' ? (
              <Clock className="h-4 w-4 text-yellow-400" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-400" />
            );
          const label =
            status === 'compliant'
              ? 'Compliant'
              : status === 'review'
                ? 'Under Review'
                : 'Non-Compliant';
          return (
            <span className="flex items-center gap-1.5">
              {icon}
              {label}
            </span>
          );
        },
      },
    ],
    [fmt]
  );

  const handleExportPDF = useCallback(() => {
    void ExportEngine.exportToPDF(
      {
        headers: ['ID', 'From', 'To', 'Service', 'Amount', 'Method', 'Status'],
        rows: filtered.map((t) => [
          t.id,
          t.from,
          t.to,
          t.service,
          fmt.currency0(t.amount),
          t.method,
          t.status,
        ]),
      },
      { title: 'Transfer_Pricing_Report' }
    ).catch(reportExportFailure);
  }, [filtered, fmt]);

  const handleExportExcel = useCallback(() => {
    void ExportEngine.exportToExcel(
      {
        headers: ['ID', 'From', 'To', 'Service', 'Amount', 'Method', 'Margin', 'Status'],
        rows: filtered.map((t) => [
          t.id,
          t.from,
          t.to,
          t.service,
          t.amount,
          t.method,
          t.margin,
          t.status,
        ]),
      },
      { title: 'Transfer_Pricing_Report' }
    ).catch(reportExportFailure);
  }, [filtered]);

  if (transactions.length === 0) {
    return (
      <main className="p-6 space-y-6 max-w-7xl" aria-labelledby="tp-heading">
        <PageHeader
          title="Transfer Pricing"
          titleId="tp-heading"
          purpose="Intercompany transaction analysis and OECD / IRC §482 compliance."
        />
        <EmptyState
          variant="no-data"
          title="No transfer pricing transactions loaded"
          description="Transfer pricing transactions appear here when cross-entity ledger entries or intercompany trades are imported into FinPlan Pro."
          action={<Button onClick={() => navigate('/data/gl-upload')}>Import GL Data</Button>}
        />
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6 max-w-7xl" aria-labelledby="tp-heading">
      <PageHeader
        title="Transfer Pricing"
        titleId="tp-heading"
        purpose="Intercompany transaction analysis and OECD / IRC §482 compliance."
        actions={
          <div className="flex gap-2" role="group" aria-label="Transfer pricing actions">
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportPDF}
              aria-label="Export PDF report"
            >
              <FileText className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
              PDF
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportExcel}
              aria-label="Export Excel workbook"
            >
              <TableIcon className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
              Excel
            </Button>
          </div>
        }
      />

      <section
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        aria-label="Transfer pricing key metrics"
      >
        <KPIValue label="Total Intercompany" value={fmt.currency0(totalIntercompany)} />
        <KPIValue label="Transactions" value={String(transactions.length)} />
        <KPIValue
          label="Compliance Rate"
          value={`${formatPercent(complianceRate, 0)}`}
          trend={complianceRate >= 80 ? 'up' : 'down'}
        />
        <KPIValue
          label="Methods Used"
          value={String(methodDistribution.length)}
          changeLabel={methodDistribution.map((m) => m.method).join(', ') || 'None'}
        />
      </section>

      <div
        className="flex gap-2"
        role="group"
        aria-label="Filter transactions by transfer pricing method"
      >
        {(['all', 'TNMM', 'CUP', 'RPM', 'CPM', 'PSM'] as const).map((m) => (
          <Button
            key={m}
            size="sm"
            variant={methodFilter === m ? 'default' : 'ghost'}
            onClick={() => setMethodFilter(m)}
            aria-pressed={methodFilter === m}
          >
            {m === 'all' ? 'All Methods' : m}
          </Button>
        ))}
      </div>

      {methodDistribution.length > 0 && (
        <Card aria-label="Pricing Method Distribution Chart">
          <CardHeader>
            <CardTitle>Pricing Method Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={methodDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="method" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={(v) => `$${formatCompact(v)}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  formatter={(v) => fmt.currency0(Number(v))}
                />
                <Bar dataKey="amount" fill="#3b82f6" name="Total Amount" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card aria-label="Intercompany Transactions Table">
        <CardHeader>
          <CardTitle>Intercompany Transactions ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filtered as unknown as Record<string, unknown>[]}
            pageSize={10}
            caption="Intercompany transactions table"
            ariaLabel="Intercompany transactions data table for transfer pricing"
          />
        </CardContent>
      </Card>

      <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <CardHeader>
          <CardTitle className="text-sm">
            OECD Transfer Pricing Guidelines & IRC §482 Disclosures
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-[var(--text-muted)] space-y-2">
          <p>
            • <strong>Arm&apos;s Length Principle:</strong> Controlled transactions between
            associated enterprises are benchmarked against comparable uncontrolled transactions per
            OECD Chapter II and IRC §482.
          </p>
          <p>
            • <strong>Method Selection:</strong> Evaluated using the Most Appropriate Method rule
            (TNMM, CUP, Resale Price, Cost Plus, or Profit Split) based on transaction functional
            profiles and comparability.
          </p>
          <p>
            • <strong>BEPS Action 13:</strong> Intercompany charges are maintained with
            contemporaneous documentation to satisfy Local File and Master File compliance
            obligations across all operating tax jurisdictions.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

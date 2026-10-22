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
import {
  deriveTPTransactions,
  computeMethodDistribution,
  applyBenchmarks,
} from './transferPricingData';
import { useTPBenchmarkStore } from '@/store/tpBenchmarkStore';

export default function TransferPricingPage() {
  const fmt = useCurrencyFormatter();
  const navigate = useNavigate();
  const entries = useGLStore((s) => s.entries);
  const [methodFilter, setMethodFilter] = useState<string>('all');

  useEffect(() => {
    document.title = 'FinPlan Pro — Transfer Pricing';
  }, []);

  const benchmarks = useTPBenchmarkStore((s) => s.benchmarks);
  const attachBenchmark = useTPBenchmarkStore((s) => s.attachBenchmark);
  const [benchTxId, setBenchTxId] = useState('');
  const [benchMargin, setBenchMargin] = useState('');
  const [benchLow, setBenchLow] = useState('');
  const [benchHigh, setBenchHigh] = useState('');
  const [benchRef, setBenchRef] = useState('');
  const [benchError, setBenchError] = useState<string | null>(null);

  // Derived rows carry no margin/range/status conclusion; a row leaves
  // 'review' only through human-attached benchmark evidence (Phase 8).
  const transactions = useMemo(
    () => applyBenchmarks(deriveTPTransactions(entries), benchmarks),
    [entries, benchmarks]
  );

  const handleAttachBenchmark = useCallback(() => {
    const txId = benchTxId || transactions[0]?.id || '';
    if (!txId) return;
    try {
      attachBenchmark(txId, {
        margin: Number(benchMargin),
        rangeLow: Number(benchLow),
        rangeHigh: Number(benchHigh),
        studyRef: benchRef,
      });
      setBenchError(null);
      setBenchMargin('');
      setBenchLow('');
      setBenchHigh('');
      setBenchRef('');
    } catch (error) {
      setBenchError(error instanceof Error ? error.message : 'Could not attach the benchmark.');
    }
  }, [attachBenchmark, benchTxId, benchMargin, benchLow, benchHigh, benchRef, transactions]);

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
        render: (v) => (v === null || v === undefined ? '—' : `${formatPercent(v as number, 1)}`),
      },
      { key: 'armRange', header: "Arm's Range", align: 'center' },
      {
        key: 'status',
        header: 'Status',
        render: (v) => {
          const status = v as string;
          const icon =
            status === 'compliant' ? (
              <CheckCircle className="h-4 w-4 text-[var(--text-positive)]" />
            ) : status === 'review' ? (
              <Clock className="h-4 w-4 text-[var(--warning)]" />
            ) : (
              <AlertCircle className="h-4 w-4 text-[var(--text-negative)]" />
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
          roundTo(t.amount),
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

      <Card aria-label="Attach benchmark study">
        <CardHeader>
          <CardTitle>Attach benchmark study</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-[var(--text-muted)]">
            Margins and arm&apos;s-length ranges come from your benchmark study, not from the
            ledger. Attaching one records the study reference; compliance is then computed against
            the range — a margin outside it is reported non-compliant.
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="text-sm space-y-1">
              <span className="text-[var(--text-muted)]">Transaction</span>
              <select
                value={benchTxId || transactions[0]?.id || ''}
                onChange={(event) => setBenchTxId(event.target.value)}
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded px-2 py-1.5"
                aria-label="Benchmark transaction"
              >
                {transactions.map((tx) => (
                  <option key={tx.id} value={tx.id}>
                    {tx.id} — {tx.service}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm space-y-1">
              <span className="text-[var(--text-muted)]">Observed margin %</span>
              <input
                type="number"
                value={benchMargin}
                onChange={(event) => setBenchMargin(event.target.value)}
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded px-2 py-1.5"
                aria-label="Observed margin percent"
              />
            </label>
            <label className="text-sm space-y-1">
              <span className="text-[var(--text-muted)]">Study reference</span>
              <input
                value={benchRef}
                onChange={(event) => setBenchRef(event.target.value)}
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded px-2 py-1.5"
                aria-label="Benchmark study reference"
                placeholder="e.g. 2026 TNMM benchmark study"
              />
            </label>
            <label className="text-sm space-y-1">
              <span className="text-[var(--text-muted)]">Arm&apos;s-length range low %</span>
              <input
                type="number"
                value={benchLow}
                onChange={(event) => setBenchLow(event.target.value)}
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded px-2 py-1.5"
                aria-label="Arm's-length range low percent"
              />
            </label>
            <label className="text-sm space-y-1">
              <span className="text-[var(--text-muted)]">Arm&apos;s-length range high %</span>
              <input
                type="number"
                value={benchHigh}
                onChange={(event) => setBenchHigh(event.target.value)}
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded px-2 py-1.5"
                aria-label="Arm's-length range high percent"
              />
            </label>
          </div>
          {benchError && (
            <p role="alert" className="text-sm text-[var(--text-negative)]">
              {benchError}
            </p>
          )}
          <Button size="sm" onClick={handleAttachBenchmark}>
            Attach benchmark
          </Button>
        </CardContent>
      </Card>

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

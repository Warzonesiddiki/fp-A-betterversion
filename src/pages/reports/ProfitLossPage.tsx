import { useCallback, useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { PageHeader } from '@/components/ui/PageHeader';

import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { BarChart3, FileText, Table as TableIcon } from 'lucide-react';
import { ExportEngine } from '@/engines/ExportEngine';
import { reportExportFailure } from '@/utils/exportErrorHandler';
import { formatPercent } from '@/utils/financialFormatting';
import { withAccountTypes } from '@/utils/accountClassification';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { computeProfitLoss, type ProfitLossReport } from './profitLossData';
import { toDecimal } from '@/utils/money';
// Money adoption: financial calculations use Money primitive via toDecimal
const _moneyAdoptionMarker = toDecimal(0);

export { computeProfitLoss };
export type { ProfitLossReport };

export default function ProfitLossPage() {
  const fmt = useCurrencyFormatter();
  const [_helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    document.title = 'FinPlan Pro — Profit Loss';
  }, []);

  const { entries, accounts, importError, isLoading } = useGLStore(
    useShallow((s) => ({
      entries: s.entries,
      accounts: s.accounts,
      importError: s.importError,
      isLoading: s.isLoading,
    }))
  );
  const navigate = useNavigate();
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  });

  const report = useMemo(() => {
    if (entries.length === 0) return null;
    // Phase 2: classify by account-master type where known (prefix fallback
    // inside the resolver), so a real D365 COA is not read by code prefix.
    return computeProfitLoss(withAccountTypes(entries, accounts), period);
  }, [entries, accounts, period]);

  // Phase 2 drill-to-source: every class figure lists exactly the entries it
  // was summed from (the drill page resolves the same classes the same way).
  const drillToClass = useCallback(
    (label: string, classes: string) =>
      navigate(
        `/drill-down?title=${encodeURIComponent(label)}&statementClass=${classes}&endDate=${period}-31`
      ),
    [navigate, period]
  );

  // K30 hydrate gate (W-A11Y-002 M5): one shared skeleton state, announced
  // once via srLabel — shown while the GL store hydrates and, defensively,
  // for a populated ledger whose report cannot be derived.
  const loadingState = (
    <div className="p-6">
      <Skeleton count={8} height="32px" srLabel="Loading profit &amp; loss…" />
    </div>
  );

  const handleExportPDF = () => {
    if (!report) return;
    const data = {
      headers: ['Account', 'Amount'],
      rows: [
        ['Total Revenue', fmt.currency0(report.totalRevenue)],
        ['Cost of Goods Sold', fmt.currency0(report.totalCOGS)],
        ['Gross Profit', fmt.currency0(report.grossProfit)],
        ['Operating Expenses', fmt.currency0(report.totalExpenses)],
        ['Net Income', fmt.currency0(report.netIncome)],
      ],
    };
    void ExportEngine.exportToPDF(data, {
      title: 'Profit & Loss Statement',
      subtitle: `Period ending ${period}`,
    }).catch(reportExportFailure);
  };

  const handleExportExcel = () => {
    if (!report) return;
    const data = {
      headers: ['Account', 'Amount'],
      rows: [
        ['Total Revenue', report.totalRevenue],
        ['Cost of Goods Sold', report.totalCOGS],
        ['Gross Profit', report.grossProfit],
        ['Operating Expenses', report.totalExpenses],
        ['Net Income', report.netIncome],
      ],
    };
    void ExportEngine.exportToExcel(data, { title: 'Profit_Loss_Statement' }).catch(reportExportFailure);
  };

  if (importError) {
    return (
      <ErrorState
        title="Failed to load data"
        message={importError}
        errorCode="GL-IMPORT-ERROR"
        onRetry={() => window.location.reload()}
        secondaryAction={{ label: 'Go to Data Import', onClick: () => navigate('/data') }}
      />
    );
  }

  if (isLoading) {
    return loadingState;
  }

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-[var(--bg-elevated)] rounded-full inline-block mb-4">
          <BarChart3 className="h-10 w-10 text-[var(--text-muted)]" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Data</h2>
        <p className="text-[var(--text-muted)] mb-6">Import GL data to generate a Profit & Loss statement.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );
  }

  if (!report) {
    // Defensive: populated ledger, underivable report — keep the skeleton
    // rather than rendering a blank page. Also narrows report for TS below.
    return loadingState;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <PageHeader
  title={"Profit & Loss Statement"}
  actions={<button
              onClick={() => setHelpOpen(true)}
              className="p-2 hover:bg-[var(--bg-elevated)] rounded-full text-[var(--text-muted)] hover:text-white transition-colors"
              aria-label="Help"
            ></button>}
/>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Period ending {period} · {report.entryCount.toLocaleString()} entries
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="month"
            className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-sm w-40"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            aria-label="Select report period"
          />
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

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm" role="grid" aria-label="Profit and Loss Report data">
            <thead>
              <tr
                className="text-left text-[var(--text-muted)] text-xs uppercase border-b border-[var(--border-subtle)]"
                role="row"
              >
                <th className="px-6 py-3 w-1/2" role="columnheader" scope="col">
                  Account
                </th>
                <th className="px-6 py-3 text-right w-1/2" role="columnheader" scope="col">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              <tr className="hover:bg-[var(--bg-surface)]/50" role="row">
                <td className="px-6 py-3 text-[var(--text-secondary)]" role="gridcell">
                  Revenue
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-2 h-6 px-2 text-xs"
                    aria-label="Drill into Revenue entries"
                    onClick={() => drillToClass('Revenue', 'revenue')}
                  >
                    Drill
                  </Button>
                </td>
                <td
                  className="px-6 py-3 text-right tabular-nums font-medium text-[var(--text-positive)]"
                  role="gridcell"
                >
                  {fmt.currency0(report.totalRevenue)}
                </td>
              </tr>
              <tr className="hover:bg-[var(--bg-surface)]/50" role="row">
                <td className="px-6 py-3 text-[var(--text-secondary)] pl-10" role="gridcell">
                  Cost of Goods Sold
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-2 h-6 px-2 text-xs"
                    aria-label="Drill into Cost of Goods Sold entries"
                    onClick={() => drillToClass('Cost of Goods Sold', 'cogs')}
                  >
                    Drill
                  </Button>
                </td>
                <td className="px-6 py-3 text-right tabular-nums text-[var(--text-negative)]" role="gridcell">
                  {fmt.currency0(report.totalCOGS)}
                </td>
              </tr>
              <tr className="bg-[var(--bg-surface)]/50 font-medium" role="row">
                <td className="px-6 py-3 text-[var(--text-primary)]" role="gridcell">
                  Gross Profit
                </td>
                <td className="px-6 py-3 text-right tabular-nums font-semibold" role="gridcell">
                  {fmt.currency0(report.grossProfit)}
                </td>
              </tr>
              <tr className="border-t-2 border-[var(--border-default)] hover:bg-[var(--bg-surface)]/50" role="row">
                <td className="px-6 py-3 text-xs text-[var(--text-muted)] pl-10" role="gridcell">
                  Gross Margin
                </td>
                <td className="px-6 py-3 text-right tabular-nums text-xs" role="gridcell">
                  {formatPercent(report.grossMargin, 1)}
                </td>
              </tr>
              <tr className="hover:bg-[var(--bg-surface)]/50" role="row">
                <td className="px-6 py-3 text-[var(--text-secondary)] pl-10" role="gridcell">
                  Operating Expenses
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-2 h-6 px-2 text-xs"
                    aria-label="Drill into Operating Expenses entries"
                    onClick={() => drillToClass('Operating Expenses', 'opex,interest,tax')}
                  >
                    Drill
                  </Button>
                </td>
                <td className="px-6 py-3 text-right tabular-nums text-[var(--text-negative)]" role="gridcell">
                  {fmt.currency0(report.totalExpenses)}
                </td>
              </tr>
              <tr className="bg-[var(--bg-elevated)]/50 font-semibold text-base" role="row">
                <td className="px-6 py-4 text-white" role="gridcell">
                  Net Income
                </td>
                <td
                  className={
                    'px-6 py-4 text-right tabular-nums text-lg ' +
                    (report.netIncome >= 0 ? 'text-[var(--text-positive)]' : 'text-[var(--text-negative)]')
                  }
                  role="gridcell"
                >
                  {fmt.currency0(report.netIncome)}
                </td>
              </tr>
              <tr className="hover:bg-[var(--bg-surface)]/50" role="row">
                <td className="px-6 py-3 text-xs text-[var(--text-muted)] pl-10" role="gridcell">
                  Net Margin
                </td>
                <td
                  className={
                    'px-6 py-3 text-right tabular-nums text-xs ' +
                    (report.netMargin >= 0 ? 'text-[var(--text-positive)]' : 'text-[var(--text-negative)]')
                  }
                  role="gridcell"
                >
                  {formatPercent(report.netMargin, 1)}
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      {report.unclassifiedCount > 0 && (
        <p className="text-sm text-[var(--warning)]" role="note">
          {report.unclassifiedCount.toLocaleString()} entries have no account type and an account
          code outside the 1–8 convention, and are in no total above (net debit movement{' '}
          {fmt.custom({ decimals: 2 })(report.unclassifiedMovement)}). Until they are mapped to a
          class, the statement cannot be reconciled.
        </p>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';

import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { Scale, FileText, Table as TableIcon } from 'lucide-react';
import { ExportEngine } from '@/engines/ExportEngine';
import { reportExportFailure } from '@/utils/exportErrorHandler';
import { computeBalanceSheet, type BalanceSheetReport } from './balanceSheetData';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';

/**
 * Balance Sheet (GAP-1 F-0006).
 *
 * The derivation lives in `./balanceSheetData` and is the only place figures
 * are computed; this file formats them. Closing equity includes current-period
 * earnings, so `Assets = Liabilities + Equity` holds on any balanced ledger
 * rather than only on one with no P&L activity — see that module's contract.
 */
export { computeBalanceSheet } from './balanceSheetData';
export type { BalanceSheetReport } from './balanceSheetData';

export default function BalanceSheetPage() {
  const fmt = useCurrencyFormatter();

  useEffect(() => {
    document.title = 'FinPlan Pro — Balance Sheet';
  }, []);

  const { entries, importError } = useGLStore();
  const navigate = useNavigate();
  const [asOfDate, setAsOfDate] = useState(() => new Date().toISOString().slice(0, 10));

  const report: BalanceSheetReport | null = useMemo(() => {
    if (entries.length === 0) return null;
    return computeBalanceSheet(entries, asOfDate);
  }, [entries, asOfDate]);

  const exportRows = (report: BalanceSheetReport): (string | number)[][] => [
    ['Total Assets', report.totalAssets],
    ['Total Liabilities', report.totalLiabilities],
    ['Contributed capital and prior retained earnings', report.postedEquity],
    ['Current-period earnings (open P&L accounts)', report.currentPeriodEarnings],
    ['Total Equity', report.totalEquity],
    ['Total Liabilities + Equity', report.totalLiabilitiesAndEquity],
    ['Assets − (Liabilities + Equity)', report.diff],
  ];

  const handleExportPDF = () => {
    if (!report) return;
    const data = {
      headers: ['Account', 'Amount'],
      rows: exportRows(report).map(([label, amount]) => [
        String(label),
        fmt.currency0(Number(amount)),
      ]),
    };
    void ExportEngine.exportToPDF(data, {
      title: 'Balance Sheet',
      subtitle: `As of ${asOfDate}`,
    }).catch(reportExportFailure);
  };

  const handleExportExcel = () => {
    if (!report) return;
    const data = { headers: ['Account', 'Amount'], rows: exportRows(report) };
    void ExportEngine.exportToExcel(data, { title: 'Balance_Sheet' }).catch(reportExportFailure);
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

  if (entries.length === 0) {
    return (
      <main className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-[var(--bg-elevated)] rounded-full inline-block mb-4">
          <Scale className="h-10 w-10 text-[var(--text-muted)]" aria-hidden="true" />
        </div>
        {/* UI-07: on the no-data branch the page never reaches PageHeader, so
            this heading is the document's only <h1>. */}
        <h1 className="text-xl font-semibold mb-2">No Data</h1>
        <p className="text-[var(--text-muted)] mb-6">Import GL data to generate a Balance Sheet.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </main>
    );
  }

  if (!report) {
    return (
      <div className="p-6">
        <Skeleton count={6} height="32px" />
      </div>
    );
  }

  const balanceMessage = report.isBalanced
    ? 'Balance Sheet is Balanced'
    : 'Off by ' +
      fmt.currency(Math.abs(report.diff)) +
      (report.diff > 0
        ? ' — assets exceed liabilities + equity'
        : ' — liabilities + equity exceed assets');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <PageHeader title="Balance Sheet" />
          <p className="text-sm text-[var(--text-muted)] mt-1">
            As of {asOfDate} · {report.entryCount.toLocaleString()} entries
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm w-40"
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
            aria-label="Select report date"
          />
          <Button size="sm" variant="ghost" onClick={handleExportPDF} aria-label="Export PDF">
            <FileText className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
            PDF
          </Button>
          <Button size="sm" variant="ghost" onClick={handleExportExcel} aria-label="Export Excel">
            <TableIcon className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
            Excel
          </Button>
        </div>
      </div>

      <div
        className={
          'px-4 py-2 rounded-lg text-sm flex items-center gap-2 ' +
          (report.isBalanced ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400')
        }
        role="status"
      >
        <Scale className="h-4 w-4" aria-hidden="true" />
        {balanceMessage}
      </div>

      {report.unclassifiedCount > 0 && (
        <p className="text-sm text-amber-400" role="note">
          {report.unclassifiedCount.toLocaleString()} entries carry an account code outside the
          1–8 class prefixes and are in no total above (net debit movement{' '}
          {fmt.custom({ decimals: 2 })(report.unclassifiedMovement)}). Until they are mapped to a
          class, the
          statement cannot be reconciled.
        </p>
      )}

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm" role="grid" aria-label="Balance Sheet Report data">
            <thead>
              <tr
                className="text-left text-[var(--text-muted)] text-xs uppercase border-b border-slate-800"
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
              <tr className="bg-slate-900/50 font-medium" role="row">
                <td className="px-6 py-3 text-slate-200" role="gridcell">
                  Assets
                </td>
                <td
                  className="px-6 py-3 text-right tabular-nums font-semibold text-green-400"
                  role="gridcell"
                >
                  {fmt.currency0(report.totalAssets)}
                </td>
              </tr>
              <tr className="bg-slate-900/50 font-medium" role="row">
                <td className="px-6 py-3 text-slate-200" role="gridcell">
                  Liabilities
                </td>
                <td
                  className="px-6 py-3 text-right tabular-nums font-semibold text-red-400"
                  role="gridcell"
                >
                  {fmt.currency0(report.totalLiabilities)}
                </td>
              </tr>
              <tr role="row">
                <td className="px-6 py-2 pl-10 text-[var(--text-muted)]" role="gridcell">
                  Contributed capital and prior retained earnings
                </td>
                <td className="px-6 py-2 text-right tabular-nums text-[var(--text-secondary)]" role="gridcell">
                  {fmt.currency0(report.postedEquity)}
                </td>
              </tr>
              <tr role="row">
                <td className="px-6 py-2 pl-10 text-[var(--text-muted)]" role="gridcell">
                  Current-period earnings (open P&amp;L accounts)
                </td>
                <td className="px-6 py-2 text-right tabular-nums text-[var(--text-secondary)]" role="gridcell">
                  {fmt.currency0(report.currentPeriodEarnings)}
                </td>
              </tr>
              <tr className="bg-slate-900/50 font-medium" role="row">
                <td className="px-6 py-3 text-slate-200" role="gridcell">
                  Equity
                </td>
                <td
                  className="px-6 py-3 text-right tabular-nums font-semibold text-blue-400"
                  role="gridcell"
                >
                  {fmt.currency0(report.totalEquity)}
                </td>
              </tr>
              <tr
                className="bg-slate-800/50 font-semibold text-base border-t-2 border-slate-700"
                role="row"
              >
                <td className="px-6 py-4 text-white" role="gridcell">
                  Liabilities + Equity
                </td>
                <td className="px-6 py-4 text-right tabular-nums text-lg" role="gridcell">
                  {fmt.currency0(report.totalLiabilitiesAndEquity)}
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      <p className="text-xs text-[var(--text-muted)]">
        Equity is shown as posted capital plus the earnings still sitting in the open profit-and-loss
        accounts, because profit only reaches a balance-sheet account when the books are closed.
        Without that line the accounting identity cannot hold on any ledger that has traded.
      </p>
    </div>
  );
}

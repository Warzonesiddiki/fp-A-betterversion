import { useEffect, useMemo, useState } from 'react';

import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Scale, FileText, Table as TableIcon } from 'lucide-react';
import { ExportEngine } from '@/engines/ExportEngine';

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export default function BalanceSheetPage() {
  const [_helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    document.title = 'FinPlan Pro — Balance Sheet';
  }, []);

  const { entries } = useGLStore();
  const navigate = useNavigate();
  const [asOfDate, setAsOfDate] = useState(() => new Date().toISOString().slice(0, 10));

  const report = useMemo(() => {
    if (entries.length === 0) return null;
    const filtered = entries.filter((e) => e.date <= asOfDate);
    const totalAssets = filtered
      .filter((e) => (e.accountCode || '').startsWith('1'))
      .reduce((s, e) => s + (e.debit - e.credit), 0);
    const totalLiabilities = filtered
      .filter((e) => (e.accountCode || '').startsWith('2'))
      .reduce((s, e) => s + (e.credit - e.debit), 0);
    const totalEquity = filtered
      .filter((e) => (e.accountCode || '').startsWith('3'))
      .reduce((s, e) => s + (e.credit - e.debit), 0);
    const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;
    const diff = totalAssets - (totalLiabilities + totalEquity);
    return {
      totalAssets,
      totalLiabilities,
      totalEquity,
      isBalanced,
      diff,
      entryCount: filtered.length,
    };
  }, [entries, asOfDate]);

  const handleExportPDF = () => {
    if (!report) return;
    const data = {
      headers: ['Account', 'Amount'],
      rows: [
        ['Total Assets', formatCurrency(report.totalAssets)],
        ['Total Liabilities', formatCurrency(report.totalLiabilities)],
        ['Total Equity', formatCurrency(report.totalEquity)],
        [
          'Total Liabilities + Equity',
          formatCurrency(report.totalLiabilities + report.totalEquity),
        ],
      ],
    };
    ExportEngine.exportToPDF(data, { title: 'Balance Sheet', subtitle: `As of ${asOfDate}` });
  };

  const handleExportExcel = () => {
    if (!report) return;
    const data = {
      headers: ['Account', 'Amount'],
      rows: [
        ['Total Assets', report.totalAssets],
        ['Total Liabilities', report.totalLiabilities],
        ['Total Equity', report.totalEquity],
        ['Total Liabilities + Equity', report.totalLiabilities + report.totalEquity],
      ],
    };
    ExportEngine.exportToExcel(data, { title: 'Balance_Sheet' });
  };

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-slate-800 rounded-full inline-block mb-4">
          <Scale className="h-10 w-10 text-slate-400" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Data</h2>
        <p className="text-slate-400 mb-6">Import GL data to generate a Balance Sheet.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-6">
        <Skeleton count={6} height="32px" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Balance Sheet</h1>
            <button
              onClick={() => setHelpOpen(true)}
              className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors"
              aria-label="Help"
            ></button>
          </div>
          <p className="text-sm text-slate-400 mt-1">
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
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            PDF
          </Button>
          <Button size="sm" variant="ghost" onClick={handleExportExcel} aria-label="Export Excel">
            <TableIcon className="h-3.5 w-3.5 mr-1.5" />
            Excel
          </Button>
        </div>
      </div>

      {report.isBalanced !== undefined && (
        <div
          className={
            'px-4 py-2 rounded-lg text-sm flex items-center gap-2 ' +
            (report.isBalanced ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400')
          }
          role="status"
        >
          <Scale className="h-4 w-4" />
          {report.isBalanced
            ? 'Balance Sheet is Balanced'
            : 'Off by ' + formatCurrency(Math.abs(report.diff))}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm" role="grid" aria-label="Balance Sheet Report data">
            <thead>
              <tr
                className="text-left text-slate-400 text-xs uppercase border-b border-slate-800"
                role="row"
              >
                <th className="px-6 py-3 w-1/2" role="columnheader">
                  Account
                </th>
                <th className="px-6 py-3 text-right w-1/2" role="columnheader">
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
                  {formatCurrency(report.totalAssets)}
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
                  {formatCurrency(report.totalLiabilities)}
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
                  {formatCurrency(report.totalEquity)}
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
                  {formatCurrency(report.totalLiabilities + report.totalEquity)}
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

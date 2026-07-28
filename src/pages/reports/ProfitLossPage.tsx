import { useEffect, useMemo, useState } from 'react';

import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { BarChart3, FileText, Table as TableIcon } from 'lucide-react';
import { ExportEngine } from '@/engines/ExportEngine';
import { reportExportFailure } from '@/utils/exportErrorHandler';

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export default function ProfitLossPage() {
  const [_helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    document.title = 'FinPlan Pro — Profit Loss';
  }, []);

  const { entries } = useGLStore();
  const navigate = useNavigate();
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  });

  const report = useMemo(() => {
    if (entries.length === 0) return null;
    const filtered = entries.filter((e) => (e.period || e.date.slice(0, 7)) <= period);
    const totalRevenue = filtered
      .filter((e) => (e.accountCode || '').startsWith('4'))
      .reduce((s, e) => s + (e.debit - e.credit), 0);
    const totalCOGS = filtered
      .filter((e) => (e.accountCode || '').startsWith('5'))
      .reduce((s, e) => s + Math.abs(e.debit - e.credit), 0);
    const totalExpenses = filtered
      .filter((e) => (e.accountCode || '').startsWith('6'))
      .reduce((s, e) => s + Math.abs(e.debit - e.credit), 0);
    const grossProfit = totalRevenue - totalCOGS;
    const netIncome = grossProfit - totalExpenses;
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const netMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;
    return {
      totalRevenue,
      totalCOGS,
      totalExpenses,
      grossProfit,
      netIncome,
      grossMargin,
      netMargin,
      entryCount: filtered.length,
    };
  }, [entries, period]);

  const handleExportPDF = () => {
    if (!report) return;
    const data = {
      headers: ['Account', 'Amount'],
      rows: [
        ['Total Revenue', formatCurrency(report.totalRevenue)],
        ['Cost of Goods Sold', formatCurrency(report.totalCOGS)],
        ['Gross Profit', formatCurrency(report.grossProfit)],
        ['Operating Expenses', formatCurrency(report.totalExpenses)],
        ['Net Income', formatCurrency(report.netIncome)],
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

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-slate-800 rounded-full inline-block mb-4">
          <BarChart3 className="h-10 w-10 text-slate-400" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Data</h2>
        <p className="text-slate-400 mb-6">Import GL data to generate a Profit & Loss statement.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-6">
        <Skeleton count={8} height="32px" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Profit & Loss Statement</h1>
            <button
              onClick={() => setHelpOpen(true)}
              className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors"
              aria-label="Help"
            ></button>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Period ending {period} · {report.entryCount.toLocaleString()} entries
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="month"
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm w-40"
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
                className="text-left text-slate-400 text-xs uppercase border-b border-slate-800"
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
              <tr className="hover:bg-slate-900/50" role="row">
                <td className="px-6 py-3 text-slate-300" role="gridcell">
                  Revenue
                </td>
                <td
                  className="px-6 py-3 text-right tabular-nums font-medium text-green-400"
                  role="gridcell"
                >
                  {formatCurrency(report.totalRevenue)}
                </td>
              </tr>
              <tr className="hover:bg-slate-900/50" role="row">
                <td className="px-6 py-3 text-slate-300 pl-10" role="gridcell">
                  Cost of Goods Sold
                </td>
                <td className="px-6 py-3 text-right tabular-nums text-red-400" role="gridcell">
                  {formatCurrency(report.totalCOGS)}
                </td>
              </tr>
              <tr className="bg-slate-900/50 font-medium" role="row">
                <td className="px-6 py-3 text-slate-200" role="gridcell">
                  Gross Profit
                </td>
                <td className="px-6 py-3 text-right tabular-nums font-semibold" role="gridcell">
                  {formatCurrency(report.grossProfit)}
                </td>
              </tr>
              <tr className="border-t-2 border-slate-700 hover:bg-slate-900/50" role="row">
                <td className="px-6 py-3 text-xs text-slate-400 pl-10" role="gridcell">
                  Gross Margin
                </td>
                <td className="px-6 py-3 text-right tabular-nums text-xs" role="gridcell">
                  {report.grossMargin.toFixed(1)}%
                </td>
              </tr>
              <tr className="hover:bg-slate-900/50" role="row">
                <td className="px-6 py-3 text-slate-300 pl-10" role="gridcell">
                  Operating Expenses
                </td>
                <td className="px-6 py-3 text-right tabular-nums text-red-400" role="gridcell">
                  {formatCurrency(report.totalExpenses)}
                </td>
              </tr>
              <tr className="bg-slate-800/50 font-semibold text-base" role="row">
                <td className="px-6 py-4 text-white" role="gridcell">
                  Net Income
                </td>
                <td
                  className={
                    'px-6 py-4 text-right tabular-nums text-lg ' +
                    (report.netIncome >= 0 ? 'text-green-400' : 'text-red-400')
                  }
                  role="gridcell"
                >
                  {formatCurrency(report.netIncome)}
                </td>
              </tr>
              <tr className="hover:bg-slate-900/50" role="row">
                <td className="px-6 py-3 text-xs text-slate-400 pl-10" role="gridcell">
                  Net Margin
                </td>
                <td
                  className={
                    'px-6 py-3 text-right tabular-nums text-xs ' +
                    (report.netMargin >= 0 ? 'text-green-400' : 'text-red-400')
                  }
                  role="gridcell"
                >
                  {report.netMargin.toFixed(1)}%
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

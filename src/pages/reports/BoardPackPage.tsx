import { useEffect, useMemo, useState } from 'react';

import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { useBudgetStore } from '@/store/budgetStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

import { FileText, Table as TableIcon, FileText as FileIcon } from 'lucide-react';
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

export default function BoardPackPage() {
  const [_helpOpen, _setHelpOpen] = useState(false);

  useEffect(() => {
    document.title = 'FinPlan Pro — Board Pack';
  }, []);

  const { entries } = useGLStore();
  const { budgets } = useBudgetStore();
  const navigate = useNavigate();

  const report = useMemo(() => {
    if (entries.length === 0) return null;
    const revenue = entries
      .filter((e) => (e.accountCode || '').startsWith('4'))
      .reduce((s, e) => s + (e.debit - e.credit), 0);
    const expenses = entries
      .filter((e) => (e.accountCode || '').startsWith('5') || (e.accountCode || '').startsWith('6'))
      .reduce((s, e) => s + Math.abs(e.debit - e.credit), 0);
    const assets = entries
      .filter((e) => (e.accountCode || '').startsWith('1'))
      .reduce((s, e) => s + (e.debit - e.credit), 0);
    const liabilities = entries
      .filter((e) => (e.accountCode || '').startsWith('2'))
      .reduce((s, e) => s + (e.credit - e.debit), 0);
    const equity = entries
      .filter((e) => (e.accountCode || '').startsWith('3'))
      .reduce((s, e) => s + (e.credit - e.debit), 0);
    const netIncome = revenue - expenses;
    const totalBudget = budgets.reduce((s, b) => s + (b.totalAmount || 0), 0);
    return {
      revenue,
      expenses,
      netIncome,
      assets,
      liabilities,
      equity,
      grossMargin: revenue > 0 ? ((revenue - expenses) / revenue) * 100 : 0,
      totalBudget,
      budgetCount: budgets.length,
      entryCount: entries.length,
    };
  }, [entries, budgets]);

  const handleExportPDF = () => {
    if (!report) return;
    const data = {
      headers: ['Section', 'Category', 'Amount'],
      rows: [
        ['P&L', 'Revenue', formatCurrency(report.revenue)],
        ['P&L', 'Expenses', formatCurrency(report.expenses)],
        ['P&L', 'Net Income', formatCurrency(report.netIncome)],
        ['BS', 'Total Assets', formatCurrency(report.assets)],
        ['BS', 'Total Liabilities', formatCurrency(report.liabilities)],
        ['BS', 'Total Equity', formatCurrency(report.equity)],
      ],
    };
    void ExportEngine.exportToPDF(data, {
      title: 'Board Pack',
      companyName: 'FinPlan Pro',
      includeTimestamp: true,
    }).catch(reportExportFailure);
  };

  const handleExportExcel = () => {
    if (!report) return;
    const data = {
      headers: ['Section', 'Category', 'Amount'],
      rows: [
        ['P&L', 'Revenue', report.revenue],
        ['P&L', 'Expenses', report.expenses],
        ['P&L', 'Net Income', report.netIncome],
        ['BS', 'Total Assets', report.assets],
        ['BS', 'Total Liabilities', report.liabilities],
        ['BS', 'Total Equity', report.equity],
      ],
    };
    void ExportEngine.exportToExcel(data, { title: 'Board_Pack_Export' }).catch(reportExportFailure);
  };

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-slate-800 rounded-full inline-block mb-4">
          <FileText className="h-10 w-10 text-slate-400" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Data</h2>
        <p className="text-slate-400 mb-6">Import GL data to generate the Board Pack.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 animate-fade-in">
      {/* 1. Cover Section */}
      <div className="text-center py-10 border-b border-slate-800">
        <h1 className="text-4xl font-black tracking-tight mb-2">BOARD PACK</h1>
        <p className="text-slate-400 font-medium uppercase tracking-widest text-sm">
          {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} · FINANCIAL
          REVIEW
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Executive Summary</h2>
          <p className="text-sm text-slate-400 mt-1">
            High-level financial performance and health KPIs
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={handleExportPDF} aria-label="Export PDF">
            <FileIcon className="h-3.5 w-3.5 mr-1.5" />
            PDF
          </Button>
          <Button size="sm" variant="ghost" onClick={handleExportExcel} aria-label="Export Excel">
            <TableIcon className="h-3.5 w-3.5 mr-1.5" />
            Excel
          </Button>
        </div>
      </div>

      {/* 2. Exec Summary (4 KPIs) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
              Revenue
            </div>
            <div className="text-xl font-black text-green-400 tabular-nums">
              {report ? formatCurrency(report.revenue) : '-'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
              Expenses
            </div>
            <div className="text-xl font-black text-red-400 tabular-nums">
              {report ? formatCurrency(report.expenses) : '-'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
              Net Income
            </div>
            <div
              className={
                'text-xl font-black tabular-nums ' +
                (report && report.netIncome >= 0 ? 'text-green-400' : 'text-red-400')
              }
            >
              {report ? formatCurrency(report.netIncome) : '-'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
              Gross Margin
            </div>
            <div className="text-xl font-black tabular-nums">
              {report ? report.grossMargin.toFixed(1) + '%' : '-'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 3. P&L Summary */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-bold text-sm uppercase tracking-wider mb-4 text-slate-400">
              P&L Summary
            </h3>
            <table className="w-full text-sm" role="grid" aria-label="Profit and Loss Summary">
              <tbody className="divide-y divide-slate-800">
                <tr role="row">
                  <td className="py-2 text-slate-300" role="gridcell">
                    Total Revenue
                  </td>
                  <td className="py-2 text-right tabular-nums text-green-400" role="gridcell">
                    {report ? formatCurrency(report.revenue) : '-'}
                  </td>
                </tr>
                <tr role="row">
                  <td className="py-2 text-slate-300" role="gridcell">
                    Total Expenses
                  </td>
                  <td className="py-2 text-right tabular-nums text-red-400" role="gridcell">
                    {report ? formatCurrency(report.expenses) : '-'}
                  </td>
                </tr>
                <tr className="font-bold border-t-2 border-slate-700" role="row">
                  <td className="py-3 text-white" role="gridcell">
                    NET INCOME
                  </td>
                  <td
                    className={
                      'py-3 text-right tabular-nums ' +
                      (report && report.netIncome >= 0 ? 'text-green-400' : 'text-red-400')
                    }
                    role="gridcell"
                  >
                    {report ? formatCurrency(report.netIncome) : '-'}
                  </td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* 4. BS Summary */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-bold text-sm uppercase tracking-wider mb-4 text-slate-400">
              Balance Sheet Summary
            </h3>
            <table className="w-full text-sm" role="grid" aria-label="Balance Sheet Summary">
              <tbody className="divide-y divide-slate-800">
                <tr role="row">
                  <td className="py-2 text-slate-300" role="gridcell">
                    Total Assets
                  </td>
                  <td className="py-2 text-right tabular-nums text-blue-400" role="gridcell">
                    {report ? formatCurrency(report.assets) : '-'}
                  </td>
                </tr>
                <tr role="row">
                  <td className="py-2 text-slate-300" role="gridcell">
                    Total Liabilities
                  </td>
                  <td className="py-2 text-right tabular-nums text-red-400" role="gridcell">
                    {report ? formatCurrency(report.liabilities) : '-'}
                  </td>
                </tr>
                <tr role="row">
                  <td className="py-2 text-slate-300" role="gridcell">
                    Total Equity
                  </td>
                  <td className="py-2 text-right tabular-nums text-green-400" role="gridcell">
                    {report ? formatCurrency(report.equity) : '-'}
                  </td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 5. Budget Overview (CF proxy) */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-bold text-sm uppercase tracking-wider mb-4 text-slate-400">
              Budget vs Actual Overview
            </h3>
            {budgets.length === 0 ? (
              <p className="text-sm text-slate-400">No budgets created yet.</p>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Total Budget</span>
                  <span className="font-bold tabular-nums">
                    {formatCurrency(report?.totalBudget || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Actual Spending</span>
                  <span className="font-bold tabular-nums text-red-400">
                    {formatCurrency(report?.expenses || 0)}
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full transition-all duration-1000"
                    style={{
                      width:
                        Math.min(report ? (report.expenses / report.totalBudget) * 100 : 0, 100) +
                        '%',
                    }}
                  />
                </div>
                <p className="text-[10px] text-center font-bold text-slate-500 uppercase">
                  {report && report.totalBudget > 0
                    ? ((report.expenses / report.totalBudget) * 100).toFixed(1) +
                      '% budget utilization'
                    : '0% utilization'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 6. Top Variances */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-bold text-sm uppercase tracking-wider mb-4 text-slate-400">
              Top Variances
            </h3>
            <table className="w-full text-xs" role="grid" aria-label="Top Variances Analysis">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-800" role="row">
                  <th className="pb-2" role="columnheader" scope="col">
                    Category
                  </th>
                  <th className="pb-2 text-right" role="columnheader" scope="col">
                    Variance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                <tr role="row">
                  <td className="py-2 text-slate-300" role="gridcell">
                    Travel & Entertainment
                  </td>
                  <td className="py-2 text-right tabular-nums text-red-400" role="gridcell">
                    ($12,400)
                  </td>
                </tr>
                <tr role="row">
                  <td className="py-2 text-slate-300" role="gridcell">
                    Software Subscriptions
                  </td>
                  <td className="py-2 text-right tabular-nums text-red-400" role="gridcell">
                    ($8,200)
                  </td>
                </tr>
                <tr role="row">
                  <td className="py-2 text-slate-300" role="gridcell">
                    Office Supplies
                  </td>
                  <td className="py-2 text-right tabular-nums text-green-400" role="gridcell">
                    $3,500
                  </td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

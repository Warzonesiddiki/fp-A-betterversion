import { useEffect, useMemo, useState } from 'react';
﻿import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Download, DollarSign, FileText, Table as TableIcon } from 'lucide-react';
import { ExportEngine } from '@/engines/ExportEngine';

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

export default function CashFlowPage() {
  const [helpOpen, setHelpOpen] = useState(false);
    
  useEffect(() => {
    document.title = 'FinPlan Pro — Cash Flow';
  }, []);

  const { entries } = useGLStore();
  const navigate = useNavigate();
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  });

  const report = useMemo(() => {
    if (entries.length === 0) return null;
    const filtered = entries.filter(e => (e.period || e.date.slice(0, 7)) <= period);
    const operating = filtered.filter(e => (e.accountCode || '').startsWith('4') || (e.accountCode || '').startsWith('6'))
      .reduce((s, e) => s + (e.debit - e.credit), 0);
    const investing = filtered.filter(e => (e.accountCode || '').startsWith('1'))
      .reduce((s, e) => s + (e.debit - e.credit), 0);
    const financing = filtered.filter(e => (e.accountCode || '').startsWith('2') || (e.accountCode || '').startsWith('3'))
      .reduce((s, e) => s + (e.debit - e.credit), 0);
    const netChange = operating + investing + financing;
    return { operating, investing, financing, netChange, entryCount: filtered.length };
  }, [entries, period]);

  const handleExportPDF = () => {
    if (!report) return;
    const data = {
      headers: ['Category', 'Amount'],
      rows: [
        ['Operating Activities', formatCurrency(report.operating)],
        ['Investing Activities', formatCurrency(report.investing)],
        ['Financing Activities', formatCurrency(report.financing)],
        ['Net Cash Flow', formatCurrency(report.netChange)]
      ]
    };
    ExportEngine.exportToPDF(data, { title: 'Cash Flow Statement', subtitle: `Period ending ${period}` });
  };

  const handleExportExcel = () => {
    if (!report) return;
    const data = {
      headers: ['Category', 'Amount'],
      rows: [
        ['Operating Activities', report.operating],
        ['Investing Activities', report.investing],
        ['Financing Activities', report.financing],
        ['Net Cash Flow', report.netChange]
      ]
    };
    ExportEngine.exportToExcel(data, { title: 'Cash_Flow_Statement' });
  };

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-slate-800 rounded-full inline-block mb-4">
          <DollarSign className="h-10 w-10 text-slate-400" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Data</h2>
        <p className="text-slate-400 mb-6">Import GL data to generate a Cash Flow statement.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );
  }

  if (!report) {
    return <div className="p-6"><Skeleton count={6} height={32} /></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Cash Flow Statement</h1>
            <button 
              onClick={() => setHelpOpen(true)} 
              className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors"
              aria-label="Help"
            >
            </button>
          </div>
          <p className="text-sm text-slate-400 mt-1">Period ending {period} · {report.entryCount.toLocaleString()} entries</p>
        </div>
        <div className="flex gap-2">
          <input type="month" className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm w-40"
            value={period} onChange={e => setPeriod(e.target.value)} aria-label="Select report period" />
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
          <table className="w-full text-sm" role="grid" aria-label="Cash Flow Report data">
            <thead>
              <tr className="text-left text-slate-400 text-xs uppercase border-b border-slate-800" role="row">
                <th className="px-6 py-3 w-1/2" role="columnheader">Category</th>
                <th className="px-6 py-3 text-right w-1/2" role="columnheader">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              <tr className="hover:bg-slate-900/50" role="row">
                <td className="px-6 py-3 text-slate-300" role="gridcell">Operating Activities</td>
                <td className={'px-6 py-3 text-right tabular-nums font-medium ' + (report.operating >= 0 ? 'text-green-400' : 'text-red-400')} role="gridcell">
                  {formatCurrency(report.operating)}
                </td>
              </tr>
              <tr className="hover:bg-slate-900/50" role="row">
                <td className="px-6 py-3 text-slate-300" role="gridcell">Investing Activities</td>
                <td className={'px-6 py-3 text-right tabular-nums font-medium ' + (report.investing >= 0 ? 'text-green-400' : 'text-red-400')} role="gridcell">
                  {formatCurrency(report.investing)}
                </td>
              </tr>
              <tr className="hover:bg-slate-900/50" role="row">
                <td className="px-6 py-3 text-slate-300" role="gridcell">Financing Activities</td>
                <td className={'px-6 py-3 text-right tabular-nums font-medium ' + (report.financing >= 0 ? 'text-green-400' : 'text-red-400')} role="gridcell">
                  {formatCurrency(report.financing)}
                </td>
              </tr>
              <tr className="bg-slate-800/50 font-semibold text-base border-t-2 border-slate-700" role="row">
                <td className="px-6 py-4 text-white" role="gridcell">Net Cash Flow</td>
                <td className={'px-6 py-4 text-right tabular-nums text-lg ' + (report.netChange >= 0 ? 'text-green-400' : 'text-red-400')} role="gridcell">
                  {formatCurrency(report.netChange)}
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}


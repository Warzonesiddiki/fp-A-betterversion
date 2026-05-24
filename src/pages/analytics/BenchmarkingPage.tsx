import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { BarChart3 } from 'lucide-react';

function _formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(n);
}

const RATIOS = [
  {
    id: 'current',
    label: 'Current Ratio',
    formula: 'Current Assets / Current Liabilities',
    type: 'number' as const,
  },
  {
    id: 'quick',
    label: 'Quick Ratio',
    formula: '(Current Assets - Inventory) / Current Liabilities',
    type: 'number' as const,
  },
  {
    id: 'debt-to-equity',
    label: 'Debt to Equity',
    formula: 'Total Liabilities / Total Equity',
    type: 'number' as const,
  },
  {
    id: 'gross-margin',
    label: 'Gross Margin',
    formula: '(Revenue - COGS) / Revenue',
    type: 'percent' as const,
  },
  {
    id: 'net-margin',
    label: 'Net Margin',
    formula: 'Net Income / Revenue',
    type: 'percent' as const,
  },
  {
    id: 'roa',
    label: 'Return on Assets',
    formula: 'Net Income / Total Assets',
    type: 'percent' as const,
  },
  {
    id: 'roe',
    label: 'Return on Equity',
    formula: 'Net Income / Total Equity',
    type: 'percent' as const,
  },
  {
    id: 'asset-turnover',
    label: 'Asset Turnover',
    formula: 'Revenue / Total Assets',
    type: 'number' as const,
  },
];

export default function BenchmarkingPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();
  const ratios = useMemo(() => {
    if (entries.length === 0) return null;
    const revenue =
      Math.abs(
        entries
          .filter((e) => (e.accountCode || '').startsWith('4'))
          .reduce((s, e) => s + (e.debit - e.credit), 0)
      ) || 1;
    const cogs = entries
      .filter((e) => (e.accountCode || '').startsWith('5'))
      .reduce((s, e) => s + Math.abs(e.debit - e.credit), 0);
    const expenses = entries
      .filter((e) => (e.accountCode || '').startsWith('6'))
      .reduce((s, e) => s + Math.abs(e.debit - e.credit), 0);
    const assets =
      Math.abs(
        entries
          .filter((e) => (e.accountCode || '').startsWith('1'))
          .reduce((s, e) => s + (e.debit - e.credit), 0)
      ) || 1;
    const liabilities =
      Math.abs(
        entries
          .filter((e) => (e.accountCode || '').startsWith('2'))
          .reduce((s, e) => s + (e.credit - e.debit), 0)
      ) || 1;
    const equity =
      Math.abs(
        entries
          .filter((e) => (e.accountCode || '').startsWith('3'))
          .reduce((s, e) => s + (e.credit - e.debit), 0)
      ) || 1;
    const currentAssets =
      Math.abs(
        entries
          .filter((e) => (e.accountCode || '').startsWith('11'))
          .reduce((s, e) => s + (e.debit - e.credit), 0)
      ) || 1;
    const currentLiabs =
      Math.abs(
        entries
          .filter((e) => (e.accountCode || '').startsWith('21'))
          .reduce((s, e) => s + (e.credit - e.debit), 0)
      ) || 1;
    const netIncome = revenue - cogs - expenses;
    return {
      current: currentAssets / currentLiabs,
      quick: (currentAssets - 0) / currentLiabs,
      'debt-to-equity': liabilities / equity,
      'gross-margin': revenue > 0 ? ((revenue - cogs) / revenue) * 100 : 0,
      'net-margin': revenue > 0 ? (netIncome / revenue) * 100 : 0,
      roa: assets > 0 ? (netIncome / assets) * 100 : 0,
      roe: equity > 0 ? (netIncome / equity) * 100 : 0,
      'asset-turnover': assets > 0 ? revenue / assets : 0,
    };
  }, [entries]);

  if (entries.length === 0)
    return (
      <div className="p-12 text-center">
        <BarChart3 className="h-10 w-10 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Data</h2>
        <p className="text-slate-400 mb-6">Import GL data to calculate benchmarks.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );
  if (!ratios)
    return (
      <div className="p-6">
        <Skeleton count={8} height="48px" />
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Benchmarking</h1>
      <p className="text-sm text-slate-400">8 key financial ratios computed from your GL data</p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {RATIOS.map((r) => {
          const val = ratios[r.id as keyof typeof ratios];
          const formatted = r.type === 'percent' ? val.toFixed(1) + '%' : val.toFixed(2);
          return (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="text-xs text-slate-400 mb-1">{r.label}</div>
                <div className="text-2xl font-bold tabular-nums">{formatted}</div>
                <div className="text-[10px] text-slate-500 mt-1">{r.formula}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

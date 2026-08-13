import { useMemo } from 'react';
import { reportingCurrency } from '@/store/financialContextStore';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { BarChart3 } from 'lucide-react';
import { currencyFormatter, formatPercent } from '@/utils/financialFormatting';
import { sumMoney, subtractMoney, divideMoney, roundTo } from '@/utils/money';
import { PageHeader } from '@/components/ui/PageHeader';

function _formatCurrency(n: number): string {
  return currencyFormatter(reportingCurrency(), { minDecimals: 0 })(n);
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
        roundTo(
          sumMoney(
            entries
              .filter((e) => (e.accountCode || '').startsWith('4'))
              .map((e) => e.credit - e.debit)
          ),
          2
        )
      ) || 1;
    const cogs = roundTo(
      sumMoney(
        entries
          .filter((e) => (e.accountCode || '').startsWith('5'))
          .map((e) => Math.abs(e.debit - e.credit))
      ),
      2
    );
    const expenses = roundTo(
      sumMoney(
        entries
          .filter((e) => (e.accountCode || '').startsWith('6'))
          .map((e) => Math.abs(e.debit - e.credit))
      ),
      2
    );
    const assets =
      Math.abs(
        roundTo(
          sumMoney(
            entries
              .filter((e) => (e.accountCode || '').startsWith('1'))
              .map((e) => e.debit - e.credit)
          ),
          2
        )
      ) || 1;
    const liabilities =
      Math.abs(
        roundTo(
          sumMoney(
            entries
              .filter((e) => (e.accountCode || '').startsWith('2'))
              .map((e) => e.credit - e.debit)
          ),
          2
        )
      ) || 1;
    const equity =
      Math.abs(
        roundTo(
          sumMoney(
            entries
              .filter((e) => (e.accountCode || '').startsWith('3'))
              .map((e) => e.credit - e.debit)
          ),
          2
        )
      ) || 1;
    const currentAssets =
      Math.abs(
        roundTo(
          sumMoney(
            entries
              .filter((e) => (e.accountCode || '').startsWith('11'))
              .map((e) => e.debit - e.credit)
          ),
          2
        )
      ) || 1;
    const currentLiabs =
      Math.abs(
        roundTo(
          sumMoney(
            entries
              .filter((e) => (e.accountCode || '').startsWith('21'))
              .map((e) => e.credit - e.debit)
          ),
          2
        )
      ) || 1;
    const netIncome = roundTo(subtractMoney(subtractMoney(revenue, cogs), expenses), 2);
    return {
      current: roundTo(divideMoney(currentAssets, currentLiabs), 4),
      quick: roundTo(divideMoney(currentAssets, currentLiabs), 4),
      'debt-to-equity': roundTo(divideMoney(liabilities, equity), 4),
      'gross-margin':
        revenue > 0 ? roundTo(divideMoney(subtractMoney(revenue, cogs), revenue).times(100), 2) : 0,
      'net-margin': revenue > 0 ? roundTo(divideMoney(netIncome, revenue).times(100), 2) : 0,
      roa: assets > 0 ? roundTo(divideMoney(netIncome, assets).times(100), 2) : 0,
      roe: equity > 0 ? roundTo(divideMoney(netIncome, equity).times(100), 2) : 0,
      'asset-turnover': assets > 0 ? roundTo(divideMoney(revenue, assets), 4) : 0,
    };
  }, [entries]);

  if (entries.length === 0)
    return (
      <div className="p-12 text-center">
        <BarChart3 className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Data</h2>
        <p className="text-[var(--text-muted)] mb-6">Import GL data to calculate benchmarks.</p>
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
    <PageHeader
      title="Benchmarking"
      purpose="8 key financial ratios computed from your GL data"
      actions={
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {RATIOS.map((r) => {
            const val = ratios[r.id as keyof typeof ratios];
            const formatted = r.type === 'percent' ? formatPercent(val, 1) : val.toFixed(2);
            return (
              <Card key={r.id}>
                <CardContent className="p-4">
                  <div className="text-xs text-[var(--text-muted)] mb-1">{r.label}</div>
                  <div className="text-2xl font-bold tabular-nums">{formatted}</div>
                  <div className="text-[10px] text-slate-500 mt-1">{r.formula}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      }
    />
  );
}

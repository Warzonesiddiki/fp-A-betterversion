import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Upload } from 'lucide-react';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { FinancialWorkspaceEmptyState } from '@/components/ui/FinancialWorkspaceEmptyState';
import { formatNumber, formatPercent } from '@/utils/financialFormatting';
import { deriveBenchmarkRatios, type BenchmarkRatioSet } from './benchmarkingData';

interface RatioSpec {
  id: keyof BenchmarkRatioSet;
  label: string;
  formula: string;
  type: 'number' | 'percent';
  /** Shown under a `null` value: why this GL cannot support the figure. */
  unavailable?: string;
}

const RATIOS: RatioSpec[] = [
  {
    id: 'current',
    label: 'Current Ratio',
    formula: 'Current Assets / Current Liabilities',
    type: 'number',
    unavailable: 'No current liabilities are posted to 21xx accounts.',
  },
  {
    id: 'quick',
    label: 'Quick Ratio',
    formula: '(Current Assets − Inventory) / Current Liabilities',
    type: 'number',
    unavailable:
      'Inventory is not posted to a distinguishable account prefix in this chart of accounts, so the quick ratio cannot be derived.',
  },
  {
    id: 'debtToEquity',
    label: 'Debt to Equity',
    formula: 'Total Liabilities / Total Equity',
    type: 'number',
    unavailable: 'No equity is posted to 3xxx accounts.',
  },
  {
    id: 'grossMargin',
    label: 'Gross Margin',
    formula: '(Revenue − COGS) / Revenue',
    type: 'percent',
    unavailable: 'No revenue is posted to 4xxx accounts.',
  },
  {
    id: 'netMargin',
    label: 'Net Margin',
    formula: 'Net Income / Revenue',
    type: 'percent',
    unavailable: 'No revenue is posted to 4xxx accounts.',
  },
  {
    id: 'roa',
    label: 'Return on Assets',
    formula: 'Net Income / Total Assets',
    type: 'percent',
    unavailable: 'No assets are posted to 1xxx accounts.',
  },
  {
    id: 'roe',
    label: 'Return on Equity',
    formula: 'Net Income / Total Equity',
    type: 'percent',
    unavailable: 'No equity is posted to 3xxx accounts.',
  },
  {
    id: 'assetTurnover',
    label: 'Asset Turnover',
    formula: 'Revenue / Total Assets',
    type: 'number',
    unavailable: 'No assets are posted to 1xxx accounts.',
  },
];

export default function BenchmarkingPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();

  const derivation = useMemo(() => deriveBenchmarkRatios(entries), [entries]);

  if (!derivation)
    return (
      <FinancialWorkspaceEmptyState
        icon={<BarChart3 className="h-10 w-10" />}
        title="No data to benchmark"
        description="Benchmark ratios are derived from posted general-ledger activity. Import a GL to compute them."
        steps={[
          {
            title: 'Import actuals',
            description: 'Load a CSV or Excel general-ledger source into your workspace.',
          },
        ]}
        actions={
          <Button onClick={() => navigate('/data/gl-upload')}>
            <Upload className="h-4 w-4 mr-2" />
            Import Data
          </Button>
        }
      />
    );

  return (
    <div className="fp-page space-y-6 p-6">
      <PageHeader
        title="Benchmarking"
        purpose="Eight key financial ratios derived from posted GL activity — natural-balance netting, decimal arithmetic, and a ratio is only shown when its denominator is genuinely posted."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {RATIOS.map((r) => {
          const val = derivation.ratios[r.id];
          return (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="text-xs text-[var(--text-muted)] mb-1">{r.label}</div>
                <div className="text-2xl font-bold tabular-nums">
                  {val === null
                    ? '—'
                    : r.type === 'percent'
                      ? formatPercent(val, 2)
                      : formatNumber(val, 2)}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-1">{r.formula}</div>
                {val === null && r.unavailable ? (
                  <div className="text-[10px] text-[var(--text-muted)] mt-1 italic">
                    {r.unavailable}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPICard } from '@/components/dashboard/KPICard';
import { ChartWrapper } from '@/components/analytics/ChartWrapper';
import { DataGrid } from '@/components/ui/DataGrid';
import { Activity, ArrowDownRight, ArrowUpRight, Download } from 'lucide-react';
import { BankingEngine } from '@/engines/BankingEngine';
import { ExportEngine } from '@/engines/ExportEngine';
import { reportExportFailure } from '@/utils/exportErrorHandler';
import { divideMoney, multiplyMoney, roundTo, sumMoney } from '@/utils/money';
import { formatPercent } from '@/utils/financialFormatting';
import { PageHeader } from '@/components/ui/PageHeader';

/**
 * GAP-1 (F-0006) — exact-decimal NIM component income/asset aggregates.
 *
 * Per-loan-category average earning-assets and interest income were raw
 * float reduces; they feed the Interest Income Breakdown DataGrid. Yield
 * (catIncome/catAssets * 12 * 100) stays a percentage metric and is not
 * placed on the money primitive.
 */
export interface NIMCategory {
  prefix: string;
  name: string;
}
export interface NIMComponentRow {
  id: string;
  source: string;
  income: number;
  yield: number;
  [key: string]: unknown;
}
export function computeNIMComponents(
  entries: readonly { accountCode: string; amount: number }[],
  categories: readonly NIMCategory[]
): NIMComponentRow[] {
  return categories
    .map((cat) => {
      const catAssets = roundTo(
        sumMoney(entries.filter((e) => e.accountCode.startsWith(cat.prefix)).map((e) => e.amount))
      );
      const incomeCode = `41${cat.prefix.substring(1)}`;
      const catIncome = roundTo(
        sumMoney(entries.filter((e) => e.accountCode === incomeCode).map((e) => e.amount))
      );
      // yield is a % ratio — compute in Decimal to avoid drift, then emit plain number
      const yieldPct =
        catAssets > 0 ? roundTo(multiplyMoney(divideMoney(catIncome, catAssets), 1200), 4) : 0;
      return {
        id: cat.prefix,
        source: cat.name,
        income: catIncome,
        yield: yieldPct,
      };
    })
    .filter((c) => c.income !== 0 || c.yield !== 0);
}

export default function NIMDashboardPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();

  const stats = useMemo(() => {
    return BankingEngine.calculateNIMStats(entries);
  }, [entries]);

  const components = useMemo(() => {
    const categories: NIMCategory[] = [
      { prefix: '131', name: 'Commercial Real Estate' },
      { prefix: '132', name: 'Residential Mortgage' },
      { prefix: '133', name: 'Consumer Portfolio' },
    ];
    return computeNIMComponents(entries, categories);
  }, [entries]);

  const columns = [
    { field: 'source', headerName: 'Interest Source', flex: 1.5 },
    { field: 'income', headerName: 'Interest Income', type: 'currency' as const, flex: 1 },
    { field: 'yield', headerName: 'Weighted Yield', type: 'percent' as const, flex: 0.8 },
  ];

  const handleExport = () => {
    const data = {
      headers: ['Interest Source', 'Interest Income', 'Weighted Yield'],
      rows: components.map((c) => [c.source, c.income, formatPercent(c.yield)]),
    };
    void ExportEngine.exportToExcel(data, { title: 'NIM_Analysis_Report' }).catch(
      reportExportFailure
    );
  };

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-slate-800 rounded-full inline-block mb-4">
          <Activity className="h-10 w-10 text-slate-400" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Banking Data</h2>
        <p className="text-[var(--text-muted)] mb-6">
          Import interest-bearing asset and liability data to calculate Net Interest Margin.
        </p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        icon={<Activity className="h-6 w-6 text-green-400" />}
        title="NIM Dashboard"
        purpose="Net Interest Margin & Spread Analysis"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
            <Button size="sm">Scenario Modeling</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Net Interest Margin"
          value={stats.netInterestMargin}
          format="percent"
          trend="up"
          change={0.06}
          sparklineData={stats.trend}
        />
        <KPICard
          title="Net Interest Income"
          value={stats.netInterestMargin}
          format="currency"
          trend="up"
          change={4.2}
        />
        <KPICard
          title="Yield on Earning Assets"
          value={stats.yieldOnAssets}
          format="percent"
          trend="up"
          change={0.12}
        />
        <KPICard
          title="Cost of Interest Funds"
          value={stats.costOfFunds}
          format="percent"
          trend="up"
          change={0.08}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartWrapper
            title="NIM Trend vs. Cost of Funds"
            subtitle="Monthly spread analysis"
            height={350}
          >
            <div className="flex items-center justify-center h-full text-slate-500 italic">
              Margin vs. Cost Visualization (Line Chart)
            </div>
          </ChartWrapper>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold">Interest Sensitivity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-slate-900 rounded">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 text-green-400" />
                  <span className="text-xs text-slate-300">+100bps Shift</span>
                </div>
                <span className="text-sm font-bold text-green-400">+$2.4M NII</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-900 rounded">
                <div className="flex items-center gap-2">
                  <ArrowDownRight className="h-4 w-4 text-red-400" />
                  <span className="text-xs text-slate-300">-100bps Shift</span>
                </div>
                <span className="text-sm font-bold text-red-400">-$1.8M NII</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500">
              Estimates based on current GAP analysis and asset-sensitive profile.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Interest Income Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataGrid rows={components} columns={columns} className="h-64 border-none" />
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Manufacturing overview — every figure is derived from the posted GL.
 *
 * CORRECTNESS CONTRACT:
 * 1. All sector KPIs come from `ManufacturingEngine.calculateStats` (pure,
 *    money-primitive-backed). This page previously rendered a generic
 *    debit/credit reskin identical to the healthcare overview while the
 *    engine sat unwired.
 * 2. OEE is disclosed as an engine derivation (85 + grossMargin÷5, capped at
 *    99), not a measured shop-floor figure.
 * 3. `ManufacturingEngine.getOutputTrend` ignores its entries argument and
 *    `getProductionLines` models line status/efficiency with pseudo-random
 *    literals — neither is rendered here until those gaps are fixed in the
 *    engine lane.
 */
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle,
  Download,
  DollarSign,
  Factory,
  FileSpreadsheet,
  Layers,
  TrendingUp,
} from 'lucide-react';
import { useGLStore } from '@/store/glStore';
import { ManufacturingEngine } from '@/engines/ManufacturingEngine';
import { ExportEngine } from '@/engines/ExportEngine';
import { reportExportFailure } from '@/utils/exportErrorHandler';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { computeManufacturingRatioPct } from './manufacturingMetrics';
import { aggregateAccounts } from './accountOverview';
import { AccountOverviewCard } from './AccountOverviewCard';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { PageHeader } from '@/components/ui/PageHeader';

const COST_STRUCTURE_ROWS = [
  { key: 'materialCost', label: 'Raw Materials (57xx)' },
  { key: 'laborCost', label: 'Direct Labor (58xx)' },
  { key: 'overheadCost', label: 'Manufacturing Overhead (59xx)' },
] as const;

/** Tailwind-scannable width buckets for the COGS share bars (no inline styles). */
const SHARE_BAR_WIDTHS: Record<number, string> = {
  0: 'w-0',
  10: 'w-[10%]',
  20: 'w-[20%]',
  30: 'w-[30%]',
  40: 'w-[40%]',
  50: 'w-[50%]',
  60: 'w-[60%]',
  70: 'w-[70%]',
  80: 'w-[80%]',
  90: 'w-[90%]',
  100: 'w-full',
};

function shareBarClass(pct: number): string {
  const bucket = Math.min(10, Math.max(0, Math.round(pct / 10))) * 10;
  return SHARE_BAR_WIDTHS[bucket] ?? 'w-0';
}

export function ManufacturingPage() {
  const fmt = useCurrencyFormatter();
  const entries = useGLStore((s) => s.entries);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Manufacturing';
  }, []);

  const stats = useMemo(() => ManufacturingEngine.calculateStats(entries), [entries]);
  const accountBreakdown = useMemo(() => aggregateAccounts(entries), [entries]);

  const costStructure = useMemo(
    () =>
      COST_STRUCTURE_ROWS.map((row) => ({
        ...row,
        amount: stats[row.key],
        shareOfCogs: computeManufacturingRatioPct(stats[row.key], stats.cogs),
      })),
    [stats]
  );

  const handleExportPDF = () => {
    void ExportEngine.exportToPDF(
      {
        headers: ['Metric', 'Value'],
        rows: [
          ['Revenue', fmt.currency0(stats.revenue)],
          ['COGS', fmt.currency0(stats.cogs)],
          ['Gross Margin', fmt.percent(stats.grossMargin, 1)],
          ['Raw Materials (57xx)', fmt.currency0(stats.materialCost)],
          ['Direct Labor (58xx)', fmt.currency0(stats.laborCost)],
          ['Mfg Overhead (59xx)', fmt.currency0(stats.overheadCost)],
          ['OEE (derived)', fmt.percent(stats.oee, 1)],
        ],
      },
      { title: 'Manufacturing Overview Report' }
    ).catch(reportExportFailure);
  };

  const handleExportExcel = () => {
    void ExportEngine.exportToExcel(
      {
        headers: ['Metric', 'Value'],
        rows: costStructure.map((row) => [
          row.label,
          row.amount,
          `${fmt.percent(row.shareOfCogs, 1)} of COGS`,
        ]),
      },
      { title: 'Manufacturing_Cost_Structure' }
    ).catch(reportExportFailure);
  };

  if (entries.length === 0) {
    return (
      <main className="p-12 text-center" role="main" aria-label="Manufacturing - No Data">
        <a
          href="#import-btn"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
        >
          Skip to import action
        </a>
        <Factory className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" aria-hidden="true" />
        <h1 className="text-xl font-semibold mb-2">No Manufacturing Data</h1>
        <p className="text-[var(--text-muted)] mb-6">Import GL data to view manufacturing.</p>
        <Button
          id="import-btn"
          onClick={() => navigate('/data/gl-upload')}
          aria-label="Import GL data to view manufacturing"
        >
          Import Data
        </Button>
      </main>
    );
  }

  return (
    <main
      className="p-6 space-y-6 animate-fade-in"
      role="main"
      aria-label="Manufacturing Dashboard"
    >
      <a
        href="#kpi-section"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
      >
        Skip to key metrics
      </a>
      <PageHeader
        title="Manufacturing"
        titleId="manufacturing-heading"
        purpose="Sector KPIs derived from posted GL accounts (47xx revenue, 57xx–59xx production costs, 5xxx/6xxx COGS) via ManufacturingEngine."
        status={
          <span className="text-sm text-[var(--text-muted)]">
            {fmt.number(entries.length)} entries imported
          </span>
        }
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={handleExportPDF} aria-label="Export PDF">
              <Download className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
              PDF
            </Button>
            <Button size="sm" variant="ghost" onClick={handleExportExcel} aria-label="Export Excel">
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
              Excel
            </Button>
          </div>
        }
      />
      <section
        id="kpi-section"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        aria-label="Manufacturing KPIs"
        aria-labelledby="manufacturing-heading"
      >
        <KPIValue
          label="Revenue"
          value={fmt.currency0(stats.revenue)}
          icon={<DollarSign className="h-4 w-4" aria-hidden="true" />}
          changeLabel="Posted 47xx product revenue"
        />
        <KPIValue
          label="COGS"
          value={fmt.currency0(stats.cogs)}
          icon={<Layers className="h-4 w-4" aria-hidden="true" />}
          changeLabel="Posted 5xxx/6xxx cost accounts"
        />
        <KPIValue
          label="Gross Margin"
          value={fmt.percent(stats.grossMargin, 1)}
          icon={<TrendingUp className="h-4 w-4" aria-hidden="true" />}
          changeLabel="(Revenue − COGS) ÷ Revenue"
        />
        <KPIValue
          label="OEE"
          value={fmt.percent(stats.oee, 1)}
          changeLabel="Derived by engine: 85 + grossMargin ÷ 5, capped at 99 — not a shop-floor feed"
        />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card aria-label="Production Cost Structure" aria-live="polite">
          <CardHeader>
            <CardTitle>Production Cost Structure</CardTitle>
          </CardHeader>
          <CardContent>
            {costStructure.every((row) => row.amount === 0) ? (
              <p className="text-[var(--text-muted)]">
                No production-cost accounts (prefixes 57/58/59) posted yet. Import GL data with
                manufacturing cost codes to populate this breakdown.
              </p>
            ) : (
              <ul className="space-y-3">
                {costStructure.map((row) => (
                  <li key={row.key}>
                    <div className="flex items-baseline justify-between text-sm">
                      <span>{row.label}</span>
                      <span className="font-mono tabular-nums">
                        {fmt.currency(row.amount)}
                        <span className="ml-2 text-[var(--text-secondary)]">
                          {fmt.percent(row.shareOfCogs, 1)} of COGS
                        </span>
                      </span>
                    </div>
                    <div
                      className="mt-1 h-2 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)]"
                      role="presentation"
                    >
                      <div
                        className={`h-2 rounded bg-blue-500 ${shareBarClass(row.shareOfCogs)}`}
                      />
                    </div>
                  </li>
                ))}
                <li className="pt-2 text-xs text-[var(--text-muted)]">
                  Shares are exact decimal divisions; a missing denominator renders 0%, never an
                  estimate.
                </li>
              </ul>
            )}
          </CardContent>
        </Card>

        <AccountOverviewCard rows={accountBreakdown} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Lineage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-[var(--text-muted)]">
          <p className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#16A34A]" aria-hidden="true" />
            <span>
              Revenue, COGS, gross margin and OEE come from ManufacturingEngine.calculateStats over{' '}
              {fmt.number(entries.length)} posted rows using exact decimal money arithmetic.
            </span>
          </p>
          <p className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-[#DC2626]" aria-hidden="true" />
            <span>
              Production-line status and output-trend charts are intentionally absent:{' '}
              ManufacturingEngine.getProductionLines / getOutputTrend model these figures instead of
              measuring them from the ledger.
            </span>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

export default ManufacturingPage;

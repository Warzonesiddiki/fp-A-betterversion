/**
 * ESG sector overview — every metric is derived from the posted GL and useESGStore.
 *
 * CORRECTNESS CONTRACT:
 * 1. Sector financial KPIs come from posted environmental, social, and governance
 *    expenditure accounts in the GL using exact decimal money arithmetic.
 *    This page previously rendered a generic debit/credit reskin while the engine
 *    and store sat unwired.
 * 2. Non-financial ESG indicators (carbon scope emissions, diversity ratios, SDG
 *    alignment) reflect recorded data in `useESGStore`. Where primary activity data
 *    is absent, requirements are disclosed rather than fabricated.
 */
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle,
  Download,
  DollarSign,
  FileSpreadsheet,
  Layers,
  Leaf,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { useGLStore } from '@/store/glStore';
import { useESGStore } from '@/store/esgStore';
import { ExportEngine } from '@/engines/ExportEngine';
import { reportExportFailure } from '@/utils/exportErrorHandler';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { aggregateAccounts } from './accountOverview';
import { AccountOverviewCard } from './AccountOverviewCard';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { PageHeader } from '@/components/ui/PageHeader';
import { addMoney, roundTo, subtractMoney, sumMoney } from '@/utils/money';

export function ESGPage() {
  const fmt = useCurrencyFormatter();
  const entries = useGLStore((s) => s.entries);
  const { metrics, initiatives, getOverallScore } = useESGStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — ESG';
  }, []);

  const overallScore = useMemo(() => getOverallScore(), [getOverallScore]);

  const esgSpend = useMemo(() => {
    if (entries.length === 0) {
      return {
        environmental: 0,
        social: 0,
        governance: 0,
        total: 0,
      };
    }

    const envEntries = entries.filter(
      (e) =>
        e.accountCode?.startsWith('681') ||
        (/environment|energy|carbon|waste|clean|renewab/i.test(e.accountName ?? '') &&
          !/training|safety|compliance|audit|legal/i.test(e.accountName ?? ''))
    );
    const socialEntries = entries.filter(
      (e) =>
        e.accountCode?.startsWith('682') ||
        /training|safety|wellness|diversity|social|community/i.test(e.accountName ?? '')
    );
    const govEntries = entries.filter(
      (e) =>
        e.accountCode?.startsWith('683') ||
        /compliance|audit|legal|governance|regulatory/i.test(e.accountName ?? '')
    );

    const getNet = (e: (typeof entries)[number]) =>
      subtractMoney(e.debit ?? 0, e.credit ?? 0).toNumber();

    const env = roundTo(sumMoney(envEntries.map(getNet)), 2);
    const soc = roundTo(sumMoney(socialEntries.map(getNet)), 2);
    const gov = roundTo(sumMoney(govEntries.map(getNet)), 2);
    const total = roundTo(addMoney(addMoney(env, soc), gov), 2);

    return {
      environmental: env,
      social: soc,
      governance: gov,
      total,
    };
  }, [entries]);

  const accountBreakdown = useMemo(() => aggregateAccounts(entries), [entries]);

  const handleExportPDF = () => {
    void ExportEngine.exportToPDF(
      {
        headers: ['Category / Indicator', 'Value', 'Source / Basis'],
        rows: [
          [
            'Total ESG Investment',
            fmt.currency0(esgSpend.total),
            'Posted GL environmental, social, governance spend',
          ],
          [
            'Environmental Spend',
            fmt.currency0(esgSpend.environmental),
            'Clean energy, waste reduction, carbon offsets',
          ],
          [
            'Social Spend',
            fmt.currency0(esgSpend.social),
            'Workforce wellness, diversity & community',
          ],
          [
            'Governance & Compliance',
            fmt.currency0(esgSpend.governance),
            'Audit, legal & regulatory compliance',
          ],
          [
            'Overall ESG Score',
            metrics.length > 0 ? `${overallScore}%` : 'Disclosed pending metrics',
            'Recorded in esgStore',
          ],
          ['Active Initiatives', fmt.number(initiatives.length), 'Recorded in esgStore'],
        ],
      },
      { title: 'ESG_Overview_Report' }
    ).catch(reportExportFailure);
  };

  const handleExportExcel = () => {
    void ExportEngine.exportToExcel(
      {
        headers: ['Pillar', 'Metric / Indicator', 'Amount / Value'],
        rows: [
          ['Financial', 'Environmental Spend (GL)', esgSpend.environmental],
          ['Financial', 'Social Spend (GL)', esgSpend.social],
          ['Financial', 'Governance Spend (GL)', esgSpend.governance],
          ['Financial', 'Total ESG Spend (GL)', esgSpend.total],
          ...metrics.map((m) => [m.category, m.name, `${m.value} ${m.unit}`]),
          ...initiatives.map((init) => [
            'Initiative',
            init.name,
            `Budget: ${init.budget}, Spent: ${init.spent}`,
          ]),
        ],
      },
      { title: 'ESG_Metrics_and_Spend' }
    ).catch(reportExportFailure);
  };

  const handleImportKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate('/data/gl-upload');
    }
  };

  if (entries.length === 0 && metrics.length === 0) {
    return (
      <main className="p-12 text-center" role="main" aria-label="ESG - No Data">
        <a
          href="#import-btn"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
        >
          Skip to import action
        </a>
        <Leaf className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" aria-hidden="true" />
        <h1 className="text-xl font-semibold mb-2">No ESG Data</h1>
        <p className="text-[var(--text-muted)] mb-6">
          Import GL data to view ESG expenditures and metrics.
        </p>
        <Button
          id="import-btn"
          onClick={() => navigate('/data/gl-upload')}
          onKeyDown={handleImportKeyDown}
          aria-label="Import GL data to view ESG"
        >
          Import Data
        </Button>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6 animate-fade-in" role="main" aria-label="ESG Dashboard">
      <a
        href="#kpi-section"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
      >
        Skip to key metrics
      </a>
      <PageHeader
        title="ESG"
        titleId="esg-heading"
        purpose="Sustainability indicators and GL-posted investments in environmental, social, and governance initiatives."
        status={
          <span className="text-sm text-[var(--text-muted)]">
            {fmt.number(entries.length)} entries imported · {metrics.length} tracked metrics
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
        aria-label="ESG KPIs"
        aria-labelledby="esg-heading"
      >
        <KPIValue
          label="Total ESG Spend"
          value={fmt.currency0(esgSpend.total)}
          icon={<DollarSign className="h-4 w-4" aria-hidden="true" />}
          changeLabel="Posted Environmental, Social & Governance costs"
        />
        <KPIValue
          label="Environmental Spend"
          value={fmt.currency0(esgSpend.environmental)}
          icon={<Leaf className="h-4 w-4" aria-hidden="true" />}
          changeLabel="Clean energy, waste reduction, carbon offsets"
        />
        <KPIValue
          label="Overall ESG Score"
          value={metrics.length > 0 ? `${overallScore}%` : 'Pending'}
          icon={<TrendingUp className="h-4 w-4" aria-hidden="true" />}
          changeLabel={
            metrics.length > 0
              ? 'Target completion across tracked metrics'
              : 'Record metrics in ESG store'
          }
        />
        <KPIValue
          label="Active Initiatives"
          value={fmt.number(initiatives.length)}
          icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />}
          changeLabel="Initiatives tracked in ESG store"
        />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card aria-label="ESG Spend Breakdown" aria-live="polite">
          <CardHeader>
            <CardTitle>ESG Investment Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-baseline justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Leaf className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                  Environmental (E)
                </span>
                <span className="font-mono tabular-nums">
                  {fmt.currency(esgSpend.environmental)}
                </span>
              </li>
              <li className="flex items-baseline justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-blue-500" aria-hidden="true" />
                  Social & Workforce (S)
                </span>
                <span className="font-mono tabular-nums">{fmt.currency(esgSpend.social)}</span>
              </li>
              <li className="flex items-baseline justify-between text-sm">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-purple-500" aria-hidden="true" />
                  Governance & Compliance (G)
                </span>
                <span className="font-mono tabular-nums">{fmt.currency(esgSpend.governance)}</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <AccountOverviewCard rows={accountBreakdown} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Lineage & Disclosures</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-[var(--text-muted)]">
          <p className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#16A34A]" aria-hidden="true" />
            <span>
              ESG financial allocations are derived from {fmt.number(entries.length)} posted ledger
              accounts using exact decimal money arithmetic.
            </span>
          </p>
          <p className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-[#DC2626]" aria-hidden="true" />
            <span>
              Scope 1, 2, and 3 GHG emissions, utility bills, and supply-chain audits require
              operational carbon activity feeds and are not estimated from financial journal
              balances.
            </span>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

export default ESGPage;

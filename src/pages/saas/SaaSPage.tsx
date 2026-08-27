/**
 * SaaS sector overview — every metric is derived from the posted GL and SaaSMetricsEngine.
 *
 * CORRECTNESS CONTRACT:
 * 1. Sector KPIs come from `SaaSMetricsEngine.calculateARR` and posted GL accounts
 *    (41xx subscription revenue, 5xxx hosting/COGS, 6xxx operating expenses).
 *    This page previously rendered a generic debit/credit reskin identical to other
 *    shallow sector hubs while the engine sat unwired.
 * 2. ARR is computed as MRR × 12 using exact decimal arithmetic via `SaaSMetricsEngine.calculateARR`.
 *    MRR is the latest posted monthly bucket of subscription revenue (41xx), or aggregate
 *    subscription revenue when single-period.
 * 3. Churn rate, customer count, and Net Revenue Retention (NRR) require subscriber-level
 *    cohort and billing feeds that a general ledger does not carry. Those metrics are disclosed
 *    as requiring cohort feeds rather than defaulted to fabricated figures.
 */
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle,
  Cloud,
  DollarSign,
  Download,
  FileSpreadsheet,
  Layers,
  TrendingUp,
} from 'lucide-react';
import { useGLStore } from '@/store/glStore';
import { SaaSMetricsEngine } from '@/engines/SaaSMetricsEngine';
import { ExportEngine } from '@/engines/ExportEngine';
import { reportExportFailure } from '@/utils/exportErrorHandler';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { aggregateAccounts } from './accountOverview';
import { AccountOverviewCard } from './AccountOverviewCard';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { PageHeader } from '@/components/ui/PageHeader';
import { addMoney, divideMoney, roundTo, subtractMoney, sumMoney, toDecimal } from '@/utils/money';

const SAAS_COST_ROWS = [
  { key: 'hosting', label: 'Hosting & Cloud Infrastructure (51xx)' },
  { key: 'support', label: 'Customer Support & Success (52xx)' },
  { key: 'sm', label: 'Sales & Marketing (61xx/65xx)' },
  { key: 'rd', label: 'Research & Development (62xx)' },
] as const;

export function SaaSPage() {
  const fmt = useCurrencyFormatter();
  const entries = useGLStore((s) => s.entries);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — SaaS';
  }, []);

  const derived = useMemo(() => {
    if (entries.length === 0) return null;

    // Subscription revenue: accounts starting with 41 (or 40 if no 41 exists)
    const subEntries = entries.filter((e) => e.accountCode?.startsWith('41'));
    const allRevEntries = entries.filter((e) => e.accountCode?.startsWith('4'));
    const targetRevEntries = subEntries.length > 0 ? subEntries : allRevEntries;

    // Monthly buckets of credit - debit for subscription revenue
    const byMonth = new Map<string, number>();
    for (const e of targetRevEntries) {
      const month = e.period || (typeof e.date === 'string' ? e.date.slice(0, 7) : '');
      if (!month) continue;
      const net = subtractMoney(e.credit ?? 0, e.debit ?? 0).toNumber();
      byMonth.set(month, roundTo(addMoney(byMonth.get(month) ?? 0, net), 2));
    }
    const months = Array.from(byMonth.entries()).sort(([a], [b]) => a.localeCompare(b));
    const currentMRR =
      months.length > 0
        ? months[months.length - 1]![1]
        : roundTo(
            sumMoney(targetRevEntries.map((e) => subtractMoney(e.credit ?? 0, e.debit ?? 0))),
            2
          );

    const arr = SaaSMetricsEngine.calculateARR(currentMRR);

    // Total posted revenue (credit - debit for 4xxx)
    const totalRevenue = roundTo(
      sumMoney(allRevEntries.map((e) => subtractMoney(e.credit ?? 0, e.debit ?? 0))),
      2
    );

    // COGS: 5xxx accounts (debit - credit)
    const cogsEntries = entries.filter((e) => e.accountCode?.startsWith('5'));
    const cogs = roundTo(
      sumMoney(cogsEntries.map((e) => subtractMoney(e.debit ?? 0, e.credit ?? 0))),
      2
    );

    // Gross profit and margin
    const grossProfit = roundTo(subtractMoney(totalRevenue, cogs), 2);
    const grossMarginPct = toDecimal(totalRevenue).gt(0)
      ? roundTo(divideMoney(grossProfit, totalRevenue).times(100), 1)
      : 0;

    // Specific cost buckets
    const hostingEntries = entries.filter((e) => e.accountCode?.startsWith('51'));
    const hosting = roundTo(
      sumMoney(hostingEntries.map((e) => subtractMoney(e.debit ?? 0, e.credit ?? 0))),
      2
    );

    const supportEntries = entries.filter((e) => e.accountCode?.startsWith('52'));
    const support = roundTo(
      sumMoney(supportEntries.map((e) => subtractMoney(e.debit ?? 0, e.credit ?? 0))),
      2
    );

    const smEntries = entries.filter(
      (e) =>
        e.accountCode?.startsWith('61') ||
        e.accountCode?.startsWith('65') ||
        /sales|marketing/i.test(e.accountName ?? '')
    );
    const sm = roundTo(
      sumMoney(smEntries.map((e) => subtractMoney(e.debit ?? 0, e.credit ?? 0))),
      2
    );

    const rdEntries = entries.filter(
      (e) =>
        e.accountCode?.startsWith('62') || /research|development|r&d/i.test(e.accountName ?? '')
    );
    const rd = roundTo(
      sumMoney(rdEntries.map((e) => subtractMoney(e.debit ?? 0, e.credit ?? 0))),
      2
    );

    return {
      arr,
      mrr: currentMRR,
      totalRevenue,
      cogs,
      grossProfit,
      grossMarginPct,
      costs: {
        hosting,
        support,
        sm,
        rd,
      },
    };
  }, [entries]);

  const accountBreakdown = useMemo(() => aggregateAccounts(entries), [entries]);

  const handleExportPDF = () => {
    if (!derived) return;
    void ExportEngine.exportToPDF(
      {
        headers: ['SaaS Metric', 'Value', 'Basis'],
        rows: [
          [
            'Annual Recurring Revenue (ARR)',
            fmt.currency0(derived.arr),
            'MRR × 12 via SaaSMetricsEngine',
          ],
          [
            'Monthly Recurring Revenue (MRR)',
            fmt.currency0(derived.mrr),
            'Latest posted month of 41xx revenue',
          ],
          ['Total Revenue', fmt.currency0(derived.totalRevenue), 'Posted 4xxx accounts'],
          ['COGS', fmt.currency0(derived.cogs), 'Posted 5xxx hosting/infrastructure costs'],
          ['Gross Margin', fmt.percent(derived.grossMarginPct, 1), '(Revenue − COGS) ÷ Revenue'],
          [
            'Hosting Infrastructure',
            fmt.currency0(derived.costs.hosting),
            'Posted 51xx cloud costs',
          ],
          ['Sales & Marketing', fmt.currency0(derived.costs.sm), 'Posted 61xx/65xx accounts'],
          [
            'Net Revenue Retention (NRR)',
            'Disclosed unavailable',
            'Requires subscriber-level cohort feed',
          ],
        ],
      },
      { title: 'SaaS_Overview_Report' }
    ).catch(reportExportFailure);
  };

  const handleExportExcel = () => {
    if (!derived) return;
    void ExportEngine.exportToExcel(
      {
        headers: ['Category', 'Account / Metric', 'Amount'],
        rows: [
          ['SaaS KPI', 'ARR (MRR × 12)', derived.arr],
          ['SaaS KPI', 'MRR (Subscription 41xx)', derived.mrr],
          ['P&L', 'Total Revenue', derived.totalRevenue],
          ['P&L', 'COGS', derived.cogs],
          ['P&L', 'Gross Profit', derived.grossProfit],
          ['Cost Center', 'Hosting & Cloud (51xx)', derived.costs.hosting],
          ['Cost Center', 'Customer Support (52xx)', derived.costs.support],
          ['Cost Center', 'Sales & Marketing (61xx/65xx)', derived.costs.sm],
          ['Cost Center', 'R&D Engineering (62xx)', derived.costs.rd],
        ],
      },
      { title: 'SaaS_Financial_Summary' }
    ).catch(reportExportFailure);
  };

  const handleImportKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate('/data/gl-upload');
    }
  };

  if (entries.length === 0 || !derived) {
    return (
      <main className="p-12 text-center" role="main" aria-label="SaaS - No Data">
        <a
          href="#import-btn"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
        >
          Skip to import action
        </a>
        <Cloud className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" aria-hidden="true" />
        <h1 className="text-xl font-semibold mb-2">No SaaS Data</h1>
        <p className="text-[var(--text-muted)] mb-6">Import GL data to view SaaS metrics.</p>
        <Button
          id="import-btn"
          onClick={() => navigate('/data/gl-upload')}
          onKeyDown={handleImportKeyDown}
          aria-label="Import GL data to view SaaS metrics"
        >
          Import Data
        </Button>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6 animate-fade-in" role="main" aria-label="SaaS Dashboard">
      <a
        href="#kpi-section"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
      >
        Skip to key metrics
      </a>
      <PageHeader
        title="SaaS"
        titleId="saas-heading"
        purpose="Sector KPIs derived from posted GL accounts (41xx subscription revenue, 5xxx hosting/COGS) via SaaSMetricsEngine."
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
        aria-label="SaaS KPIs"
        aria-labelledby="saas-heading"
      >
        <KPIValue
          label="ARR (Annualized)"
          value={fmt.currency0(derived.arr)}
          icon={<TrendingUp className="h-4 w-4" aria-hidden="true" />}
          changeLabel="MRR × 12 via SaaSMetricsEngine"
        />
        <KPIValue
          label="MRR (Posted)"
          value={fmt.currency0(derived.mrr)}
          icon={<DollarSign className="h-4 w-4" aria-hidden="true" />}
          changeLabel="Latest posted month of 41xx revenue"
        />
        <KPIValue
          label="Gross Margin"
          value={fmt.percent(derived.grossMarginPct, 1)}
          icon={<Layers className="h-4 w-4" aria-hidden="true" />}
          changeLabel="(Revenue − COGS) ÷ Revenue"
        />
        <KPIValue
          label="COGS"
          value={fmt.currency0(derived.cogs)}
          icon={<Cloud className="h-4 w-4" aria-hidden="true" />}
          changeLabel="Posted 5xxx hosting & support costs"
        />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card aria-label="SaaS Cost Structure" aria-live="polite">
          <CardHeader>
            <CardTitle>SaaS Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {SAAS_COST_ROWS.map((row) => {
                const amount = derived.costs[row.key];
                const shareOfRev = toDecimal(derived.totalRevenue).gt(0)
                  ? roundTo(divideMoney(amount, derived.totalRevenue).times(100), 1)
                  : 0;
                return (
                  <li key={row.key} className="flex items-baseline justify-between text-sm">
                    <span>{row.label}</span>
                    <span className="font-mono tabular-nums">
                      {fmt.currency(amount)}
                      <span className="ml-2 text-[var(--text-secondary)] text-xs">
                        ({fmt.percent(shareOfRev, 1)} of rev)
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        <AccountOverviewCard rows={accountBreakdown} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Lineage & Feeds</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-[var(--text-muted)]">
          <p className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#16A34A]" aria-hidden="true" />
            <span>
              ARR and MRR are computed via SaaSMetricsEngine.calculateARR over posted subscription
              revenue (41xx) using exact decimal arithmetic.
            </span>
          </p>
          <p className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-[#DC2626]" aria-hidden="true" />
            <span>
              Cohort-based retention (NRR, Gross Churn, Magic Number) requires subscription billing
              and customer logo feeds; disclosed as unavailable rather than fabricated.
            </span>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

export default SaaSPage;

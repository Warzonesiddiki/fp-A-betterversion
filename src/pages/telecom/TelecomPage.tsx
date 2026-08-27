import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { useTelecomStore } from '@/store/telecomStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { PageHeader } from '@/components/ui/PageHeader';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { ExportEngine } from '@/engines/ExportEngine';
import { reportExportFailure } from '@/utils/exportErrorHandler';
import { aggregateAccounts, type AccountBreakdownRow } from './accountOverview';
import { AccountOverviewCard } from './AccountOverviewCard';
import { divideMoney, roundTo, sumMoney } from '@/utils/money';
import {
  Wifi,
  DollarSign,
  Users,
  Activity,
  Download,
  FileSpreadsheet,
  Info,
  Signal,
} from 'lucide-react';

export default function TelecomPage() {
  const { entries } = useGLStore();
  const telecomStore = useTelecomStore();
  const subscribers = useMemo(() => telecomStore?.subscribers ?? [], [telecomStore?.subscribers]);
  const networkMetrics = useMemo(
    () => telecomStore?.networkMetrics ?? [],
    [telecomStore?.networkMetrics]
  );
  const getAverageARPU = telecomStore?.getAverageARPU;
  const navigate = useNavigate();
  const fmt = useCurrencyFormatter();

  useEffect(() => {
    document.title = 'FinPlan Pro — Telecom';
  }, []);

  const totalDebit = useMemo(
    () => roundTo(sumMoney(entries.map((e) => e.debit ?? 0)), 2),
    [entries]
  );
  const totalCredit = useMemo(
    () => roundTo(sumMoney(entries.map((e) => e.credit ?? 0)), 2),
    [entries]
  );
  const netChange = useMemo(
    () => roundTo(sumMoney(entries.map((e) => e.netChange ?? 0)), 2),
    [entries]
  );

  const avgRevenuePerEntry = useMemo(() => {
    if (entries.length === 0) return 0;
    return roundTo(divideMoney(totalCredit, entries.length), 2);
  }, [totalCredit, entries.length]);

  const averageARPU = useMemo(() => {
    return typeof getAverageARPU === 'function' ? getAverageARPU() : 0;
  }, [getAverageARPU]);

  const accountRows: AccountBreakdownRow[] = useMemo(() => aggregateAccounts(entries), [entries]);

  const handleExportPDF = () => {
    void ExportEngine.exportToPDF(
      {
        headers: ['Metric', 'Value', 'Source / Lineage'],
        rows: [
          [
            'Total Recognized Revenue',
            fmt.currency(totalCredit),
            'GL Credit-Normal Accounts (4xxx)',
          ],
          [
            'Total Operating Costs',
            fmt.currency(totalDebit),
            'GL Debit-Normal Accounts (5xxx/6xxx)',
          ],
          ['Net Surplus / (Deficit)', fmt.currency(netChange), 'GL Balance Net Change'],
          ['Active Subscribers', fmt.number(subscribers.length), 'Recorded Subscribers Store'],
          [
            'Average Revenue Per User (ARPU)',
            averageARPU > 0 ? fmt.currency(averageARPU) : 'N/A (No Billing Feed)',
            'Active Subscriber Store ARPU',
          ],
          [
            'Average Revenue / Entry',
            fmt.currency(avgRevenuePerEntry),
            'Recognized Revenue / Posting Count',
          ],
          [
            'Monitored Network Regions',
            fmt.number(networkMetrics.length),
            'Network Telemetry Store',
          ],
        ],
      },
      { title: 'Telecom_Financial_Report' }
    ).catch(reportExportFailure);
  };

  const handleExportExcel = () => {
    void ExportEngine.exportToExcel(
      {
        headers: ['Metric', 'Amount', 'Notes'],
        rows: [
          ['Total Recognized Revenue', totalCredit, 'GL 4xxx'],
          ['Total Operating Costs', totalDebit, 'GL 5xxx/6xxx'],
          ['Net Change', netChange, 'GL Net Change'],
          ['Subscribers', subscribers.length, 'Store records'],
          ['Average ARPU', averageARPU, 'Store ARPU'],
          ['Avg Revenue Per Entry', avgRevenuePerEntry, 'Revenue / Entry Count'],
        ],
      },
      { title: 'Telecom_Performance_Review' }
    ).catch(reportExportFailure);
  };

  const handleImportKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate('/data/gl-upload');
    }
  };

  if (entries.length === 0) {
    return (
      <main className="p-12 text-center" role="main" aria-label="Telecom - No Data">
        <a
          href="#import-btn"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
        >
          Skip to import action
        </a>
        <Wifi className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" aria-hidden="true" />
        <h1 className="text-xl font-semibold mb-2">No Telecom Data</h1>
        <p className="text-[var(--text-muted)] mb-6">Import GL data to view telecom financials.</p>
        <Button
          id="import-btn"
          onClick={() => navigate('/data/gl-upload')}
          onKeyDown={handleImportKeyDown}
          aria-label="Import GL data to view telecom financials"
        >
          Import Data
        </Button>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6 animate-fade-in" role="main" aria-label="Telecom Dashboard">
      <a
        href="#kpi-section"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
      >
        Skip to key metrics
      </a>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <PageHeader
          title="Telecom"
          titleId="telecom-heading"
          status={
            <span className="text-sm text-[var(--text-muted)]">
              {fmt.number(entries.length)} entries imported
            </span>
          }
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            aria-label="Export PDF Report"
          >
            <Download className="h-4 w-4 mr-1.5" aria-hidden="true" />
            PDF Report
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            aria-label="Export Excel Workbook"
          >
            <FileSpreadsheet className="h-4 w-4 mr-1.5" aria-hidden="true" />
            Excel Export
          </Button>
        </div>
      </div>

      <section
        id="kpi-section"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        aria-label="Telecom KPIs"
        aria-labelledby="telecom-heading"
      >
        <KPIValue
          label="Total Revenue"
          value={fmt.compact(totalCredit)}
          icon={<DollarSign className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Total Entries"
          value={fmt.number(entries.length)}
          icon={<Users className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Avg Revenue/Entry"
          value={fmt.currency(avgRevenuePerEntry)}
          icon={<Activity className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Net Change"
          value={fmt.compact(netChange)}
          icon={<Wifi className="h-4 w-4" aria-hidden="true" />}
        />
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4" aria-label="Subscriber KPIs">
        <KPIValue
          label="Subscribers"
          value={fmt.number(subscribers.length)}
          changeLabel={
            subscribers.length > 0 ? 'Recorded active accounts' : 'No subscribers recorded'
          }
          icon={<Users className="h-4 w-4 text-blue-500" aria-hidden="true" />}
        />
        <KPIValue
          label="Average ARPU"
          value={averageARPU > 0 ? fmt.currency(averageARPU) : 'N/A'}
          changeLabel={averageARPU > 0 ? 'Monthly revenue per subscriber' : 'Billing feed required'}
          icon={<DollarSign className="h-4 w-4 text-[#16A34A]" aria-hidden="true" />}
        />
        <KPIValue
          label="Network Regions"
          value={fmt.number(networkMetrics.length)}
          changeLabel={networkMetrics.length > 0 ? 'Telemetry nodes active' : 'No telemetry nodes'}
          icon={<Signal className="h-4 w-4 text-purple-500" aria-hidden="true" />}
        />
        <KPIValue
          label="Network Uptime"
          value={
            networkMetrics.length > 0
              ? `${roundTo(
                  divideMoney(sumMoney(networkMetrics.map((n) => n.uptime)), networkMetrics.length),
                  2
                )}%`
              : 'N/A'
          }
          changeLabel={
            networkMetrics.length > 0 ? 'Fleet average uptime' : 'Telemetry feed required'
          }
          icon={<Activity className="h-4 w-4 text-emerald-500" aria-hidden="true" />}
        />
      </section>

      <Card aria-label="Telecom Basis Disclosures">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-500" aria-hidden="true" />
            Telecom Basis & Lineage Disclosure
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-[var(--text-muted)] space-y-1">
          <p>
            • <strong>Revenue Recognition:</strong> Subscription and data revenue is recognized
            under ASC 606 from GL accounts 4xxx.
          </p>
          <p>
            • <strong>Operational Metrics:</strong> Subscriber counts, ARPU, and network
            availability require customer billing and telemetry feeds. Missing operational data is
            disclosed rather than populated with placeholder estimates.
          </p>
        </CardContent>
      </Card>

      <AccountOverviewCard rows={accountRows} />
    </main>
  );
}

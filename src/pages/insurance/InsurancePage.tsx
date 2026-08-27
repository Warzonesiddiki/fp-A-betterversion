import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { useInsuranceStore } from '@/store/insuranceStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { PageHeader } from '@/components/ui/PageHeader';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { ExportEngine } from '@/engines/ExportEngine';
import { reportExportFailure } from '@/utils/exportErrorHandler';
import { InsuranceEngine, type InsuranceStats } from '@/engines/InsuranceEngine';
import { aggregateAccounts, type AccountBreakdownRow } from './accountOverview';
import { AccountOverviewCard } from './AccountOverviewCard';
import { roundTo, sumMoney } from '@/utils/money';
import {
  Shield,
  DollarSign,
  Layers,
  TrendingUp,
  Download,
  FileSpreadsheet,
  Percent,
  Info,
} from 'lucide-react';

export function InsurancePage() {
  const { entries } = useGLStore();
  const { lossPicks } = useInsuranceStore();
  const navigate = useNavigate();
  const fmt = useCurrencyFormatter();

  useEffect(() => {
    document.title = 'FinPlan Pro — Insurance';
  }, []);

  const totalDebit = useMemo(
    () => roundTo(sumMoney(entries.map((e) => e.debit ?? 0)), 2),
    [entries]
  );
  const totalCredit = useMemo(
    () => roundTo(sumMoney(entries.map((e) => e.credit ?? 0)), 2),
    [entries]
  );

  const insuranceStats: InsuranceStats = useMemo(
    () => InsuranceEngine.calculateStats([...entries]),
    [entries]
  );

  const accountRows: AccountBreakdownRow[] = useMemo(() => aggregateAccounts(entries), [entries]);

  const handleExportPDF = () => {
    void ExportEngine.exportToPDF(
      {
        headers: ['Metric', 'Value', 'Basis / Lineage'],
        rows: [
          [
            'Gross Written Premium',
            fmt.currency(insuranceStats.grossWrittenPremium),
            'GL Account 41xx (Credit-Normal)',
          ],
          [
            'Earned Premium',
            fmt.currency(insuranceStats.earnedPremium),
            'GL Account 42xx (Credit-Normal)',
          ],
          [
            'Net Written Premium',
            insuranceStats.netWrittenPremium !== null
              ? fmt.currency(insuranceStats.netWrittenPremium)
              : 'No Cessions Posted',
            'Gross less 43xx ceded premium',
          ],
          [
            'Loss Ratio',
            insuranceStats.lossRatio !== null ? `${insuranceStats.lossRatio}%` : 'N/A',
            'Loss & LAE (51xx) / Earned Premium (42xx)',
          ],
          [
            'Expense Ratio',
            insuranceStats.expenseRatio !== null ? `${insuranceStats.expenseRatio}%` : 'N/A',
            'Underwriting & Commissions (52xx/53xx) / Written Premium (41xx)',
          ],
          [
            'Combined Ratio',
            insuranceStats.combinedRatio !== null ? `${insuranceStats.combinedRatio}%` : 'N/A',
            'Loss Ratio + Expense Ratio',
          ],
          ['Actuarial Loss Picks', String(lossPicks.length), 'Recorded loss-pick rows on file'],
        ],
      },
      { title: 'Insurance_Sector_Financial_Report' }
    ).catch(reportExportFailure);
  };

  const handleExportExcel = () => {
    void ExportEngine.exportToExcel(
      {
        headers: ['Metric', 'Amount', 'Notes'],
        rows: [
          ['Gross Written Premium', insuranceStats.grossWrittenPremium, 'GL 41xx'],
          ['Earned Premium', insuranceStats.earnedPremium, 'GL 42xx'],
          ['Net Written Premium', insuranceStats.netWrittenPremium ?? 0, 'Gross less 43xx ceded'],
          ['Loss Ratio (%)', insuranceStats.lossRatio ?? 0, 'Loss / Earned'],
          ['Expense Ratio (%)', insuranceStats.expenseRatio ?? 0, 'Expense / Written'],
          ['Combined Ratio (%)', insuranceStats.combinedRatio ?? 0, 'Loss + Expense'],
          ['Actuarial Loss Picks', lossPicks.length, 'Store rows'],
        ],
      },
      { title: 'Insurance_Portfolio_Review' }
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
      <main className="p-12 text-center" role="main" aria-label="Insurance - No Data">
        <a
          href="#import-btn"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
        >
          Skip to import action
        </a>
        <Shield className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" aria-hidden="true" />
        <h1 className="text-xl font-semibold mb-2">No Insurance Data</h1>
        <p className="text-[var(--text-muted)] mb-6">Import GL data to view insurance.</p>
        <Button
          id="import-btn"
          onClick={() => navigate('/data/gl-upload')}
          onKeyDown={handleImportKeyDown}
          aria-label="Import GL data to view insurance"
        >
          Import Data
        </Button>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6 animate-fade-in" role="main" aria-label="Insurance Dashboard">
      <a
        href="#kpi-section"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
      >
        Skip to key metrics
      </a>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <PageHeader
          title="Insurance"
          titleId="insurance-heading"
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
        aria-label="Insurance KPIs"
        aria-labelledby="insurance-heading"
      >
        <KPIValue
          label="Total Entries"
          value={fmt.number(entries.length)}
          icon={<Shield className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Loss Picks"
          value={fmt.number(lossPicks.length)}
          changeLabel={lossPicks.length > 0 ? 'loss-pick rows on file' : 'no loss picks recorded'}
          icon={<Layers className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Total Debit"
          value={fmt.compact(totalDebit)}
          icon={<DollarSign className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Total Credit"
          value={fmt.compact(totalCredit)}
          icon={<TrendingUp className="h-4 w-4" aria-hidden="true" />}
        />
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4" aria-label="Underwriting KPIs">
        <KPIValue
          label="Gross Written Premium"
          value={fmt.compact(insuranceStats.grossWrittenPremium)}
          changeLabel="GL 41xx (credit-normal)"
          icon={<DollarSign className="h-4 w-4 text-[#16A34A]" aria-hidden="true" />}
        />
        <KPIValue
          label="Earned Premium"
          value={fmt.compact(insuranceStats.earnedPremium)}
          changeLabel="GL 42xx (recognized)"
          icon={<DollarSign className="h-4 w-4 text-blue-500" aria-hidden="true" />}
        />
        <KPIValue
          label="Loss Ratio"
          value={insuranceStats.lossRatio !== null ? `${insuranceStats.lossRatio}%` : 'N/A'}
          changeLabel={
            insuranceStats.lossRatio !== null ? 'Losses / Earned Premium' : 'No earned premium'
          }
          icon={<Percent className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Combined Ratio"
          value={insuranceStats.combinedRatio !== null ? `${insuranceStats.combinedRatio}%` : 'N/A'}
          changeLabel={
            insuranceStats.combinedRatio !== null ? 'Loss + Expense Ratio' : 'Incomplete components'
          }
          icon={<TrendingUp className="h-4 w-4 text-purple-500" aria-hidden="true" />}
        />
      </section>

      <Card aria-label="Insurance Basis Disclosures">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-500" aria-hidden="true" />
            Underwriting & Lineage Disclosure
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-[var(--text-muted)] space-y-1">
          <p>
            • <strong>Statutory Basis:</strong> Account conventions follow ASC 944 / Statutory
            Accounting Principles (SAP): 41xx Written Premium, 42xx Earned Premium, 43xx Reinsurance
            Ceded, 51xx Losses & LAE, 52xx Commissions, 53xx Underwriting Expenses.
          </p>
          <p>
            • <strong>Actuarial Integrity:</strong> Loss ratio requires posted earned premium (&gt;
            0). Expense ratio requires posted written premium (&gt; 0). Unposted components remain
            N/A rather than fabricated estimates.
          </p>
        </CardContent>
      </Card>

      <AccountOverviewCard rows={accountRows} />
    </main>
  );
}

export default InsurancePage;

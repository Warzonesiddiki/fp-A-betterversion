import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { useGovernmentStore } from '@/store/governmentStore';
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
  Landmark,
  FileText,
  Users,
  DollarSign,
  Download,
  FileSpreadsheet,
  Info,
  ShieldCheck,
  Building2,
  Percent,
} from 'lucide-react';

export default function GovernmentPage() {
  const { entries } = useGLStore();
  const governmentStore = useGovernmentStore();
  const funds = useMemo(() => governmentStore?.funds ?? [], [governmentStore?.funds]);
  const compliance = useMemo(
    () => governmentStore?.compliance ?? [],
    [governmentStore?.compliance]
  );
  const budgetLines = useMemo(
    () => governmentStore?.budgetLines ?? [],
    [governmentStore?.budgetLines]
  );

  const navigate = useNavigate();
  const fmt = useCurrencyFormatter();

  useEffect(() => {
    document.title = 'FinPlan Pro — Government';
  }, []);

  const totalDebit = useMemo(
    () => roundTo(sumMoney(entries.map((e) => e.debit ?? 0)), 2),
    [entries]
  );
  const totalCredit = useMemo(
    () => roundTo(sumMoney(entries.map((e) => e.credit ?? 0)), 2),
    [entries]
  );
  const uniqueDepartments = useMemo(
    () => new Set(entries.map((e) => e.departmentId).filter(Boolean)).size,
    [entries]
  );

  const utilization = useMemo(() => {
    if (totalDebit <= 0) return 0;
    return roundTo(divideMoney(totalCredit, totalDebit).times(100), 2);
  }, [totalDebit, totalCredit]);

  const compliantItemsCount = useMemo(
    () => compliance.filter((c) => c.status === 'Compliant').length,
    [compliance]
  );

  const accountRows: AccountBreakdownRow[] = useMemo(() => aggregateAccounts(entries), [entries]);

  const handleExportPDF = () => {
    void ExportEngine.exportToPDF(
      {
        headers: ['Metric', 'Value', 'Source / Lineage'],
        rows: [
          [
            'Total Budget / Appropriations',
            fmt.currency(totalDebit),
            'GL Appropriations (Debit-Normal)',
          ],
          [
            'Total Expenditures / Disbursed',
            fmt.currency(totalCredit),
            'GL Expenditures (Credit-Normal)',
          ],
          ['Departmental Entities', fmt.number(uniqueDepartments), 'GL Departmental Cost Centers'],
          ['Budget Utilization', `${fmt.number(utilization)}%`, 'Disbursements / Appropriations'],
          ['Monitored Special Funds', fmt.number(funds.length), 'Government Fund Allocations'],
          [
            'Compliance Status',
            compliance.length > 0
              ? `${compliantItemsCount} / ${compliance.length} Mandates Met`
              : 'No Compliance Records',
            'Statutory Audit Oversight',
          ],
          ['Tracked Budget Programs', fmt.number(budgetLines.length), 'Program Budget Master'],
        ],
      },
      { title: 'Government_Budget_Execution' }
    ).catch(reportExportFailure);
  };

  const handleExportExcel = () => {
    void ExportEngine.exportToExcel(
      {
        headers: ['Metric', 'Amount', 'Notes'],
        rows: [
          ['Total Appropriations', totalDebit, 'GL Appropriations'],
          ['Total Expenditures', totalCredit, 'GL Disbursements'],
          ['Departments', uniqueDepartments, 'Department IDs'],
          ['Budget Utilization (%)', utilization, 'Disbursements / Appropriations'],
          ['Monitored Funds', funds.length, 'Fund allocations'],
          ['Compliant Audits', compliantItemsCount, 'Statutory items'],
        ],
      },
      { title: 'Government_Budget_Review' }
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
      <main className="p-12 text-center" role="main" aria-label="Government - No Data">
        <a
          href="#import-btn"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
        >
          Skip to import action
        </a>
        <Landmark className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" aria-hidden="true" />
        <h1 className="text-xl font-semibold mb-2">No Government Data</h1>
        <p className="text-[var(--text-muted)] mb-6">
          Import GL data to view government budget tracking.
        </p>
        <Button
          id="import-btn"
          onClick={() => navigate('/data/gl-upload')}
          onKeyDown={handleImportKeyDown}
          aria-label="Import GL data to view government budget tracking"
        >
          Import Data
        </Button>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6 animate-fade-in" role="main" aria-label="Government Dashboard">
      <a
        href="#kpi-section"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
      >
        Skip to key metrics
      </a>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <PageHeader
          title="Government"
          titleId="government-heading"
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
        aria-label="Government KPIs"
        aria-labelledby="government-heading"
      >
        <KPIValue
          label="Total Budget"
          value={fmt.compact(totalDebit)}
          icon={<DollarSign className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Expenditures"
          value={fmt.compact(totalCredit)}
          icon={<FileText className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Departments"
          value={fmt.number(uniqueDepartments)}
          icon={<Users className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Utilization"
          value={`${fmt.number(utilization)}%`}
          icon={<Landmark className="h-4 w-4" aria-hidden="true" />}
        />
      </section>

      <section
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        aria-label="Appropriation & Fund KPIs"
      >
        <KPIValue
          label="Monitored Funds"
          value={fmt.number(funds.length)}
          changeLabel={funds.length > 0 ? 'Active fund accounts' : 'No fund accounts'}
          icon={<Building2 className="h-4 w-4 text-blue-500" aria-hidden="true" />}
        />
        <KPIValue
          label="Compliance Items"
          value={fmt.number(compliance.length)}
          changeLabel={
            compliance.length > 0
              ? `${compliantItemsCount} compliant mandates`
              : 'No compliance records'
          }
          icon={<ShieldCheck className="h-4 w-4 text-[#16A34A]" aria-hidden="true" />}
        />
        <KPIValue
          label="Budget Programs"
          value={fmt.number(budgetLines.length)}
          changeLabel={budgetLines.length > 0 ? 'Statutory line items' : 'No program records'}
          icon={<FileText className="h-4 w-4 text-purple-500" aria-hidden="true" />}
        />
        <KPIValue
          label="Execution Ratio"
          value={totalDebit > 0 ? `${fmt.number(utilization)}%` : 'N/A'}
          changeLabel={
            totalDebit > 0 ? 'Disbursements tied to appropriations' : 'No appropriations recorded'
          }
          icon={<Percent className="h-4 w-4 text-emerald-500" aria-hidden="true" />}
        />
      </section>

      <Card aria-label="Government Basis Disclosures">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-500" aria-hidden="true" />
            Government Accounting & Fund Basis (GASB 34)
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-[var(--text-muted)] space-y-1">
          <p>
            • <strong>Governmental Fund Basis:</strong> Reporting aligns with GASB Statement No. 34
            principles (Modified Accrual Basis for governmental funds, Full Accrual for proprietary
            and fiduciary funds).
          </p>
          <p>
            • <strong>Appropriation Control:</strong> Expenditures are tracked against legislative
            appropriations. Utilization reflects encumbrances and realized disbursements against
            authorized spending ceilings.
          </p>
        </CardContent>
      </Card>

      <AccountOverviewCard rows={accountRows} />
    </main>
  );
}

import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { useEducationStore } from '@/store/educationStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { PageHeader } from '@/components/ui/PageHeader';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { ExportEngine } from '@/engines/ExportEngine';
import { reportExportFailure } from '@/utils/exportErrorHandler';
import { aggregateAccounts, type AccountBreakdownRow } from './accountOverview';
import { AccountOverviewCard } from './AccountOverviewCard';
import { roundTo, sumMoney } from '@/utils/money';
import {
  GraduationCap,
  Users,
  DollarSign,
  BookOpen,
  Download,
  FileSpreadsheet,
  Info,
  Award,
  TrendingUp,
} from 'lucide-react';

export default function EducationPage() {
  const { entries } = useGLStore();
  const educationStore = useEducationStore();
  const programs = useMemo(() => educationStore?.programs ?? [], [educationStore?.programs]);
  const scholarships = useMemo(
    () => educationStore?.scholarships ?? [],
    [educationStore?.scholarships]
  );
  const enrollmentTrends = useMemo(
    () => educationStore?.enrollmentTrends ?? [],
    [educationStore?.enrollmentTrends]
  );
  const getTotalEnrollment = educationStore?.getTotalEnrollment;
  const getActiveProgramCount = educationStore?.getActiveProgramCount;

  const navigate = useNavigate();
  const fmt = useCurrencyFormatter();

  useEffect(() => {
    document.title = 'FinPlan Pro — Education';
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
  const uniqueAccounts = useMemo(() => new Set(entries.map((e) => e.accountCode)).size, [entries]);

  const totalEnrollment = useMemo(() => {
    return typeof getTotalEnrollment === 'function'
      ? getTotalEnrollment()
      : roundTo(sumMoney(programs.map((p) => p.enrollment)), 0);
  }, [getTotalEnrollment, programs]);

  const activePrograms = useMemo(() => {
    return typeof getActiveProgramCount === 'function'
      ? getActiveProgramCount()
      : programs.filter((p) => p.status === 'Active').length;
  }, [getActiveProgramCount, programs]);

  const totalScholarshipAmount = useMemo(
    () => roundTo(sumMoney(scholarships.map((s) => s.amount)), 2),
    [scholarships]
  );

  const accountRows: AccountBreakdownRow[] = useMemo(() => aggregateAccounts(entries), [entries]);

  const handleExportPDF = () => {
    void ExportEngine.exportToPDF(
      {
        headers: ['Metric', 'Value', 'Source / Lineage'],
        rows: [
          ['Tuition & Fee Revenue', fmt.currency(totalCredit), 'GL Credit-Normal Accounts (4xxx)'],
          [
            'Instructional & Operating Spend',
            fmt.currency(totalDebit),
            'GL Debit-Normal Accounts (5xxx/6xxx)',
          ],
          ['Net Institutional Surplus', fmt.currency(netChange), 'GL Balance Net Change'],
          ['Enrolled Student Body', fmt.number(totalEnrollment), 'Academic Program Census'],
          ['Active Degree Programs', fmt.number(activePrograms), 'Accredited Program Roster'],
          ['Scholarships Awarded', fmt.number(scholarships.length), 'Institutional Aid Registry'],
          [
            'Total Financial Aid Disbursed',
            fmt.currency(totalScholarshipAmount),
            'Institutional Aid Disbursed',
          ],
          [
            'Historical Enrollment Semesters',
            fmt.number(enrollmentTrends.length),
            'Registrar Census Feeds',
          ],
        ],
      },
      { title: 'Education_Institutional_Report' }
    ).catch(reportExportFailure);
  };

  const handleExportExcel = () => {
    void ExportEngine.exportToExcel(
      {
        headers: ['Metric', 'Amount', 'Notes'],
        rows: [
          ['Tuition & Fee Revenue', totalCredit, 'GL 4xxx'],
          ['Operating & Instructional Costs', totalDebit, 'GL 5xxx/6xxx'],
          ['Net Institutional Surplus', netChange, 'GL Net Change'],
          ['Total Enrolled Students', totalEnrollment, 'Program enrollments'],
          ['Active Programs', activePrograms, 'Accredited offerings'],
          ['Financial Aid Disbursements', totalScholarshipAmount, 'Scholarships registry'],
        ],
      },
      { title: 'Education_Institutional_Review' }
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
      <main className="p-12 text-center" role="main" aria-label="Education - No Data">
        <a
          href="#import-btn"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
        >
          Skip to import action
        </a>
        <GraduationCap
          className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4"
          aria-hidden="true"
        />
        <h1 className="text-xl font-semibold mb-2">No Education Data</h1>
        <p className="text-[var(--text-muted)] mb-6">Import GL data to view education.</p>
        <Button
          id="import-btn"
          onClick={() => navigate('/data/gl-upload')}
          onKeyDown={handleImportKeyDown}
          aria-label="Import GL data to view education"
        >
          Import Data
        </Button>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6 animate-fade-in" role="main" aria-label="Education Dashboard">
      <a
        href="#kpi-section"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
      >
        Skip to key metrics
      </a>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <PageHeader
          title="Education"
          titleId="education-heading"
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
        aria-label="Education KPIs"
        aria-labelledby="education-heading"
      >
        <KPIValue
          label="Total Revenue"
          value={fmt.compact(totalCredit)}
          icon={<DollarSign className="h-4 w-4 text-[#16A34A]" aria-hidden="true" />}
        />
        <KPIValue
          label="Total Debit"
          value={fmt.compact(totalDebit)}
          icon={<TrendingUp className="h-4 w-4 text-amber-500" aria-hidden="true" />}
        />
        <KPIValue
          label="Active Accounts"
          value={fmt.number(uniqueAccounts)}
          icon={<BookOpen className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Net Change"
          value={fmt.compact(netChange)}
          icon={<GraduationCap className="h-4 w-4" aria-hidden="true" />}
        />
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4" aria-label="Academic KPIs">
        <KPIValue
          label="Enrolled Students"
          value={fmt.number(totalEnrollment)}
          changeLabel={totalEnrollment > 0 ? 'Active program census' : 'No students recorded'}
          icon={<Users className="h-4 w-4 text-blue-500" aria-hidden="true" />}
        />
        <KPIValue
          label="Degree Programs"
          value={fmt.number(activePrograms)}
          changeLabel={activePrograms > 0 ? 'Active academic departments' : 'No program records'}
          icon={<BookOpen className="h-4 w-4 text-indigo-500" aria-hidden="true" />}
        />
        <KPIValue
          label="Scholarships"
          value={fmt.number(scholarships.length)}
          changeLabel={
            scholarships.length > 0
              ? `${fmt.currency(totalScholarshipAmount)} aid allocated`
              : 'No aid records'
          }
          icon={<Award className="h-4 w-4 text-amber-500" aria-hidden="true" />}
        />
        <KPIValue
          label="Tracked Semesters"
          value={fmt.number(enrollmentTrends.length)}
          changeLabel={
            enrollmentTrends.length > 0 ? 'Historical census terms' : 'No term trend data'
          }
          icon={<GraduationCap className="h-4 w-4 text-emerald-500" aria-hidden="true" />}
        />
      </section>

      <Card aria-label="Education Basis Disclosures">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-500" aria-hidden="true" />
            Institutional Accounting Basis & Recognition (ASC 958)
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-[var(--text-muted)] space-y-1">
          <p>
            • <strong>Not-for-Profit / Higher Ed Framework:</strong> Accounting reflects ASC 958
            guidelines for Net Assets with Donor Restrictions vs Without Donor Restrictions. Tuition
            revenue is recognized net of institutional allowances and remissions.
          </p>
          <p>
            • <strong>Enrollment & Metric Feeds:</strong> Operational retention, credit hours, and
            faculty headcount require Student Information System (SIS) integration. Where SIS
            telemetry is absent, ratios are not estimated.
          </p>
        </CardContent>
      </Card>

      <AccountOverviewCard rows={accountRows} />
    </main>
  );
}

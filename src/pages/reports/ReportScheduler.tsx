import { useState, useCallback, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { useReportStore } from '@/store/reportStore';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { HelpPanel } from '@/components/ui/HelpPanel';
import { ReportScheduler as SchedulerComponent } from '@/components/reports/ReportScheduler';
import { Calendar, HelpCircle } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';

const HELP_SECTIONS = [
  {
    title: 'What is Report Scheduling?',
    content:
      'Automate the generation and distribution of financial reports on a recurring basis. Schedules can be daily, weekly, monthly, or quarterly.',
  },
  {
    title: 'Setting Up a Schedule',
    content:
      'Click "Add Schedule", select a report, choose frequency, and configure recipients. The system will automatically generate and distribute the report at the specified interval.',
  },
  {
    title: 'Managing Schedules',
    content:
      'Toggle active/inactive to pause or resume a schedule. Remove schedules that are no longer needed. Each schedule tracks its next run date.',
  },
];

export default function ReportSchedulerPage() {
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    document.title = 'FinPlan Pro — Report Scheduler';
  }, []);

  const { entries, isLoading } = useGLStore(
    useShallow((s) => ({ entries: s.entries, isLoading: s.isLoading }))
  );
  const {
    reports,
    scheduledReports,
    addScheduledReport,
    deleteScheduledReport,
    toggleScheduledReport,
  } = useReportStore(
    useShallow((s) => ({
      reports: s.reports,
      scheduledReports: s.scheduledReports,
      addScheduledReport: s.addScheduledReport,
      deleteScheduledReport: s.deleteScheduledReport,
      toggleScheduledReport: s.toggleScheduledReport,
    }))
  );
  const navigate = useNavigate();

  const availableReports = reports.map((r) => ({ id: r.id, name: r.name }));

  const handleAdd = useCallback(
    (schedule: {
      reportId: string;
      reportName: string;
      frequency: string;
      format: string;
      recipients: string[];
      isActive: boolean;
      nextRun: string;
    }) => {
      addScheduledReport({
        reportId: schedule.reportId,
        frequency: schedule.frequency,
        recipients: schedule.recipients,
        nextRun: schedule.nextRun,
        isActive: schedule.isActive,
      });
    },
    [addScheduledReport]
  );

  const handleRemove = useCallback(
    (id: string) => {
      deleteScheduledReport(id);
    },
    [deleteScheduledReport]
  );

  const handleToggle = useCallback(
    (id: string) => {
      toggleScheduledReport(id);
    },
    [toggleScheduledReport]
  );

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton
          count={1}
          height="40px"
          width="30%"
          className="mb-4"
          srLabel="Loading report schedules…"
        />
        <Skeleton count={3} variant="rectangular" height="80px" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-[var(--bg-elevated)] rounded-full inline-block mb-4">
          <Calendar className="h-10 w-10 text-[var(--text-muted)]" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No GL Data</h2>
        <p className="text-[var(--text-muted)] mb-6">
          Import General Ledger entries first, then create and schedule automated reports.
        </p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );
  }

  const schedulerSchedules = scheduledReports.map((s) => {
    const matchedReport = reports.find((r) => r.id === s.reportId);
    return {
      id: s.id,
      reportId: s.reportId,
      reportName: matchedReport?.name ?? 'Unknown Report',
      frequency: s.frequency as 'daily' | 'weekly' | 'monthly' | 'quarterly',
      format: 'pdf' as const,
      recipients: s.recipients,
      isActive: s.isActive,
      nextRun: s.nextRun,
    };
  });

  return (
    <div className="p-6 space-y-6" role="main" aria-label="Report Scheduler page">
      <div className="flex items-center justify-between">
        <div>
          <PageHeader
            title="Report Scheduler"
            actions={<button
                       onClick={() => setHelpOpen(true)}
                       className="p-2 hover:bg-slate-800 rounded-full text-[var(--text-muted)] hover:text-white transition-colors"
                       aria-label="Help"
                     >
                       <HelpCircle className="h-5 w-5" />
                     </button>}
          />
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {entries.length.toLocaleString()} GL entries available
            {scheduledReports.length > 0 &&
              ` \u00B7 ${scheduledReports.length} scheduled report${scheduledReports.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      <SchedulerComponent
        schedules={schedulerSchedules}
        onAdd={handleAdd}
        onRemove={handleRemove}
        onToggle={handleToggle}
        availableReports={
          availableReports.length > 0
            ? availableReports
            : [{ id: 'default', name: 'P&L Statement' }]
        }
      />

      <HelpPanel
        title="Report Scheduler Help"
        sections={HELP_SECTIONS}
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
      />
    </div>
  );
}

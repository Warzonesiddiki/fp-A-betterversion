import { useState, useCallback, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { useReportStore } from '@/store/reportStore';
import { findDueSchedules } from '@/services/reports/scheduleRuns';
import { nowISO } from '@/utils/clock';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
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
      'Track recurring report obligations. When a schedule falls due it is flagged here for you to run; automatic generation and email distribution are not performed by this app — recipients are recorded so you can send the report yourself. Schedules can be daily, weekly, monthly, or quarterly.',
  },
  {
    title: 'Setting Up a Schedule',
    content:
      'Click "Add Schedule", select a report, choose frequency, and configure recipients. When the schedule comes due, use "Run now" here: the run is recorded, the next run date advances, and the report opens for you to generate and distribute.',
  },
  {
    title: 'Managing Schedules',
    content:
      'Toggle active/inactive to pause or resume a schedule. Remove schedules that are no longer needed. Each schedule tracks its next run date and its last recorded run.',
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
    recordScheduleRun,
  } = useReportStore(
    useShallow((s) => ({
      reports: s.reports,
      scheduledReports: s.scheduledReports,
      addScheduledReport: s.addScheduledReport,
      deleteScheduledReport: s.deleteScheduledReport,
      toggleScheduledReport: s.toggleScheduledReport,
      recordScheduleRun: s.recordScheduleRun,
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

  const dueSchedules = findDueSchedules(scheduledReports, nowISO());

  const handleRunNow = useCallback(
    (id: string, reportId: string) => {
      recordScheduleRun(id, 'opened-for-generation');
      navigate('/reports');
      void reportId;
    },
    [recordScheduleRun, navigate]
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
      {dueSchedules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Schedules due ({dueSchedules.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dueSchedules.map((s) => {
                const matchedReport = reports.find((r) => r.id === s.reportId);
                return (
                  <div key={s.id} className="flex items-center gap-3 text-sm">
                    <span className="flex-1">
                      {matchedReport?.name ?? 'Unknown Report'} — due {s.nextRun}
                      {s.recipients.length > 0 &&
                        ` · recipients: ${s.recipients.join(', ')} (send manually)`}
                    </span>
                    <Button size="sm" onClick={() => handleRunNow(s.id, s.reportId)}>
                      Run now
                    </Button>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-3">
              Running records the run and advances the next run date. This app does not email
              reports automatically.
            </p>
          </CardContent>
        </Card>
      )}
      {scheduledReports.some((s) => s.lastRunAt) && (
        <div className="space-y-1">
          {scheduledReports
            .filter((s) => s.lastRunAt)
            .map((s) => (
              <p key={s.id} className="text-xs text-[var(--text-muted)]">
                {reports.find((r) => r.id === s.reportId)?.name ?? 'Unknown Report'}: last run{' '}
                {s.lastRunAt} ({s.lastRunStatus})
              </p>
            ))}
        </div>
      )}
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
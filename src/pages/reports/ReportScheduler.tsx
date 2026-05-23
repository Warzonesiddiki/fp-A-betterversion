import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { useReportStore } from '@/store/reportStore';
import { Button } from '@/components/ui/Button';
import { ReportScheduler } from '@/components/reports/ReportScheduler';
import { FileText, Calendar } from 'lucide-react';
import { ReportSchedulingEngine } from '@/engines/ReportSchedulingEngine';
import { ReportDistributionEngine } from '@/engines/ReportDistributionEngine';

export default function ReportSchedulerPage() {
  useEffect(() => {
    document.title = 'FinPlan Pro — Report Scheduler';
  }, []);

  const { entries } = useGLStore();
  const {
    reports,
    scheduledReports,
    addScheduledReport,
    deleteScheduledReport,
    toggleScheduledReport,
  } = useReportStore();
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

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-slate-800 rounded-full inline-block mb-4">
          <Calendar className="h-10 w-10 text-slate-400" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No GL Data</h2>
        <p className="text-slate-400 mb-6">
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
          <h1 className="text-2xl font-bold">Report Scheduler</h1>
          <p className="text-sm text-slate-400 mt-1">
            {entries.length.toLocaleString()} GL entries available
            {scheduledReports.length > 0 &&
              ` \u00B7 ${scheduledReports.length} scheduled report${scheduledReports.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      <ReportScheduler
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
    </div>
  );
}

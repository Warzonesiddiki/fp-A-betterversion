/* eslint-disable @typescript-eslint/no-unused-vars */
import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReportStore } from '@/store/reportStore';
import { ReportTemplateLibrary } from '@/components/reports/ReportTemplateLibrary';
import type { ReportDefinition, TemplateType } from '@/engines/ReportBuilderEngine';

export default function ReportTemplateLibraryPage() {
  const navigate = useNavigate();
  const { reports, createReport, deleteReport } = useReportStore();

  useEffect(() => {
    document.title = 'FinPlan Pro - Report Templates';
  }, []);

  const handleSelectTemplate = useCallback(
    (template: TemplateType) => {
      const id = createReport({
        name: `${template.replace(/_/g, ' ')} Report`,
        type: template,
        format: 'standard',
        createdAt: new Date().toISOString(),
        createdBy: 'current-user',
      });
      navigate(`/reports`);
    },
    [createReport, navigate]
  );

  const handleSelectReport = useCallback(
    (report: ReportDefinition) => {
      navigate(`/reports`);
    },
    [navigate]
  );

  const handleDeleteReport = useCallback(
    (reportId: string) => {
      deleteReport(reportId);
    },
    [deleteReport]
  );

  const handleCloneReport = useCallback(
    (report: ReportDefinition) => {
      createReport({
        name: `${report.name} (Copy)`,
        type: report.template,
        format: 'standard',
        createdAt: new Date().toISOString(),
        createdBy: 'current-user',
      });
    },
    [createReport]
  );

  return (
    <main
      className="h-[calc(100vh-4rem)] flex flex-col"
      role="main"
      aria-label="Report template library"
    >
      <ReportTemplateLibrary
        savedReports={reports as unknown as ReportDefinition[]}
        onSelectTemplate={handleSelectTemplate}
        onSelectReport={handleSelectReport}
        onDeleteReport={handleDeleteReport}
        onCloneReport={handleCloneReport}
      />
    </main>
  );
}

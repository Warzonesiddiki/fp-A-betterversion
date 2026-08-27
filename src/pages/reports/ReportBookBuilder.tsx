import { useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { useReportStore } from '@/store/reportStore';
import { Button } from '@/components/ui/Button';
import { ReportBookBuilder } from '@/components/reports/ReportBookBuilder';
import { FileText } from 'lucide-react';

export default function ReportBookBuilderPage() {
  useEffect(() => {
    document.title = 'FinPlan Pro — Report Book Builder';
  }, []);

  const entries = useGLStore((s) => s.entries);
  const reports = useReportStore((s) => s.reports);
  const navigate = useNavigate();

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-[var(--bg-elevated)] rounded-full inline-block mb-4">
          <FileText className="h-10 w-10 text-[var(--text-muted)]" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No GL Data</h2>
        <p className="text-[var(--text-muted)] mb-6">
          Import General Ledger entries to build report books from your financial data.
        </p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" role="main" aria-label="Report Book Builder page">
      <PageHeader
  title="Report Book Builder"
  purpose={<>{entries.length.toLocaleString()}GL entries available
            {reports.length > 0 &&
              ` \u00B7 ${reports.length} saved report${reports.length !== 1 ? 's' : ''}`}</>}
/>

      <ReportBookBuilder />
    </div>
  );
}

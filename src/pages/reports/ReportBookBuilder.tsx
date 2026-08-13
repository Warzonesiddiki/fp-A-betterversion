import { useEffect } from 'react';
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

  const { entries } = useGLStore();
  const { reports  } = useReportStore();
  const navigate = useNavigate();

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-slate-800 rounded-full inline-block mb-4">
          <FileText className="h-10 w-10 text-slate-400" />
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Report Book Builder</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {entries.length.toLocaleString()} GL entries available
            {reports.length > 0 &&
              ` \u00B7 ${reports.length} saved report${reports.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      <ReportBookBuilder />
    </div>
  );
}

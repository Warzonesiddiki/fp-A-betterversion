import { FileDropZone } from '@/components/ui/FileDropZone';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ArrowLeftRight } from 'lucide-react';

interface ReconciliationPanelProps {
  recFile: File | null;
  recData: Record<string, string>[];
  recKeyCol: string;
  recValCol: string;
  recError: string | null;
  csvHeaders: string[];
  onFile: (file: File) => void;
  onKeyColChange: (col: string) => void;
  onValColChange: (col: string) => void;
  onRun: () => void;
}

export function ReconciliationPanel({
  recFile,
  recData,
  recKeyCol,
  recValCol,
  recError,
  csvHeaders,
  onFile,
  onKeyColChange,
  onValColChange,
  onRun,
}: ReconciliationPanelProps) {
  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <ArrowLeftRight className="h-5 w-5 text-blue-400" aria-hidden="true" />
        <h2 className="font-semibold">Data Reconciliation</h2>
      </div>
      <p className="text-sm text-[var(--text-muted)] mb-4">
        Upload a CSV file from your source system to compare against imported data. The
        reconciliation will check account-level balances.
      </p>
      <FileDropZone onFile={onFile} accept=".csv" aria-label="Upload reconciliation CSV file" />
      {recError && (
        <Alert type="error" title="Reconciliation Error" message={recError} className="mt-4" />
      )}
      {recData.length > 0 && (
        <div className="mt-4 space-y-4">
          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
            <p className="text-sm text-slate-400 mb-2">
              {recData.length.toLocaleString()} rows loaded from {recFile?.name}. Select columns to
              match:
            </p>
            <div className="flex gap-3 items-center">
              <div>
                <label
                  htmlFor="rec-key-col"
                  className="block text-xs text-[var(--text-muted)] mb-1"
                >
                  Account Key Column
                </label>
                <select
                  id="rec-key-col"
                  className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                  value={recKeyCol}
                  onChange={(e) => onKeyColChange(e.target.value)}
                  aria-label="Select account key column"
                >
                  {csvHeaders.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="rec-val-col"
                  className="block text-xs text-[var(--text-muted)] mb-1"
                >
                  Balance Column
                </label>
                <select
                  id="rec-val-col"
                  className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                  value={recValCol}
                  onChange={(e) => onValColChange(e.target.value)}
                  aria-label="Select balance column"
                >
                  {csvHeaders.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                className="mt-5"
                onClick={onRun}
                disabled={!recKeyCol || !recValCol}
                aria-label="Run reconciliation"
              >
                <ArrowLeftRight className="h-4 w-4 mr-2" aria-hidden="true" />
                Run Reconciliation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

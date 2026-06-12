/* eslint-disable react/no-unescaped-entities */
import { Card } from '@/components/ui/Card';
import type { GeneratedReport, GenerationProgress } from '@/engines/ReportBookEngine';

// ---------------------------------------------------------------------------
// Batch runner — processes items in parallel batches
// ---------------------------------------------------------------------------

export async function runBatched<T, R>(
  items: T[],
  batchSize: number,
  handler: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(handler));
    results.push(...batchResults);
  }
  return results;
}

// ---------------------------------------------------------------------------
// CSV helper
// ---------------------------------------------------------------------------

export function reportToCsv(report: GeneratedReport): string {
  const header = report.data.headers.join(',');
  const rows = report.data.rows.map((row) =>
    row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  );
  return [header, ...rows].join('\n');
}

// ---------------------------------------------------------------------------
// Progress panel
// ---------------------------------------------------------------------------

interface ProgressPanelProps {
  progress: GenerationProgress;
  elapsed: number;
}

export function ProgressPanel({ progress, elapsed }: ProgressPanelProps) {
  const pct = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
  const remaining =
    progress.completed > 0
      ? ((elapsed / progress.completed) * (progress.total - progress.completed)) / 1000
      : 0;

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Generation Progress</h3>
        <span className="text-xs text-slate-400">
          {progress.status === 'running'
            ? `${Math.round(remaining)}s remaining`
            : progress.status}
        </span>
      </div>
      <div className="flex justify-between text-xs text-slate-400">
        <span>
          {progress.currentReport && `${progress.currentReport} \u2014 ${progress.currentEntity}`}
        </span>
        <span>
          {progress.completed}/{progress.total} ({pct}%)
        </span>
      </div>
      <div className="h-3 rounded-full bg-slate-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            progress.status === 'error' ? 'bg-red-500' : 'bg-emerald-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="grid grid-cols-5 gap-1">
        {Array.from({ length: progress.total }, (_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full ${
              i < progress.completed
                ? progress.errors.length > 0 && i >= progress.completed - progress.errors.length
                  ? 'bg-red-500'
                  : 'bg-emerald-500'
                : 'bg-slate-700'
            }`}
          />
        ))}
      </div>
      {progress.errors.length > 0 && (
        <div className="max-h-24 overflow-auto rounded bg-red-950/30 p-2"> role="alert"  role="alert" 
          <p className="text-xs font-medium text-red-400 mb-1">
            {progress.errors.length} error(s)
          </p>
          <ul className="text-xs text-red-300 space-y-0.5">
            {progress.errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

import type { DiffEntry } from '@/engines/VersionControlEngine';
import { Card, CardContent } from '@/components/ui/Card';

interface VersionDiffViewerProps {
  diffEntries: readonly DiffEntry[];
  sourceLabel: string;
  targetLabel: string;
  title?: string;
}

export function VersionDiffViewer({
  diffEntries,
  sourceLabel,
  targetLabel,
  title,
}: VersionDiffViewerProps) {
  return (
    <Card>
      <CardContent className="p-4">
        {title && <h3 className="font-semibold mb-3">{title}</h3>}
        <p className="text-sm text-slate-400">
          {diffEntries.length} changes between {sourceLabel} and {targetLabel}
        </p>
        {diffEntries.length === 0 && (
          <p className="text-sm text-slate-500 mt-2">No differences found.</p>
        )}
      </CardContent>
    </Card>
  );
}

// src/components/audit/AuditExportButton.tsx
// Clio (Audit Muse) — Part 141 P0A-17 — CSV + JSON export buttons

import { Download, FileJson } from 'lucide-react';
import type { JSX } from 'react';
import { useAuditTrailStore } from '@/store/auditTrailStore';
import { Button } from '@/components/ui/Button';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AuditExportButton(): JSX.Element {
  const exportToCSV = useAuditTrailStore((s) => s.exportToCSV);
  const exportToJSON = useAuditTrailStore((s) => s.exportToJSON);

  const handleCSVExport = (): void => {
    const csv = exportToCSV();
    const filename = `audit-trail-${new Date().toISOString().slice(0, 10)}.csv`;
    downloadFile(csv, filename, 'text/csv');
  };

  const handleJSONExport = (): void => {
    const json = exportToJSON();
    const filename = `audit-trail-${new Date().toISOString().slice(0, 10)}.json`;
    downloadFile(json, filename, 'application/json');
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleCSVExport} aria-label="Export to CSV">
        <Download className="h-4 w-4 mr-1" /> CSV
      </Button>
      <Button variant="outline" size="sm" onClick={handleJSONExport} aria-label="Export to JSON">
        <FileJson className="h-4 w-4 mr-1" /> JSON
      </Button>
    </div>
  );
}

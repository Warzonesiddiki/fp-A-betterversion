import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { GeneratedReport, BoardPackSection } from '@/engines/ReportBookEngine';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface ReportTableProps {
  report: GeneratedReport;
}

function ReportTable({ report }: ReportTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b-2 border-slate-600">
            {report.data.headers.map((h, i) => (
              <th
                key={i}
                className={`py-1.5 px-2 text-slate-400 font-medium ${
                  i > 0 ? 'text-right' : 'text-left'
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {report.data.rows.map((row, ri) => (
            <tr key={ri} className="border-b border-slate-800">
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className={`py-1 px-2 ${ci > 0 ? 'text-right font-mono' : ''} ${
                    ri === 0 ? 'font-semibold text-white' : 'text-slate-300'
                  }`}
                >
                  {String(cell ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {report.data.footers && report.data.footers.length > 0 && (
        <div className="mt-2 pt-1 border-t border-slate-700">
          {report.data.footers.map((f, i) => (
            <p key={i} className="text-xs text-slate-500">{f}</p>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ReportResultsPanelProps {
  reports: GeneratedReport[];
  sections: BoardPackSection[];
  onDownloadZip: () => void;
  onDownloadBoardPack: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReportResultsPanel({
  reports = [],
  sections = [],
  onDownloadZip = () => {},
  onDownloadBoardPack = () => {},
}: ReportResultsPanelProps) {
  const [activeTab, setActiveTab] = useState<'reports' | 'sections'>('reports');
  const [selectedReport, setSelectedReport] = useState<GeneratedReport | null>(null);

  const entityNames = useMemo(() => [...new Set(reports.map((r) => r.entityName))], [reports]);
  const reportNames = useMemo(() => [...new Set(reports.map((r) => r.reportName))], [reports]);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card className="p-4">
        <div className="grid grid-cols-4 gap-3 text-center">
          <div>
            <p className="text-2xl font-bold text-emerald-400">{reports.length}</p>
            <p className="text-xs text-slate-400">Reports</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{entityNames.length}</p>
            <p className="text-xs text-slate-400">Entities</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{reportNames.length}</p>
            <p className="text-xs text-slate-400">Templates</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{sections.length}</p>
            <p className="text-xs text-slate-400">Sections</p>
          </div>
        </div>
      </Card>

      {/* Export */}
      <Card className="p-4 space-y-3">
        <h3 className="text-sm font-semibold text-white">Export</h3>
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={onDownloadZip} className="w-full">
            Download ZIP (CSV)
          </Button>
          <Button onClick={onDownloadBoardPack} variant="secondary" className="w-full">
            Board Pack (JSON)
          </Button>
        </div>
        <p className="text-xs text-slate-500">
          ZIP: one CSV per report organized by entity. Board pack: structured JSON for PDF rendering.
        </p>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700">
        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          className={`pb-2 text-sm transition-colors ${
            activeTab === 'reports'
              ? 'border-b-2 border-blue-500 text-white'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          All Reports ({reports.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('sections')}
          className={`pb-2 text-sm transition-colors ${
            activeTab === 'sections'
              ? 'border-b-2 border-blue-500 text-white'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          Sections ({sections.length})
        </button>
      </div>

      {/* Report list + preview */}
      {activeTab === 'reports' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="space-y-1 max-h-[500px] overflow-auto">
            {reports.map((report, i) => (
              <button
                key={`${report.entryId}-${report.entityId}-${i}`}
                type="button"
                onClick={() => setSelectedReport(report)}
                className={`w-full text-left rounded-lg border px-3 py-2 transition-colors ${
                  selectedReport === report
                    ? 'border-blue-500 bg-blue-600/15'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                }`}
              >
                <p className="text-sm font-medium text-white truncate">{report.reportName}</p>
                <p className="text-xs text-slate-400">
                  {report.entityName} &middot; {report.data.rows.length} rows
                </p>
              </button>
            ))}
          </div>
          <div>
            {selectedReport ? (
              <Card className="p-4 bg-white dark:bg-gray-800 max-h-[500px] overflow-auto">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                  {selectedReport.reportName}
                </h4>
                <p className="text-xs text-slate-500 mb-3">{selectedReport.entityName}</p>
                <ReportTable report={selectedReport} />
              </Card>
            ) : (
              <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
                Select a report to preview
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sections */}
      {activeTab === 'sections' && (
        <div className="space-y-3">
          {sections.map((section, si) => (
            <Card key={section.id} className="p-4 space-y-2">
              <h4 className="text-sm font-semibold text-white">
                {si + 1}. {section.title}
                <span className="ml-2 text-xs text-slate-400 font-normal">
                  ({section.reports.length} report{section.reports.length !== 1 ? 's' : ''})
                </span>
              </h4>
              <div className="space-y-1">
                {section.reports.map((report, ri) => (
                  <div
                    key={ri}
                    className="flex items-center justify-between text-xs text-slate-400 bg-slate-800/30 rounded px-2 py-1"
                  >
                    <span>
                      {report.entityName} &mdash; {report.reportName}
                    </span>
                    <span className="text-slate-500">{report.data.rows.length} rows</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

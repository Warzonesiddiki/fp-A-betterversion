/* eslint-disable jsx-a11y/label-has-associated-control, react/no-unescaped-entities */
import { useCallback, useState } from 'react';
import { X, FileText, Table, Download, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import {
  ReportBuilderEngine,
  type ReportDefinition,
  type CubeData,
  type ExportFormat,
} from '@/engines/ReportBuilderEngine';
import { ExportEngine } from '@/engines/ExportEngine';

/* ────────────────── props ────────────────── */

export interface ExportDialogProps {
  report: ReportDefinition;
  cubeData: CubeData;
  onClose: () => void;
  className?: string;
}

/* ────────────────── export options ────────────────── */

interface ExportOption {
  format: ExportFormat;
  label: string;
  description: string;
  icon: typeof FileText;
  color: string;
}

const EXPORT_OPTIONS: ExportOption[] = [
  {
    format: 'pdf',
    label: 'PDF',
    description: 'Printable document with headers and page numbers',
    icon: FileText,
    color: 'text-red-400',
  },
  {
    format: 'excel',
    label: 'Excel',
    description: 'Spreadsheet with formulas and conditional formatting',
    icon: Table,
    color: 'text-green-400',
  },
  {
    format: 'csv',
    label: 'CSV',
    description: 'Comma-separated values for data import',
    icon: Download,
    color: 'text-blue-400',
  },
];

/* ────────────────── PDF options ────────────────── */

interface PDFOptions {
  orientation: 'portrait' | 'landscape';
  pageSize: 'letter' | 'a4' | 'legal';
  showPageNumbers: boolean;
  showTimestamp: boolean;
  watermark: string;
}

const DEFAULT_PDF_OPTIONS: PDFOptions = {
  orientation: 'landscape',
  pageSize: 'letter',
  showPageNumbers: true,
  showTimestamp: true,
  watermark: '',
};

/* ────────────────── main component ────────────────── */

export function ExportDialog({ report, cubeData, onClose, className }: ExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [pdfOptions, setPdfOptions] = useState<PDFOptions>(DEFAULT_PDF_OPTIONS);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setExportError(null);
    setExportSuccess(false);

    try {
      if (selectedFormat === 'pdf') {
        const metadata = ReportBuilderEngine.generatePDFMetadata(report, {
          orientation: pdfOptions.orientation,
          pageSize: pdfOptions.pageSize,
          showPageNumbers: pdfOptions.showPageNumbers,
          showTimestamp: pdfOptions.showTimestamp,
          watermark: pdfOptions.watermark || undefined,
        });

        // Build ExportData from the resolved layout
        const resolved = ReportBuilderEngine.resolveLayout(report.layout, cubeData);
        const visibleColumns = ReportBuilderEngine.getVisibleColumns(report.layout);
        const headers = visibleColumns.map((col) => col.header);
        const rows: (string | number | boolean | null)[][] = [];

        for (let ri = 0; ri < report.layout.rows.length; ri++) {
          const row = report.layout.rows[ri];
          if (!row) continue;
          if (!row.isVisible) continue;
          const exportRow: (string | number | boolean | null)[] = [];
          for (let ci = 0; ci < report.layout.columns.length; ci++) {
            const col = report.layout.columns[ci];
            if (!col) continue;
            if (!col.isVisible) continue;
            const cell = resolved[ri]?.[ci];
            exportRow.push(cell?.rawValue ?? null);
          }
          rows.push(exportRow);
        }

        ExportEngine.exportToPDF(
          { headers, rows },
          {
            title: metadata.title,
            subtitle: metadata.subtitle,
            orientation: metadata.orientation === 'landscape' ? 'l' : 'p',
            pageSize: metadata.pageSize,
            companyName: 'FinPlan Pro',
          }
        );
      } else if (selectedFormat === 'excel') {
        const excelResult = ReportBuilderEngine.generateExcelExport(report, cubeData);
        const sheet = excelResult.sheets[0];
        if (!sheet) throw new Error('No sheet data generated');

        ExportEngine.exportToExcel(
          { headers: sheet.data[0] as string[], rows: sheet.data.slice(1) },
          { title: report.name, companyName: 'FinPlan Pro' }
        );
      } else if (selectedFormat === 'csv') {
        const csvResult = ReportBuilderEngine.generateCSVExport(report, cubeData);

        const blob = new Blob(['\uFEFF' + csvResult.content], {
          type: 'text/csv;charset=utf-8;',
        });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', csvResult.filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Export failed';
      setExportError(message);
    } finally {
      setIsExporting(false);
    }
  }, [selectedFormat, pdfOptions, report, cubeData]);

  return (
    <div className={cn('bg-slate-900 border border-slate-700 rounded-lg p-4 space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-white flex items-center gap-2">
          <Download className="h-4 w-4 text-blue-400" />
          Export Report
        </h4>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
          aria-label="Close export dialog"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Format selection */}
      <div className="space-y-2">
        <p className="text-xs text-slate-500">Export format</p>
        <div className="grid grid-cols-3 gap-2">
          {EXPORT_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.format}
                onClick={() => setSelectedFormat(option.format)}
                className={cn(
                  'flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-colors',
                  selectedFormat === option.format
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                )}
              >
                <Icon className={cn('h-5 w-5', option.color)} />
                <span className="text-xs font-medium text-white">{option.label}</span>
                <span className="text-[10px] text-slate-500 text-center leading-tight">
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* PDF options */}
      {selectedFormat === 'pdf' && (
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <p className="text-xs text-slate-400 font-medium">PDF Options</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="pdf-orientation" className="text-xs text-slate-500 block mb-1">Orientation</label>
              <select
                id="pdf-orientation"
                value={pdfOptions.orientation}
                onChange={(e) =>
                  setPdfOptions((prev) => ({
                    ...prev,
                    orientation: e.target.value as 'portrait' | 'landscape',
                  }))
                }
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-white"
              >
                <option value="landscape">Landscape</option>
                <option value="portrait">Portrait</option>
              </select>
            </div>

            <div>
              <label htmlFor="pdf-page-size" className="text-xs text-slate-500 block mb-1">Page Size</label>
              <select
                id="pdf-page-size"
                value={pdfOptions.pageSize}
                onChange={(e) =>
                  setPdfOptions((prev) => ({
                    ...prev,
                    pageSize: e.target.value as 'letter' | 'a4' | 'legal',
                  }))
                }
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-white"
              >
                <option value="letter">Letter</option>
                <option value="a4">A4</option>
                <option value="legal">Legal</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 text-xs text-slate-400">
              <input
                type="checkbox"
                checked={pdfOptions.showPageNumbers}
                onChange={(e) =>
                  setPdfOptions((prev) => ({ ...prev, showPageNumbers: e.target.checked }))
                }
                className="rounded"
              />
              Page numbers
            </label>
            <label className="flex items-center gap-1.5 text-xs text-slate-400">
              <input
                type="checkbox"
                checked={pdfOptions.showTimestamp}
                onChange={(e) =>
                  setPdfOptions((prev) => ({ ...prev, showTimestamp: e.target.checked }))
                }
                className="rounded"
              />
              Timestamp
            </label>
          </div>

          <div>
            <label className="text-xs text-slate-500 block mb-1">Watermark (optional)</label>
            <input
              type="text"
              value={pdfOptions.watermark}
              onChange={(e) => setPdfOptions((prev) => ({ ...prev, watermark: e.target.value }))}
              placeholder="DRAFT, CONFIDENTIAL, etc."
              className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-white placeholder:text-slate-600"
            />
          </div>
        </div>
      )}

      {/* Report summary */}
      <div className="pt-2 border-t border-slate-800">
        <p className="text-xs text-slate-500">
          Report: <span className="text-slate-300">{report.name}</span>
        </p>
        <p className="text-xs text-slate-500">
          Rows: <span className="text-slate-300">{report.layout.rows.length}</span>
          {' | '}
          Columns: <span className="text-slate-300">{report.layout.columns.length}</span>
        </p>
      </div>

      {/* Status messages */}
      {exportError && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded"> role="alert"  role="alert" 
          <X className="h-3.5 w-3.5 flex-shrink-0" />
          {exportError}
        </div>
      )}

      {exportSuccess && (
        <div className="flex items-center gap-2 text-xs text-green-400 bg-green-500/10 px-3 py-2 rounded">
          <Download className="h-3.5 w-3.5 flex-shrink-0" />
          Export completed successfully
        </div>
      )}

      {/* Export button */}
      <button
        onClick={handleExport}
        disabled={isExporting}
        className={cn(
          'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded text-sm font-medium transition-colors',
          isExporting
            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-500'
        )}
      >
        {isExporting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            Export {selectedFormat.toUpperCase()}
          </>
        )}
      </button>
    </div>
  );
}

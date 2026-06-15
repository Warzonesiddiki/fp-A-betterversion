import React, { useState, useCallback, useMemo } from 'react';
import {
  Save,
  FolderOpen,
  Undo2,
  Redo2,
  Eye,
  Layout,
  FileText,
  Table as TableIcon,
  Download,
  Plus,
  Rows,
  Columns,
  Sigma,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import { useCubeStore } from '@/store/cubeStore';
import { DesignerSidebar } from './DesignerSidebar';
import { PeriodPromptBar, type PeriodPrompt } from './PeriodPromptBar';
import { FilterPanel, type ActiveFilter } from './FilterPanel';
import { TemplateModal } from './TemplateModal';
import { ReportGrid } from '../ReportGrid';
import {
  ReportBuilderEngine,
  type ReportDefinition,
  type ReportLayout,
  type RowType,
  type TemplateType,
  type ExportFormat,
} from '@/engines/ReportBuilderEngine';

const COLUMN_TYPES_MAP: Record<
  string,
  { type: 'label' | 'period' | 'custom'; label: string; period?: 'actual' | 'budget' | 'forecast' | 'variance' }
> = {
  'Label Column': { type: 'label', label: 'Label' },
  'Actual Column': { type: 'period', label: 'Actual', period: 'actual' },
  'Budget Column': { type: 'period', label: 'Budget', period: 'budget' },
  'Forecast Column': { type: 'period', label: 'Forecast', period: 'forecast' },
  'Variance Column': { type: 'period', label: 'Variance', period: 'variance' },
  'Custom Column': { type: 'custom', label: 'Custom' },
};

export function ReportDesigner() {
  const { engine } = useCubeStore();
  const [report, setReport] = useState<ReportDefinition>(() =>
    ReportBuilderEngine.createReport('New Report', 'custom', 'designer')
  );
  const [history, setHistory] = useState<ReportDefinition[]>([report]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [previewMode, setPreviewMode] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [savedReports, setSavedReports] = useState<ReportDefinition[]>([]);
  const [subtotalsEnabled, setSubtotalsEnabled] = useState(true);
  const [periodPrompt, setPeriodPrompt] = useState<PeriodPrompt>({
    fiscalYear: 'FY 2026', quarter: 'Full Year', month: 'All Months',
  });
  const [filters, setFilters] = useState<ActiveFilter[]>([]);

  const pushHistory = useCallback(
    (next: ReportDefinition) => {
      setHistory((prev) => [...prev.slice(0, historyIndex + 1), next]);
      setHistoryIndex((i) => i + 1);
      setReport(next);
    },
    [historyIndex]
  );

  const undo = useCallback(() => {
    if (historyIndex > 0) { setHistoryIndex(historyIndex - 1); setReport(history[historyIndex - 1]!); }
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) { setHistoryIndex(historyIndex + 1); setReport(history[historyIndex + 1]!); }
  }, [historyIndex, history]);

  const updateLayout = useCallback(
    (updater: (layout: ReportLayout) => ReportLayout) => {
      const nextLayout = updater(report.layout);
      pushHistory({ ...report, layout: nextLayout, updatedAt: new Date().toISOString(), version: report.version + 1 });
    },
    [report, pushHistory]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, target: 'rows' | 'columns') => {
      e.preventDefault();
      try {
        const data = JSON.parse(e.dataTransfer.getData('application/json'));
        if (target === 'rows') {
          if (data.type === 'dimension') {
            const members = engine.getMembers(data.value);
            updateLayout((layout) => {
              let next = ReportBuilderEngine.addRow(layout, 'header');
              const headerIdx = next.rows.length - 1;
              const labelColIdx = next.columns.findIndex((c) => c.type === 'label');
              if (labelColIdx !== -1) {
                next = ReportBuilderEngine.updateCell(next, headerIdx, labelColIdx,
                  { type: 'text', content: { text: data.value } }, { bold: true, backgroundColor: '#1e293b' });
              }
              members.slice(0, 8).forEach((m) => {
                next = ReportBuilderEngine.addRow(next, 'data');
                if (labelColIdx !== -1) {
                  next = ReportBuilderEngine.updateCell(next, next.rows.length - 1, labelColIdx,
                    { type: 'text', content: { text: m.name } }, { indent: 1 });
                }
              });
              return next;
            });
          } else if (data.type === 'row-type' || data.type === 'element') {
            updateLayout((l) => ReportBuilderEngine.addRow(l, data.value as RowType));
          }
        } else if (target === 'columns') {
          if (data.type === 'measure') {
            updateLayout((l) => ReportBuilderEngine.addColumn(l, { type: 'period', header: data.value.measure, width: 140, period: 'actual' }));
          } else if (data.type === 'dimension') {
            const members = engine.getMembers(data.value);
            updateLayout((l) => members.slice(0, 4).reduce((acc, m) =>
              ReportBuilderEngine.addColumn(acc, { type: 'period', header: m.name, width: 120, period: 'actual' }), l));
          } else if (data.type === 'column-type') {
            const colDef = COLUMN_TYPES_MAP[data.value as string];
            if (colDef) updateLayout((l) => ReportBuilderEngine.addColumn(l, { type: colDef.type, header: colDef.label, width: colDef.type === 'label' ? 220 : 130, period: colDef.period }));
          }
        }
      } catch { /* ignore invalid drag data */ }
    },
    [engine, updateLayout]
  );

  const handleExport = useCallback((format: ExportFormat) => {
    ReportBuilderEngine.exportReport(report, {}, format);
  }, [report]);

  const handleSave = useCallback(() => {
    setSavedReports((prev) => {
      const idx = prev.findIndex((r) => r.id === report.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = report; return next; }
      return [...prev, report];
    });
  }, [report]);

  const handleLoadTemplate = useCallback((type: TemplateType) => {
    pushHistory(ReportBuilderEngine.createReport(`${type} Report`, type, 'designer'));
    setFilters([]);
    setShowTemplateModal(false);
  }, [pushHistory]);

  const cubeData = useMemo(() => {
    const data: Record<string, number> = {};
    report.layout.rows.forEach((row) => {
      report.layout.columns.forEach((col) => {
        if (col.type !== 'label') {
          const labelCell = row.cells.find((_, i) => report.layout.columns[i]?.type === 'label');
          const label = (labelCell?.content as { content?: { text?: string } })?.content?.text ?? 'Unknown';
          data[`${label}.${col.header}`] = Math.random() * 100000;
        }
      });
    });
    return data;
  }, [report.layout]);

  const validation = useMemo(() => ReportBuilderEngine.validateReport(report), [report]);

  return (
    <div className="flex h-full w-full bg-[var(--bg-root)] overflow-hidden font-sans antialiased text-[var(--text-secondary)]" role="region" aria-label="ReportDesigner">
      {!previewMode && <DesignerSidebar onDragStart={(e, item) => { e.dataTransfer.setData('application/json', JSON.stringify(item)); }} />}

      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Toolbar */}
        <header className="h-14 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] backdrop-blur-md flex items-center justify-between px-4 z-20">
          <div className="flex items-center gap-3">
            <input type="text" value={report.name} onChange={(e) => setReport({ ...report, name: e.target.value })} className="bg-transparent border-none focus:ring-0 font-bold text-[var(--text-primary)] p-0 text-sm h-5 w-48" aria-label="Report name" />
            {validation.errors.length > 0 && <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">{validation.errors.length} issue{validation.errors.length > 1 ? 's' : ''}</span>}
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" onClick={() => setShowTemplateModal(true)}><FolderOpen className="h-3.5 w-3.5 mr-1.5" />Template</Button>
            <div className="w-px h-5 bg-[var(--border-default)] mx-1" />
            <Button variant={subtotalsEnabled ? 'default' : 'ghost'} size="sm" onClick={() => setSubtotalsEnabled((p) => !p)} className={subtotalsEnabled ? 'bg-blue-600 hover:bg-blue-500 text-white' : ''}><Sigma className="h-3.5 w-3.5 mr-1" />Totals</Button>
            <div className="w-px h-5 bg-[var(--border-default)] mx-1" />
            <Button variant="ghost" size="sm" onClick={undo} disabled={historyIndex === 0} aria-label="Undo"><Undo2 className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" onClick={redo} disabled={historyIndex === history.length - 1} aria-label="Redo"><Redo2 className="h-4 w-4" /></Button>
            <div className="w-px h-5 bg-[var(--border-default)] mx-1" />
            <div className="flex bg-[var(--bg-hover)] rounded-lg p-0.5">
              <button onClick={() => setPreviewMode(false)} className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-all', !previewMode ? 'bg-blue-600 text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]')}><Layout className="h-3 w-3" />Design</button>
              <button onClick={() => setPreviewMode(true)} className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-all', previewMode ? 'bg-blue-600 text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]')}><Eye className="h-3 w-3" />Preview</button>
            </div>
            <div className="w-px h-5 bg-[var(--border-default)] mx-1" />
            <Button variant="ghost" size="sm" onClick={() => handleExport('pdf')} aria-label="Export as PDF"><FileText className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="sm" onClick={() => handleExport('excel')} aria-label="Export as Excel"><TableIcon className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="sm" onClick={() => handleExport('csv')} aria-label="Export as CSV"><Download className="h-3.5 w-3.5" /></Button>
            <div className="w-px h-5 bg-[var(--border-default)] mx-1" />
            <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20" onClick={handleSave}><Save className="h-3.5 w-3.5 mr-1.5" />Save</Button>
          </div>
        </header>

        <PeriodPromptBar value={periodPrompt} onChange={setPeriodPrompt} />

        {/* Canvas */}
        <main className="flex-1 overflow-auto bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 to-slate-950 p-6 relative">
          {report.layout.rows.length === 0 && report.layout.columns.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md p-10 border-2 border-dashed border-slate-700 rounded-2xl flex flex-col items-center gap-5 text-center">
                <div className="p-3 bg-blue-500/10 rounded-xl"><Layout className="h-10 w-10 text-blue-400" /></div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-white">Build Your Report</h3>
                  <p className="text-[var(--text-muted)] text-xs">Drag dimensions and measures from the sidebar, or start from a template.</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--bg-hover)] rounded-lg text-[10px] text-[var(--text-secondary)] border border-[var(--border-default)]"><Rows className="h-3 w-3" /> Rows</div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--bg-hover)] rounded-lg text-[10px] text-[var(--text-secondary)] border border-[var(--border-default)]"><Columns className="h-3 w-3" /> Columns</div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setShowTemplateModal(true)} className="mt-2"><FolderOpen className="h-3.5 w-3.5 mr-1.5" />Start from Template</Button>
              </motion.div>
            </div>
          )}

          <div className="max-w-6xl mx-auto space-y-4">
            <FilterPanel filters={filters} onAddFilter={(f) => setFilters((p) => [...p, f])} onRemoveFilter={(id) => setFilters((p) => p.filter((f) => f.id !== id))} onUpdateFilter={(id, u) => setFilters((p) => p.map((f) => (f.id === id ? { ...f, ...u } : f)))} className="bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-default)] p-3" />

            <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, 'columns')} className="flex items-center justify-center h-10 border border-dashed border-slate-700 rounded-xl hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group">
              <span className="text-[10px] uppercase tracking-tighter text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] font-bold flex items-center gap-1.5"><Plus className="h-3 w-3" />Drop Measures or Dimensions for Columns</span>
            </div>

            <div className="flex gap-3 items-start">
              <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, 'rows')} className="w-7 self-stretch min-h-[200px] border border-dashed border-slate-700 rounded-xl hover:border-blue-500/50 hover:bg-blue-500/5 transition-all flex items-center justify-center group">
                <div className="rotate-90 text-[10px] uppercase tracking-tighter text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] font-bold whitespace-nowrap"><Plus className="h-3 w-3 inline mr-1" />Rows</div>
              </div>
              <div className="flex-1 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-default)] p-1 shadow-xl">
                <ReportGrid layout={report.layout} cubeData={cubeData} onExportPDF={() => handleExport('pdf')} onExportExcel={() => handleExport('excel')} onExportCSV={() => handleExport('csv')} className="rounded-lg overflow-hidden" />
              </div>
            </div>
          </div>
        </main>
      </div>

      <TemplateModal isOpen={showTemplateModal} onClose={() => setShowTemplateModal(false)} onSelectTemplate={handleLoadTemplate} onLoadSaved={(r) => { pushHistory(r); setShowTemplateModal(false); }} savedReports={savedReports} />
    </div>
  );
}

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  GripVertical,
  Plus,
  Trash2,
  Settings,
  Eye,
  Save,
  Undo2,
  Redo2,
  Layers,
  Columns,
  Rows,
  Contrast,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import { ReportGrid } from './ReportGrid';
import {
  ReportBuilderEngine,
  type ReportDefinition,
  type ReportLayout,
  type RowType,
  type ColumnType,
  type PeriodType,
  type CubeData,
} from '@/engines/ReportBuilderEngine';

/* ────────────────── props ────────────────── */

export interface ReportBuilderProps {
  initialReport?: ReportDefinition;
  cubeData?: CubeData;
  onSave?: (report: ReportDefinition) => void;
  onExportPDF?: (report: ReportDefinition) => void;
  onExportExcel?: (report: ReportDefinition) => void;
  onExportCSV?: (report: ReportDefinition) => void;
  className?: string;
}

/* ────────────────── draggable item ────────────────── */

interface DragItem {
  type: 'row-type' | 'column-type';
  value: string;
}

/* ────────────────── available items ────────────────── */

const ROW_TYPES: Array<{ type: RowType; label: string; icon: string }> = [
  { type: 'header', label: 'Header Row', icon: 'H' },
  { type: 'data', label: 'Data Row', icon: 'D' },
  { type: 'subtotal', label: 'Subtotal Row', icon: 'S' },
  { type: 'total', label: 'Total Row', icon: 'T' },
  { type: 'blank', label: 'Blank Row', icon: '—' },
];

const COLUMN_TYPES: Array<{ type: ColumnType; label: string; period?: PeriodType }> = [
  { type: 'label', label: 'Label Column' },
  { type: 'period', label: 'Actual Column', period: 'actual' },
  { type: 'period', label: 'Budget Column', period: 'budget' },
  { type: 'period', label: 'Forecast Column', period: 'forecast' },
  { type: 'period', label: 'Variance Column', period: 'variance' },
  { type: 'custom', label: 'Custom Column' },
];

/* ────────────────── main component ────────────────── */

export function ReportBuilder({
  initialReport,
  cubeData = {},
  onSave,
  onExportPDF,
  onExportExcel,
  onExportCSV,
  className,
}: ReportBuilderProps) {
  const [report, setReport] = useState<ReportDefinition>(
    () => initialReport ?? ReportBuilderEngine.createReport('New Report', 'custom', 'user')
  );
  const [history, setHistory] = useState<ReportDefinition[]>([report]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [activePanel, setActivePanel] = useState<'rows' | 'columns' | 'properties'>('rows');
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
  const [selectedColIndex, setSelectedColIndex] = useState<number | null>(null);
  const [highContrast, setHighContrast] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.localStorage.getItem('reportBuilder.highContrast') === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-high-contrast', String(highContrast));
    try {
      if (highContrast) {
        window.localStorage.setItem('reportBuilder.highContrast', '1');
      } else {
        window.localStorage.removeItem('reportBuilder.highContrast');
      }
    } catch {
      /* ignore */
    }
  }, [highContrast]);

  const toggleHighContrast = useCallback(() => {
    setHighContrast((prev) => !prev);
  }, []);

  /* ── undo / redo ── */
  const pushHistory = useCallback(
    (next: ReportDefinition) => {
      setHistory((prev) => [...prev.slice(0, historyIndex + 1), next]);
      setHistoryIndex((i) => i + 1);
      setReport(next);
    },
    [historyIndex]
  );

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const next = historyIndex - 1;
      const nextReport = history[next];
      if (nextReport) {
        setHistoryIndex(next);
        setReport(nextReport);
      }
    }
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const next = historyIndex + 1;
      const nextReport = history[next];
      if (nextReport) {
        setHistoryIndex(next);
        setReport(nextReport);
      }
    }
  }, [historyIndex, history]);

  /* ── layout mutation helpers ── */
  const updateLayout = useCallback(
    (updater: (layout: ReportLayout) => ReportLayout) => {
      const newLayout = updater(report.layout);
      pushHistory({
        ...report,
        layout: newLayout,
        updatedAt: new Date().toISOString(),
        version: report.version + 1,
      });
    },
    [report, pushHistory]
  );

  /* ── row operations ── */
  const addRow = useCallback(
    (type: RowType) => {
      updateLayout((layout) => ReportBuilderEngine.addRow(layout, type));
    },
    [updateLayout]
  );

  const removeRow = useCallback(
    (rowId: string) => {
      updateLayout((layout) => ReportBuilderEngine.removeRow(layout, rowId));
      setSelectedRowIndex(null);
    },
    [updateLayout]
  );

  /* ── column operations ── */
  const addColumn = useCallback(
    (colType: ColumnType, period?: PeriodType) => {
      updateLayout((layout) =>
        ReportBuilderEngine.addColumn(layout, {
          type: colType,
          header:
            colType === 'label'
              ? 'Label'
              : period
                ? period.charAt(0).toUpperCase() + period.slice(1)
                : 'Custom',
          width: colType === 'label' ? 220 : 130,
          period,
        })
      );
    },
    [updateLayout]
  );

  const removeColumn = useCallback(
    (colId: string) => {
      updateLayout((layout) => ReportBuilderEngine.removeColumn(layout, colId));
      setSelectedColIndex(null);
    },
    [updateLayout]
  );

  /* ── row/column name editing ── */
  const updateRowLabel = useCallback(
    (rowIndex: number, text: string) => {
      updateLayout((layout) => {
        const row = layout.rows[rowIndex];
        if (!row) return layout;
        const labelColIdx = layout.columns.findIndex((c) => c.type === 'label');
        if (labelColIdx === -1) return layout;
        return ReportBuilderEngine.updateCell(layout, rowIndex, labelColIdx, {
          type: 'text',
          content: { text },
        });
      });
    },
    [updateLayout]
  );

  const updateColumnHeader = useCallback(
    (colIndex: number, header: string) => {
      updateLayout((layout) => {
        const columns = layout.columns.map((c, i) => (i === colIndex ? { ...c, header } : c));
        return { ...layout, columns };
      });
    },
    [updateLayout]
  );

  /* ── report metadata ── */
  const updateName = useCallback(
    (name: string) => {
      pushHistory(ReportBuilderEngine.updateReport(report, { name }));
    },
    [report, pushHistory]
  );

  /* ── save ── */
  const handleSave = useCallback(() => {
    onSave?.(report);
  }, [report, onSave]);

  /* ── drag and drop ── */
  const handleDragStart = useCallback((e: React.DragEvent, item: DragItem) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, target: 'rows' | 'columns') => {
      e.preventDefault();
      try {
        const item: DragItem = JSON.parse(e.dataTransfer.getData('application/json'));
        if (target === 'rows' && item.type === 'row-type') {
          addRow(item.value as RowType);
        } else if (target === 'columns' && item.type === 'column-type') {
          const colDef = COLUMN_TYPES.find((c) => c.label === item.value);
          if (colDef) addColumn(colDef.type, colDef.period);
        }
      } catch {
        // ignore invalid drag data
      }
    },
    [addRow, addColumn]
  );

  /* ── render ── */
  const validation = useMemo(() => ReportBuilderEngine.validateReport(report), [report]);
  const errors = validation.errors;

  return (
    <div
      className={cn('flex flex-col h-full', className)}
      role="region"
      aria-label="Report Builder"
      data-high-contrast={highContrast}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={report.name}
            onChange={(e) => updateName(e.target.value)}
            className="bg-transparent text-lg font-semibold text-white border-b border-transparent hover:border-slate-600 focus:border-blue-500 focus:outline-none px-1"
            aria-label="Report name"
          />
          {errors.length > 0 && (
            <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
              {errors.length} issue{errors.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={undo}
            disabled={historyIndex === 0}
            aria-label="Undo"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={redo}
            disabled={historyIndex === history.length - 1}
            aria-label="Redo"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
          <div className="w-px h-5 bg-[var(--bg-hover)] mx-1" />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setPreviewMode(!previewMode)}
            aria-label={previewMode ? 'Switch to edit mode' : 'Switch to preview mode'}
            aria-pressed={previewMode}
          >
            <Eye className="h-4 w-4 mr-1.5" aria-hidden="true" />
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={toggleHighContrast}
            aria-label={highContrast ? 'Disable high contrast mode' : 'Enable high contrast mode'}
            aria-pressed={highContrast}
            data-testid="high-contrast-toggle"
            title={highContrast ? 'High contrast: ON (WCAG AAA)' : 'High contrast: OFF'}
          >
            <Contrast className="h-4 w-4 mr-1.5" aria-hidden="true" />
            {highContrast ? 'HC: On' : 'HC: Off'}
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-1.5" aria-hidden="true" />
            Save
          </Button>
        </div>
      </div>

      {/* Body */}
      {previewMode ? (
        <div className="flex-1 overflow-auto p-6">
          <ReportGrid
            layout={report.layout}
            cubeData={cubeData}
            onExportPDF={() => onExportPDF?.(report)}
            onExportExcel={() => onExportExcel?.(report)}
            onExportCSV={() => onExportCSV?.(report)}
          />
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel */}
          <div className="w-56 border-r border-[var(--border-subtle)] flex flex-col overflow-hidden">
            <div className="flex border-b border-[var(--border-subtle)]">
              <button
                className={cn(
                  'flex-1 px-3 py-2 text-xs font-medium text-center transition-colors',
                  activePanel === 'rows'
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                )}
                onClick={() => setActivePanel('rows')}
              >
                <Rows className="h-3.5 w-3.5 inline mr-1" />
                Rows
              </button>
              <button
                className={cn(
                  'flex-1 px-3 py-2 text-xs font-medium text-center transition-colors',
                  activePanel === 'columns'
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                )}
                onClick={() => setActivePanel('columns')}
              >
                <Columns className="h-3.5 w-3.5 inline mr-1" />
                Cols
              </button>
              <button
                className={cn(
                  'flex-1 px-3 py-2 text-xs font-medium text-center transition-colors',
                  activePanel === 'properties'
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                )}
                onClick={() => setActivePanel('properties')}
              >
                <Settings className="h-3.5 w-3.5 inline mr-1" />
                Props
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {activePanel === 'rows' && (
                <>
                  <p className="text-xs text-[var(--text-muted)] mb-2">Drag to add rows</p>
                  {ROW_TYPES.map((rt) => (
                    <div
                      key={rt.type}
                      draggable
                      onDragStart={(e) => handleDragStart(e, { type: 'row-type', value: rt.type })}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)]/50 cursor-grab hover:border-blue-500 hover:bg-[var(--bg-elevated)] transition-colors text-sm"
                    >
                      <GripVertical className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                      <span className="text-xs font-mono bg-[var(--bg-hover)] px-1.5 py-0.5 rounded">
                        {rt.icon}
                      </span>
                      <span className="text-[var(--text-secondary)]">{rt.label}</span>
                    </div>
                  ))}
                </>
              )}

              {activePanel === 'columns' && (
                <>
                  <p className="text-xs text-[var(--text-muted)] mb-2">Drag to add columns</p>
                  {COLUMN_TYPES.map((ct) => (
                    <div
                      key={ct.label}
                      draggable
                      onDragStart={(e) =>
                        handleDragStart(e, { type: 'column-type', value: ct.label })
                      }
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)]/50 cursor-grab hover:border-blue-500 hover:bg-[var(--bg-elevated)] transition-colors text-sm"
                    >
                      <GripVertical className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                      <span className="text-[var(--text-secondary)]">{ct.label}</span>
                    </div>
                  ))}
                </>
              )}

              {activePanel === 'properties' && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="report-name" className="text-xs text-[var(--text-secondary)] block mb-1">
                      Report Name
                    </label>
                    <input
                      id="report-name"
                      type="text"
                      value={report.name}
                      onChange={(e) => updateName(e.target.value)}
                      className="w-full bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded px-2 py-1.5 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="report-description"
                      className="text-xs text-[var(--text-secondary)] block mb-1"
                    >
                      Description
                    </label>
                    <textarea
                      id="report-description"
                      value={report.description}
                      onChange={(e) =>
                        pushHistory(
                          ReportBuilderEngine.updateReport(report, { description: e.target.value })
                        )
                      }
                      className="w-full bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded px-2 py-1.5 text-sm text-white resize-none"
                      rows={3}
                    />
                  </div>

                  {errors.length > 0 && (
                    <div className="mt-4 space-y-1">
                      <p className="text-xs font-medium text-amber-400">Validation Issues</p>
                      {errors.map((err: string, i: number) => (
                        <p key={i} className="text-xs text-amber-400/80">
                          • {err}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Center — Layout Editor */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div
              className="flex-1 overflow-y-auto"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, 'rows')}
            >
              <div className="p-4 space-y-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase flex items-center gap-1.5">
                    <Rows className="h-3.5 w-3.5" />
                    Rows ({report.layout.rows.length})
                  </h3>
                  <Button size="sm" variant="ghost" onClick={() => addRow('data')}>
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Row
                  </Button>
                </div>

                {report.layout.rows.length === 0 ? (
                  <div className="text-center py-8 text-[var(--text-muted)] text-sm border-2 border-dashed border-[var(--border-default)] rounded-lg">
                    Drag row types here or click Add Row
                  </div>
                ) : (
                  report.layout.rows.map((row, ri) => (
                    <div
                      key={row.id}
                      className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded border text-sm transition-colors cursor-pointer',
                        selectedRowIndex === ri
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-[var(--border-default)] bg-[var(--bg-elevated)]/30 hover:border-slate-600'
                      )}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedRowIndex(ri)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') setSelectedRowIndex(ri);
                      }}
                    >
                      <GripVertical className="h-3.5 w-3.5 text-[var(--text-muted)] flex-shrink-0" />
                      <span
                        className={cn(
                          'text-xs font-mono px-1.5 py-0.5 rounded flex-shrink-0',
                          row.type === 'total'
                            ? 'bg-green-500/20 text-green-400'
                            : row.type === 'subtotal'
                              ? 'bg-blue-500/20 text-blue-400'
                              : row.type === 'header'
                                ? 'bg-purple-500/20 text-purple-400'
                                : row.type === 'blank'
                                  ? 'bg-[var(--bg-active)] text-[var(--text-secondary)]'
                                  : 'bg-[var(--bg-hover)] text-[var(--text-secondary)]'
                        )}
                      >
                        {row.type.charAt(0).toUpperCase()}
                      </span>
                      <span className="text-[var(--text-secondary)] truncate flex-1">
                        {(
                          row.cells.find((_, ci) => report.layout.columns[ci]?.type === 'label')
                            ?.content as { content?: { text?: string } }
                        )?.content?.text ?? row.type}
                      </span>
                      {row.grouping && <Layers className="h-3 w-3 text-[var(--text-muted)] flex-shrink-0" />}
                      <button
                        className="text-[var(--text-muted)] hover:text-red-400 flex-shrink-0 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRow(row.id);
                        }}
                        aria-label={`Remove row ${ri + 1}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Column list */}
              <div
                className="px-4 pb-4"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, 'columns')}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase flex items-center gap-1.5">
                    <Columns className="h-3.5 w-3.5" />
                    Columns ({report.layout.columns.length})
                  </h3>
                  <Button size="sm" variant="ghost" onClick={() => addColumn('period', 'actual')}>
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Column
                  </Button>
                </div>

                {report.layout.columns.length === 0 ? (
                  <div className="text-center py-6 text-[var(--text-muted)] text-sm border-2 border-dashed border-[var(--border-default)] rounded-lg">
                    Drag column types here or click Add Column
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {report.layout.columns.map((col, ci) => (
                      <div
                        key={col.id}
                        className={cn(
                          'flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs transition-colors cursor-pointer',
                          selectedColIndex === ci
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-[var(--border-default)] bg-[var(--bg-elevated)]/30 hover:border-slate-600'
                        )}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedColIndex(ci)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') setSelectedColIndex(ci);
                        }}
                      >
                        <span
                          className={cn(
                            'font-mono px-1 py-0.5 rounded',
                            col.type === 'label'
                              ? 'bg-purple-500/20 text-purple-400'
                              : col.period === 'actual'
                                ? 'bg-green-500/20 text-green-400'
                                : col.period === 'budget'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : col.period === 'variance'
                                    ? 'bg-amber-500/20 text-amber-400'
                                    : 'bg-[var(--bg-active)] text-[var(--text-secondary)]'
                          )}
                        >
                          {col.type === 'label'
                            ? 'L'
                            : (col.period?.charAt(0).toUpperCase() ?? 'C')}
                        </span>
                        <span className="text-[var(--text-secondary)]">{col.header}</span>
                        <button
                          className="text-[var(--text-muted)] hover:text-red-400 ml-1 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeColumn(col.id);
                          }}
                          aria-label={`Remove column ${col.header}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Selected item properties */}
            {(selectedRowIndex !== null || selectedColIndex !== null) && (
              <div className="border-t border-[var(--border-subtle)] p-4 bg-[var(--bg-elevated)]">
                {selectedRowIndex !== null && report.layout.rows[selectedRowIndex] && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-[var(--text-secondary)]">
                      Row {selectedRowIndex + 1} — {report.layout.rows[selectedRowIndex]!.type}
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={
                          (
                            report.layout.rows[selectedRowIndex]!.cells.find(
                              (_, ci) => report.layout.columns[ci]?.type === 'label'
                            )?.content as { content?: { text?: string } }
                          )?.content?.text ?? ''
                        }
                        onChange={(e) => updateRowLabel(selectedRowIndex, e.target.value)}
                        placeholder="Row label..."
                        className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded px-2 py-1 text-sm text-white"
                      />
                      <select
                        value={report.layout.rows[selectedRowIndex]!.type}
                        onChange={(e) => {
                          const newType = e.target.value as RowType;
                          updateLayout((layout) => {
                            const rows = layout.rows.map((r, i) =>
                              i === selectedRowIndex ? { ...r, type: newType } : r
                            );
                            return { ...layout, rows };
                          });
                        }}
                        className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded px-2 py-1 text-sm text-white"
                      >
                        {ROW_TYPES.map((rt) => (
                          <option key={rt.type} value={rt.type}>
                            {rt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
                {selectedColIndex !== null && report.layout.columns[selectedColIndex] && (() => {
                  const col = report.layout.columns[selectedColIndex]!;
                  return (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-[var(--text-secondary)]">
                        Column {selectedColIndex + 1} — {col.type}
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={col.header}
                          onChange={(e) => updateColumnHeader(selectedColIndex, e.target.value)}
                          placeholder="Column header..."
                          className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded px-2 py-1 text-sm text-white"
                        />
                        <input
                          type="number"
                          value={col.width}
                          onChange={(e) => {
                            const width = parseInt(e.target.value, 10) || 100;
                            updateLayout((layout) =>
                              ReportBuilderEngine.setColumnWidth(
                                layout,
                                col.id,
                                width
                              )
                            );
                          }}
                          className="w-20 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded px-2 py-1 text-sm text-white"
                          min={40}
                          aria-label="Column width"
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Right Panel — Live Preview */}
          <div className="w-[420px] border-l border-[var(--border-subtle)] overflow-y-auto p-4 bg-[var(--bg-root)]/50">
            <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase mb-3 flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              Live Preview
            </h3>
            <div className="origin-top-left scale-[0.65] w-[154%]">
              <ReportGrid layout={report.layout} cubeData={cubeData} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

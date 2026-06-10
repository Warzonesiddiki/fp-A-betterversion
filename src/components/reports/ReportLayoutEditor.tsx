import React from 'react';
import { GripVertical, Plus, Trash2, Layers, Columns, Rows } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import { ROW_TYPES } from './reportBuilder.constants';
import type {
  ReportLayout,
  RowType,
  ReportColumn,
  ReportRow,
  ReportCell,
} from '@/engines/ReportBuilderEngine';

function getRowColor(type: RowType): string {
  switch (type) {
    case 'total':
      return 'bg-green-500/20 text-green-400';
    case 'subtotal':
      return 'bg-blue-500/20 text-blue-400';
    case 'header':
      return 'bg-purple-500/20 text-purple-400';
    case 'blank':
      return 'bg-slate-600 text-slate-400';
    default:
      return 'bg-slate-700 text-slate-300';
  }
}

function getColColor(col: ReportColumn): string {
  if (col.type === 'label') return 'bg-purple-500/20 text-purple-400';
  if (col.period === 'actual') return 'bg-green-500/20 text-green-400';
  if (col.period === 'budget') return 'bg-blue-500/20 text-blue-400';
  if (col.period === 'variance') return 'bg-amber-500/20 text-amber-400';
  return 'bg-slate-600 text-slate-400';
}

function getRowLabel(row: ReportRow, columns: ReportColumn[]): string {
  const labelCell = row.cells.find((_: ReportCell, ci: number) => columns[ci]?.type === 'label');
  return (labelCell?.content as { content?: { text?: string } })?.content?.text ?? row.type;
}

export interface ReportLayoutEditorProps {
  layout: ReportLayout;
  selectedRowIndex: number | null;
  selectedColIndex: number | null;
  onSelectRow: (index: number | null) => void;
  onSelectCol: (index: number | null) => void;
  onAddRow: (type: RowType) => void;
  onRemoveRow: (rowId: string) => void;
  onAddColumn: () => void;
  onRemoveColumn: (colId: string) => void;
  onUpdateRowLabel: (rowIndex: number, text: string) => void;
  onUpdateRowType: (rowIndex: number, type: RowType) => void;
  onUpdateColumnHeader: (colIndex: number, header: string) => void;
  onUpdateColumnWidth: (colId: string, width: number) => void;
  onDrop: (e: React.DragEvent, target: 'rows' | 'columns') => void;
}

export function ReportLayoutEditor({
  layout,
  selectedRowIndex,
  selectedColIndex,
  onSelectRow,
  onSelectCol,
  onAddRow,
  onRemoveRow,
  onAddColumn,
  onRemoveColumn,
  onUpdateRowLabel,
  onUpdateRowType,
  onUpdateColumnHeader,
  onUpdateColumnWidth,
  onDrop,
}: ReportLayoutEditorProps) {
  const selectedRow = selectedRowIndex !== null ? layout.rows[selectedRowIndex] : null;
  const selectedCol = selectedColIndex !== null ? layout.columns[selectedColIndex] : null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div
        className="flex-1 overflow-y-auto"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => onDrop(e, 'rows')}
      >
        <div className="p-4 space-y-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-1.5">
              <Rows className="h-3.5 w-3.5" />
              Rows ({layout.rows.length})
            </h3>
            <Button size="sm" variant="ghost" onClick={() => onAddRow('data')}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Row
            </Button>
          </div>

          {layout.rows.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm border-2 border-dashed border-slate-700 rounded-lg">
              Drag row types here or click Add Row
            </div>
          ) : (
            layout.rows.map((row, ri) => (
              <div
                key={row.id}
                role="button"
                tabIndex={0}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded border text-sm transition-colors cursor-pointer',
                  selectedRowIndex === ri
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                )}
                onClick={() => onSelectRow(ri)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') onSelectRow(ri);
                }}
              >
                <GripVertical className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
                <span
                  className={cn(
                    'text-xs font-mono px-1.5 py-0.5 rounded flex-shrink-0',
                    getRowColor(row.type)
                  )}
                >
                  {row.type.charAt(0).toUpperCase()}
                </span>
                <span className="text-slate-300 truncate flex-1">
                  {getRowLabel(row, layout.columns)}
                </span>
                {row.grouping && <Layers className="h-3 w-3 text-slate-500 flex-shrink-0" />}
                <button
                  className="text-slate-500 hover:text-red-400 flex-shrink-0 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveRow(row.id);
                  }}
                  aria-label={`Remove row ${ri + 1}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        <div
          className="px-4 pb-4"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => onDrop(e, 'columns')}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-1.5">
              <Columns className="h-3.5 w-3.5" />
              Columns ({layout.columns.length})
            </h3>
            <Button size="sm" variant="ghost" onClick={onAddColumn}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Column
            </Button>
          </div>

          {layout.columns.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-sm border-2 border-dashed border-slate-700 rounded-lg">
              Drag column types here or click Add Column
            </div>
          ) : (
            <div className="flex flex-wrap gap-1">
              {layout.columns.map((col, ci) => (
                <div
                  key={col.id}
                  role="button"
                  tabIndex={0}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs transition-colors cursor-pointer',
                    selectedColIndex === ci
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                  )}
                  onClick={() => onSelectCol(ci)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') onSelectCol(ci);
                  }}
                >
                  <span className={cn('font-mono px-1 py-0.5 rounded', getColColor(col))}>
                    {col.type === 'label' ? 'L' : (col.period?.charAt(0).toUpperCase() ?? 'C')}
                  </span>
                  <span className="text-slate-300">{col.header}</span>
                  <button
                    className="text-slate-500 hover:text-red-400 ml-1 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveColumn(col.id);
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

      {(selectedRow || selectedCol) && (
        <div className="border-t border-slate-800 p-4 bg-slate-900/30">
          {selectedRow && selectedRowIndex !== null && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-400">
                Row {selectedRowIndex + 1} — {selectedRow.type}
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={getRowLabel(selectedRow, layout.columns)}
                  onChange={(e) => onUpdateRowLabel(selectedRowIndex, e.target.value)}
                  placeholder="Row label..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white"
                />
                <select
                  value={selectedRow.type}
                  onChange={(e) => onUpdateRowType(selectedRowIndex, e.target.value as RowType)}
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white"
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
          {selectedCol && selectedColIndex !== null && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-400">
                Column {selectedColIndex + 1} — {selectedCol.type}
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={selectedCol.header}
                  onChange={(e) => onUpdateColumnHeader(selectedColIndex, e.target.value)}
                  placeholder="Column header..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white"
                />
                <input
                  type="number"
                  value={selectedCol.width}
                  onChange={(e) =>
                    onUpdateColumnWidth(selectedCol.id, parseInt(e.target.value, 10) || 100)
                  }
                  className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white"
                  min={40}
                  aria-label="Column width"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

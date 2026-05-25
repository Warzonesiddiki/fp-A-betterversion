import React, { useMemo, useRef, useCallback, useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type GridOptions,
  type CellValueChangedEvent,
  type SelectionChangedEvent,
} from 'ag-grid-community';
import { ExcelKeyboardEngine } from '@/engines/ExcelKeyboardEngine';
import { cn } from '@/utils/cn';

ModuleRegistry.registerModules([AllCommunityModule]);

export type GridPreset = 'standard' | 'report' | 'spreadsheet' | 'comparison';

export interface FinPlanGridColumn {
  field: string;
  headerName: string;
  type?: 'text' | 'number' | 'currency' | 'percent' | 'date' | 'badge';
  width?: number;
  flex?: number;
  editable?: boolean;
  pinned?: 'left' | 'right';
  isVariance?: boolean;
  accountType?: 'Revenue' | 'Expense';
  cellRenderer?: React.ComponentType<any>;
  valueFormatter?: (params: any) => string;
}

export interface FinPlanGridProps {
  preset?: GridPreset;
  columns: FinPlanGridColumn[];
  rows: any[];
  loading?: boolean;
  showFormulaBar?: boolean;
  showToolbar?: boolean;
  showSubtotals?: boolean;
  showSelectionStats?: boolean;
  gridOptions?: GridOptions;
  onCellValueChanged?: (event: CellValueChangedEvent) => void;
  onSelectionChanged?: (selectedRows: any[]) => void;
  className?: string;
}

export const FinPlanGrid: React.FC<FinPlanGridProps> = ({
  preset = 'standard',
  columns,
  rows,
  loading = false,
  showFormulaBar = false,
  showToolbar = false,
  showSubtotals = false,
  showSelectionStats = false,
  gridOptions,
  onCellValueChanged,
  onSelectionChanged,
  className,
}) => {
  const gridRef = useRef<AgGridReact>(null);
  const findInputRef = useRef<HTMLInputElement>(null);

  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Toolbar states
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');

  // Stats
  const [selectionStats, setSelectionStats] = useState<{
    sum: number;
    avg: number;
    count: number;
    min: number;
    max: number;
  } | null>(null);

  useEffect(() => {
    if (showFindReplace) {
      findInputRef.current?.focus();
    }
  }, [showFindReplace]);

  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      suppressMovable: false,
      headerClass: 'font-semibold text-[var(--text-secondary)]',
    }),
    []
  );

  const columnDefs = useMemo<ColDef[]>(() => {
    return columns.map((col) => {
      const colDef: ColDef = {
        field: col.field,
        headerName: col.headerName,
        headerTooltip: `Sort by ${col.headerName}`,
        width: col.width,
        editable: preset === 'spreadsheet' ? (col.editable ?? true) : col.editable,
        pinned: col.pinned,
        flex: col.flex,
        valueFormatter: col.valueFormatter,
        cellRenderer: col.cellRenderer,
      };

      if (col.type === 'currency' || col.type === 'number' || col.type === 'percent') {
        colDef.cellClass = 'text-right tabular-nums';
        colDef.headerClass = 'text-right font-semibold text-[var(--text-secondary)]';

        if (!col.valueFormatter) {
          if (col.type === 'currency') {
            colDef.valueFormatter = (params) => {
              if (params.value === null || params.value === undefined) return '';
              return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(params.value);
            };
          } else if (col.type === 'percent') {
            colDef.valueFormatter = (params) => {
              if (params.value === null || params.value === undefined) return '';
              return new Intl.NumberFormat('en-US', {
                style: 'percent',
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              }).format(params.value / 100);
            };

            if (col.isVariance || preset === 'report') {
              colDef.cellClassRules = {
                'fin-positive font-medium': (params) => {
                  const val = Number(params.value);
                  const isRev =
                    params.data?.accountType === 'Revenue' || col.accountType === 'Revenue';
                  return !isNaN(val) && ((isRev && val > 0) || (!isRev && val < 0));
                },
                'fin-negative font-medium': (params) => {
                  const val = Number(params.value);
                  const isRev =
                    params.data?.accountType === 'Revenue' || col.accountType === 'Revenue';
                  return !isNaN(val) && ((isRev && val < 0) || (!isRev && val > 0));
                },
              };
            }
          } else if (col.type === 'number') {
            colDef.valueFormatter = (params) => {
              if (params.value === null || params.value === undefined) return '';
              return new Intl.NumberFormat('en-US').format(params.value);
            };
          }
        }
      }

      if (col.type === 'badge') {
        colDef.cellRenderer = (params: any) => {
          const val = params.value;
          if (!val) return null;
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
              {String(val)}
            </span>
          );
        };
      }

      return colDef;
    });
  }, [columns, preset]);

  const updateSelectionStats = useCallback(() => {
    if (!gridRef.current || !showSelectionStats) {
      setSelectionStats(null);
      return;
    }
    const selected = gridRef.current.api.getSelectedRows();
    if (!selected.length) {
      setSelectionStats(null);
      return;
    }
    const numericValues = selected
      .flatMap((row) =>
        columns
          .filter((c) => c.type === 'currency' || c.type === 'number' || c.type === 'percent')
          .map((c) => row[c.field])
      )
      .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));

    if (!numericValues.length) {
      setSelectionStats(null);
      return;
    }
    const sum = numericValues.reduce((a, b) => a + b, 0);
    setSelectionStats({
      sum,
      avg: sum / numericValues.length,
      count: numericValues.length,
      min: Math.min(...numericValues),
      max: Math.max(...numericValues),
    });
  }, [columns, showSelectionStats]);

  const handleSelectionChanged = useCallback(
    (event: SelectionChangedEvent) => {
      if (onSelectionChanged) {
        onSelectionChanged(event.api.getSelectedRows());
      }
      updateSelectionStats();
    },
    [onSelectionChanged, updateSelectionStats]
  );

  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const handleFind = useCallback(() => {
    if (!gridRef.current || !findText) return;
    gridRef.current.api.setGridOption('quickFilterText', findText);
  }, [findText]);

  const handleReplace = useCallback(() => {
    if (!gridRef.current || !findText) return;
    const api = gridRef.current.api;
    const escaped = escapeRegex(findText);
    api.forEachNode((node) => {
      if (node.data) {
        columns.forEach((col) => {
          if (col.editable !== false) {
            const val = String(node.data[col.field] ?? '');
            if (val.toLowerCase().includes(findText.toLowerCase())) {
              node.setDataValue(col.field, val.replace(new RegExp(escaped, 'gi'), replaceText));
            }
          }
        });
      }
    });
  }, [findText, replaceText, columns]);

  const handleExport = useCallback(() => {
    if (!gridRef.current) return;
    gridRef.current.api.exportDataAsCsv();
  }, []);

  const handleKeyDown = useCallback(
    async (e: React.KeyboardEvent) => {
      if (!gridRef.current || !selectedCell) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'f' && showToolbar) {
        e.preventDefault();
        setShowFindReplace(true);
        return;
      }

      if (e.key === 'Escape') {
        if (showFindReplace) {
          setShowFindReplace(false);
          gridRef.current.api.setGridOption('quickFilterText', '');
          return;
        }
      }

      if (preset === 'spreadsheet') {
        const action = ExcelKeyboardEngine.handleKey(
          e.key,
          { ctrl: e.ctrlKey, shift: e.shiftKey, alt: e.altKey },
          {
            selectedCell,
            selectedRange: null,
            activeRow: selectedCell.row,
            activeCol: selectedCell.col,
            totalRows: rows.length,
            totalCols: columns.length,
            isEditing,
          }
        );

        switch (action.type) {
          case 'move': {
            const { row, col } = action.payload as { row: number; col: number };
            if (row >= 0 && row < rows.length && col >= 0 && col < columns.length) {
              setSelectedCell({ row, col });
              gridRef.current.api.setFocusedCell(row, columns[col].field);
            }
            break;
          }
          case 'edit': {
            setIsEditing(true);
            gridRef.current.api.startEditingCell({
              rowIndex: selectedCell.row,
              colKey: columns[selectedCell.col].field,
            });
            break;
          }
          case 'copy': {
            const selectedNodes = gridRef.current.api.getSelectedNodes();
            const tsv = selectedNodes
              .map((node) => columns.map((c) => node.data[c.field]).join('\t'))
              .join('\n');
            await navigator.clipboard.writeText(tsv);
            e.preventDefault();
            break;
          }
        }
      }
    },
    [selectedCell, rows.length, columns, isEditing, showFindReplace, showToolbar, preset]
  );

  const getRowStyle = useCallback(
    (params: any) => {
      if (preset === 'report' && showSubtotals) {
        if (params.data?.isSubtotal || params.data?.type === 'subtotal') {
          return {
            fontWeight: 'bold',
            borderTop: '2px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-muted)',
          };
        }
      }
      return undefined;
    },
    [preset, showSubtotals]
  );

  const mergedGridOptions = useMemo<GridOptions>(
    () => ({
      rowHeight: 32,
      headerHeight: 40,
      animateRows: true,
      rowSelection: { mode: 'multiRow' },
      suppressCellFocus: false,
      enableCellTextSelection: true,
      suppressRowVirtualisation: false,
      suppressColumnVirtualisation: false,
      rowBuffer: 10,
      cacheBlockSize: 100,
      maxBlocksInCache: 10,
      getRowStyle,
      onCellClicked: (params) => {
        if (params.rowIndex !== null) {
          const colIndex = columns.findIndex((c) => c.field === params.column.getColId());
          setSelectedCell({ row: params.rowIndex, col: colIndex });
        }
      },
      onCellEditingStarted: () => setIsEditing(true),
      onCellEditingStopped: () => setIsEditing(false),
      ...gridOptions,
    }),
    [gridOptions, columns, getRowStyle]
  );

  return (
    <div
      className={cn(
        'finplan-grid w-full h-[500px] flex flex-col border border-[var(--border-subtle)] rounded-lg overflow-hidden shadow-sm relative focus:outline-none focus:ring-2 focus:ring-blue-500/20',
        loading && 'opacity-50 pointer-events-none grayscale',
        className
      )}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="grid"
      aria-label="Financial Data Grid"
      aria-rowcount={rows.length}
      aria-colcount={columns.length}
      aria-busy={loading}
    >
      {showToolbar && (
        <div className="flex items-center gap-2 px-2 py-1 bg-[var(--bg-muted)] border-b border-[var(--border-subtle)] text-xs">
          <button
            onClick={() => setShowFindReplace(!showFindReplace)}
            className="px-2 py-1 rounded hover:bg-[var(--bg-surface)] transition-colors"
            title="Find & Replace (Ctrl+F)"
          >
            Find/Replace
          </button>
          <button
            onClick={handleExport}
            className="px-2 py-1 rounded hover:bg-[var(--bg-surface)] transition-colors"
            title="Export CSV"
          >
            Export CSV
          </button>
        </div>
      )}

      {showFindReplace && showToolbar && (
        <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-muted)] border-b border-[var(--border-subtle)]">
          <input
            ref={findInputRef}
            type="text"
            value={findText}
            onChange={(e) => setFindText(e.target.value)}
            placeholder="Find..."
            className="px-2 py-1 text-sm border border-[var(--border-subtle)] rounded w-40"
          />
          <button
            onClick={handleFind}
            className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Search
          </button>
          <input
            type="text"
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            placeholder="Replace..."
            className="px-2 py-1 text-sm border border-[var(--border-subtle)] rounded w-40"
          />
          <button
            onClick={handleReplace}
            className="px-2 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Replace All
          </button>
          <button
            onClick={() => {
              setShowFindReplace(false);
              gridRef.current?.api.setGridOption('quickFilterText', '');
            }}
            className="px-2 py-1 text-sm hover:bg-[var(--bg-surface)] rounded"
          >
            ✕
          </button>
        </div>
      )}

      {showFormulaBar && preset === 'spreadsheet' && (
        <div className="flex items-center gap-2 px-3 py-1 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] text-sm">
          <div className="w-8 font-mono text-[var(--text-secondary)] text-center font-bold">fx</div>
          <input
            type="text"
            className="flex-1 bg-transparent outline-none font-mono"
            placeholder="="
            readOnly
            value={
              selectedCell
                ? String(rows[selectedCell.row]?.[columns[selectedCell.col]?.field] ?? '')
                : ''
            }
          />
        </div>
      )}

      <div className="flex-1 min-h-0 w-full">
        <AgGridReact
          ref={gridRef}
          rowData={rows}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onCellValueChanged={onCellValueChanged}
          onSelectionChanged={handleSelectionChanged}
          gridOptions={mergedGridOptions}
          className="h-full w-full"
        />
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-overlay)] backdrop-blur-[1px] z-50">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-[var(--border-subtle)] border-t-[var(--accent-primary)] rounded-full animate-spin" />
            <span className="mt-2 text-xs font-semibold text-[var(--accent-primary)]">
              Loading Grid...
            </span>
          </div>
        </div>
      )}

      {showSelectionStats && selectionStats && (
        <div className="flex items-center gap-4 px-3 py-1 bg-[var(--bg-muted)] border-t border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
          <span>
            Count: <strong>{selectionStats.count}</strong>
          </span>
          <span>
            Sum:{' '}
            <strong>
              {new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(
                selectionStats.sum
              )}
            </strong>
          </span>
          <span>
            Average:{' '}
            <strong>
              {new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(
                selectionStats.avg
              )}
            </strong>
          </span>
          <span>
            Min:{' '}
            <strong>
              {new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(
                selectionStats.min
              )}
            </strong>
          </span>
          <span>
            Max:{' '}
            <strong>
              {new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(
                selectionStats.max
              )}
            </strong>
          </span>
        </div>
      )}
    </div>
  );
};

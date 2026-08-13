import React, { useMemo, useRef, useCallback, useState, useEffect } from 'react';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
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
import { useDensity, densityMetrics } from '@/hooks/useDensity';

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
  cellRenderer?: React.ComponentType<{ value: unknown }>;
  valueFormatter?: (params: { value: unknown }) => string;
}

export interface FinPlanGridProps {
  preset?: GridPreset;
  columns: FinPlanGridColumn[];
  rows: Record<string, unknown>[];
  loading?: boolean;
  showFormulaBar?: boolean;
  showToolbar?: boolean;
  showSubtotals?: boolean;
  showSelectionStats?: boolean;
  gridOptions?: GridOptions;
  onCellValueChanged?: (event: CellValueChangedEvent) => void;
  onSelectionChanged?: (selectedRows: Record<string, unknown>[]) => void;
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
  const fmtCurrency = useCurrencyFormatter();
  const gridRef = useRef<AgGridReact>(null);
  // UI-04: row metrics come from the shared density contract, not literals.
  const density = useDensity();
  const metrics = densityMetrics(density);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const findInputRef = useRef<HTMLInputElement>(null);

  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Drag-fill state
  const isDraggingFill = useRef(false);
  const fillStartRef = useRef<{ row: number; col: number } | null>(null);
  const [dragHighlight, setDragHighlight] = useState<{
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
  } | null>(null);
  const [handlePosition, setHandlePosition] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

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
              return fmtCurrency.custom({ decimals: 0 })(params.value);
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
        colDef.cellRenderer = (params: { value: unknown }) => {
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
  }, [columns, preset, fmtCurrency]);

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

  const fillRange = useCallback(
    (fromRow: number, fromCol: number, toRow: number, toCol: number) => {
      if (!gridRef.current || preset !== 'spreadsheet') return;
      const api = gridRef.current.api;
      const sourceCol = columns[fromCol];
      if (!sourceCol) return;

      const minRow = Math.min(fromRow, toRow);
      const maxRow = Math.max(fromRow, toRow);
      const minCol = Math.min(fromCol, toCol);
      const maxCol = Math.max(fromCol, toCol);

      // Get source value
      const sourceNode = api.getDisplayedRowAtIndex(fromRow);
      const sourceValue = sourceNode?.data?.[sourceCol.field];
      const isNumber = typeof sourceValue === 'number' && Number.isFinite(sourceValue);

      // Fill cells
      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          if (r === fromRow && c === fromCol) continue;
          const col = columns[c];
          if (!col) continue;
          const node = api.getDisplayedRowAtIndex(r);
          if (!node) continue;

          let fillValue = sourceValue;
          // Auto-increment for numeric series
          if (isNumber) {
            const rowOffset = r - fromRow;
            const colOffset = c - fromCol;
            fillValue = sourceValue! + rowOffset + colOffset;
          }

          node.setDataValue(col.field, fillValue);
        }
      }

      setDragHighlight(null);
    },
    [columns, preset]
  );

  const updateHandlePosition = useCallback(() => {
    if (!selectedCell || !gridContainerRef.current) {
      setHandlePosition(null);
      return;
    }
    // Query for the focused cell element using AG Grid's cell focus class
    const cellEl = gridContainerRef.current.querySelector('.ag-cell-focus') as HTMLElement | null;
    if (!cellEl) return;
    const rect = cellEl.getBoundingClientRect();
    const gridRect = gridContainerRef.current.getBoundingClientRect();
    setHandlePosition({
      top: rect.bottom - gridRect.top - 6,
      left: rect.right - gridRect.left - 6,
      width: 12,
      height: 12,
    });
  }, [selectedCell]);

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
              gridRef.current.api.setFocusedCell(row, columns[col]!.field);
            }
            break;
          }
          case 'edit': {
            setIsEditing(true);
            gridRef.current.api.startEditingCell({
              rowIndex: selectedCell.row,
              colKey: columns[selectedCell.col]!.field,
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
          case 'fill': {
            const fillPayload = action.payload as { direction: string };
            if (fillPayload?.direction === 'down') {
              const targetRow = Math.min(selectedCell.row + 1, rows.length - 1);
              fillRange(selectedCell.row, selectedCell.col, targetRow, selectedCell.col);
            } else if (fillPayload?.direction === 'right') {
              const targetCol = Math.min(selectedCell.col + 1, columns.length - 1);
              fillRange(selectedCell.row, selectedCell.col, selectedCell.row, targetCol);
            }
            e.preventDefault();
            break;
          }
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedCell, rows.length, columns, isEditing, showFindReplace, showToolbar, preset]
  );

  const getRowStyle = useCallback(
    (params: { data?: { isSubtotal?: boolean; type?: string } }) => {
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
      rowHeight: metrics.rowHeight,
      headerHeight: metrics.headerHeight,
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
          updateHandlePosition();
        }
      },
      onCellEditingStarted: () => setIsEditing(true),
      onCellEditingStopped: () => setIsEditing(false),
      ...gridOptions,
    }),
    [gridOptions, columns, getRowStyle, updateHandlePosition, metrics]
  );

  // Drag-fill mouse handlers
  const handleFillMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (!selectedCell) return;
      isDraggingFill.current = true;
      fillStartRef.current = { ...selectedCell };
      setDragHighlight({
        startRow: selectedCell.row,
        startCol: selectedCell.col,
        endRow: selectedCell.row,
        endCol: selectedCell.col,
      });

      const handleMouseMove = (ev: MouseEvent) => {
        if (!isDraggingFill.current || !gridContainerRef.current || !fillStartRef.current) return;
        // Convert mouse position to cell coordinates using the grid container
        const gridRect = gridContainerRef.current.getBoundingClientRect();
        const relX = ev.clientX - gridRect.left;
        const relY = ev.clientY - gridRect.top;

        // Estimate row/col from pixel position
        // UI-04: must track the active density, or drag-fill hit-tests the
        // wrong row as soon as the user leaves the default row height.
        const { rowHeight, headerHeight } = metrics;
        const gridRows = Math.floor((relY - headerHeight) / rowHeight);
        const avgColWidth = (gridRect.width - 50) / Math.max(columns.length, 1);
        const gridCol = Math.floor(relX / avgColWidth);

        if (fillStartRef.current) {
          setDragHighlight({
            startRow: fillStartRef.current.row,
            startCol: fillStartRef.current.col,
            endRow: Math.max(0, Math.min(gridRows, rows.length - 1)),
            endCol: Math.max(0, Math.min(gridCol, columns.length - 1)),
          });
        }
      };

      const handleMouseUp = () => {
        if (isDraggingFill.current && fillStartRef.current && dragHighlight) {
          const { startRow, startCol, endRow, endCol } = dragHighlight;
          if (startRow !== endRow || startCol !== endCol) {
            fillRange(startRow, startCol, endRow, endCol);
          }
        }
        isDraggingFill.current = false;
        fillStartRef.current = null;
        setDragHighlight(null);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [selectedCell, columns.length, rows.length, dragHighlight, fillRange, metrics]
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
            className="px-2 py-1 rounded hover:bg-[var(--bg-surface)] transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
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
            className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
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
            className="px-2 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
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
                ? String(rows[selectedCell.row]?.[columns[selectedCell.col]?.field ?? ''] ?? '')
                : ''
            }
          />
        </div>
      )}

      <div className="flex-1 min-h-0 w-full relative">
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
        {/* Drag-fill handle — visible only in spreadsheet mode with a selected cell */}
        {preset === 'spreadsheet' && selectedCell && !isEditing && handlePosition && (
          <div
            className="absolute z-50 cursor-crosshair bg-blue-600 border-2 border-white rounded-sm shadow-sm hover:bg-blue-700 transition-colors"
            style={{
              top: handlePosition.top,
              left: handlePosition.left,
              width: handlePosition.width,
              height: handlePosition.height,
            }}
            role="button"
            tabIndex={0}
            onMouseDown={handleFillMouseDown}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
              }
            }}
            title="Drag to fill cells"
          />
        )}

        {/* Drag highlight overlay */}
        {preset === 'spreadsheet' && dragHighlight && (
          <div
            className="absolute pointer-events-none z-40 rounded border-2 border-blue-500 bg-blue-500/10"
            style={{
              top: 40 + Math.min(dragHighlight.startRow, dragHighlight.endRow) * 32,
              left: 0,
              width: '100%',
              height: (Math.abs(dragHighlight.endRow - dragHighlight.startRow) + 1) * 32,
            }}
          />
        )}
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-overlay)] backdrop-blur-[1px] z-50">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-[var(--border-subtle)] border-t-[var(--accent-primary)] rounded-full animate-spin" />
            <span className="mt-2 text-xs font-semibold text-[var(--text-accent)]">
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

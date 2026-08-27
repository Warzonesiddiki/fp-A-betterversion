import React, { useMemo, useRef, useCallback, useState, useEffect, useId } from 'react';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { AgGridReact } from 'ag-grid-react';
import {
  ClientSideRowModelModule,
  CsvExportModule,
  DateFilterModule,
  ModuleRegistry,
  NumberFilterModule,
  RowSelectionModule,
  RowStyleModule,
  TextFilterModule,
  ValidationModule,
  type ColDef,
  type GridOptions,
  type CellValueChangedEvent,
  type SelectionChangedEvent,
} from 'ag-grid-community';
import { ExcelKeyboardEngine } from '@/engines/ExcelKeyboardEngine';
import { cn } from '@/utils/cn';
import { useSelectionStats } from '@/hooks/useSelectionStats';
import { useFindReplace } from '@/hooks/useFindReplace';
import { useColumnVisibility } from '@/hooks/useColumnVisibility';
import { useDataGridExport } from '@/hooks/useDataGridExport';
import { useDensity, densityMetrics } from '@/hooks/useDensity';

// Modular registration (P-02-I): register only the modules these grids use
// (client-side rows, basic text/number/date filters, built-in CSV export via
// FinPlanGrid + hand-rolled Blob export here). Capability witnesses:
// _bmad/p02-bundle-remediation-proposal.md §1.2.
ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  TextFilterModule,
  NumberFilterModule,
  DateFilterModule,
  RowSelectionModule,
  RowStyleModule,
  CsvExportModule,
  // Dev-time module-misconfiguration warnings; excluded from prod bundles.
  ...(import.meta.env.DEV ? [ValidationModule] : []),
]);

export interface DataGridColumn {
  field: string;
  headerName: string;
  width?: number;
  editable?: boolean;
  type?: 'number' | 'currency' | 'percent' | 'text';
  valueFormatter?: (params: { value: unknown }) => string;
  cellRenderer?: React.ComponentType<unknown> | undefined;
  pinned?: 'left' | 'right';
  flex?: number;
}

export interface DataGridProps {
  rows: Record<string, unknown>[];
  columns: DataGridColumn[];
  onCellValueChanged?: (event: CellValueChangedEvent) => void;
  onSelectionChanged?: (selectedRows: Record<string, unknown>[]) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  gridOptions?: GridOptions;
  loading?: boolean;
  className?: string;
  enableFindReplace?: boolean;
  enableExport?: boolean;
  enableColumnHiding?: boolean;
}

export const DataGrid: React.FC<DataGridProps> = ({
  rows,
  columns,
  onCellValueChanged,
  onSelectionChanged,
  onUndo,
  onRedo,
  gridOptions,
  loading = false,
  className,
  enableFindReplace = false,
  enableExport = false,
  enableColumnHiding = false,
}) => {
  const fmtCurrency = useCurrencyFormatter();
  const gridRef = useRef<AgGridReact>(null);
  // UI-04: row metrics come from the shared density contract, not literals.
  const density = useDensity();
  const metrics = densityMetrics(density);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  /* row count announcement (WCAG 4.1.3 Status Messages) */
  const [rowCountAnnouncement, setRowCountAnnouncement] = useState<string>('');

  useEffect(() => {
    if (loading) {
      setRowCountAnnouncement('Loading data...');
    } else if (rows.length === 0) {
      setRowCountAnnouncement('No rows to display');
    } else {
      setRowCountAnnouncement(
        `Table updated: ${rows.length} row${rows.length === 1 ? '' : 's'} displayed`
      );
    }
  }, [rows.length, loading]);

  const { selectionStats, updateSelectionStats } = useSelectionStats(gridRef, columns);
  const {
    findInputRef,
    showFindReplace,
    setShowFindReplace,
    findText,
    setFindText,
    replaceText,
    setReplaceText,
    handleFind,
    handleReplace,
    closeFindReplace,
  } = useFindReplace(gridRef, columns);

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
        headerTooltip: `Sort by ${col.headerName}`, // Fallback for aria-label in some ATs
        width: col.width,
        editable: col.editable,
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
            colDef.cellClassRules = {
              'fin-positive font-medium': (params) => {
                const val = Number(params.value);
                return !isNaN(val) && val > 0;
              },
              'fin-negative font-medium': (params) => {
                const val = Number(params.value);
                return !isNaN(val) && val < 0;
              },
            };
          }
        }
      }

      return colDef;
    });
  }, [columns, fmtCurrency]);

  const { hiddenColumns, showColumnMenu, setShowColumnMenu, toggleColumn, visibleColumnDefs } =
    useColumnVisibility(columnDefs);
  const { handleExport } = useDataGridExport(columns, rows, hiddenColumns);

  // ===== Wave-7E a11y-modal-grid: column-visibility menu keyboard support ===
  // WAI-ARIA menu pattern for role="menu" + menuitemcheckbox: roving tabindex,
  // Arrow/Home/End navigation with wraparound, Escape closes without toggling
  // and returns focus to the trigger. Items are real <button>s (previously
  // unfocusable divs — keyboard users could not reach the menu at all).
  const [columnMenuFocusIndex, setColumnMenuFocusIndex] = useState(0);
  const columnMenuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const columnMenuItemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const columnMenuId = useId();

  // Opening the menu moves focus to the first item (menu-button pattern).
  useEffect(() => {
    if (!showColumnMenu) return;
    setColumnMenuFocusIndex(0);
    columnMenuItemRefs.current[0]?.focus();
  }, [showColumnMenu]);

  const closeColumnMenu = useCallback(() => {
    setShowColumnMenu(false);
    columnMenuTriggerRef.current?.focus();
  }, [setShowColumnMenu]);

  const handleColumnMenuKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const count = columns.length;
      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowUp':
        case 'Home':
        case 'End': {
          if (count === 0) return;
          e.preventDefault();
          let next: number;
          if (e.key === 'Home') next = 0;
          else if (e.key === 'End') next = count - 1;
          else if (e.key === 'ArrowDown') next = (columnMenuFocusIndex + 1) % count;
          else next = (columnMenuFocusIndex - 1 + count) % count;
          setColumnMenuFocusIndex(next);
          columnMenuItemRefs.current[next]?.focus();
          return;
        }
        case 'Escape':
          // The menu owns Escape while focus is inside it; stop propagation so
          // the grid-level handler does not also consume it.
          e.preventDefault();
          e.stopPropagation();
          closeColumnMenu();
          return;
        default:
          return;
      }
    },
    [columns.length, columnMenuFocusIndex, closeColumnMenu]
  );
  // ==========================================================================

  const handleSelectionChanged = useCallback(
    (event: SelectionChangedEvent) => {
      if (onSelectionChanged) {
        onSelectionChanged(event.api.getSelectedRows());
      }
      updateSelectionStats();
    },
    [onSelectionChanged, updateSelectionStats]
  );

  const handleKeyDown = useCallback(
    async (e: React.KeyboardEvent) => {
      // Ctrl+F for find — must work without a selected cell (the grid is
      // focusable before any cell is clicked, so the shortcut would otherwise
      // be dead on first focus). Same for Escape, which closes transient UI.
      if ((e.ctrlKey || e.metaKey) && e.key === 'f' && enableFindReplace) {
        e.preventDefault();
        setShowFindReplace(true);
        return;
      }

      // Escape to close find/replace
      if (e.key === 'Escape') {
        if (showFindReplace) {
          closeFindReplace();
          return;
        }
        if (showColumnMenu) {
          setShowColumnMenu(false);
          return;
        }
      }

      // Cell operations below require an active cell and a mounted grid.
      if (!gridRef.current || !selectedCell) return;

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
            colKey: columns![selectedCell.col]!.field,
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
        case 'paste': {
          const text = await navigator.clipboard.readText();
          if (!text) break;
          // Paste handled by parent callback
          break;
        }
        case 'undo':
          onUndo?.();
          break;
        case 'redo':
          onRedo?.();
          break;
      }
    },
    [
      selectedCell,
      rows.length,
      columns,
      isEditing,
      onUndo,
      onRedo,
      showFindReplace,
      showColumnMenu,
      enableFindReplace,
      closeFindReplace,
      setShowFindReplace,
      setShowColumnMenu,
    ]
  );

  const mergedGridOptions = useMemo<GridOptions>(
    () => ({
      rowHeight: metrics.rowHeight,
      headerHeight: metrics.headerHeight,
      animateRows: true,
      rowSelection: { mode: 'multiRow' },
      suppressCellFocus: false,
      enableCellTextSelection: true,
      // Virtual scrolling configuration for large datasets
      rowModelType: 'clientSide',
      suppressRowVirtualisation: false,
      suppressColumnVirtualisation: false,
      rowBuffer: 10,
      cacheBlockSize: 100,
      maxBlocksInCache: 10,
      suppressAnimationFrame: false,
      suppressBrowserResizeObserver: false,
      groupDisplayType: 'groupRows',
      // ===== WCAG 2.2 AA 2.5.7 Dragging Movements =====
      // AG Grid v35.3.0 community defaults: enableFillHandle = false.
      // DataGrid does NOT set cellSelection.handle (would enable fill handle in v32.2+).
      // Therefore, no dragging movement exists. Criterion 2.5.7 is N/A (waiver).
      // Keyboard alternatives for cell data operations (see handleKeyDown above):
      //   - Ctrl+C: copy selection to clipboard (case 'copy')
      //   - Ctrl+V: paste from clipboard (case 'paste')
      //   - Ctrl+Z: undo (case 'undo')
      //   - Ctrl+Shift+Z / Ctrl+Y: redo (case 'redo')
      //   - Arrow keys: navigate cells (case 'move')
      //   - Enter / F2: start editing (case 'edit')
      // See: A11Y_READINESS v0.1 §3.5 (Dim 5 — Operable, criterion 2.5.7) — Prometheus T-PR-046
      // ==========================================================================
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
    [gridOptions, columns, metrics]
  );

  return (
    <div
      className={cn(
        'data-grid w-full h-[500px] border border-[var(--border-subtle)] rounded-lg overflow-hidden shadow-sm relative focus:outline-none focus:ring-2 focus:ring-blue-500/20',
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
      {/* Toolbar */}
      {(enableFindReplace || enableExport || enableColumnHiding) && (
        <div className="flex items-center gap-2 px-2 py-1 bg-[var(--bg-muted)] border-b border-[var(--border-subtle)] text-xs">
          {enableFindReplace && (
            <button
              onClick={() => setShowFindReplace(!showFindReplace)}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 px-2 py-1 rounded hover:bg-[var(--bg-surface)] transition-colors"
              aria-label="Find and Replace"
              title="Find & Replace (Ctrl+F)"
            >
              Find
            </button>
          )}
          {enableExport && (
            <button
              onClick={handleExport}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 px-2 py-1 rounded hover:bg-[var(--bg-surface)] transition-colors"
              aria-label="Export to CSV"
              title="Export CSV"
            >
              Export
            </button>
          )}
          {enableColumnHiding && (
            <div className="relative">
              <button
                ref={columnMenuTriggerRef}
                onClick={() => setShowColumnMenu(!showColumnMenu)}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 px-2 py-1 rounded hover:bg-[var(--bg-surface)] transition-colors"
                aria-label="Show or hide columns"
                aria-expanded={showColumnMenu}
                aria-haspopup="menu"
                aria-controls={showColumnMenu ? columnMenuId : undefined}
                title="Column Visibility"
              >
                Columns
              </button>
              {showColumnMenu && (
                <div
                  ref={(node) => {
                    if (node === null) columnMenuItemRefs.current = [];
                  }}
                  id={columnMenuId}
                  tabIndex={-1}
                  className="absolute top-full left-0 z-50 mt-1 w-48 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-md shadow-lg"
                  role="menu"
                  aria-label="Column visibility"
                  onKeyDown={handleColumnMenuKeyDown}
                >
                  {columns.map((col, index) => {
                    const visible = !hiddenColumns.has(col.field);
                    return (
                      <button
                        key={col.field}
                        ref={(node) => {
                          columnMenuItemRefs.current[index] = node;
                        }}
                        type="button"
                        role="menuitemcheckbox"
                        aria-checked={visible}
                        tabIndex={index === columnMenuFocusIndex ? 0 : -1}
                        onClick={() => toggleColumn(col.field)}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-[var(--bg-muted)] cursor-pointer focus-visible:outline-none focus-visible:bg-[var(--bg-muted)]"
                      >
                        <span aria-hidden="true" className="w-3 flex-shrink-0">
                          {visible ? '✓' : ''}
                        </span>
                        <span>{col.headerName}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Find & Replace Bar */}
      {showFindReplace && enableFindReplace && (
        <div
          className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-muted)] border-b border-[var(--border-subtle)]"
          role="search"
          aria-label="Find and Replace"
        >
          <input
            ref={findInputRef}
            type="text"
            value={findText}
            onChange={(e) => setFindText(e.target.value)}
            placeholder="Find..."
            className="px-2 py-1 text-sm border border-[var(--border-subtle)] rounded w-40"
            aria-label="Find text"
          />
          <button
            onClick={handleFind}
            className="px-2 py-1 text-sm bg-blue-600 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 rounded hover:bg-blue-700"
            aria-label="Search"
          >
            Search
          </button>
          <input
            type="text"
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            placeholder="Replace..."
            className="px-2 py-1 text-sm border border-[var(--border-subtle)] rounded w-40"
            aria-label="Replace text"
          />
          <button
            onClick={handleReplace}
            className="px-2 py-1 text-sm bg-gray-600 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 rounded hover:bg-gray-700"
            aria-label="Replace all"
          >
            Replace All
          </button>
          <button
            onClick={() => {
              setShowFindReplace(false);
              gridRef.current?.api.setGridOption('quickFilterText', '');
            }}
            className="px-2 py-1 text-sm hover:bg-[var(--bg-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 rounded"
            aria-label="Close find and replace"
          >
            ✕
          </button>
        </div>
      )}

      <AgGridReact
        ref={gridRef}
        rowData={rows}
        columnDefs={visibleColumnDefs}
        defaultColDef={defaultColDef}
        onCellValueChanged={onCellValueChanged}
        onSelectionChanged={handleSelectionChanged}
        gridOptions={mergedGridOptions}
      />
      {loading && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-[var(--bg-overlay)] backdrop-blur-[1px] z-50"
          role="status"
          aria-live="polite"
        >
          <div className="flex flex-col items-center">
            <div
              className="w-8 h-8 border-4 border-[var(--border-subtle)] border-t-[var(--accent-primary)] rounded-full animate-spin"
              aria-hidden="true"
            />
            <span className="mt-2 text-xs font-semibold text-[var(--text-accent)]">
              Loading Grid...
            </span>
          </div>
        </div>
      )}

      {/* Status Bar — Selection Aggregation */}
      {selectionStats && (
        <div
          className="flex items-center gap-4 px-3 py-1 bg-[var(--bg-muted)] border-t border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]"
          role="status"
          aria-live="polite"
        >
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
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-testid="row-count-announcement"
        className="sr-only"
      >
        {rowCountAnnouncement}
      </div>
    </div>
  );
};

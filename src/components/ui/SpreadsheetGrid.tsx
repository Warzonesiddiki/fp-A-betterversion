/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useMemo, useRef, useCallback, useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type CellValueChangedEvent,
  type CellClickedEvent,
} from 'ag-grid-community';
import { cn } from '@/utils/cn';
import { FormulaBar } from './FormulaBar';
import { SheetTabs } from './SheetTabs';
import { ContextMenu, type ContextMenuAction } from './ContextMenu';

ModuleRegistry.registerModules([AllCommunityModule]);

// Constants extracted to avoid inline object creation on every render
const NOOP = () => {};
const GRID_STYLE: React.CSSProperties = { height: 'calc(100vh - 240px)', minHeight: 400 };

export interface SpreadsheetColumn {
  field: string;
  headerName: string;
  width?: number;
  minWidth?: number;
  type?: 'number' | 'currency' | 'percent' | 'text' | 'date';
  editable?: boolean;
  pinned?: 'left' | 'right';
  flex?: number;
  format?: string;
}

export interface SpreadsheetSheet {
  id: string;
  name: string;
  rows: Record<string, unknown>[];
  columns: SpreadsheetColumn[];
}

export interface SpreadsheetGridProps {
  sheets: SpreadsheetSheet[];
  activeSheetId?: string;
  onSheetChange?: (sheetId: string) => void;
  onSheetAdd?: () => void;
  onSheetRename?: (sheetId: string, name: string) => void;
  onSheetDelete?: (sheetId: string) => void;
  onSheetReorder?: (fromIndex: number, toIndex: number) => void;
  onCellValueChanged?: (sheetId: string, row: number, field: string, value: unknown) => void;
  onSelectionChanged?: (selectedCells: { row: number; col: string }[]) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  freezeRows?: number;
  freezeCols?: number;
  loading?: boolean;
  className?: string;
}

export function SpreadsheetGrid({
  sheets,
  activeSheetId,
  onSheetChange,
  onSheetAdd,
  onSheetRename,
  onSheetDelete,
  onSheetReorder,
  onCellValueChanged,
  onUndo,
  onRedo,
  freezeCols = 0,
  loading = false,
  className,
}: SpreadsheetGridProps) {
  const gridRef = useRef<AgGridReact>(null);
  const [activeCell, setActiveCell] = useState<{ row: number; col: string } | null>(null);
  const [formulaValue, setFormulaValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [copiedRange, setCopiedRange] = useState<Record<string, unknown>[] | null>(null);

  const currentSheet = useMemo(
    () => sheets.find((s) => s.id === activeSheetId) || sheets[0]!,
    [sheets, activeSheetId]
  );

  const columnDefs = useMemo<ColDef[]>(() => {
    if (!currentSheet) return [];
    return currentSheet.columns.map((col, idx) => {
      const colDef: ColDef = {
        field: col.field,
        headerName: col.headerName,
        width: col.width || 120,
        minWidth: col.minWidth || 60,
        editable: col.editable ?? true,
        pinned: idx < freezeCols ? 'left' : col.pinned,
        flex: col.flex,
        sortable: true,
        filter: true,
        resizable: true,
        suppressMovable: false,
      };

      if (col.type === 'currency') {
        colDef.cellClass = 'text-right tabular-nums font-mono';
        colDef.valueFormatter = (params) => {
          if (params.value == null) return '';
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
          }).format(params.value as number);
        };
      } else if (col.type === 'percent') {
        colDef.cellClass = 'text-right tabular-nums font-mono';
        colDef.valueFormatter = (params) => {
          if (params.value == null) return '';
          return `${(params.value as number).toFixed(1)}%`;
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
      } else if (col.type === 'number') {
        colDef.cellClass = 'text-right tabular-nums font-mono';
      }

      return colDef;
    });
  }, [currentSheet, freezeCols]);

  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      editable: true,
    }),
    []
  );

  const handleCellClicked = useCallback((event: CellClickedEvent) => {
    if (event.rowIndex != null) {
      setActiveCell({ row: event.rowIndex, col: event.column.getColId() });
      const value = event.value;
      setFormulaValue(value != null ? String(value) : '');
    }
  }, []);

  const handleCellValueChanged = useCallback(
    (event: CellValueChangedEvent) => {
      if (currentSheet && onCellValueChanged) {
        onCellValueChanged(currentSheet.id, event.rowIndex!, event.colDef.field!, event.newValue);
      }
    },
    [currentSheet, onCellValueChanged]
  );

  const handleFormulaChange = useCallback((value: string) => {
    setFormulaValue(value);
  }, []);

  const handleFormulaEvaluate = useCallback(
    (result: number) => {
      if (gridRef.current && activeCell) {
        gridRef.current.api.forEachNode((node) => {
          if (node.rowIndex === activeCell.row) {
            node.setDataValue(activeCell.col, result);
          }
        });
      }
      setIsEditing(false);
    },
    [activeCell]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!gridRef.current || !activeCell) return;

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'c': {
            const selectedRows = gridRef.current.api.getSelectedRows();
            if (selectedRows.length) {
              setCopiedRange(selectedRows);
              const tsv = selectedRows
                .map((row) => currentSheet?.columns.map((c) => row[c.field] ?? '').join('\t'))
                .join('\n');
              navigator.clipboard.writeText(tsv);
            }
            e.preventDefault();
            break;
          }
          case 'v': {
            if (copiedRange?.length && currentSheet) {
              const startRow = activeCell.row;
              copiedRange.forEach((srcRow, i) => {
                const targetRowIndex = startRow + i;
                currentSheet.columns.forEach((col) => {
                  if (srcRow[col.field] !== undefined) {
                    gridRef.current?.api.forEachNode((node) => {
                      if (node.rowIndex === targetRowIndex) {
                        node.setDataValue(col.field, srcRow[col.field]);
                      }
                    });
                  }
                });
              });
            }
            e.preventDefault();
            break;
          }
          case 'z':
            onUndo?.();
            e.preventDefault();
            break;
          case 'y':
            onRedo?.();
            e.preventDefault();
            break;
          case 'd':
            // Fill down — copy value from row above into active cell
            if (activeCell.row > 0 && currentSheet) {
              const col = activeCell.col;
              const prevNode = gridRef.current.api.getDisplayedRowAtIndex(activeCell.row - 1);
              if (prevNode) {
                const value = prevNode.data[col];
                gridRef.current.api.forEachNode((node) => {
                  if (node.rowIndex === activeCell.row) {
                    node.setDataValue(col, value);
                  }
                });
              }
            }
            e.preventDefault();
            break;
        }
      }

      if (e.key === 'F2') {
        setIsEditing(true);
        gridRef.current.api.startEditingCell({
          rowIndex: activeCell.row,
          colKey: activeCell.col,
        });
        e.preventDefault();
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selectedRows = gridRef.current.api.getSelectedRows();
        selectedRows.forEach((row) => {
          if (activeCell.col) {
            gridRef.current?.api.forEachNode((node) => {
              if (node.data === row) {
                node.setDataValue(activeCell.col, null);
              }
            });
          }
        });
        e.preventDefault();
      }
    },
    [activeCell, currentSheet, copiedRange, onUndo, onRedo]
  );

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const handleContextMenuAction = useCallback(
    (action: ContextMenuAction) => {
      if (!gridRef.current || !activeCell || !currentSheet) return;

      switch (action) {
        case 'cut': {
          const selectedRows = gridRef.current.api.getSelectedRows();
          if (selectedRows.length) {
            setCopiedRange(selectedRows);
            const tsv = selectedRows
              .map((row) => currentSheet.columns.map((c) => row[c.field] ?? '').join('\t'))
              .join('\n');
            navigator.clipboard.writeText(tsv);
            selectedRows.forEach((row) => {
              currentSheet.columns.forEach((col) => {
                gridRef.current?.api.forEachNode((node) => {
                  if (node.data === row) {
                    node.setDataValue(col.field, null);
                  }
                });
              });
            });
          }
          break;
        }
        case 'copy': {
          const selectedRows = gridRef.current.api.getSelectedRows();
          if (selectedRows.length) {
            setCopiedRange(selectedRows);
            const tsv = selectedRows
              .map((row) => currentSheet.columns.map((c) => row[c.field] ?? '').join('\t'))
              .join('\n');
            navigator.clipboard.writeText(tsv);
          }
          break;
        }
        case 'paste':
          if (copiedRange?.length) {
            const startRow = activeCell.row;
            copiedRange.forEach((srcRow, i) => {
              const targetRowIndex = startRow + i;
              currentSheet.columns.forEach((col) => {
                if (srcRow[col.field] !== undefined) {
                  gridRef.current?.api.forEachNode((node) => {
                    if (node.rowIndex === targetRowIndex) {
                      node.setDataValue(col.field, srcRow[col.field]);
                    }
                  });
                }
              });
            });
          }
          break;
        case 'insertRowAbove':
          // Handled by parent via callback
          break;
        case 'insertRowBelow':
          break;
        case 'deleteRow':
          break;
        case 'insertColLeft':
          break;
        case 'insertColRight':
          break;
        case 'deleteCol':
          break;
        case 'clearContents': {
          const selectedRows = gridRef.current.api.getSelectedRows();
          selectedRows.forEach((row) => {
            currentSheet.columns.forEach((col) => {
              gridRef.current?.api.forEachNode((node) => {
                if (node.data === row) {
                  node.setDataValue(col.field, null);
                }
              });
            });
          });
          break;
        }
        case 'sortAsc':
          gridRef.current.api.applyColumnState({
            state: [{ colId: activeCell.col, sort: 'asc' }],
          });
          break;
        case 'sortDesc':
          gridRef.current.api.applyColumnState({
            state: [{ colId: activeCell.col, sort: 'desc' }],
          });
          break;
      }
      setContextMenu(null);
    },
    [activeCell, currentSheet, copiedRange]
  );

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const cellRefLabel = activeCell ? `${activeCell.col}${activeCell.row + 1}` : '---';

  return (
    <div className={cn('flex flex-col w-full', className)}>
      {/* Formula Bar */}
      <FormulaBar
        value={formulaValue}
        onChange={handleFormulaChange}
        onEvaluate={handleFormulaEvaluate}
        activeCell={cellRefLabel}
        disabled={!activeCell}
      />

      {/* Grid */}
      <div
        className={cn(
          'relative w-full border border-t-0 border-[var(--border-subtle)] rounded-b-lg overflow-hidden',
          loading && 'opacity-50 pointer-events-none grayscale'
        )}
        onContextMenu={handleContextMenu}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="grid"
        aria-label="Spreadsheet Grid"
        style={GRID_STYLE}
      >
        <AgGridReact
          ref={gridRef}
          rowData={currentSheet?.rows || []}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onCellClicked={handleCellClicked}
          onCellValueChanged={handleCellValueChanged}
          onCellEditingStarted={() => setIsEditing(true)}
          onCellEditingStopped={() => setIsEditing(false)}
          gridOptions={{
            rowHeight: 28,
            headerHeight: 32,
            animateRows: true,
            rowSelection: { mode: 'multiRow' },
            suppressCellFocus: false,
            enableCellTextSelection: true,
            undoRedoCellEditing: true,
            // Virtual scrolling configuration for large datasets
            suppressRowVirtualisation: false,
            suppressColumnVirtualisation: false,
            rowBuffer: 10,
            cacheBlockSize: 100,
            maxBlocksInCache: 10,
            suppressAnimationFrame: false,
            suppressBrowserResizeObserver: false,
          }}
        />

        {/* Context Menu */}
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onAction={handleContextMenuAction}
            onClose={() => setContextMenu(null)}
          />
        )}

        {/* Loading overlay */}
        {loading && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-[var(--bg-overlay)] backdrop-blur-[1px] z-50"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 border-4 border-[var(--border-subtle)] border-t-[var(--accent-primary)] rounded-full animate-spin"
                aria-hidden="true"
              />
              <span className="mt-2 text-xs font-semibold text-[var(--accent-primary)]">
                Loading...
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Sheet Tabs */}
      <SheetTabs
        sheets={sheets.map((s) => ({ id: s.id, name: s.name }))}
        activeSheetId={currentSheet?.id || ''}
        onSheetChange={onSheetChange || NOOP}
        onSheetAdd={onSheetAdd || NOOP}
        onSheetRename={onSheetRename || NOOP}
        onSheetDelete={onSheetDelete || NOOP}
        onSheetReorder={onSheetReorder || NOOP}
      />
    </div>
  );
}

import type { CellValueChangedEvent, GridOptions } from 'ag-grid-community';

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

export interface SelectionStats {
  sum: number;
  avg: number;
  count: number;
  min: number;
  max: number;
}

import type { RowType, ColumnType, PeriodType } from '@/engines/ReportBuilderEngine';

export interface DragItem {
  type: 'row-type' | 'column-type';
  value: string;
}

export const ROW_TYPES: Array<{ type: RowType; label: string; icon: string }> = [
  { type: 'header', label: 'Header Row', icon: 'H' },
  { type: 'data', label: 'Data Row', icon: 'D' },
  { type: 'subtotal', label: 'Subtotal Row', icon: 'S' },
  { type: 'total', label: 'Total Row', icon: 'T' },
  { type: 'blank', label: 'Blank Row', icon: '—' },
];

export const COLUMN_TYPES: Array<{ type: ColumnType; label: string; period?: PeriodType }> = [
  { type: 'label', label: 'Label Column' },
  { type: 'period', label: 'Actual Column', period: 'actual' },
  { type: 'period', label: 'Budget Column', period: 'budget' },
  { type: 'period', label: 'Forecast Column', period: 'forecast' },
  { type: 'period', label: 'Variance Column', period: 'variance' },
  { type: 'custom', label: 'Custom Column' },
];

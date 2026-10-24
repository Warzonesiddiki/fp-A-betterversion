import type { ColDef } from 'ag-grid-community';
import { reportingCurrency } from '@/store/financialContextStore';
import { currencyFormatter } from '@/utils/financialFormatting';
import type { DataGridColumn } from './DataGrid.types';

export function buildColumnDefs(columns: DataGridColumn[]): ColDef[] {
  return columns.map((col) => {
    const colDef: ColDef = {
      field: col.field,
      headerName: col.headerName,
      headerTooltip: `Sort by ${col.headerName}`,
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
            return currencyFormatter(reportingCurrency(), { decimals: 0 })(params.value);
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
}

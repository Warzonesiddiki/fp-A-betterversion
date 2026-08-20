import type { ColDef, ColGroupDef } from 'ag-grid-community';
import {
  formatCompact,
  formatCurrency,
  formatPercent,
  formatVariance,
} from '@/utils/financialFormatting';
import { subtractMoney, divideMoney, multiplyMoney, compareMoney, roundTo } from '@/utils/money';

/**
 * Pre-configured AG Grid column types for financial data.
 * Spread `type: 'currency'` etc. into columnDefs for consistent formatting.
 *
 * Usage:
 *   const colDefs: ColDef[] = [
 *     { field: 'revenue', headerName: 'Revenue', ...financialColumnTypes.currency },
 *     { field: 'growth', headerName: 'Growth %', ...financialColumnTypes.percentage },
 *   ];
 */

export const financialColumnTypes: Record<string, ColDef> = {
  currency: {
    cellClass: 'font-mono text-right tabular-nums',
    headerClass: 'text-right font-semibold text-[var(--text-secondary)]',
    valueFormatter: (params) => {
      if (params.value == null) return '—';
      return formatCurrency(params.value);
    },
    cellClassRules: {
      'text-red-600 font-semibold': (p) => Number(p.value) < 0,
      'text-green-600': (p) => Number(p.value) > 0,
    },
    filter: 'agNumberColumnFilter',
    comparator: (a, b) => roundTo(subtractMoney(a ?? 0, b ?? 0)),
  },

  compactCurrency: {
    cellClass: 'font-mono text-right tabular-nums',
    headerClass: 'text-right font-semibold text-[var(--text-secondary)]',
    valueFormatter: (params) => {
      if (params.value == null) return '—';
      const num = Number(params.value);
      if (!Number.isFinite(num)) return '—';
      const abs = Math.abs(num);
      if (abs >= 1_000) return formatCompact(num);
      return formatCurrency(num);
    },
    filter: 'agNumberColumnFilter',
    comparator: (a, b) => roundTo(subtractMoney(a ?? 0, b ?? 0)),
  },

  percentage: {
    cellClass: 'font-mono text-right tabular-nums',
    headerClass: 'text-right font-semibold text-[var(--text-secondary)]',
    valueFormatter: (params) => {
      if (params.value == null) return '—';
      return formatPercent(params.value);
    },
    cellClassRules: {
      'text-red-600': (p) => Number(p.value) < 0,
      'text-green-600': (p) => Number(p.value) > 0,
    },
    filter: 'agNumberColumnFilter',
    comparator: (a, b) => roundTo(subtractMoney(a ?? 0, b ?? 0)),
  },

  variance: {
    cellClass: 'font-mono text-right tabular-nums',
    headerClass: 'text-right font-semibold text-[var(--text-secondary)]',
    valueFormatter: (params) => {
      if (params.value == null) return '—';
      const { text } = formatVariance(params.value, 0);
      return text;
    },
    cellClassRules: {
      'bg-green-50 text-green-700': (p) => Number(p.value) > 0,
      'bg-red-50 text-red-700': (p) => Number(p.value) < 0,
    },
    filter: 'agNumberColumnFilter',
    comparator: (a, b) => roundTo(subtractMoney(a ?? 0, b ?? 0)),
  },

  period: {
    cellClass: 'text-center',
    headerClass: 'text-center font-semibold text-[var(--text-secondary)]',
    filter: 'agTextColumnFilter',
  },

  accountCode: {
    cellRenderer: 'agGroupCellRenderer',
    filter: 'agTextColumnFilter',
    cellClass: 'font-mono text-sm',
  },

  editableNumber: {
    editable: true,
    cellClass: 'font-mono text-right tabular-nums',
    valueParser: (params) => {
      const val = parseFloat(params.newValue);
      return isNaN(val) ? params.oldValue : val;
    },
    singleClickEdit: false,
  },

  editableCurrency: {
    editable: true,
    cellClass: 'font-mono text-right tabular-nums',
    headerClass: 'text-right font-semibold text-[var(--text-secondary)]',
    valueFormatter: (params) => {
      if (params.value == null) return '';
      return formatCurrency(params.value);
    },
    valueParser: (params) => {
      const val = parseFloat(params.newValue);
      return isNaN(val) ? params.oldValue : val;
    },
    singleClickEdit: false,
  },

  formula: {
    cellClass: 'font-mono text-right tabular-nums',
    headerClass: 'text-right font-semibold text-[var(--text-secondary)]',
    valueFormatter: (params) => {
      if (params.value == null) return '—';
      const val = Number(params.value);
      if (!Number.isFinite(val)) return String(params.value);
      return formatCurrency(val);
    },
  },
};

// ─── Column builder: 12-month period grid ─────────────────────────

/**
 * Generate 12-month + optional YTD column group for budget/forecast/actual.
 */
export function createMonthlyPeriodColumns(
  config: {
    showBudget?: boolean;
    showVariance?: boolean;
    showYTD?: boolean;
  } = {}
): (ColDef | ColGroupDef)[] {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const columns: (ColDef | ColGroupDef)[] = [];

  for (const month of months) {
    const group: ColGroupDef = {
      headerName: month,
      groupId: month.toLowerCase(),
      children: [
        {
          headerName: 'Actual',
          field: `actual.${month.toLowerCase()}`,
          type: 'currency',
          editable: true,
        },
      ],
    };

    if (config.showBudget) {
      group.children.push({
        headerName: 'Budget',
        field: `budget.${month.toLowerCase()}`,
        type: 'currency',
        editable: false,
      });
    }

    if (config.showVariance) {
      group.children.push({
        headerName: 'Var',
        field: `variance.${month.toLowerCase()}`,
        type: 'variance',
      });
    }

    columns.push(group);
  }

  if (config.showYTD) {
    columns.push({
      headerName: 'YTD',
      groupId: 'ytd',
      children: [
        { headerName: 'Actual', field: 'ytd.actual', type: 'currency' },
        { headerName: 'Budget', field: 'ytd.budget', type: 'currency' },
        { headerName: 'Var', field: 'ytd.variance', type: 'variance' },
      ],
    });
  }

  return columns;
}

// ─── Column builder: Variance detail ──────────────────────────────

/**
 * Generate Actual / Budget / Variance / Var% column group for a single metric.
 */
export function createVarianceColumns(
  actualField: string,
  budgetField: string,
  options: { prefix?: string } = {}
): ColGroupDef {
  const p = options.prefix ? `${options.prefix}_` : '';
  return {
    headerName: options.prefix || 'Comparison',
    groupId: `${p}variance_group`,
    children: [
      {
        field: actualField,
        headerName: 'Actual',
        type: 'currency',
        width: 110,
      },
      {
        field: budgetField,
        headerName: 'Budget',
        type: 'currency',
        width: 110,
      },
      {
        field: `${p}variance`,
        headerName: 'Var $',
        type: 'variance',
        width: 100,
        valueGetter: (params) => {
          const actual = Number(params.data?.[actualField] ?? 0);
          const budget = Number(params.data?.[budgetField] ?? 0);
          return roundTo(subtractMoney(actual, budget));
        },
      },
      {
        field: `${p}variance_pct`,
        headerName: 'Var %',
        type: 'percentage',
        width: 80,
        valueGetter: (params) => {
          const actual = Number(params.data?.[actualField] ?? 0);
          const budget = Number(params.data?.[budgetField] ?? 0);
          if (compareMoney(budget, 0) === 0) return 0;
          return multiplyMoney(
            divideMoney(subtractMoney(actual, budget), Math.abs(budget)),
            100
          ).toNumber();
        },
      },
    ],
  };
}

// ─── Column builder: YTD sum ──────────────────────────────────────

/**
 * Generate a YTD column that sums the given monthly fields.
 */
export function createYTDColumns(monthlyFields: string[]): ColDef[] {
  return [
    {
      field: 'ytd_total',
      headerName: 'YTD',
      type: 'currency',
      width: 120,
      pinned: 'right',
      valueGetter: (params) => {
        return monthlyFields.reduce((sum, f) => sum + Number(params.data?.[f] ?? 0), 0);
      },
    },
  ];
}

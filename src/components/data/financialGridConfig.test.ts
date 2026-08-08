import { describe, it, expect } from 'vitest';
import {
  financialColumnTypes,
  createMonthlyPeriodColumns,
  createVarianceColumns,
  createYTDColumns,
} from './financialGridConfig';

describe('financialGridConfig', () => {
  describe('column types', () => {
    it('currency formats and colors positive/negative/zero values', () => {
      const t = financialColumnTypes.currency!;
      expect(t.valueFormatter?.({ value: 1234.5 } as never)).toBe('$1,234.50');
      expect(t.valueFormatter?.({ value: null } as never)).toBe('—');
      expect(t.cellClassRules?.['text-red-600 font-semibold']?.({ value: -5 } as never)).toBe(true);
      expect(t.cellClassRules?.['text-green-600']?.({ value: 5 } as never)).toBe(true);
      expect(t.comparator?.(100, 50)).toBe(50);
      expect(t.comparator?.(null, 50)).toBe(-50);
    });

    it('compactCurrency falls back for small/NaN values', () => {
      const t = financialColumnTypes.compactCurrency!;
      expect(t.valueFormatter?.({ value: 500 } as never)).toBe('$500.00');
      expect(t.valueFormatter?.({ value: 1_234_567 } as never)).toContain('M');
      expect(t.valueFormatter?.({ value: 'abc' } as never)).toBe('—');
      expect(t.valueFormatter?.({ value: null } as never)).toBe('—');
    });

    it('percentage formats with sign-based classes', () => {
      const t = financialColumnTypes.percentage!;
      expect(t.valueFormatter?.({ value: 0.123 } as never)).toBe('0.1%');
      expect(t.valueFormatter?.({ value: null } as never)).toBe('—');
      expect(t.cellClassRules?.['text-red-600']?.({ value: -1 } as never)).toBe(true);
      expect(t.cellClassRules?.['text-green-600']?.({ value: 1 } as never)).toBe(true);
    });

    it('variance formats via formatVariance and colors by sign', () => {
      const t = financialColumnTypes.variance!;
      expect(t.valueFormatter?.({ value: 250 } as never)).toBe('$250.00');
      expect(t.valueFormatter?.({ value: null } as never)).toBe('—');
      expect(t.cellClassRules?.['bg-green-50 text-green-700']?.({ value: 1 } as never)).toBe(true);
      expect(t.cellClassRules?.['bg-red-50 text-red-700']?.({ value: -1 } as never)).toBe(true);
    });

    it('editableNumber/editableCurrency parse input and guard NaN', () => {
      const num = financialColumnTypes.editableNumber!;
      expect(num.valueParser?.({ newValue: '42.5', oldValue: 1 } as never)).toBe(42.5);
      expect(num.valueParser?.({ newValue: 'abc', oldValue: 7 } as never)).toBe(7);

      const cur = financialColumnTypes.editableCurrency!;
      expect(cur.valueParser?.({ newValue: '10', oldValue: 0 } as never)).toBe(10);
      expect(cur.valueParser?.({ newValue: 'x', oldValue: 3 } as never)).toBe(3);
      expect(cur.valueFormatter?.({ value: 5 } as never)).toBe('$5.00');
      expect(cur.valueFormatter?.({ value: null } as never)).toBe('');
    });

    it('formula formats numbers but passes through non-numeric text', () => {
      const t = financialColumnTypes.formula!;
      expect(t.valueFormatter?.({ value: 99 } as never)).toBe('$99.00');
      expect(t.valueFormatter?.({ value: 'SUM(A1:A5)' } as never)).toBe('SUM(A1:A5)');
      expect(t.valueFormatter?.({ value: null } as never)).toBe('—');
    });
  });

  describe('createMonthlyPeriodColumns', () => {
    it('builds 12 monthly groups with actual-only children by default', () => {
      const cols = createMonthlyPeriodColumns();
      expect(cols).toHaveLength(12);
      const jan = cols[0] as { headerName: string; children: unknown[] };
      expect(jan.headerName).toBe('Jan');
      expect(jan.children).toHaveLength(1);
      expect((jan.children[0] as { headerName: string }).headerName).toBe('Actual');
    });

    it('adds budget/variance children and YTD group on request', () => {
      const cols = createMonthlyPeriodColumns({
        showBudget: true,
        showVariance: true,
        showYTD: true,
      });
      expect(cols).toHaveLength(13); // 12 months + YTD
      const jan = cols[0] as { children: unknown[] };
      expect(jan.children).toHaveLength(3); // Actual + Budget + Var
      const ytd = cols[12] as { headerName: string; children: unknown[] };
      expect(ytd.headerName).toBe('YTD');
      expect(ytd.children).toHaveLength(3);
    });
  });

  describe('createVarianceColumns', () => {
    it('builds Actual/Budget/Var$/Var% with value getters', () => {
      const group = createVarianceColumns('revenue', 'budgetRevenue', { prefix: 'net' });
      expect(group.headerName).toBe('net');
      expect(group.groupId).toBe('net_variance_group');
      expect(group.children).toHaveLength(4);

      const varianceGetter = (
        group.children[2] as { valueGetter: (p: { data: Record<string, number> }) => number }
      ).valueGetter;
      expect(varianceGetter({ data: { revenue: 120, budgetRevenue: 100 } } as never)).toBe(20);

      const pctGetter = (
        group.children[3] as { valueGetter: (p: { data: Record<string, number> }) => number }
      ).valueGetter;
      expect(pctGetter({ data: { revenue: 120, budgetRevenue: 100 } } as never)).toBe(20);
      expect(pctGetter({ data: { revenue: 50, budgetRevenue: 0 } } as never)).toBe(0);
    });

    it('defaults to unprefixed fields and Comparison header', () => {
      const group = createVarianceColumns('a', 'b');
      expect(group.headerName).toBe('Comparison');
      expect(group.groupId).toBe('variance_group');
    });
  });

  describe('createYTDColumns', () => {
    it('sums the given monthly fields via valueGetter', () => {
      const [col] = createYTDColumns(['m1', 'm2', 'm3']);
      expect(col.field).toBe('ytd_total');
      expect(col.pinned).toBe('right');
      const getter = col.valueGetter as (p: { data: Record<string, number> }) => number;
      expect(getter({ data: { m1: 10, m2: 20, m3: 30 } } as never)).toBe(60);
      expect(getter({ data: { m1: 10 } } as never)).toBe(10);
      expect(getter({ data: {} } as never)).toBe(0);
    });
  });
});

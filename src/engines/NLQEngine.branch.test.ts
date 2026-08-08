import { describe, it, expect } from 'vitest';
import { NLQEngine } from './NLQEngine';
import type { GLEntry } from '@/types';

function entry(over: Partial<GLEntry>): GLEntry {
  return {
    id: 'e1',
    accountId: 'a1',
    accountCode: '4000',
    accountName: 'Sales Revenue',
    period: '2024-01',
    periodName: 'Jan 2024',
    debit: 100,
    credit: 0,
    netChange: 100,
    date: '2024-01-15',
    amount: 100,
    description: 'Sale',
    reference: 'R1',
    entityId: 'ent-1',
    departmentId: 'dept-1',
    ...over,
  };
}

const entries: GLEntry[] = [
  entry({
    id: 'e1',
    date: '2024-01-15',
    netChange: 1000,
    debit: 1000,
    entityId: 'ent-1',
    departmentId: 'dept-1',
    accountName: 'Sales Revenue',
    periodName: 'Jan 2024',
  }),
  entry({
    id: 'e2',
    date: '2024-02-15',
    netChange: -400,
    debit: 0,
    credit: 400,
    entityId: 'ent-1',
    departmentId: 'dept-2',
    accountName: 'Rent Expense',
    periodName: 'Feb 2024',
  }),
  entry({
    id: 'e3',
    date: '2023-11-10',
    netChange: 500,
    debit: 500,
    entityId: 'ent-2',
    departmentId: 'dept-1',
    accountName: 'Sales Revenue',
    periodName: 'Nov 2023',
  }),
];

// A no-dimension query always emits a single 'total' group; dimension queries
// emit one group per distinct value. To stay robust across both shapes, assert
// on the SUM of all returned group values.
const sumData = (q: ReturnType<typeof NLQEngine.parseQuery>, src = entries) =>
  NLQEngine.executeQuery(q, src).data.reduce((s, d) => s + d.value, 0);

describe('NLQEngine — branch sweep', () => {
  describe('time period filters', () => {
    it('thisYear and lastYear filter by year', () => {
      const nowYear = new Date().getFullYear();
      const thisYearSum = entries
        .filter((e) => new Date(e.date).getFullYear() === nowYear)
        .reduce((s, e) => s + Math.max(e.netChange, 0), 0);
      const lastYearSum = entries
        .filter((e) => new Date(e.date).getFullYear() === nowYear - 1)
        .reduce((s, e) => s + Math.max(e.netChange, 0), 0);

      expect(sumData(NLQEngine.parseQuery('revenue this year'))).toBe(thisYearSum);
      expect(sumData(NLQEngine.parseQuery('revenue last year'))).toBe(lastYearSum);
    });

    it('MTD/QTD keep current month/quarter', () => {
      const now = new Date();
      const mtdSum = entries
        .filter(
          (e) =>
            new Date(e.date).getFullYear() === now.getFullYear() &&
            new Date(e.date).getMonth() === now.getMonth()
        )
        .reduce((s, e) => s + Math.max(e.netChange, 0), 0);
      const qtdSum = entries
        .filter((e) => {
          const d = new Date(e.date);
          return (
            d.getFullYear() === now.getFullYear() &&
            Math.ceil((d.getMonth() + 1) / 3) === Math.ceil((now.getMonth() + 1) / 3)
          );
        })
        .reduce((s, e) => s + Math.max(e.netChange, 0), 0);
      expect(sumData(NLQEngine.parseQuery('revenue MTD'))).toBe(mtdSum);
      expect(sumData(NLQEngine.parseQuery('revenue QTD'))).toBe(qtdSum);
    });

    it('thisQuarter and lastQuarter filter by quarter', () => {
      const now = new Date();
      const thisQ = Math.ceil((now.getMonth() + 1) / 3);
      const lastQ = thisQ === 1 ? 4 : thisQ - 1;
      const lastQYear = thisQ === 1 ? now.getFullYear() - 1 : now.getFullYear();

      const tqSum = entries
        .filter(
          (e) =>
            new Date(e.date).getFullYear() === now.getFullYear() &&
            Math.ceil((new Date(e.date).getMonth() + 1) / 3) === thisQ
        )
        .reduce((s, e) => s + Math.max(e.netChange, 0), 0);
      const lqSum = entries
        .filter(
          (e) =>
            new Date(e.date).getFullYear() === lastQYear &&
            Math.ceil((new Date(e.date).getMonth() + 1) / 3) === lastQ
        )
        .reduce((s, e) => s + Math.max(e.netChange, 0), 0);
      expect(sumData(NLQEngine.parseQuery('revenue this quarter'))).toBe(tqSum);
      expect(sumData(NLQEngine.parseQuery('revenue last quarter'))).toBe(lqSum);
    });

    it('specific quarter with and without year', () => {
      // Q1 2024: e1 only contributes (e2's negative netChange yields 0 for revenue)
      expect(sumData(NLQEngine.parseQuery('revenue in Q1 2024'))).toBe(1000);
      // Q4 (any year): e3 (Nov 2023)
      expect(sumData(NLQEngine.parseQuery('revenue in Q4'))).toBe(500);
    });

    it('specific year filters by year', () => {
      expect(sumData(NLQEngine.parseQuery('revenue in 2023'))).toBe(500);
      expect(sumData(NLQEngine.parseQuery('revenue in FY2024'))).toBe(1000);
    });
  });

  describe('filter operators', () => {
    const withFilter = (operator: string, value: string) => {
      const base = NLQEngine.parseQuery('revenue');
      return {
        ...base,
        entities: {
          ...base.entities,
          filters: [{ field: 'amount', operator, value } as never],
        },
      };
    };

    it('eq / neq / gt / lt / gte / lte / contains', () => {
      expect(sumData(withFilter('eq', '1000'))).toBe(1000);
      expect(sumData(withFilter('neq', '1000'))).toBe(500); // e2→0 + e3→500
      expect(sumData(withFilter('gt', '500'))).toBe(1000);
      expect(sumData(withFilter('lt', '600'))).toBe(500);
      expect(sumData(withFilter('gte', '1000'))).toBe(1000);
      expect(sumData(withFilter('lte', '500'))).toBe(500);
      // contains against the description field → all three entries match
      const contains = {
        ...withFilter('contains', 'ale'),
        entities: {
          ...withFilter('contains', 'ale').entities,
          filters: [{ field: 'description', operator: 'contains', value: 'ale' }],
        },
      };
      expect(sumData(contains)).toBe(1500);
      // unknown field → filter passes everything through
      const unknown = {
        ...withFilter('eq', 'x'),
        entities: {
          ...withFilter('eq', 'x').entities,
          filters: [{ field: 'bogus', operator: 'eq', value: 'x' }],
        },
      };
      expect(sumData(unknown)).toBe(1500);
    });
  });

  describe('aggregations and metrics', () => {
    it('avg / count / min / max', () => {
      // revenue values: [1000, 0 (negative dropped), 500]
      expect(sumData(NLQEngine.parseQuery('average revenue'))).toBe(500);
      expect(sumData(NLQEngine.parseQuery('how many entries'))).toBe(3);
      expect(sumData(NLQEngine.parseQuery('minimum revenue'))).toBe(0);
      expect(sumData(NLQEngine.parseQuery('maximum revenue'))).toBe(1000);
    });

    it('expenses/profit/debit/credit metric mapping', () => {
      const byMonth = NLQEngine.executeQuery(NLQEngine.parseQuery('expenses by month'), entries);
      const feb = byMonth.data.find((d) => d.label === 'Feb 2024');
      expect(feb?.value).toBe(400);

      expect(sumData(NLQEngine.parseQuery('debit total'))).toBe(1500);
      expect(sumData(NLQEngine.parseQuery('credit total'))).toBe(400);
    });
  });

  describe('grouping by dimension', () => {
    it('groups by entity, department, account, period, product', () => {
      expect(
        NLQEngine.executeQuery(NLQEngine.parseQuery('revenue by entity'), entries).data
      ).toHaveLength(2);
      expect(
        NLQEngine.executeQuery(NLQEngine.parseQuery('revenue by department'), entries).data
      ).toHaveLength(2);
      expect(
        NLQEngine.executeQuery(NLQEngine.parseQuery('revenue by account'), entries).data
      ).toHaveLength(2);
      expect(
        NLQEngine.executeQuery(NLQEngine.parseQuery('revenue by period'), entries).data
      ).toHaveLength(3);
      expect(
        NLQEngine.executeQuery(NLQEngine.parseQuery('revenue by product'), entries).data
      ).toHaveLength(2);
    });

    it('falls back to Unknown buckets for missing entity/department', () => {
      const withMissing = [
        ...entries,
        entry({ id: 'e9', entityId: undefined, departmentId: undefined }),
      ];
      const byRegion = NLQEngine.executeQuery(
        NLQEngine.parseQuery('revenue by region'),
        withMissing
      );
      expect(byRegion.data.some((d) => d.label === 'Unknown')).toBe(true);

      const byDept = NLQEngine.executeQuery(
        NLQEngine.parseQuery('revenue by department'),
        withMissing
      );
      expect(byDept.data.some((d) => d.label === 'Unknown')).toBe(true);
    });
  });

  describe('summaries and chart configs', () => {
    it('generates per-intent summaries including no-data', () => {
      const noData = NLQEngine.executeQuery(NLQEngine.parseQuery('revenue by account'), []);
      expect(noData.summary).toBe('No data found for this query.');
      expect(noData.data).toHaveLength(0);

      const kpi = NLQEngine.executeQuery(NLQEngine.parseQuery('revenue'), entries);
      expect(kpi.summary).toMatch(/^Total revenue:/);
      expect(kpi.chartConfig).toBeNull();

      expect(
        NLQEngine.executeQuery(NLQEngine.parseQuery('compare revenue by account'), entries).summary
      ).toContain('items');
      expect(
        NLQEngine.executeQuery(NLQEngine.parseQuery('trend of revenue'), entries).summary
      ).toContain('trend');
      expect(
        NLQEngine.executeQuery(NLQEngine.parseQuery('table of revenue'), entries).summary
      ).toContain('rows');
      expect(
        NLQEngine.executeQuery(NLQEngine.parseQuery('revenue by account'), entries).summary
      ).toContain('by');
    });

    it('generateChartConfig reflects query type, metric and dimension', () => {
      const q = NLQEngine.parseQuery('show me a donut chart of expenses by department');
      const cfg = NLQEngine.generateChartConfig(q, []);
      expect(cfg.type).toBe('pie');
      expect(cfg.dataKey).toBe('value');
      expect(cfg.labelKey).toBe('label');
      expect(cfg.colors.length).toBeGreaterThan(3);
      expect(cfg.title).toContain('expenses');

      const line = NLQEngine.parseQuery('trend of revenue');
      expect(NLQEngine.generateChartConfig(line, []).type).toBe('line');
    });
  });

  describe('parsing edge cases', () => {
    it('defaults intent to kpi for vague queries and chart for dimension keywords', () => {
      expect(NLQEngine.parseQuery('revenue').intent).toBe('kpi');
      expect(NLQEngine.parseQuery('show numbers').intent).toBe('chart');
      expect(NLQEngine.parseQuery('show me grouped by account').intent).toBe('chart');
      expect(NLQEngine.parseQuery('just some numbers').intent).toBe('kpi');
    });

    it('extracts month periods and where-filters', () => {
      const m = NLQEngine.parseQuery('revenue in january');
      expect(m.entities.timePeriod?.type).toBe('month');
      expect(m.entities.timePeriod?.value).toBe('Jan');

      const f = NLQEngine.parseQuery('revenue where department = sales');
      expect(f.entities.filters.length).toBeGreaterThan(0);
      expect(f.entities.filters[0]).toMatchObject({
        field: 'department',
        operator: 'eq',
        value: 'sales',
      });
    });

    it('detects aggregation keywords', () => {
      expect(NLQEngine.parseQuery('average revenue').entities.aggregation).toBe('avg');
      expect(NLQEngine.parseQuery('how many records').entities.aggregation).toBe('count');
      expect(NLQEngine.parseQuery('minimum value').entities.aggregation).toBe('min');
      expect(NLQEngine.parseQuery('maximum value').entities.aggregation).toBe('max');
      expect(NLQEngine.parseQuery('total revenue').entities.aggregation).toBe('sum');
    });
  });
});

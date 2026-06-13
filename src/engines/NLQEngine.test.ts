/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { NLQEngine } from './NLQEngine';

describe('NLQEngine', () => {
  describe('parseQuery', () => {
    it('parses revenue query', () => {
      const result = NLQEngine.parseQuery('show revenue by region');
      expect(result).toBeDefined();
      expect(result?.intent).toBeDefined();
    });

    it('parses expense query', () => {
      const result = NLQEngine.parseQuery('total expenses this quarter');
      expect(result).toBeDefined();
    });

    it('parses variance query', () => {
      const result = NLQEngine.parseQuery('budget vs actual variance');
      expect(result).toBeDefined();
    });

    it('handles empty query', () => {
      const result = NLQEngine.parseQuery('');
      expect(result).toBeDefined();
      expect(result.intent).toBeDefined();
    });
  });

  describe('classifyIntent', () => {
    it('classifies chart intent', () => {
      const result = NLQEngine.classifyIntent('show revenue by region as bar chart');
      expect(result).toBe('chart');
    });

    it('classifies table intent', () => {
      const result = NLQEngine.classifyIntent('list all expenses');
      expect(result).toBe('table');
    });

    it('classifies KPI intent', () => {
      const result = NLQEngine.classifyIntent('what is total revenue');
      expect(result).toBe('kpi');
    });

    it('classifies comparison intent', () => {
      const result = NLQEngine.classifyIntent('compare revenue vs expenses');
      expect(result).toBe('comparison');
    });

    it('classifies trend intent', () => {
      const result = NLQEngine.classifyIntent('show revenue trend over time');
      expect(result).toBe('trend');
    });
  });

  describe('extractEntities', () => {
    it('extracts time period', () => {
      const result = NLQEngine.extractEntities('revenue in Q3 2026');
      expect(result).toBeDefined();
    });

    it('extracts metric', () => {
      const result = NLQEngine.extractEntities('total expenses');
      expect(result).toBeDefined();
    });

    it('extracts dimension', () => {
      const result = NLQEngine.extractEntities('revenue by region');
      expect(result).toBeDefined();
    });

    it('extracts multiple metrics', () => {
      const result = NLQEngine.extractEntities('revenue and expenses and profit');
      expect(result.metrics.length).toBeGreaterThanOrEqual(2);
    });

    it('extracts new metric patterns', () => {
      const result = NLQEngine.extractEntities('show EBITDA by department');
      expect(result.metrics).toContain('ebitda');
    });

    it('extracts customer dimension', () => {
      const result = NLQEngine.extractEntities('revenue by customer');
      expect(result.dimensions).toContain('customer');
    });

    it('extracts vendor dimension', () => {
      const result = NLQEngine.extractEntities('spending by vendor');
      expect(result.dimensions).toContain('vendor');
    });

    it('extracts project dimension', () => {
      const result = NLQEngine.extractEntities('costs by project');
      expect(result.dimensions).toContain('project');
    });

    it('extracts specific time period', () => {
      const result = NLQEngine.extractEntities('revenue YTD');
      expect(result.timePeriod).not.toBeNull();
      expect(result.timePeriod!.value).toBe('YTD');
    });

    it('extracts quarter time period', () => {
      const result = NLQEngine.extractEntities('expenses in Q3');
      expect(result.timePeriod).not.toBeNull();
      expect(result.timePeriod!.type).toBe('quarter');
    });

    it('extracts filter', () => {
      const result = NLQEngine.extractEntities('revenue where region is north');
      expect(result.filters.length).toBeGreaterThan(0);
    });
  });

  describe('calculateConfidence', () => {
    it('returns higher confidence for specific queries', () => {
      const result = NLQEngine.parseQuery('show revenue by department in Q3 2026');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('returns lower confidence for vague queries', () => {
      const result = NLQEngine.parseQuery('revenue');
      expect(result.confidence).toBeLessThan(0.7);
    });

    it('returns higher confidence for comparison queries', () => {
      const result = NLQEngine.parseQuery('compare revenue vs expenses in Q3');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('returns higher confidence for trend queries', () => {
      const result = NLQEngine.parseQuery('show revenue trend over time');
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    it('returns higher confidence with filters', () => {
      const result = NLQEngine.parseQuery('revenue by region where department is sales');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('returns higher confidence for YTD/MTD/QTD', () => {
      const result = NLQEngine.parseQuery('revenue YTD by department');
      expect(result.confidence).toBeGreaterThan(0.7);
    });
  });

  describe('executeQuery', () => {
    const mockEntries = [
      {
        id: '1',
        period: '2026-01',
        accountCode: '4000',
        accountName: 'Revenue',
        debit: 0,
        credit: 100000,
        netChange: 100000,
        date: '2026-01-15',
        amount: 100000,
        description: 'Sales',
        reference: 'INV-001',
        department: 'Sales',
      },
      {
        id: '2',
        period: '2026-01',
        accountCode: '6000',
        accountName: 'Expenses',
        debit: 30000,
        credit: 0,
        netChange: -30000,
        date: '2026-01-15',
        amount: 30000,
        description: 'Payroll',
        reference: 'PAY-001',
        department: 'Operations',
      },
      {
        id: '3',
        period: '2026-02',
        accountCode: '4000',
        accountName: 'Revenue',
        debit: 0,
        credit: 120000,
        netChange: 120000,
        date: '2026-02-15',
        amount: 120000,
        description: 'Sales',
        reference: 'INV-002',
        department: 'Sales',
      },
    ] as unknown as import('@/types').GLEntry[];

    it('executes query and returns data points', () => {
      const query = NLQEngine.parseQuery('show revenue by department');
      const result = NLQEngine.executeQuery(query, mockEntries);
      expect(result.data).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    it('returns null chart config for KPI intent', () => {
      const query = NLQEngine.parseQuery('what is total revenue');
      const result = NLQEngine.executeQuery(query, mockEntries);
      expect(result.chartConfig).toBeNull();
    });
  });

  describe('suggestChartType', () => {
    it('suggests line for trend queries', () => {
      const result = NLQEngine.parseQuery('show revenue trend over time');
      expect(result.chartType).toBe('line');
    });

    it('suggests pie for donut queries', () => {
      const result = NLQEngine.parseQuery('show revenue as donut');
      expect(result.chartType).toBe('pie');
    });

    it('suggests bar for column queries', () => {
      const result = NLQEngine.parseQuery('show revenue as column chart');
      expect(result.chartType).toBe('bar');
    });
  });
});

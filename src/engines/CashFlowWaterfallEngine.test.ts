/**
 * Tests for CashFlowWaterfallEngine
 * Covers: build, project
 */
import { describe, it, expect } from 'vitest';
import { CashFlowWaterfallEngine } from './CashFlowWaterfallEngine';

describe('CashFlowWaterfallEngine', () => {
  describe('build', () => {
    it('should build waterfall from categories', () => {
      const operating = {
        name: 'Operating',
        items: [
          { label: 'Revenue', amount: 500000, type: 'inflow' as const },
          { label: 'COGS', amount: 200000, type: 'outflow' as const },
          { label: 'OpEx', amount: 150000, type: 'outflow' as const },
        ],
      };
      const investing = { name: 'Investing', items: [] };
      const financing = { name: 'Financing', items: [] };

      const result = CashFlowWaterfallEngine.build(100000, operating, investing, financing);
      expect(result.openingCash).toBe(100000);
      expect(result.closingCash).toBe(250000);
      expect(result.operating.items.length).toBe(3);
    });

    it('should track net change', () => {
      const operating = {
        name: 'Operating',
        items: [
          { label: 'Income', amount: 100, type: 'inflow' as const },
          { label: 'Expense', amount: 50, type: 'outflow' as const },
        ],
      };
      const investing = { name: 'Investing', items: [] };
      const financing = { name: 'Financing', items: [] };

      const result = CashFlowWaterfallEngine.build(0, operating, investing, financing);
      expect(result.netChange).toBe(50);
    });

    it('should handle empty categories', () => {
      const empty = { name: 'Empty', items: [] };
      const result = CashFlowWaterfallEngine.build(1000, empty, empty, empty);
      expect(result.openingCash).toBe(1000);
      expect(result.closingCash).toBe(1000);
      expect(result.netChange).toBe(0);
    });
  });

  describe('project', () => {
    it('should project future cash flows', () => {
      const result = CashFlowWaterfallEngine.project(100000, [
        { inflows: 50000, outflows: 30000 },
        { inflows: 50000, outflows: 30000 },
        { inflows: 50000, outflows: 30000 },
        { inflows: 50000, outflows: 30000 },
        { inflows: 50000, outflows: 30000 },
        { inflows: 50000, outflows: 30000 },
      ]);
      expect(result.length).toBe(6);
      expect(result[0].closingBalance).toBe(120000);
      expect(result[5].closingBalance).toBe(220000);
    });

    it('should handle negative cash flow', () => {
      const result = CashFlowWaterfallEngine.project(100000, [
        { inflows: 20000, outflows: 30000 },
        { inflows: 20000, outflows: 30000 },
        { inflows: 20000, outflows: 30000 },
      ]);
      expect(result[2].closingBalance).toBe(70000);
    });
  });
});

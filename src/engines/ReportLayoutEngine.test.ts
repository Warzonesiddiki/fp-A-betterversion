/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import {
  generateProfitAndLossLayout,
  generateBalanceSheetLayout,
  renderSectionToHTML,
} from './ReportLayoutEngine';

describe('ReportLayoutEngine', () => {
  describe('generateProfitAndLossLayout', () => {
    it('generates P&L layout with revenue section', () => {
      const data = {
        productRevenue: { '2026-01': 100000 },
        serviceRevenue: { '2026-01': 50000 },
        otherRevenue: { '2026-01': 10000 },
        materials: { '2026-01': 30000 },
        directLabor: { '2026-01': 20000 },
        overhead: { '2026-01': 10000 },
      };
      const layout = generateProfitAndLossLayout(data);
      expect(layout).toBeDefined();
      expect(layout.length).toBeGreaterThan(0);
    });

    it('includes revenue, COGS, and net income sections', () => {
      const data = {};
      const layout = generateProfitAndLossLayout(data);
      const labels = layout.map((s) => s.label);
      expect(labels).toContain('Revenue');
      expect(labels).toContain('Cost of Goods Sold');
      expect(labels).toContain('Operating Expenses');
    });

    it('handles empty data', () => {
      const layout = generateProfitAndLossLayout({});
      expect(layout).toBeDefined();
      expect(layout.length).toBeGreaterThan(0);
    });
  });

  describe('generateBalanceSheetLayout', () => {
    it('generates balance sheet layout', () => {
      const data = {
        currentAssets: { '2026-01': 50000 },
        fixedAssets: { '2026-01': 100000 },
        otherAssets: { '2026-01': 10000 },
        currentLiabilities: { '2026-01': 30000 },
        longTermLiabilities: { '2026-01': 50000 },
        retainedEarnings: { '2026-01': 60000 },
        capitalStock: { '2026-01': 10000 },
        additionalPaidIn: { '2026-01': 10000 },
      };
      const layout = generateBalanceSheetLayout(data);
      expect(layout).toBeDefined();
      expect(layout.length).toBeGreaterThan(0);
    });

    it('includes assets, liabilities, and equity sections', () => {
      const data = {};
      const layout = generateBalanceSheetLayout(data);
      const labels = layout.map((s) => s.label);
      expect(labels).toContain('Assets');
      expect(labels).toContain('Liabilities');
      expect(labels).toContain('Equity');
    });

    it('handles empty data', () => {
      const layout = generateBalanceSheetLayout({});
      expect(layout).toBeDefined();
    });
  });

  describe('renderSectionToHTML', () => {
    it('renders section to HTML', () => {
      const section = {
        id: 'test',
        type: 'line_item' as const,
        label: 'Revenue',
        indent: 0,
        bold: false,
        underline: 'none' as const,
        showLineAbove: false,
        fontSize: 'normal' as const,
        values: { '2026-01': 100000 },
        isPercentage: false,
      };
      const html = renderSectionToHTML(section, ['2026-01']);
      expect(html).toContain('Revenue');
      expect(html).toContain('100,000');
    });

    it('renders bold total section', () => {
      const section = {
        id: 'total',
        type: 'total' as const,
        label: 'Total Revenue',
        indent: 0,
        bold: true,
        underline: 'double' as const,
        showLineAbove: true,
        fontSize: 'large' as const,
        values: { '2026-01': 160000 },
        isPercentage: false,
      };
      const html = renderSectionToHTML(section, ['2026-01']);
      expect(html).toContain('Total Revenue');
      expect(html).toContain('font-bold');
    });
  });
});

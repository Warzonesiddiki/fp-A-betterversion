/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { AdvancedExcelEngine } from './AdvancedExcelEngine';

describe('AdvancedExcelEngine', () => {
  describe('createWorkbook', () => {
    it('creates workbook from sheets', () => {
      const sheets = [
        {
          name: 'Sheet1',
          data: [
            ['Name', 'Value'],
            ['Revenue', 100000],
            ['Expenses', 50000],
          ],
        },
      ];
      const blob = AdvancedExcelEngine.createWorkbook(sheets);
      expect(blob).toBeDefined();
      expect(blob.size).toBeGreaterThan(0);
    });
  });

  describe('exportToExcel', () => {
    it('exports data to Excel format', () => {
      const data = [
        { account: 'Revenue', amount: 100000 },
        { account: 'Expenses', amount: 50000 },
      ];
      const columns = [
        { header: 'Account', key: 'account', width: 20 },
        { header: 'Amount', key: 'amount', width: 15 },
      ];
      const result = AdvancedExcelEngine.exportToExcel(data, columns, 'test');
      expect(result).toBeDefined();
    });
  });

  describe('applyConditionalFormatting', () => {
    it('applies conditional formatting rules', () => {
      const sheet = {
        name: 'Sheet1',
        data: [['Value'], [100], [200], [50]],
      };
      const rules = [
        {
          condition: 'greaterThan',
          value: 100,
          style: { backgroundColor: '#10B981' },
        },
      ];
      const result = AdvancedExcelEngine.applyConditionalFormatting(sheet, rules);
      expect(result).toBeDefined();
    });
  });

  describe('addComments', () => {
    it('adds comments to cells', () => {
      const sheet = {
        name: 'Sheet1',
        data: [['Value'], [100]],
      };
      const comments = [
        {
          cell: 'B2',
          author: 'Test User',
          text: 'This is a comment',
          timestamp: '2026-05-20',
        },
      ];
      const result = AdvancedExcelEngine.addComments(sheet, comments);
      expect(result).toBeDefined();
    });
  });

  describe('createNamedRange', () => {
    it('creates named range', () => {
      const result = AdvancedExcelEngine.createNamedRange('Revenue', 'Sheet1', 'B2:B10');
      expect(result).toBeDefined();
    });
  });
});

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
          columns: [
            { header: 'Name', width: 150 },
            { header: 'Value', width: 150 },
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
      const sheet: Parameters<typeof AdvancedExcelEngine.applyConditionalFormatting>[0] = {
        name: 'Sheet1',
        data: [['Value'], [100], [200], [50]],
        columns: [{ header: 'Value', width: 150 }],
      };
      const rules: Parameters<typeof AdvancedExcelEngine.applyConditionalFormatting>[1] = [
        {
          range: 'A1:A4',
          type: 'greaterThan',
          value: 100,
          style: { backgroundColor: '#10B981' },
        },
      ];
      const result = AdvancedExcelEngine.applyConditionalFormatting(sheet, rules);
      expect(result).toBeDefined();
      expect(result.conditionalFormatting).toHaveLength(1);
    });
  });

  describe('addComments', () => {
    it('adds comments to cells', () => {
      const sheet: Parameters<typeof AdvancedExcelEngine.addComments>[0] = {
        name: 'Sheet1',
        data: [['Value'], [100]],
        columns: [{ header: 'Value', width: 150 }],
      };
      const comments: Parameters<typeof AdvancedExcelEngine.addComments>[1] = [
        {
          cell: 'B2',
          author: 'Test User',
          text: 'This is a comment',
          timestamp: '2026-05-20',
        },
      ];
      const result = AdvancedExcelEngine.addComments(sheet, comments);
      expect(result).toBeDefined();
      expect(result.comments).toHaveLength(1);
    });
  });

  describe('createNamedRange', () => {
    it('creates named range', () => {
      const result = AdvancedExcelEngine.createNamedRange('Revenue', 'B2:B10', 'Sheet1');
      expect(result).toEqual({
        name: 'Revenue',
        range: 'B2:B10',
        sheet: 'Sheet1',
      });
    });
  });
});

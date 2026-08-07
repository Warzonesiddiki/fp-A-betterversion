/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { SmartImportMapper, type ColumnMapping } from './SmartImportMapper';

describe('SmartImportMapper', () => {
  describe('suggestMappings', () => {
    it('suggests mappings for GL headers', () => {
      const headers = ['Account', 'Date', 'Amount', 'Description'];
      const result = SmartImportMapper.suggestMappings(headers, 'csv');
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('suggests mappings for budget headers', () => {
      const headers = ['Department', 'Category', 'Budget Amount', 'Actual Amount'];
      const result = SmartImportMapper.suggestMappings(headers, 'xlsx');
      expect(result).toBeDefined();
    });

    it('handles empty headers', () => {
      const result = SmartImportMapper.suggestMappings([], 'csv');
      expect(result).toBeDefined();
      expect(result.length).toBe(0);
    });
  });

  describe('validateMappings', () => {
    it('validates complete mappings', () => {
      const mappings: ColumnMapping[] = [
        { sourceColumn: 'Account', targetField: 'accountId', confidence: 0.95 },
        { sourceColumn: 'Date', targetField: 'date', confidence: 0.9 },
        { sourceColumn: 'Amount', targetField: 'amount', confidence: 0.85 },
      ];
      const requiredFields = ['accountId', 'date', 'amount'];
      const result = SmartImportMapper.validateMappings(mappings, requiredFields);
      expect(result.valid).toBe(true);
      expect(result.missingFields).toHaveLength(0);
    });

    it('identifies missing required fields and warnings', () => {
      const mappings: ColumnMapping[] = [
        { sourceColumn: 'Account', targetField: 'accountId', confidence: 0.95 },
      ];
      const requiredFields = ['accountId', 'date', 'amount'];
      const result = SmartImportMapper.validateMappings(mappings, requiredFields);
      expect(result.valid).toBe(false);
      expect(result.missingFields).toContain('date');
      expect(result.missingFields).toContain('amount');
    });

    it('finds duplicate target field mappings', () => {
      const mappings: ColumnMapping[] = [
        { sourceColumn: 'ColA', targetField: 'accountId', confidence: 0.9 },
        { sourceColumn: 'ColB', targetField: 'accountId', confidence: 0.8 },
      ];
      const duplicates = SmartImportMapper.findDuplicateMappings(mappings);
      expect(duplicates).toContain('accountId');
    });
  });

  describe('transform with column transformations', () => {
    it('transforms data using mappings and applies date, currency, number, percentage, uppercase, trim', () => {
      const data = [
        ['AcctHeader', 'AmtHeader', 'PctHeader', 'DateHeader', 'DescHeader'],
        ['  acc001  ', '$1,250.50', '25%', '2026/01/15', '  raw description  '],
      ];
      const mappings: ColumnMapping[] = [
        {
          sourceColumn: 'AcctHeader',
          targetField: 'accountId',
          confidence: 0.95,
          transform: 'uppercase',
        },
        {
          sourceColumn: 'AmtHeader',
          targetField: 'amount',
          confidence: 0.95,
          transform: 'currency',
        },
        {
          sourceColumn: 'PctHeader',
          targetField: 'rate',
          confidence: 0.95,
          transform: 'percentage',
        },
        {
          sourceColumn: 'DateHeader',
          targetField: 'postDate',
          confidence: 0.95,
          transform: 'date',
        },
        { sourceColumn: 'DescHeader', targetField: 'desc', confidence: 0.95, transform: 'trim' },
      ];

      const result = SmartImportMapper.transform(data, mappings);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(['accountId', 'amount', 'rate', 'postDate', 'desc']);
      expect(result[1]![0]).toBe('ACC001');
      expect(result[1]![1]).toBe(1250.5);
      expect(result[1]![2]).toBe(25);
      expect(result[1]![4]).toBe('raw description');
    });

    it('handles empty data', () => {
      expect(SmartImportMapper.transform([], [])).toEqual([]);
    });
  });

  describe('learning and persisting mappings', () => {
    it('learns and merges mappings based on historical imports', () => {
      const mappings: ColumnMapping[] = [
        { sourceColumn: 'Acct_Num', targetField: 'accountId', confidence: 0.9 },
        { sourceColumn: 'Post_Dt', targetField: 'date', confidence: 0.9 },
        { sourceColumn: 'Txn_Amt', targetField: 'amount', confidence: 0.9 },
      ];

      SmartImportMapper.learnMapping('ledger.csv', mappings);
      SmartImportMapper.learnMapping('ledger.csv', mappings); // useCount >= 2

      const suggested = SmartImportMapper.suggestMappings(
        ['Acct_Num', 'Post_Dt', 'Txn_Amt'],
        'csv'
      );
      expect(suggested.length).toBe(3);
    });
  });
});

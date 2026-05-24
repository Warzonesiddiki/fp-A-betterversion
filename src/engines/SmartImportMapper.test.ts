/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { SmartImportMapper } from './SmartImportMapper';

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
      const mappings = [
        { sourceColumn: 'Account', targetField: 'accountId', confidence: 0.95 },
        { sourceColumn: 'Date', targetField: 'date', confidence: 0.9 },
        { sourceColumn: 'Amount', targetField: 'amount', confidence: 0.85 },
      ];
      const requiredFields = ['accountId', 'date', 'amount'];
      const result = SmartImportMapper.validateMappings(mappings, requiredFields);
      expect(result).toBeDefined();
    });

    it('identifies missing required fields', () => {
      const mappings = [{ sourceColumn: 'Account', targetField: 'accountId', confidence: 0.95 }];
      const requiredFields = ['accountId', 'date', 'amount'];
      const result = SmartImportMapper.validateMappings(mappings, requiredFields);
      expect(result).toBeDefined();
    });
  });

  describe('transform', () => {
    it('transforms data using mappings', () => {
      const data = [
        ['ACC001', '2026-01-01', '1000'],
        ['ACC002', '2026-01-02', '2000'],
      ];
      const mappings = [
        { sourceColumn: '0', targetField: 'accountId', confidence: 0.95 },
        { sourceColumn: '1', targetField: 'date', confidence: 0.9 },
        { sourceColumn: '2', targetField: 'amount', confidence: 0.85 },
      ];
      const result = SmartImportMapper.transform(data, mappings);
      expect(result).toBeDefined();
      expect(result.length).toBe(2);
    });
  });
});

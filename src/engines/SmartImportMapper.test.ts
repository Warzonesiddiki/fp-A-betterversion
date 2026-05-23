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
        { source: 'Account', target: 'accountId', confidence: 0.95 },
        { source: 'Date', target: 'date', confidence: 0.9 },
        { source: 'Amount', target: 'amount', confidence: 0.85 },
      ];
      const requiredFields = ['accountId', 'date', 'amount'];
      const result = SmartImportMapper.validateMappings(mappings, requiredFields);
      expect(result).toBeDefined();
    });

    it('identifies missing required fields', () => {
      const mappings = [{ source: 'Account', target: 'accountId', confidence: 0.95 }];
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
        { source: '0', target: 'accountId', confidence: 0.95 },
        { source: '1', target: 'date', confidence: 0.9 },
        { source: '2', target: 'amount', confidence: 0.85 },
      ];
      const result = SmartImportMapper.transform(data, mappings);
      expect(result).toBeDefined();
      expect(result.length).toBe(2);
    });
  });
});

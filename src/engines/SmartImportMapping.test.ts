/**
 * Tests for SmartImportMapping
 * Covers: suggestMappings, learnFromImport, getLearnedMappings, fuzzyMatch
 */
import { describe, it, expect } from 'vitest';
import { SmartImportMapping } from './SmartImportMapping';

describe('SmartImportMapping', () => {
  describe('suggestMappings', () => {
    it('should suggest mappings for known column headers', () => {
      const headers = ['Date', 'Revenue', 'Expenses', 'Profit'];
      const suggestions = SmartImportMapping.suggestMappings(headers);
      expect(suggestions.length).toBeGreaterThanOrEqual(1);
      expect(suggestions[0].sourceColumn).toBe('Date');
      expect(suggestions[0].confidence).toBeGreaterThan(0);
    });

    it('should handle case-insensitive matching', () => {
      const headers = ['DATE', 'REVENUE', 'EXPENSES'];
      const suggestions = SmartImportMapping.suggestMappings(headers);
      expect(suggestions[0].sourceColumn).toBe('DATE');
    });

    it('should return empty array for unknown headers', () => {
      const headers = ['XYZ', 'ABC', 'DEF'];
      const suggestions = SmartImportMapping.suggestMappings(headers);
      expect(suggestions).toHaveLength(0);
    });

    it('should handle empty headers', () => {
      const suggestions = SmartImportMapping.suggestMappings([]);
      expect(suggestions).toHaveLength(0);
    });
  });

  describe('learnFromImport', () => {
    it('should learn and retrieve mappings', () => {
      const headers = ['Date', 'Revenue'];
      const mappings = [
        { sourceColumn: 'Date', targetField: 'period', confidence: 0.9 },
        { sourceColumn: 'Revenue', targetField: 'revenue', confidence: 0.95 },
      ];
      SmartImportMapping.learnFromImport(headers, mappings);
      const learned = SmartImportMapping.getLearnedMappings('Date|Revenue');
      expect(learned).toHaveLength(2);
    });

    it('should have transform property on learned mappings', () => {
      const headers = ['Date', 'Amount'];
      const mappings = [
        { sourceColumn: 'Date', targetField: 'period', confidence: 0.9 },
        { sourceColumn: 'Amount', targetField: 'revenue', confidence: 0.85 },
      ];
      SmartImportMapping.learnFromImport(headers, mappings);
      const learned = SmartImportMapping.getLearnedMappings('Date|Amount');
      expect(learned[0].sourceColumn).toBe('Date');
    });
  });

  describe('fuzzyMatch', () => {
    it('should find fuzzy matches', () => {
      const results = SmartImportMapping.fuzzyMatch('acct', ['acct_num', 'gl_code', 'period']);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return empty for no matches', () => {
      const results = SmartImportMapping.fuzzyMatch('zzzzz', ['test']);
      expect(results).toHaveLength(0);
    });
  });
});

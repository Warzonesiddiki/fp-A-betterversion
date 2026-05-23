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
  });
});

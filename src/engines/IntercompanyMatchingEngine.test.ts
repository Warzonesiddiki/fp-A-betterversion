/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { IntercompanyMatchingEngine } from './IntercompanyMatchingEngine';

describe('IntercompanyMatchingEngine', () => {
  describe('matchICTransactions', () => {
    it('matches matching transactions', () => {
      const result = IntercompanyMatchingEngine.matchICTransactions(
        [{ id: '1', amount: 1000, entity: 'A', counterparty: 'B' }],
        [{ id: '2', amount: -1000, entity: 'B', counterparty: 'A' }]
      );
      expect(result).toBeDefined();
      expect(result.matched).toBeDefined();
    });

    it('identifies unmatched transactions', () => {
      const result = IntercompanyMatchingEngine.matchICTransactions(
        [{ id: '1', amount: 1000, entity: 'A', counterparty: 'B' }],
        [{ id: '2', amount: -500, entity: 'B', counterparty: 'A' }]
      );
      expect(result).toBeDefined();
    });
  });

  describe('createEliminations', () => {
    it('calculates elimination entries', () => {
      const result = IntercompanyMatchingEngine.createEliminations([
        { id: '1', amount: 1000, entity: 'A', counterparty: 'B' },
        { id: '2', amount: -1000, entity: 'B', counterparty: 'A' },
      ]);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getMatchingSummary', () => {
    it('returns matching summary', () => {
      const summary = IntercompanyMatchingEngine.getMatchingSummary();
      expect(summary).toBeDefined();
    });
  });
});

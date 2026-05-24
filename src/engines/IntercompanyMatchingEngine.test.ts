/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { IntercompanyMatchingEngine, ICTransaction } from './IntercompanyMatchingEngine';

const makeTxns = (): ICTransaction[] => [
  {
    id: '1',
    fromEntity: 'A',
    toEntity: 'B',
    amount: 1000,
    currency: 'USD',
    accountCode: '1200',
    description: 'Sale to B',
    date: '2024-01-15',
    status: 'pending',
  },
  {
    id: '2',
    fromEntity: 'B',
    toEntity: 'A',
    amount: -1000,
    currency: 'USD',
    accountCode: '1200',
    description: 'Purchase from A',
    date: '2024-01-15',
    status: 'pending',
  },
];

describe('IntercompanyMatchingEngine', () => {
  beforeEach(() => {
    IntercompanyMatchingEngine.clear();
  });

  describe('autoMatch', () => {
    it('matches matching transactions', () => {
      IntercompanyMatchingEngine.addTransactions(makeTxns());
      const result = IntercompanyMatchingEngine.autoMatch();
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
    });

    it('identifies unmatched transactions', () => {
      IntercompanyMatchingEngine.addTransactions([
        { ...makeTxns()[0], amount: 1000 },
        { ...makeTxns()[1], amount: -500, id: '2' },
      ]);
      const result = IntercompanyMatchingEngine.autoMatch();
      expect(result).toBeDefined();
      expect(result.length).toBe(0);
    });
  });

  describe('createEliminations', () => {
    it('creates elimination entries', () => {
      IntercompanyMatchingEngine.addTransactions(makeTxns());
      IntercompanyMatchingEngine.autoMatch();
      const result = IntercompanyMatchingEngine.createEliminations('2024-01', 'test-user');
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getMatches', () => {
    it('returns matched transactions', () => {
      IntercompanyMatchingEngine.addTransactions(makeTxns());
      IntercompanyMatchingEngine.autoMatch();
      const matches = IntercompanyMatchingEngine.getMatches();
      expect(matches).toBeDefined();
      expect(Array.isArray(matches)).toBe(true);
    });
  });
});

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

  // -------------------------------------------------------------------------
  // Exact-decimal financial arithmetic (F-0006 money-primitive migration).
  // These assert the numeric contract that the float implementation could not
  // guarantee: summing many cent amounts must not drift.
  // -------------------------------------------------------------------------
  describe('netICBalances (exact decimal)', () => {
    it('nets a pair to an exact 2-dp string', () => {
      IntercompanyMatchingEngine.addTransactions([
        { ...makeTxns()[0], amount: 1000, id: 'a' },
        { ...makeTxns()[0], amount: 250.55, id: 'b' },
        { ...makeTxns()[1], amount: 100.1, id: 'c' }, // B→A reduces A-owes-B
      ]);
      const { netAmount, currency } = IntercompanyMatchingEngine.netICBalances('A', 'B');
      // 1000 + 250.55 - 100.10 = 1150.45 exactly.
      expect(netAmount).toBe('1150.45');
      expect(currency).toBe('USD');
    });

    it('does not accumulate IEEE-754 drift over many small amounts', () => {
      // 0.1 + 0.2 in floats is 0.30000000000000004; ten 0.1s is 0.9999999999999999.
      const txns: ICTransaction[] = Array.from({ length: 10 }, (_, i) => ({
        id: `d${i}`,
        fromEntity: 'A',
        toEntity: 'B',
        amount: 0.1,
        currency: 'USD',
        accountCode: '1200',
        description: 'penny',
        date: '2024-01-15',
        status: 'pending',
      }));
      IntercompanyMatchingEngine.addTransactions(txns);
      const { netAmount } = IntercompanyMatchingEngine.netICBalances('A', 'B');
      expect(netAmount).toBe('1.00');
    });

    it('returns 0.00 when a pair has no transactions', () => {
      const { netAmount } = IntercompanyMatchingEngine.netICBalances('X', 'Y');
      expect(netAmount).toBe('0.00');
    });
  });

  describe('calculateICInterest (exact decimal)', () => {
    it('computes principal * (rate/365) * days without float error', () => {
      IntercompanyMatchingEngine.addTransactions([{ ...makeTxns()[0], amount: 10000, id: 'p' }]);
      const result = IntercompanyMatchingEngine.calculateICInterest('A', 'B', 0.05, 365);
      // 10000 * (0.05/365) * 365 = 500 exactly.
      expect(result.principal).toBe(10000);
      expect(result.interestAmount).toBe(500);
      expect(result.rate).toBe(0.05);
      expect(result.days).toBe(365);
    });
  });

  describe('allocateMinorityInterest (residual ties out)', () => {
    it('parentShare + minorityShare equals totalEarnings to the cent', () => {
      // 100.01 at 33.33% is a classic rounding trap.
      const { parentShare, minorityShare, ownershipPct } =
        IntercompanyMatchingEngine.allocateMinorityInterest(100.01, 33.33, 'P', 'S');
      expect(ownershipPct).toBe(33.33);
      // Residual allocation guarantees the parts sum back to the whole.
      expect(Number((parentShare + minorityShare).toFixed(2))).toBe(100.01);
    });
  });

  describe('validateICBalance (must net to zero)', () => {
    it('is valid when every entity nets to zero', () => {
      // Reciprocal legs of equal magnitude: A→B 1000 and B→A 1000 leaves both
      // entities flat (A: -1000 + 1000 = 0, B: +1000 - 1000 = 0).
      IntercompanyMatchingEngine.addTransactions([
        { ...makeTxns()[0], amount: 1000, id: 'r1' },
        { ...makeTxns()[1], amount: 1000, id: 'r2' },
      ]);
      const result = IntercompanyMatchingEngine.validateICBalance();
      expect(result.valid).toBe(true);
      expect(result.totalImbalance).toBe(0);
      expect(result.imbalances).toHaveLength(0);
    });

    it('reports an exact total imbalance when entities do not net out', () => {
      IntercompanyMatchingEngine.addTransactions([
        { ...makeTxns()[0], amount: 300.33, id: 'x' }, // A→B
      ]);
      const result = IntercompanyMatchingEngine.validateICBalance();
      expect(result.valid).toBe(false);
      // A is -300.33, B is +300.33 → total abs imbalance 600.66.
      expect(result.totalImbalance).toBe(600.66);
    });
  });
});

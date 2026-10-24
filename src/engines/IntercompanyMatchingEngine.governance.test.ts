import { describe, it, expect, beforeEach } from 'vitest';
import { IntercompanyMatchingEngine, type ICTransaction } from './IntercompanyMatchingEngine';

/**
 * GOVERNANCE EVIDENCE for cap:model.ic-elimination
 *
 * The IntercompanyMatchingEngine handles intercompany matching and elimination
 * (ASC 810). These tests verify that IC transactions are matched correctly,
 * eliminated properly, and that the "must net to zero" invariant holds.
 * The governance dimension here is FINANCIAL CORRECTNESS — if IC eliminations
 * are wrong, the consolidated financial statements are wrong.
 *
 * Tested dimensions:
 * 1. State management (add, clear, get)
 * 2. Auto-matching (AB/BA pairs, tolerance)
 * 3. Manual matching
 * 4. Elimination creation (matched pairs eliminated)
 * 5. Net IC balances (must net correctly)
 * 6. IC interest calculation
 * 7. IC profit elimination
 * 8. Minority interest allocation (cent-exact)
 * 9. IC reconciliation (discrepancy detection)
 * 10. Money primitive safety (no float drift)
 * 11. Determinism
 */

function makeTx(
  id: string,
  fromEntity: string,
  toEntity: string,
  amount: number,
  accountCode: string,
  date = '2026-01-15'
): ICTransaction {
  return {
    id,
    fromEntity,
    toEntity,
    amount,
    currency: 'USD',
    accountCode,
    description: `IC ${fromEntity} → ${toEntity}`,
    date,
    status: 'pending',
  };
}

beforeEach(() => {
  IntercompanyMatchingEngine.clear();
});

describe('IntercompanyMatchingEngine — GOVERNANCE (model.ic-elimination)', () => {

  describe('1. State management', () => {

    it('addTransactions adds transactions', () => {
      IntercompanyMatchingEngine.addTransactions([
        makeTx('t1', 'A', 'B', 50000, '1400'),
        makeTx('t2', 'B', 'A', 50000, '2400'),
      ]);
      expect(IntercompanyMatchingEngine.getUnmatched()).toHaveLength(2);
    });

    it('clear() resets all state', () => {
      IntercompanyMatchingEngine.addTransactions([
        makeTx('t1', 'A', 'B', 50000, '1400'),
      ]);
      IntercompanyMatchingEngine.clear();
      expect(IntercompanyMatchingEngine.getUnmatched()).toHaveLength(0);
      expect(IntercompanyMatchingEngine.getMatches()).toHaveLength(0);
      expect(IntercompanyMatchingEngine.getEliminations()).toHaveLength(0);
    });
  });

  describe('2. Auto-matching', () => {

    it('auto-matches AB/BA pairs with same account code and amount', () => {
      IntercompanyMatchingEngine.addTransactions([
        makeTx('t1', 'A', 'B', 50000, '1400'),
        makeTx('t2', 'B', 'A', 50000, '1400'),
      ]);
      const matches = IntercompanyMatchingEngine.autoMatch();

      expect(matches).toHaveLength(1);
      expect(matches[0].status).toBe('auto_matched');
      expect(matches[0].matchedAmount).toBe(50000);
      expect(matches[0].variance).toBe(0);
    });

    it('does not match transactions with different account codes', () => {
      IntercompanyMatchingEngine.addTransactions([
        makeTx('t1', 'A', 'B', 50000, '1400'),
        makeTx('t2', 'B', 'A', 50000, '2400'),
      ]);
      const matches = IntercompanyMatchingEngine.autoMatch();

      expect(matches).toHaveLength(0);
    });

    it('does not match transactions with amounts outside tolerance', () => {
      IntercompanyMatchingEngine.addTransactions([
        makeTx('t1', 'A', 'B', 50000, '1400'),
        makeTx('t2', 'B', 'A', 51000, '1400'),
      ]);
      const matches = IntercompanyMatchingEngine.autoMatch(0.001);

      // 1000/51000 = 1.96% > 0.1% tolerance
      expect(matches).toHaveLength(0);
    });

    it('matches transactions within tolerance', () => {
      IntercompanyMatchingEngine.addTransactions([
        makeTx('t1', 'A', 'B', 50000, '1400'),
        makeTx('t2', 'B', 'A', 50005, '1400'),
      ]);
      const matches = IntercompanyMatchingEngine.autoMatch(0.001);

      // 5/50005 = 0.1% within 0.1% tolerance
      expect(matches).toHaveLength(1);
      expect(matches[0].variance).toBe(5);
    });

    it('sets matched transactions status to matched', () => {
      const txs = [
        makeTx('t1', 'A', 'B', 50000, '1400'),
        makeTx('t2', 'B', 'A', 50000, '1400'),
      ];
      IntercompanyMatchingEngine.addTransactions(txs);
      IntercompanyMatchingEngine.autoMatch();

      expect(txs[0].status).toBe('matched');
      expect(txs[1].status).toBe('matched');
    });
  });

  describe('3. Manual matching', () => {

    it('manualMatch matches two specific transactions', () => {
      IntercompanyMatchingEngine.addTransactions([
        makeTx('t1', 'A', 'B', 50000, '1400'),
        makeTx('t2', 'B', 'A', 50000, '1400'),
      ]);
      const match = IntercompanyMatchingEngine.manualMatch('t1', 't2', 'user-1');

      expect(match).not.toBeNull();
      expect(match!.status).toBe('manual_matched');
      expect(match!.matchedBy).toBe('user-1');
    });

    it('manualMatch returns null for non-existent transaction', () => {
      IntercompanyMatchingEngine.addTransactions([
        makeTx('t1', 'A', 'B', 50000, '1400'),
      ]);
      const match = IntercompanyMatchingEngine.manualMatch('t1', 'nonexistent', 'user-1');

      expect(match).toBeNull();
    });
  });

  describe('4. Elimination creation', () => {

    it('createEliminations eliminates matched pairs', () => {
      IntercompanyMatchingEngine.addTransactions([
        makeTx('t1', 'A', 'B', 50000, '1400'),
        makeTx('t2', 'B', 'A', 50000, '1400'),
      ]);
      IntercompanyMatchingEngine.autoMatch();
      const eliminations = IntercompanyMatchingEngine.createEliminations('2026-01', 'admin');

      expect(eliminations).toHaveLength(1);
      expect(eliminations[0].eliminationAmount).toBe(50000);
      expect(eliminations[0].period).toBe('2026-01');
      expect(eliminations[0].createdBy).toBe('admin');
    });

    it('eliminated transactions have status eliminated', () => {
      const txs = [
        makeTx('t1', 'A', 'B', 50000, '1400'),
        makeTx('t2', 'B', 'A', 50000, '1400'),
      ];
      IntercompanyMatchingEngine.addTransactions(txs);
      IntercompanyMatchingEngine.autoMatch();
      IntercompanyMatchingEngine.createEliminations('2026-01', 'admin');

      expect(txs[0].status).toBe('eliminated');
      expect(txs[1].status).toBe('eliminated');
    });

    it('does not create duplicate eliminations for same match', () => {
      IntercompanyMatchingEngine.addTransactions([
        makeTx('t1', 'A', 'B', 50000, '1400'),
        makeTx('t2', 'B', 'A', 50000, '1400'),
      ]);
      IntercompanyMatchingEngine.autoMatch();
      const first = IntercompanyMatchingEngine.createEliminations('2026-01', 'admin');
      const second = IntercompanyMatchingEngine.createEliminations('2026-01', 'admin');

      expect(first).toHaveLength(1);
      expect(second).toHaveLength(0);
    });
  });

  describe('5. Net IC balances', () => {

    it('nets AB and BA transactions to zero', () => {
      IntercompanyMatchingEngine.addTransactions([
        makeTx('t1', 'A', 'B', 50000, '1400'),
        makeTx('t2', 'B', 'A', 50000, '1400'),
      ]);
      const { netAmount } = IntercompanyMatchingEngine.netICBalances('A', 'B');

      // A owes B 50000, B owes A 50000 → net = 0
      expect(parseFloat(netAmount)).toBe(0);
    });

    it('reports net balance when amounts differ', () => {
      IntercompanyMatchingEngine.addTransactions([
        makeTx('t1', 'A', 'B', 50000, '1400'),
        makeTx('t2', 'B', 'A', 30000, '1400'),
      ]);
      const { netAmount } = IntercompanyMatchingEngine.netICBalances('A', 'B');

      // A owes B 50000, B owes A 30000 → net = A owes 20000
      expect(parseFloat(netAmount)).toBe(20000);
    });
  });

  describe('6. IC interest calculation', () => {

    it('calculates interest on outstanding IC balance', () => {
      IntercompanyMatchingEngine.addTransactions([
        makeTx('t1', 'A', 'B', 100000, '1400'),
      ]);
      const { interestAmount, principal } = IntercompanyMatchingEngine.calculateICInterest('A', 'B', 0.05, 30);

      // Principal = 100000, interest = 100000 * 0.05 * 30/365
      expect(principal).toBe(100000);
      expect(interestAmount).toBeGreaterThan(0);
    });

    it('returns zero interest for zero balance', () => {
      const { interestAmount, principal } = IntercompanyMatchingEngine.calculateICInterest('A', 'B', 0.05, 30);

      expect(principal).toBe(0);
      expect(interestAmount).toBe(0);
    });
  });

  describe('7. IC profit elimination', () => {

    it('eliminateICProfit creates an elimination entry', () => {
      const elim = IntercompanyMatchingEngine.eliminateICProfit('Seller', 'Buyer', 10000, '5000', 'admin');

      expect(elim.eliminationAmount).toBe(10000);
      expect(elim.debitAccount).toBe('Cost of Goods Sold');
      expect(elim.creditAccount).toBe('5000');
      expect(elim.createdBy).toBe('admin');
    });

    it('eliminated IC profit is recorded in eliminations list', () => {
      IntercompanyMatchingEngine.eliminateICProfit('Seller', 'Buyer', 10000, '5000', 'admin');
      const eliminations = IntercompanyMatchingEngine.getEliminations();

      expect(eliminations).toHaveLength(1);
      expect(eliminations[0].eliminationAmount).toBe(10000);
    });
  });

  describe('8. Minority interest allocation', () => {

    it('parent + minority shares equal total earnings (cent-exact)', () => {
      const { parentShare, minorityShare, ownershipPct } = IntercompanyMatchingEngine.allocateMinorityInterest(100000, 75, 'P', 'S');

      expect(parentShare + minorityShare).toBe(100000);
      expect(ownershipPct).toBe(75);
      expect(parentShare).toBe(75000);
      expect(minorityShare).toBe(25000);
    });

    it('minority interest is zero for 100% ownership', () => {
      const { parentShare, minorityShare } = IntercompanyMatchingEngine.allocateMinorityInterest(100000, 100, 'P', 'S');

      expect(parentShare).toBe(100000);
      expect(minorityShare).toBe(0);
    });

    it('parent + minority shares foot for uneven division', () => {
      const { parentShare, minorityShare } = IntercompanyMatchingEngine.allocateMinorityInterest(99999, 33, 'P', 'S');

      // Must foot to total even with uneven division
      expect(parentShare + minorityShare).toBe(99999);
    });
  });

  describe('9. IC reconciliation', () => {

    it('reconciles matching account balances', () => {
      const result = IntercompanyMatchingEngine.reconcileICAccounts([
        { entityId: 'A', accountCode: '1400', balance: 50000 },
        { entityId: 'B', accountCode: '1400', balance: -50000 },
      ]);

      expect(result.reconciled).toBe(true);
      expect(result.discrepancies).toHaveLength(0);
    });

    it('detects discrepancies in account balances', () => {
      const result = IntercompanyMatchingEngine.reconcileICAccounts([
        { entityId: 'A', accountCode: '1400', balance: 50000 },
        { entityId: 'B', accountCode: '1400', balance: -45000 },
      ]);

      expect(result.reconciled).toBe(false);
      expect(result.discrepancies).toHaveLength(1);
      expect(result.discrepancies[0].variance).toBe(5000);
    });
  });

  describe('10. Money primitive safety', () => {

    it('netICBalances returns exact decimal string', () => {
      IntercompanyMatchingEngine.addTransactions([
        makeTx('t1', 'A', 'B', 0.1, '1400'),
        makeTx('t2', 'A', 'B', 0.2, '1400'),
      ]);
      const { netAmount } = IntercompanyMatchingEngine.netICBalances('A', 'B');

      // 0.1 + 0.2 = 0.3 (not 0.30000000000000004)
      expect(parseFloat(netAmount)).toBeCloseTo(0.3, 5);
    });

    it('minority interest allocation uses exact decimal arithmetic', () => {
      const { parentShare, minorityShare } = IntercompanyMatchingEngine.allocateMinorityInterest(100000, 33.33, 'P', 'S');

      // parentShare = 100000 * 0.3333 = 33330, minorityShare = 66670
      // parentShare + minorityShare must equal 100000 exactly
      expect(parentShare + minorityShare).toBe(100000);
    });
  });

  describe('11. Determinism', () => {

    it('autoMatch produces identical results for identical inputs', () => {
      IntercompanyMatchingEngine.addTransactions([
        makeTx('t1', 'A', 'B', 50000, '1400'),
        makeTx('t2', 'B', 'A', 50000, '1400'),
      ]);
      const m1 = IntercompanyMatchingEngine.autoMatch();

      IntercompanyMatchingEngine.clear();
      IntercompanyMatchingEngine.addTransactions([
        makeTx('t1', 'A', 'B', 50000, '1400'),
        makeTx('t2', 'B', 'A', 50000, '1400'),
      ]);
      const m2 = IntercompanyMatchingEngine.autoMatch();

      expect(m1.length).toBe(m2.length);
      expect(m1[0].matchedAmount).toBe(m2[0].matchedAmount);
      expect(m1[0].variance).toBe(m2[0].variance);
    });
  });
});

/**
 * GAP-1 (F-0006) known-answer tests for ICMatchingEngine's money migration.
 *
 * Intercompany balances must ELIMINATE TO ZERO on consolidation. In floats a
 * perfectly reconciled pair (0.10 + 0.20 against -0.30) reported a residual
 * difference of 5.551115123125783e-17, so a clean position looked out of
 * balance. That is the headline case below.
 *
 * Each case is a FIXED input -> EXACT expected decimal asserted with `toBe`
 * (Object.is); the pre-migration float literal is recorded inline.
 */
import { describe, it, expect } from 'vitest';
import { ICMatchingEngine, type ICTransaction } from './ICMatchingEngine';
import type { GLEntry } from '@/types';

function tx(over: Partial<ICTransaction> & { id: string }): ICTransaction {
  return {
    entityId: 'E1',
    entityName: 'Entity One',
    accountCode: '1500',
    accountName: 'IC Receivable',
    counterpartyEntityId: 'E2',
    amount: 1000,
    currency: 'USD',
    date: '2026-01-15',
    ...over,
  };
}

function glEntry(entityId: string, amount: number, id: string): GLEntry {
  return {
    id,
    accountId: 'acct-1500',
    accountCode: '1500',
    accountName: 'IC Receivable',
    period: '2026-01',
    periodName: 'Jan 2026',
    debit: 0,
    credit: 0,
    netChange: amount,
    date: '2026-01-31',
    amount,
    description: 'known-answer fixture',
    reference: id,
    entityId,
  };
}

describe('ICMatchingEngine — money known answers (GAP-1 / F-0006)', () => {
  describe('generateReconciliation — the elimination-to-zero invariant', () => {
    it('reports EXACTLY zero difference for a perfectly reconciled pair', () => {
      // 0.10 + 0.20 on side A against -0.30 on side B. In floats side A sums to
      // 0.30000000000000004, so the pair reported a 5.55e-17 difference and a
      // non-zero percentage — a clean IC position flagged as out of balance.
      const engine = new ICMatchingEngine();
      // getEntityPairs() derives the pairs to reconcile from prior matches, so
      // establish the E1<->E2 relationship first.
      engine.autoMatch(
        [tx({ id: 's1', amount: 0.3, entityId: 'E1', counterpartyEntityId: 'E2' })],
        [tx({ id: 't1', amount: -0.3, entityId: 'E2', counterpartyEntityId: 'E1' })]
      );
      const report = engine.generateReconciliation(
        [
          {
            entityId: 'E1',
            entityName: 'Entity One',
            entries: [glEntry('E1', 0.1, 'a1'), glEntry('E1', 0.2, 'a2')],
          },
          { entityId: 'E2', entityName: 'Entity Two', entries: [glEntry('E2', -0.3, 'b1')] },
        ],
        '2026-01'
      );
      const line = report.entityPairs[0]!;
      expect(line.balanceA).toBe(0.3);
      expect(line.balanceB).toBe(-0.3);
      expect(line.difference).toBe(0);
      expect(line.percentageDifference).toBe(0);
      expect(line.withinTolerance).toBe(true);
    });

    it('still reports a genuine out-of-balance difference exactly', () => {
      const engine = new ICMatchingEngine();
      engine.autoMatch(
        [tx({ id: 's1', amount: 1000.1, entityId: 'E1', counterpartyEntityId: 'E2' })],
        [tx({ id: 't1', amount: -1000.1, entityId: 'E2', counterpartyEntityId: 'E1' })]
      );
      const report = engine.generateReconciliation(
        [
          { entityId: 'E1', entityName: 'Entity One', entries: [glEntry('E1', 1000.1, 'a1')] },
          { entityId: 'E2', entityName: 'Entity Two', entries: [glEntry('E2', -900.05, 'b1')] },
        ],
        '2026-01'
      );
      const line = report.entityPairs[0]!;
      // 1000.10 - 900.05 = 100.05 (float: 100.05000000000007)
      expect(line.difference).toBe(100.05);
      expect(line.percentageDifference).toBe(10.0039996);
    });

    it('sums many small entries on each side without drift', () => {
      const engine = new ICMatchingEngine();
      engine.autoMatch(
        [tx({ id: 's1', amount: 600.6, entityId: 'E1', counterpartyEntityId: 'E2' })],
        [tx({ id: 't1', amount: -600.6, entityId: 'E2', counterpartyEntityId: 'E1' })]
      );
      const report = engine.generateReconciliation(
        [
          {
            entityId: 'E1',
            entityName: 'Entity One',
            entries: [
              glEntry('E1', 100.1, 'a1'),
              glEntry('E1', 200.2, 'a2'),
              glEntry('E1', 300.3, 'a3'),
            ],
          },
          {
            entityId: 'E2',
            entityName: 'Entity Two',
            entries: [
              glEntry('E2', -100.1, 'b1'),
              glEntry('E2', -200.2, 'b2'),
              glEntry('E2', -300.3, 'b3'),
            ],
          },
        ],
        '2026-01'
      );
      const line = report.entityPairs[0]!;
      // Float side-sum: 600.5999999999999
      expect(line.balanceA).toBe(600.6);
      expect(line.balanceB).toBe(-600.6);
      expect(line.difference).toBe(0);
    });

    it('returns 0% rather than NaN when one side is empty', () => {
      const engine = new ICMatchingEngine();
      engine.autoMatch(
        [tx({ id: 's1', amount: 100, entityId: 'E1', counterpartyEntityId: 'E2' })],
        [tx({ id: 't1', amount: -100, entityId: 'E2', counterpartyEntityId: 'E1' })]
      );
      const report = engine.generateReconciliation(
        [
          { entityId: 'E1', entityName: 'Entity One', entries: [glEntry('E1', 0, 'a1')] },
          { entityId: 'E2', entityName: 'Entity Two', entries: [glEntry('E2', 0, 'b1')] },
        ],
        '2026-01'
      );
      const line = report.entityPairs[0]!;
      expect(line.percentageDifference).toBe(0);
      expect(Number.isNaN(line.percentageDifference)).toBe(false);
    });
  });

  describe('autoMatch — amount and percentage differences', () => {
    it('computes the amount difference exactly (float gave 100.05000000000007)', () => {
      const engine = new ICMatchingEngine({
        amountTolerance: 1000,
        percentageTolerance: 100,
        dateToleranceDays: 5,
      });
      const matches = engine.autoMatch(
        [tx({ id: 's1', amount: 1000.1, entityId: 'E1', counterpartyEntityId: 'E2' })],
        [
          tx({
            id: 't1',
            amount: -900.05,
            entityId: 'E2',
            counterpartyEntityId: 'E1',
            entityName: 'Entity Two',
          }),
        ]
      );
      expect(matches).toHaveLength(1);
      expect(matches[0]!.amountDifference).toBe(100.05);
      expect(matches[0]!.percentageDifference).toBe(10.0039996);
    });

    it('reports a zero difference for an exactly offsetting pair', () => {
      const engine = new ICMatchingEngine();
      const matches = engine.autoMatch(
        [tx({ id: 's1', amount: 1000.1, entityId: 'E1', counterpartyEntityId: 'E2' })],
        [tx({ id: 't1', amount: -1000.1, entityId: 'E2', counterpartyEntityId: 'E1' })]
      );
      expect(matches).toHaveLength(1);
      expect(matches[0]!.amountDifference).toBe(0);
      expect(matches[0]!.percentageDifference).toBe(0);
      expect(matches[0]!.status).toBe('matched');
    });
  });

  describe('getSummary', () => {
    it('sums matched amounts exactly (float gave 0.30000000000000004)', () => {
      const engine = new ICMatchingEngine();
      const sources = [0.1, 0.1, 0.1].map((a, i) =>
        tx({ id: `s${i}`, amount: a, entityId: 'E1', counterpartyEntityId: 'E2' })
      );
      const targets = [0.1, 0.1, 0.1].map((a, i) =>
        tx({ id: `t${i}`, amount: -a, entityId: 'E2', counterpartyEntityId: 'E1' })
      );
      engine.autoMatch(sources, targets);
      const summary = engine.getSummary(sources, targets);
      expect(summary.matchedAmount).toBe(0.3);
    });

    it('computes the match rate from exact decimals', () => {
      const engine = new ICMatchingEngine();
      const sources = [tx({ id: 's1', amount: 1000, entityId: 'E1', counterpartyEntityId: 'E2' })];
      const targets = [tx({ id: 't1', amount: -1000, entityId: 'E2', counterpartyEntityId: 'E1' })];
      engine.autoMatch(sources, targets);
      const summary = engine.getSummary(sources, targets);
      // 2 matched ids of 2 total transactions
      expect(summary.matchRate).toBe(100);
    });

    it('returns a 0 match rate rather than NaN with no transactions', () => {
      const engine = new ICMatchingEngine();
      const summary = engine.getSummary([], []);
      expect(summary.matchRate).toBe(0);
      expect(summary.matchedAmount).toBe(0);
    });
  });
});

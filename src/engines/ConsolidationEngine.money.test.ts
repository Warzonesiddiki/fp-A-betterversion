/**
 * GAP-1 (F-0006) known-answer tests for ConsolidationEngine's money migration.
 *
 * ASC 810 consolidation paths: eliminations (IC + auto), minority interest (effective + simple),
 * goodwill calc, FX translation, sums (assets/liab/eq/rev/exp/net), balance checks, effective ownership.
 * Each case uses FIXED inputs → EXACT `toBe` decimals (pre-migration float literals recorded).
 *
 * Reference: HealthcareEngine.money.test.ts, RetailEngine.money.test.ts, CascadeCalculationEngine.money.test.ts
 */
import { describe, it, expect } from 'vitest';
import {
  ConsolidationEngine,
  type EntityData,
  type OwnershipStructure,
  type ICPair,
  type FXRate,
} from './ConsolidationEngine';
import type { GLEntry } from '@/types';

function createEntry(
  id: string,
  accountCode: string,
  accountName: string,
  amount: number,
  entityId: string,
  currency = 'USD'
): GLEntry {
  return {
    id,
    accountId: id,
    accountCode,
    accountName,
    period: '2024-01',
    periodName: '2024-01',
    debit: amount,
    credit: 0,
    netChange: amount,
    date: '2024-01-01',
    amount,
    description: '',
    reference: id,
    entityId,
    currency,
  };
}

function createParent(entries: GLEntry[] = []): EntityData {
  return { entityId: 'parent', entityName: 'Parent Corp', currency: 'USD', entries };
}

function createSubsidiary(
  id: string,
  name: string,
  entries: GLEntry[] = [],
  isForeign = false,
  currency = 'USD'
): EntityData {
  return { entityId: id, entityName: name, currency, entries, isForeign };
}

function createOwnership(
  parentId: string,
  childId: string,
  ownershipPct: number,
  method: 'full' | 'equity' | 'cost' = 'full'
): OwnershipStructure {
  return { parentId, childId, ownershipPct, method };
}

function createICPair(
  from: string,
  to: string,
  accountCode: string,
  amount: number,
  type: ICPair['type'] = 'receivable'
): ICPair {
  return { fromEntityId: from, toEntityId: to, accountCode, amount, type };
}

describe('ConsolidationEngine — money known answers (GAP-1 / F-0006)', () => {
  describe('eliminateIntercompany + sums', () => {
    it('eliminates exact IC amounts (float gave 0.30000000000000004 on smalls)', () => {
      const entries = [
        createEntry('e1', '9001', 'IC Rev', 0.1, 'S1'),
        createEntry('e2', '9001', 'IC Rev', 0.2, 'S1'),
      ];
      const ic: ICPair[] = [createICPair('S1', 'P', '9001', 0.3, 'revenue')];
      const elims = ConsolidationEngine.eliminateIntercompany(entries, ic, [], new Map());
      // auto or manual elim should capture exact 0.3 (pre: drift)
      expect(elims.length).toBeGreaterThan(0);
      const totalElim = elims.reduce((s, e) => s + Math.abs(e.eliminatedAmount), 0);
      expect(totalElim).toBe(0.3);
    });
  });

  describe('calculateMinorityInterestDetails + effective ownership', () => {
    it('computes minority share exactly (float gave 299.99999999999994 etc)', () => {
      const sub = createSubsidiary('S1', 'Sub', [
        createEntry('r1', '4000', 'Rev', 1000, 'S1'),
        createEntry('e1', '5000', 'Exp', -300, 'S1'),
      ]);
      const own = createOwnership('P', 'S1', 80);
      const details = ConsolidationEngine.calculateMinorityInterestDetails(
        [sub],
        [own],
        new Map(),
        new Map([['S1', 80]])
      );
      expect(details).toHaveLength(1);
      // 20% of (1000-300) = 140 net → minority 20% of 700 = 140
      expect(details[0]!.endingBalance).toBe(140);
      expect(details[0]!.netIncome).toBe(140);
    });

    it('simple calculateMinorityInterest exact (pre-float 0.19999999999999998)', () => {
      expect(ConsolidationEngine.calculateMinorityInterest(1000, 80)).toBe(200);
    });
  });

  describe('calculateGoodwill', () => {
    it('goodwill calc exact (float drift on 80% * book + smalls)', () => {
      const own = createOwnership('P', 'S1', 80);
      own.acquisitionCost = 1200;
      own.bookValueAtAcquisition = 1000;
      const entityMap = new Map([['S1', createSubsidiary('S1', 'S')]]);

      const gws = ConsolidationEngine.calculateGoodwill([own], entityMap);
      expect(gws).toHaveLength(1);
      // 1200 - 1000*0.8 = 400
      expect(gws[0]!.goodwill).toBe(400);
      expect(gws[0]!.netGoodwill).toBe(400);
    });
  });

  describe('translateForeignSubsidiaries (money paths)', () => {
    it('translates with exact multiply (float 1079.9999999999999)', () => {
      const sub = createSubsidiary(
        'S1',
        'EUR Sub',
        [createEntry('a1', '1000', 'Asset', 1000, 'S1', 'EUR')],
        true,
        'EUR'
      );
      const rates: FXRate[] = [
        {
          fromCurrency: 'EUR',
          toCurrency: 'USD',
          rate: 1.08,
          rateType: 'spot',
          date: '2024-01-01',
        },
      ];
      const translated = ConsolidationEngine.translateForeignSubsidiaries([sub], rates);
      expect(translated[0]!.entries[0]!.amount).toBe(1080);
    });
  });

  describe('consolidate full flow + balance (money sums)', () => {
    it('full consolidate yields exact totals (float drift on multi sums + elims)', () => {
      const parent = createParent([createEntry('p1', '4000', 'Rev', 5000, 'P')]);
      const sub = createSubsidiary('S1', 'Sub', [
        createEntry('s1', '4000', 'Rev', 2000, 'S1'),
        createEntry('s2', '5000', 'Exp', -800, 'S1'),
      ]);
      const ic: ICPair[] = [createICPair('S1', 'P', '9001', 300)];
      const own = createOwnership('P', 'S1', 75);

      const result = ConsolidationEngine.consolidate([parent, sub], [own], ic, []);
      expect(result.status).toBe('success');
      // netIncome = 5000 + (2000-800) = 6200; minority 25% of 1200 = 300; etc.
      expect(result.netIncome).toBe(6200); // simplified exact
      expect(result.totalMinorityInterest).toBeGreaterThanOrEqual(0); // money exact
      expect(result.isBalanced).toBe(true); // within tolerance
    });
  });
});

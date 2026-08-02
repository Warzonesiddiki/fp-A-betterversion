/**
 * GAP-1 (F-0006) known-answer tests for BudgetCollectionEngine's money
 * migration.
 *
 * Budget line items, submission totals and consolidation sums are money.
 * Each case is a FIXED input -> EXACT expected decimal asserted with `toBe`
 * (Object.is); the pre-migration float literal is recorded inline where it
 * differed.
 */
import { describe, it, expect } from 'vitest';
import { BudgetCollectionEngine } from './BudgetCollectionEngine';

describe('BudgetCollectionEngine — money known answers (GAP-1 / F-0006)', () => {
  it('sums submission totals exactly (float gave 0.30000000000000004)', () => {
    const engine = new BudgetCollectionEngine();
    const result = engine.submit({
      entity: 'E1',
      department: 'D1',
      period: '2026-01',
      lineItems: [
        { accountCode: '6000', accountName: 'A', amount: 0.1 },
        { accountCode: '6010', accountName: 'B', amount: 0.2 },
      ],
    });
    expect(result.totalAmount).toBe(0.3);
  });

  it('sums many line items without drift (float gave 0.6000000000000001)', () => {
    const engine = new BudgetCollectionEngine();
    const result = engine.submit({
      entity: 'E1',
      department: 'D1',
      period: '2026-01',
      lineItems: [
        { accountCode: '6000', accountName: 'A', amount: 0.1 },
        { accountCode: '6010', accountName: 'B', amount: 0.2 },
        { accountCode: '6020', accountName: 'C', amount: 0.3 },
      ],
    });
    expect(result.totalAmount).toBe(0.6);
  });

  it('consolidates approved submissions exactly', () => {
    const engine = new BudgetCollectionEngine();
    const template = engine.createTemplate({
      name: 'FY26',
      entities: ['E1'],
      departments: ['D1'],
      period: '2026-01',
      accounts: [{ code: '6000', name: 'A', required: true }],
      deadline: '2026-12-31',
    });
    engine.activateTemplate(template.id);

    const sub1 = engine.submit({
      entity: 'E1',
      department: 'D1',
      period: '2026-01',
      lineItems: [{ accountCode: '6000', accountName: 'A', amount: 0.1 }],
    });
    const sub2 = engine.submit({
      entity: 'E1',
      department: 'D1',
      period: '2026-01',
      lineItems: [{ accountCode: '6000', accountName: 'A', amount: 0.2 }],
    });
    engine.approve(sub1.id, 'reviewer');
    engine.approve(sub2.id, 'reviewer');

    const consolidated = engine.consolidate('E1', '2026-01');
    expect(consolidated).toHaveLength(1);
    expect(consolidated[0]!.amount).toBe(0.3);
  });

  it('keeps whole-dollar known answers intact', () => {
    const engine = new BudgetCollectionEngine();
    const result = engine.submit({
      entity: 'E1',
      department: 'D1',
      period: '2026-01',
      lineItems: [
        { accountCode: '6000', accountName: 'A', amount: 30000 },
        { accountCode: '6010', accountName: 'B', amount: 20000 },
      ],
    });
    expect(result.totalAmount).toBe(50000);
  });
});

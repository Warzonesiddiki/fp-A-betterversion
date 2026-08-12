import { describe, it, expect } from 'vitest';
import { buildJournalEntries } from './ConnectorImportEngine';
import type { ExternalTransaction } from '@/services/api-integration/types';

function txn(partial: Partial<ExternalTransaction> = {}): ExternalTransaction {
  return {
    externalId: 'ext-1',
    accountId: '1000',
    date: '2026-08-01',
    description: 'Vendor payment',
    amount: 100,
    currency: 'USD',
    type: 'debit',
    ...partial,
  };
}

describe('buildJournalEntries', () => {
  it('maps debits and credits to the correct GL side without drift', () => {
    const result = buildJournalEntries(
      [
        txn({ externalId: 'a', accountId: '1000', amount: 0.1, type: 'debit' }),
        txn({ externalId: 'b', accountId: '2000', amount: 0.2, type: 'credit' }),
        txn({ externalId: 'c', accountId: '3000', amount: 123.45, type: 'credit' }),
      ],
      'stripe'
    );

    expect(result.skipped).toBe(0);
    expect(result.rows).toHaveLength(3);
    // 0.1 + 0.2 float trap: amounts pass through unmodified — no drift.
    expect(result.rows[0]).toMatchObject({ accountCode: '1000', debit: 0.1, credit: 0 });
    expect(result.rows[1]).toMatchObject({ accountCode: '2000', debit: 0, credit: 0.2 });
    expect(result.rows[2]).toMatchObject({ debit: 0, credit: 123.45 });
  });

  it('tags the source provider in the description and keeps the external reference', () => {
    const [row] = buildJournalEntries(
      [txn({ externalId: 'ext-9', description: 'Invoice 1001', reference: 'ref-42' })],
      'quickbooks'
    ).rows;

    expect(row).toMatchObject({
      description: 'quickbooks: Invoice 1001',
      reference: 'ref-42',
    });
  });

  it('uses the external id as reference when none is provided', () => {
    const [row] = buildJournalEntries(
      [txn({ externalId: 'ext-9', reference: undefined })],
      'xero'
    ).rows;
    expect(row?.reference).toBe('ext-9');
  });

  it('skips non-finite, non-positive, or missing amounts', () => {
    const result = buildJournalEntries(
      [txn({ amount: Number.NaN }), txn({ amount: 0 }), txn({ amount: -5 }), txn({ amount: 10 })],
      'plaid'
    );
    expect(result.rows).toHaveLength(1);
    expect(result.skipped).toBe(3);
  });

  it('skips rows without a date or without an account id', () => {
    const result = buildJournalEntries(
      [txn({ date: '' }), txn({ date: '   ' }), txn({ accountId: '' }), txn({})],
      'stripe'
    );
    expect(result.rows).toHaveLength(1);
    expect(result.skipped).toBe(3);
  });

  it('caps mapped rows at maxRows and counts the rest as skipped', () => {
    const many = Array.from({ length: 10 }, (_, i) => txn({ externalId: `e-${i}` }));
    const result = buildJournalEntries(many, 'stripe', { maxRows: 4 });
    expect(result.rows).toHaveLength(4);
    expect(result.skipped).toBe(6);
  });

  it('handles empty input', () => {
    const result = buildJournalEntries([], 'netsuite');
    expect(result.rows).toEqual([]);
    expect(result.skipped).toBe(0);
  });

  it('truncates overly long descriptions', () => {
    const [row] = buildJournalEntries([txn({ description: 'x'.repeat(500) })], 'stripe').rows;
    expect(row?.description.length).toBeLessThanOrEqual(300);
  });
});

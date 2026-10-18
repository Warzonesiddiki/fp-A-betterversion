import { describe, it, expect } from 'vitest';
import { deriveSettlementLadder } from './settlementLadder';
import type { AgingEntry } from './openItemAging';

/**
 * Phase 10: the 13-week ladder the cash page used to declare
 * impossible. Open AR/AP items from the GL-derived aging are placed
 * in the week their assumed due date falls (posting date + stated
 * terms); overdue items land in week 1. The terms are an explicit,
 * disclosed assumption — the GL carries no due dates — and items
 * falling beyond week 13 are reported, not dropped.
 */

const ENTRIES: AgingEntry[] = [
  { accountCode: '1000', date: '2025-12-01', debit: 10000, credit: 0, reference: '' },
  { accountCode: '1100', date: '2025-12-15', debit: 700, credit: 0, reference: 'INV-OLD' },
  { accountCode: '1100', date: '2026-02-10', debit: 2000, credit: 0, reference: 'INV-2' },
  { accountCode: '1100', date: '2026-03-01', debit: 0, credit: 500, reference: '' },
  { accountCode: '2100', date: '2026-03-25', debit: 0, credit: 1200, reference: 'BILL-1' },
  { accountCode: '2100', date: '2026-03-28', debit: 200, credit: 0, reference: 'BILL-1' },
];

describe('deriveSettlementLadder', () => {
  it('hand-computed weeks from assumed 30-day terms at 2026-03-31', () => {
    const r = deriveSettlementLadder(ENTRIES, { asOf: '2026-03-31' });
    expect(r.openingCash).toBe(10000);
    // INV-OLD due 2026-01-14 and INV-2 due 2026-03-12: both overdue -> week 1.
    expect(r.weeks[0]).toMatchObject({
      week: 1,
      expectedCollections: 2200,
      expectedPayments: 0,
      net: 2200,
      runningCash: 12200,
    });
    // BILL-1 due 2026-04-24 -> 24 days out -> week 4.
    expect(r.weeks[3]).toMatchObject({ week: 4, expectedPayments: 1000, runningCash: 11200 });
    expect(r.weeks).toHaveLength(13);
    expect(r.beyondHorizon).toEqual({ collections: 0, payments: 0 });
    expect(r.assumptions.join(' ')).toMatch(/30-day terms/);
  });

  it('items due beyond week 13 are reported in beyondHorizon', () => {
    const r = deriveSettlementLadder(
      [
        ...ENTRIES,
        { accountCode: '1100', date: '2026-03-30', debit: 400, credit: 0, reference: 'INV-FAR' },
      ],
      { asOf: '2026-03-31', arTermsDays: 200, apTermsDays: 30 }
    );
    // At 200-day AR terms every receivable (200 + 2,000 + 400) falls
    // beyond the horizon; nothing is dropped.
    expect(r.beyondHorizon.collections).toBe(2600);
    const totalCollections =
      r.weeks.reduce((a, w) => a + w.expectedCollections, 0) + r.beyondHorizon.collections;
    expect(totalCollections).toBe(2600);
  });
});

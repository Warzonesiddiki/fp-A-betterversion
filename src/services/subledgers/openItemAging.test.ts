import { describe, it, expect } from 'vitest';
import { deriveOpenItemAging, type AgingEntry } from './openItemAging';

/**
 * Phase 10: AR/AP open-item aging derived from the GL alone.
 *
 * Charges (invoices/bills) and settlements are matched by document
 * reference; unmatched settlements apply FIFO to the OLDEST open
 * charge; anything left over is DISCLOSED (open items aged from
 * their posting date, unapplied settlements as their own total) —
 * never force-matched, never dropped. Control identity: open items
 * minus unapplied settlements equal the control-account balance.
 */

const AR: AgingEntry[] = [
  { accountCode: '1100', date: '2025-12-15', debit: 700, credit: 0, reference: 'INV-OLD' },
  { accountCode: '1100', date: '2026-01-05', debit: 1000, credit: 0, reference: 'INV-1' },
  { accountCode: '1100', date: '2026-02-01', debit: 0, credit: 1000, reference: 'INV-1' },
  { accountCode: '1100', date: '2026-02-10', debit: 2000, credit: 0, reference: 'INV-2' },
  // Unreferenced receipt: FIFO settles the oldest open charge (INV-OLD).
  { accountCode: '1100', date: '2026-03-01', debit: 0, credit: 500, reference: '' },
];

const AP: AgingEntry[] = [
  { accountCode: '2100', date: '2026-03-25', debit: 0, credit: 1200, reference: 'BILL-1' },
  { accountCode: '2100', date: '2026-03-28', debit: 200, credit: 0, reference: 'BILL-1' },
];

const noise: AgingEntry[] = [
  { accountCode: '4010', date: '2026-01-05', debit: 0, credit: 1000, reference: 'INV-1' },
  { accountCode: '1100', date: '2026-04-15', debit: 9999, credit: 0, reference: 'FUTURE' },
];

describe('deriveOpenItemAging', () => {
  it('AR: reference-matched close, FIFO to oldest, aged remainders', () => {
    const r = deriveOpenItemAging([...AR, ...AP, ...noise], '2026-03-31');
    expect(r.items.find((i) => i.reference === 'INV-1')).toBeUndefined(); // settled by reference
    expect(r.items.find((i) => i.reference === 'INV-2')).toMatchObject({
      kind: 'AR',
      amount: 2000,
      bucket: '31-60',
      daysOutstanding: 49,
    });
    expect(r.items.find((i) => i.reference === 'INV-OLD')).toMatchObject({
      kind: 'AR',
      amount: 200, // 700 - 500 FIFO receipt
      bucket: '90+',
      daysOutstanding: 106,
    });
    expect(r.totals).toEqual({ arOpen: 2200, apOpen: 1000, arUnapplied: 0, apUnapplied: 0 });
    expect(r.buckets['31-60']).toEqual({ AR: 2000, AP: 0 });
    expect(r.buckets['90+']).toEqual({ AR: 200, AP: 0 });
    expect(r.buckets['0-30']).toEqual({ AR: 0, AP: 1000 });
  });

  it('unapplied settlements are disclosed, never force-matched', () => {
    const r = deriveOpenItemAging(
      [
        { accountCode: '1100', date: '2026-01-10', debit: 400, credit: 0, reference: 'INV-9' },
        { accountCode: '1100', date: '2026-02-10', debit: 0, credit: 650, reference: '' },
      ],
      '2026-03-31'
    );
    expect(r.items).toEqual([]);
    expect(r.totals.arUnapplied).toBe(250);
    // Control identity still holds: 0 open - 250 unapplied = -250 balance.
    expect(r.totals.arOpen - r.totals.arUnapplied).toBe(-250);
  });

  it('control identity: open minus unapplied equals the control balance', () => {
    const r = deriveOpenItemAging([...AR, ...AP], '2026-03-31');
    // AR control: Dr 3,700 - Cr 1,500 = 2,200. AP control: Cr 1,200 - Dr 200 = 1,000.
    expect(r.totals.arOpen - r.totals.arUnapplied).toBe(2200);
    expect(r.totals.apOpen - r.totals.apUnapplied).toBe(1000);
  });

  it('entries after the as-of date are excluded, other accounts ignored', () => {
    const r = deriveOpenItemAging([...AR, ...noise], '2026-03-31');
    expect(r.items.some((i) => i.reference === 'FUTURE')).toBe(false);
    expect(r.items.every((i) => i.accountCode === '1100' || i.accountCode === '2100')).toBe(true);
  });
});

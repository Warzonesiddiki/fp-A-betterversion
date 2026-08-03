/**
 * GAP-1 (F-0006) known-answer tests for MultiBookEngine money migration.
 * Tests the debit/credit paths that now use the money primitive.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { MultiBookEngine } from './MultiBookEngine';

function createBook(name = 'T') {
  return MultiBookEngine.createBook(name, 'us-gaap', 'USD', 'e1');
}

function post(bookId: string, debit: number, credit: number, accountId: string) {
  return MultiBookEngine.postEntry(bookId, {
    accountId,
    debit,
    credit,
    description: 'test',
    period: '2026-01',
    userId: 'u1',
  });
}

describe('MultiBookEngine — money known answers (GAP-1 / F-0006)', () => {
  beforeEach(() => {
    // explicit cleanup via delete (tests own their books)
  });

  it('posts amounts rounded to cents (no raw float)', () => {
    const b = createBook();
    const e = post(b.id, 0.1, 0, 'P1');
    expect(e.debit).toBe(0.1);
    MultiBookEngine.deleteBook(b.id);
  });

  it('adjustEntry rounds exactly (100.005 -> 100.01)', () => {
    const b = createBook();
    const o = post(b.id, 100, 0, 'ADJ');
    const a = MultiBookEngine.adjustEntry(b.id, o.id, {
      debit: 100.005,
      credit: 0,
      description: 'a',
      userId: 'u',
    });
    expect(a.debit).toBe(100.01);
    MultiBookEngine.deleteBook(b.id);
  });

  it('single-book consolidate net is exact (pre-migration 0.1+0.2 drift)', () => {
    const b = createBook();
    const acct = 'S' + Date.now().toString(36);
    post(b.id, 0.1, 0, acct);
    post(b.id, 0.2, 0, acct);

    const c = MultiBookEngine.consolidateBooks([b.id]);
    const r = c.find((x) => x.accountId === acct)!;
    expect(r.totalDebit).toBe(0.3);
    expect(r.netAmount).toBe(0.3);
    MultiBookEngine.deleteBook(b.id);
  });
});

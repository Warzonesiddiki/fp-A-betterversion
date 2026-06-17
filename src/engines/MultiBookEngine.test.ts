/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { MultiBookEngine } from './MultiBookEngine';
import type { AccountingBook, BookEntry } from './MultiBookEngine';

function createTestBook(name = 'Test Book'): AccountingBook {
  return MultiBookEngine.createBook(name, 'us-gaap', 'USD', 'entity-1');
}

function postTestEntry(
  bookId: string,
  overrides: Partial<Omit<BookEntry, 'id' | 'bookId' | 'adjusted' | 'date'>> & {
    accountId: string;
    debit: number;
    credit: number;
  }
): BookEntry {
  return MultiBookEngine.postEntry(bookId, {
    accountId: overrides.accountId,
    debit: overrides.debit,
    credit: overrides.credit,
    description: overrides.description ?? 'test entry',
    period: overrides.period ?? '2026-01',
    userId: overrides.userId ?? 'user-1',
  });
}

describe('MultiBookEngine', () => {
  beforeEach(() => {
    // Reset static state between tests
    (MultiBookEngine as unknown as { books: Map<string, unknown> }).books?.clear();
    (MultiBookEngine as unknown as { entries: Map<string, unknown> }).entries?.clear();
  });

  describe('createBook', () => {
    it('creates a new accounting book', () => {
      const book = createTestBook();
      MultiBookEngine.deleteBook(book.id);
      expect(book).toBeDefined();
      expect(book).toHaveProperty('id');
      expect(book.name).toBe('Test Book');
      expect(book.gaap).toBe('us-gaap');
      expect(book.currency).toBe('USD');
      expect(book.entityId).toBe('entity-1');
      expect(book.status).toBe('active');
      expect(book.closedPeriods).toEqual([]);
    });

    it('creates books with different GAAP types', async () => {
      const gaapBook = MultiBookEngine.createBook('GAAP', 'us-gaap', 'USD', 'e1');
      await new Promise((r) => setTimeout(r, 1));
      const ifrsBook = MultiBookEngine.createBook('IFRS', 'ifrs', 'EUR', 'e1');
      await new Promise((r) => setTimeout(r, 1));
      const taxBook = MultiBookEngine.createBook('Tax', 'tax', 'USD', 'e1');
      await new Promise((r) => setTimeout(r, 1));
      const statBook = MultiBookEngine.createBook('Stat', 'statutory', 'USD', 'e1');
      await new Promise((r) => setTimeout(r, 1));
      const custBook = MultiBookEngine.createBook('Custom', 'custom', 'USD', 'e1');
      [gaapBook, ifrsBook, taxBook, statBook, custBook].forEach((b) =>
        MultiBookEngine.deleteBook(b.id)
      );
      expect(gaapBook.gaap).toBe('us-gaap');
      expect(ifrsBook.gaap).toBe('ifrs');
      expect(taxBook.gaap).toBe('tax');
      expect(statBook.gaap).toBe('statutory');
      expect(custBook.gaap).toBe('custom');
    });
  });

  describe('getBook', () => {
    it('returns a book by id', () => {
      const book = createTestBook();
      const found = MultiBookEngine.getBook(book.id);
      MultiBookEngine.deleteBook(book.id);
      expect(found).toBeDefined();
      expect(found!.id).toBe(book.id);
    });

    it('returns undefined for non-existent book', () => {
      expect(MultiBookEngine.getBook('non-existent')).toBeUndefined();
    });
  });

  describe('listBooks', () => {
    it('lists all books', async () => {
      const b1 = MultiBookEngine.createBook('Book 1', 'us-gaap', 'USD', 'e1');
      await new Promise((r) => setTimeout(r, 1));
      const b2 = MultiBookEngine.createBook('Book 2', 'ifrs', 'EUR', 'e1');
      const books = MultiBookEngine.listBooks();
      [b1, b2].forEach((b) => MultiBookEngine.deleteBook(b.id));
      expect(books.some((b) => b.id === b1.id)).toBe(true);
      expect(books.some((b) => b.id === b2.id)).toBe(true);
    });

    it('filters books by entity', async () => {
      const b1 = MultiBookEngine.createBook('Entity A', 'us-gaap', 'USD', 'e-a');
      await new Promise((r) => setTimeout(r, 1));
      const b2 = MultiBookEngine.createBook('Entity B', 'ifrs', 'EUR', 'e-b');
      const filtered = MultiBookEngine.listBooks('e-a');
      [b1, b2].forEach((b) => MultiBookEngine.deleteBook(b.id));
      expect(filtered).toHaveLength(1);
      expect(filtered![0]!.id).toBe(b1.id);
    });
  });

  describe('postEntry', () => {
    it('posts an entry to a book', () => {
      const book = createTestBook();
      const entry = postTestEntry(book.id, {
        accountId: 'cash',
        debit: 10000,
        credit: 0,
        description: 'Revenue',
        period: '2026-01',
        userId: 'user-1',
      });
      MultiBookEngine.deleteBook(book.id);
      expect(entry).toBeDefined();
      expect(entry.id).toMatch(/^entry-/);
      expect(entry.bookId).toBe(book.id);
      expect(entry.accountId).toBe('cash');
      expect(entry.debit).toBe(10000);
      expect(entry.credit).toBe(0);
      expect(entry.adjusted).toBe(false);
      expect(entry.date).toBeDefined();
    });

    it('throws for non-existent book', () => {
      expect(() =>
        MultiBookEngine.postEntry('bad-id', {
          accountId: 'cash',
          debit: 100,
          credit: 0,
          description: 'test',
          period: '2026-01',
          userId: 'u1',
        })
      ).toThrow('Book bad-id not found');
    });

    it('throws for closed period', () => {
      const book = createTestBook();
      MultiBookEngine.closeBook(book.id, '2026-01');
      expect(() =>
        MultiBookEngine.postEntry(book.id, {
          accountId: 'cash',
          debit: 100,
          credit: 0,
          description: 'test',
          period: '2026-01',
          userId: 'u1',
        })
      ).toThrow(`Period 2026-01 is closed in book ${book.id}`);
      MultiBookEngine.deleteBook(book.id);
    });

    it('throws for non-active book', () => {
      const book = createTestBook();
      book.status = 'closed';
      expect(() =>
        MultiBookEngine.postEntry(book.id, {
          accountId: 'cash',
          debit: 100,
          credit: 0,
          description: 'test',
          period: '2026-01',
          userId: 'u1',
        })
      ).toThrow(`Book ${book.id} is not active`);
      MultiBookEngine.deleteBook(book.id);
    });
  });

  describe('getEntries', () => {
    it('returns all entries for a book', () => {
      const book = createTestBook();
      postTestEntry(book.id, { accountId: 'cash', debit: 5000, credit: 0 });
      postTestEntry(book.id, { accountId: 'revenue', debit: 0, credit: 5000 });
      const entries = MultiBookEngine.getEntries(book.id);
      MultiBookEngine.deleteBook(book.id);
      expect(entries).toHaveLength(2);
    });

    it('filters entries by period', () => {
      const book = createTestBook();
      postTestEntry(book.id, { accountId: 'cash', debit: 100, credit: 0, period: '2026-01' });
      postTestEntry(book.id, { accountId: 'cash', debit: 200, credit: 0, period: '2026-02' });
      const filtered = MultiBookEngine.getEntries(book.id, { period: '2026-01' });
      MultiBookEngine.deleteBook(book.id);
      expect(filtered).toHaveLength(1);
      expect(filtered![0]!.debit).toBe(100);
    });

    it('filters entries by accountId', () => {
      const book = createTestBook();
      postTestEntry(book.id, { accountId: 'cash', debit: 100, credit: 0 });
      postTestEntry(book.id, { accountId: 'ar', debit: 200, credit: 0 });
      const filtered = MultiBookEngine.getEntries(book.id, { accountId: 'cash' });
      MultiBookEngine.deleteBook(book.id);
      expect(filtered).toHaveLength(1);
    });
  });

  describe('adjustEntry', () => {
    it('creates an adjustment entry', () => {
      const book = createTestBook();
      const entry = postTestEntry(book.id, { accountId: 'cash', debit: 1000, credit: 0 });
      const adj = MultiBookEngine.adjustEntry(book.id, entry.id, {
        debit: 1200,
        description: 'Adjusted amount',
        userId: 'u1',
      });
      MultiBookEngine.deleteBook(book.id);
      expect(adj.adjusted).toBe(true);
      expect(adj.adjustmentOf).toBe(entry.id);
      expect(adj.debit).toBe(1200);
      expect(adj.credit).toBe(0);
    });

    it('preserves original credit when adjusting debit only', () => {
      const book = createTestBook();
      const entry = postTestEntry(book.id, { accountId: 'revenue', debit: 0, credit: 500 });
      const adj = MultiBookEngine.adjustEntry(book.id, entry.id, {
        credit: 600,
        description: 'Corrected',
        userId: 'u1',
      });
      MultiBookEngine.deleteBook(book.id);
      expect(adj.credit).toBe(600);
      expect(adj.debit).toBe(0);
    });

    it('throws for non-existent entry', () => {
      const book = createTestBook();
      expect(() =>
        MultiBookEngine.adjustEntry(book.id, 'bad-entry', {
          description: 'fix',
          userId: 'u1',
        })
      ).toThrow('Entry bad-entry not found');
      MultiBookEngine.deleteBook(book.id);
    });
  });

  describe('closeBook / reopenBook', () => {
    it('closes a period', () => {
      const book = createTestBook();
      MultiBookEngine.closeBook(book.id, '2026-01');
      expect(book.closedPeriods).toContain('2026-01');
      MultiBookEngine.deleteBook(book.id);
    });

    it('throws when closing already-closed period', () => {
      const book = createTestBook();
      MultiBookEngine.closeBook(book.id, '2026-01');
      expect(() => MultiBookEngine.closeBook(book.id, '2026-01')).toThrow(
        'Period 2026-01 already closed'
      );
      MultiBookEngine.deleteBook(book.id);
    });

    it('reopens a closed period', () => {
      const book = createTestBook();
      MultiBookEngine.closeBook(book.id, '2026-01');
      MultiBookEngine.reopenBook(book.id, '2026-01', 'u1');
      expect(book.closedPeriods).not.toContain('2026-01');
      MultiBookEngine.deleteBook(book.id);
    });

    it('throws closing non-existent book', () => {
      expect(() => MultiBookEngine.closeBook('bad-id', '2026-01')).toThrow('Book bad-id not found');
    });

    it('throws reopening non-existent book', () => {
      expect(() => MultiBookEngine.reopenBook('bad-id', '2026-01', 'u1')).toThrow(
        'Book bad-id not found'
      );
    });
  });

  describe('consolidateBooks', () => {
    it('consolidates entries across books', async () => {
      const gaap = MultiBookEngine.createBook('GAAP', 'us-gaap', 'USD', 'e1');
      await new Promise((r) => setTimeout(r, 1));
      const ifrs = MultiBookEngine.createBook('IFRS', 'ifrs', 'EUR', 'e1');

      postTestEntry(gaap.id, { accountId: 'cash', debit: 1000, credit: 0 });
      postTestEntry(ifrs.id, { accountId: 'cash', debit: 900, credit: 0 });

      const consolidated = MultiBookEngine.consolidateBooks([gaap.id, ifrs.id]);
      [gaap, ifrs].forEach((b) => MultiBookEngine.deleteBook(b.id));
      expect(consolidated).toHaveLength(1);
      expect(consolidated![0]!.accountId).toBe('cash');
      expect(consolidated![0]!.totalDebit).toBe(1900);
      expect(consolidated![0]!.totalCredit).toBe(0);
      expect(consolidated![0]!.netAmount).toBe(1900);
      expect(consolidated![0]!.books).toHaveLength(2);
    });

    it('detects GAAP differences', async () => {
      const gaap = MultiBookEngine.createBook('GAAP', 'us-gaap', 'USD', 'e1');
      await new Promise((r) => setTimeout(r, 1));
      const ifrs = MultiBookEngine.createBook('IFRS', 'ifrs', 'EUR', 'e1');

      postTestEntry(gaap.id, { accountId: 'cash', debit: 1000, credit: 0 });
      postTestEntry(ifrs.id, { accountId: 'cash', debit: 900, credit: 0 });

      const consolidated = MultiBookEngine.consolidateBooks([gaap.id, ifrs.id]);
      [gaap, ifrs].forEach((b) => MultiBookEngine.deleteBook(b.id));
      expect(consolidated![0]!.gaapDifferences.length).toBeGreaterThan(0);
      expect(consolidated![0]!.gaapDifferences[0]!.difference).toBe(100);
    });

    it('returns empty array for no books', () => {
      expect(MultiBookEngine.consolidateBooks([])).toEqual([]);
    });
  });

  describe('compareBooks', () => {
    it('compares account totals across books', async () => {
      const a = MultiBookEngine.createBook('A', 'us-gaap', 'USD', 'e1');
      await new Promise((r) => setTimeout(r, 1));
      const b = MultiBookEngine.createBook('B', 'ifrs', 'USD', 'e1');

      postTestEntry(a.id, { accountId: 'cash', debit: 500, credit: 0 });
      postTestEntry(b.id, { accountId: 'cash', debit: 300, credit: 0 });

      const result = MultiBookEngine.compareBooks([a.id, b.id]);
      [a, b].forEach((bk) => MultiBookEngine.deleteBook(bk.id));
      const cash = result.find((r) => r.accountId === 'cash');
      expect(cash).toBeDefined();
      expect(cash!.maxDifference).toBe(200);
      expect(cash!.values).toHaveLength(2);
    });

    it('returns accounts unique across books', async () => {
      const a = MultiBookEngine.createBook('A', 'us-gaap', 'USD', 'e1');
      await new Promise((r) => setTimeout(r, 1));
      const b = MultiBookEngine.createBook('B', 'ifrs', 'USD', 'e1');

      postTestEntry(a.id, { accountId: 'cash', debit: 500, credit: 0 });
      postTestEntry(b.id, { accountId: 'ar', debit: 300, credit: 0 });

      const result = MultiBookEngine.compareBooks([a.id, b.id]);
      [a, b].forEach((bk) => MultiBookEngine.deleteBook(bk.id));
      expect(result).toHaveLength(2);
    });
  });

  describe('deleteBook', () => {
    it('deletes a book and returns true', () => {
      const b = createTestBook();
      expect(MultiBookEngine.deleteBook(b.id)).toBe(true);
      expect(MultiBookEngine.getBook(b.id)).toBeUndefined();
    });

    it('returns false for non-existent book', () => {
      expect(MultiBookEngine.deleteBook('nope')).toBe(false);
    });
  });
});

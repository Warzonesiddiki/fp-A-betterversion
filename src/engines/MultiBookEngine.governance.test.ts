import { describe, it, expect, beforeEach } from 'vitest';
import { MultiBookEngine } from './MultiBookEngine';

/**
 * GOVERNANCE EVIDENCE for cap:model.multi-book
 *
 * The MultiBookEngine manages parallel accounting books (US GAAP, IFRS, tax,
 * statutory) for the same entity. The governance dimension here is CORRECTNESS
 * — period closing must be immutable, adjustments must trace to originals, and
 * consolidation/comparison must produce correct cross-book results. If period
 * closing is not enforced, closed-period numbers can be silently altered.
 *
 * Tested dimensions:
 * 1. Period closing immutability (postEntry throws after close)
 * 2. Adjustment chain (adjusted entries reference originals)
 * 3. Book consolidation correctness
 * 4. Book comparison correctness
 * 5. Money primitive safety (debit/credit rounding)
 * 6. Book status lifecycle (active → closed, delete)
 */

describe('MultiBookEngine — GOVERNANCE (model.multi-book)', () => {
  beforeEach(() => {
    // Clear static state between tests
    const books = (MultiBookEngine as unknown as { books: Map<string, unknown> }).books;
    const entries = (MultiBookEngine as unknown as { entries: Map<string, unknown[]> }).entries;
    books.clear();
    entries.clear();
  });

  describe('1. Period closing immutability', () => {
    it('postEntry throws when period is closed', () => {
      const book = MultiBookEngine.createBook('US GAAP Book', 'us-gaap', 'USD', 'entity-1');
      MultiBookEngine.postEntry(book.id, {
        accountId: '1000',
        debit: 100,
        credit: 0,
        description: 'Test',
        period: '2026-01',
        userId: 'analyst@finplan.test',
      });
      MultiBookEngine.closeBook(book.id, '2026-01');
      expect(() =>
        MultiBookEngine.postEntry(book.id, {
          accountId: '1000',
          debit: 200,
          credit: 0,
          description: 'After close',
          period: '2026-01',
          userId: 'analyst@finplan.test',
        })
      ).toThrow();
    });

    it('closeBook throws when period already closed', () => {
      const book = MultiBookEngine.createBook('US GAAP Book', 'us-gaap', 'USD', 'entity-1');
      MultiBookEngine.closeBook(book.id, '2026-01');
      expect(() => MultiBookEngine.closeBook(book.id, '2026-01')).toThrow();
    });

    it('reopenBook allows posting after reopen', () => {
      const book = MultiBookEngine.createBook('US GAAP Book', 'us-gaap', 'USD', 'entity-1');
      MultiBookEngine.closeBook(book.id, '2026-01');
      MultiBookEngine.reopenBook(book.id, '2026-01', 'admin@finplan.test');
      const entry = MultiBookEngine.postEntry(book.id, {
        accountId: '1000',
        debit: 100,
        credit: 0,
        description: 'After reopen',
        period: '2026-01',
        userId: 'analyst@finplan.test',
      });
      expect(entry).toBeDefined();
    });
  });

  describe('2. Adjustment chain', () => {
    it('adjustEntry creates adjusted entry with adjustmentOf reference', () => {
      const book = MultiBookEngine.createBook('US GAAP Book', 'us-gaap', 'USD', 'entity-1');
      const original = MultiBookEngine.postEntry(book.id, {
        accountId: '1000',
        debit: 100,
        credit: 0,
        description: 'Original',
        period: '2026-01',
        userId: 'analyst@finplan.test',
      });
      const adjusted = MultiBookEngine.adjustEntry(book.id, original.id, {
        debit: 150,
        description: 'Adjustment',
        userId: 'admin@finplan.test',
      });
      expect(adjusted.adjusted).toBe(true);
      expect(adjusted.adjustmentOf).toBe(original.id);
      expect(adjusted.debit).toBe(150);
    });

    it('adjustEntry throws when entry not found', () => {
      const book = MultiBookEngine.createBook('US GAAP Book', 'us-gaap', 'USD', 'entity-1');
      expect(() =>
        MultiBookEngine.adjustEntry(book.id, 'nonexistent', {
          debit: 100,
          description: 'Adjustment',
          userId: 'admin@finplan.test',
        })
      ).toThrow();
    });

    it('original entry remains unchanged after adjustment', () => {
      const book = MultiBookEngine.createBook('US GAAP Book', 'us-gaap', 'USD', 'entity-1');
      const original = MultiBookEngine.postEntry(book.id, {
        accountId: '1000',
        debit: 100,
        credit: 0,
        description: 'Original',
        period: '2026-01',
        userId: 'analyst@finplan.test',
      });
      MultiBookEngine.adjustEntry(book.id, original.id, {
        debit: 150,
        description: 'Adjustment',
        userId: 'admin@finplan.test',
      });
      const entries = MultiBookEngine.getEntries(book.id);
      const orig = entries.find((e) => e.id === original.id);
      expect(orig!.debit).toBe(100);
      expect(orig!.adjusted).toBe(false);
    });
  });

  describe('3. Book consolidation correctness', () => {
    it('consolidateBooks aggregates entries across books', () => {
      const b1 = MultiBookEngine.createBook('US GAAP', 'us-gaap', 'USD', 'entity-1');
      const b2 = MultiBookEngine.createBook('IFRS', 'ifrs', 'USD', 'entity-1');
      MultiBookEngine.postEntry(b1.id, {
        accountId: '1000',
        debit: 100,
        credit: 0,
        description: 'A',
        period: '2026-01',
        userId: 'u1',
      });
      MultiBookEngine.postEntry(b2.id, {
        accountId: '1000',
        debit: 200,
        credit: 0,
        description: 'B',
        period: '2026-01',
        userId: 'u2',
      });

      const consolidated = MultiBookEngine.consolidateBooks([b1.id, b2.id]);
      expect(consolidated).toHaveLength(1);
      expect(consolidated[0].totalDebit).toBe(300);
      expect(consolidated[0].books).toHaveLength(2);
    });

    it('consolidateBooks handles multiple accounts', () => {
      const b1 = MultiBookEngine.createBook('US GAAP', 'us-gaap', 'USD', 'entity-1');
      MultiBookEngine.postEntry(b1.id, {
        accountId: '1000',
        debit: 100,
        credit: 0,
        description: 'A',
        period: '2026-01',
        userId: 'u1',
      });
      MultiBookEngine.postEntry(b1.id, {
        accountId: '2000',
        debit: 50,
        credit: 0,
        description: 'B',
        period: '2026-01',
        userId: 'u1',
      });

      const consolidated = MultiBookEngine.consolidateBooks([b1.id]);
      expect(consolidated).toHaveLength(2);
    });
  });

  describe('4. Book comparison correctness', () => {
    it('compareBooks identifies differences between books', () => {
      const b1 = MultiBookEngine.createBook('US GAAP', 'us-gaap', 'USD', 'entity-1');
      const b2 = MultiBookEngine.createBook('IFRS', 'ifrs', 'USD', 'entity-1');
      MultiBookEngine.postEntry(b1.id, {
        accountId: '1000',
        debit: 100,
        credit: 0,
        description: 'A',
        period: '2026-01',
        userId: 'u1',
      });
      MultiBookEngine.postEntry(b2.id, {
        accountId: '1000',
        debit: 200,
        credit: 0,
        description: 'B',
        period: '2026-01',
        userId: 'u2',
      });

      const comparison = MultiBookEngine.compareBooks([b1.id, b2.id]);
      expect(comparison).toHaveLength(1);
      expect(comparison[0].values[0].amount).toBe(100);
      expect(comparison[0].values[1].amount).toBe(200);
      expect(comparison[0].maxDifference).toBe(100);
    });
  });

  describe('5. Money primitive safety', () => {
    it('postEntry rounds debit and credit to 2 decimal places', () => {
      const book = MultiBookEngine.createBook('US GAAP', 'us-gaap', 'USD', 'entity-1');
      const entry = MultiBookEngine.postEntry(book.id, {
        accountId: '1000',
        debit: 100.123456,
        credit: 0,
        description: 'Rounding test',
        period: '2026-01',
        userId: 'u1',
      });
      expect(entry.debit).toBe(100.12);
    });

    it('adjustEntry rounds adjustment values', () => {
      const book = MultiBookEngine.createBook('US GAAP', 'us-gaap', 'USD', 'entity-1');
      const original = MultiBookEngine.postEntry(book.id, {
        accountId: '1000',
        debit: 100,
        credit: 0,
        description: 'A',
        period: '2026-01',
        userId: 'u1',
      });
      const adjusted = MultiBookEngine.adjustEntry(book.id, original.id, {
        debit: 150.9999,
        description: 'Adjustment',
        userId: 'admin@finplan.test',
      });
      expect(adjusted.debit).toBe(151);
    });
  });

  describe('6. Book status lifecycle', () => {
    it('postEntry throws after period close (lifecycle enforcement)', () => {
      const book = MultiBookEngine.createBook('US GAAP', 'us-gaap', 'USD', 'entity-1');
      MultiBookEngine.postEntry(book.id, {
        accountId: '1000',
        debit: 100,
        credit: 0,
        description: 'A',
        period: '2026-01',
        userId: 'u1',
      });
      MultiBookEngine.closeBook(book.id, '2026-01');
      expect(() =>
        MultiBookEngine.postEntry(book.id, {
          accountId: '1000',
          debit: 200,
          credit: 0,
          description: 'B',
          period: '2026-01',
          userId: 'u1',
        })
      ).toThrow();
    });

    it('deleteBook removes book and returns true', () => {
      const book = MultiBookEngine.createBook('US GAAP', 'us-gaap', 'USD', 'entity-1');
      expect(MultiBookEngine.deleteBook(book.id)).toBe(true);
      expect(MultiBookEngine.getBook(book.id)).toBeUndefined();
    });

    it('deleteBook returns false for nonexistent book', () => {
      expect(MultiBookEngine.deleteBook('nonexistent')).toBe(false);
    });
  });
});

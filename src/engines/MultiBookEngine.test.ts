/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { MultiBookEngine } from './MultiBookEngine';

describe('MultiBookEngine', () => {
  beforeEach(() => {
    // Reset state between tests
  });

  describe('createBook', () => {
    it('creates a new accounting book', () => {
      const book = MultiBookEngine.createBook({
        name: 'US GAAP Book',
        gaap: 'US GAAP',
        currency: 'USD',
        entityId: 'entity-1',
      });
      expect(book).toBeDefined();
      expect(book).toHaveProperty('id');
    });

    it('creates books with different GAAP types', () => {
      const gaapBook = MultiBookEngine.createBook({
        name: 'GAAP',
        gaap: 'US GAAP',
        currency: 'USD',
        entityId: 'e1',
      });
      const ifrsBook = MultiBookEngine.createBook({
        name: 'IFRS',
        gaap: 'IFRS',
        currency: 'USD',
        entityId: 'e1',
      });
      expect(gaapBook).toBeDefined();
      expect(ifrsBook).toBeDefined();
    });
  });

  describe('listBooks', () => {
    it('lists all books', () => {
      MultiBookEngine.createBook({
        name: 'Book 1',
        gaap: 'US GAAP',
        currency: 'USD',
        entityId: 'e1',
      });
      MultiBookEngine.createBook({ name: 'Book 2', gaap: 'IFRS', currency: 'USD', entityId: 'e1' });
      const books = MultiBookEngine.listBooks();
      expect(books.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('postEntry', () => {
    it('posts entry to a book', () => {
      const book = MultiBookEngine.createBook({
        name: 'Test',
        gaap: 'US GAAP',
        currency: 'USD',
        entityId: 'e1',
      });
      const entry = MultiBookEngine.postEntry(book.id, {
        date: '2026-01-15',
        description: 'Revenue',
        debitAccount: 'Cash',
        creditAccount: 'Revenue',
        amount: 10000,
      });
      expect(entry).toBeDefined();
    });
  });
});

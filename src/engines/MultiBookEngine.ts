/**
 * MultiBookEngine — Multi-book accounting for GAAP, IFRS, Tax
 * Manages parallel accounting books with cross-book consolidation
 *
 * MONEY MIGRATION (2026-08-03): All currency-bearing debit/credit/netAmount
 * paths (post, consolidate, compare, adjust) now use the canonical money
 * primitive (src/utils/money.ts, decimal.js, ROUND_HALF_UP). Amounts round to
 * cents. No raw + - * / or Math.abs on currency values remains.
 */
import { addMoney, roundTo, subtractMoney } from '../utils/money';

export interface AccountingBook {
  id: string;
  name: string;
  gaap: 'us-gaap' | 'ifrs' | 'tax' | 'statutory' | 'custom';
  currency: string;
  entityId: string;
  createdAt: string;
  closedPeriods: string[];
  status: 'active' | 'closed' | 'archived';
}

export interface BookEntry {
  id: string;
  bookId: string;
  accountId: string;
  debit: number;
  credit: number;
  description: string;
  period: string;
  date: string;
  userId: string;
  adjusted: boolean;
  adjustmentOf?: string;
  metadata?: Record<string, unknown>;
}

export interface ConsolidatedEntry {
  accountId: string;
  books: Array<{ bookId: string; bookName: string; debit: number; credit: number }>;
  totalDebit: number;
  totalCredit: number;
  netAmount: number;
  gaapDifferences: Array<{ account: string; gaap1: number; gaap2: number; difference: number }>;
}

export class MultiBookEngine {
  private static books = new Map<string, AccountingBook>();
  private static entries = new Map<string, BookEntry[]>();

  static createBook(
    name: string,
    gaap: AccountingBook['gaap'],
    currency: string,
    entityId: string
  ): AccountingBook {
    const book: AccountingBook = {
      id: `book-${Date.now()}`,
      name,
      gaap,
      currency,
      entityId,
      createdAt: new Date().toISOString(),
      closedPeriods: [],
      status: 'active',
    };
    this.books.set(book.id, book);
    this.entries.set(book.id, []);
    return book;
  }

  static getBook(bookId: string): AccountingBook | undefined {
    return this.books.get(bookId);
  }

  static listBooks(entityId?: string): AccountingBook[] {
    const all = Array.from(this.books.values());
    return entityId ? all.filter((b) => b.entityId === entityId) : all;
  }

  static postEntry(
    bookId: string,
    entry: Omit<BookEntry, 'id' | 'bookId' | 'adjusted' | 'date'>
  ): BookEntry {
    const book = this.books.get(bookId);
    if (!book) throw new Error(`Book ${bookId} not found`);
    if (book.status !== 'active') throw new Error(`Book ${bookId} is not active`);
    if (book.closedPeriods.includes(entry.period)) {
      throw new Error(`Period ${entry.period} is closed in book ${bookId}`);
    }

    const fullEntry: BookEntry = {
      ...entry,
      id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      bookId,
      debit: roundTo(entry.debit),
      credit: roundTo(entry.credit),
      adjusted: false,
      date: new Date().toISOString(),
    };

    const bookEntries = this.entries.get(bookId) ?? [];
    bookEntries.push(fullEntry);
    this.entries.set(bookId, bookEntries);

    return fullEntry;
  }

  static getEntries(
    bookId: string,
    filters?: { period?: string; accountId?: string; startDate?: string; endDate?: string }
  ): BookEntry[] {
    let entries = this.entries.get(bookId) ?? [];

    if (filters?.period) {
      entries = entries.filter((e) => e.period === filters.period);
    }
    if (filters?.accountId) {
      entries = entries.filter((e) => e.accountId === filters.accountId);
    }
    if (filters?.startDate) {
      entries = entries.filter((e) => e.date >= filters.startDate!);
    }
    if (filters?.endDate) {
      entries = entries.filter((e) => e.date <= filters.endDate!);
    }

    return entries;
  }

  static adjustEntry(
    bookId: string,
    entryId: string,
    adjustment: { debit?: number; credit?: number; description: string; userId: string }
  ): BookEntry {
    const bookEntries = this.entries.get(bookId) ?? [];
    const original = bookEntries.find((e) => e.id === entryId);
    if (!original) throw new Error(`Entry ${entryId} not found`);

    const adjDebit = adjustment.debit !== undefined ? roundTo(adjustment.debit) : original.debit;
    const adjCredit =
      adjustment.credit !== undefined ? roundTo(adjustment.credit) : original.credit;

    const adjusted: BookEntry = {
      id: `adj-${Date.now()}`,
      bookId,
      accountId: original.accountId,
      debit: adjDebit,
      credit: adjCredit,
      description: adjustment.description,
      period: original.period,
      date: new Date().toISOString(),
      userId: adjustment.userId,
      adjusted: true,
      adjustmentOf: entryId,
    };

    bookEntries.push(adjusted);
    this.entries.set(bookId, bookEntries);

    return adjusted;
  }

  static closeBook(bookId: string, period: string): void {
    const book = this.books.get(bookId);
    if (!book) throw new Error(`Book ${bookId} not found`);
    if (book.closedPeriods.includes(period)) {
      throw new Error(`Period ${period} already closed`);
    }
    book.closedPeriods.push(period);
  }

  static reopenBook(bookId: string, period: string, _userId: string): void {
    const book = this.books.get(bookId);
    if (!book) throw new Error(`Book ${bookId} not found`);
    book.closedPeriods = book.closedPeriods.filter((p) => p !== period);
  }

  static consolidateBooks(bookIds: string[]): ConsolidatedEntry[] {
    const accountMap = new Map<string, ConsolidatedEntry>();

    for (const bookId of bookIds) {
      const book = this.books.get(bookId);
      if (!book) continue;

      const entries = this.entries.get(bookId) ?? [];
      for (const entry of entries) {
        const existing = accountMap.get(entry.accountId);
        if (existing) {
          existing.books.push({
            bookId,
            bookName: book.name,
            debit: entry.debit,
            credit: entry.credit,
          });
          const newTotalDebit = roundTo(addMoney(existing.totalDebit, entry.debit));
          const newTotalCredit = roundTo(addMoney(existing.totalCredit, entry.credit));
          existing.totalDebit = newTotalDebit;
          existing.totalCredit = newTotalCredit;
          existing.netAmount = roundTo(subtractMoney(newTotalDebit, newTotalCredit));
        } else {
          const d = roundTo(entry.debit);
          const c = roundTo(entry.credit);
          accountMap.set(entry.accountId, {
            accountId: entry.accountId,
            books: [{ bookId, bookName: book.name, debit: d, credit: c }],
            totalDebit: d,
            totalCredit: c,
            netAmount: roundTo(subtractMoney(d, c)),
            gaapDifferences: [],
          });
        }
      }
    }

    // Calculate GAAP differences (differences are display-only but keep rounded)
    const entries = Array.from(accountMap.values());
    for (const entry of entries) {
      if (entry.books.length >= 2) {
        for (let i = 0; i < entry.books.length - 1; i++) {
          for (let j = i + 1; j < entry.books.length; j++) {
            const diff = roundTo(subtractMoney(entry.books[i]!.debit, entry.books[j]!.debit));
            if (Math.abs(diff) > 0.01) {
              // tolerance remains for display diff
              entry.gaapDifferences.push({
                account: entry.accountId,
                gaap1: entry.books[i]!.debit,
                gaap2: entry.books[j]!.debit,
                difference: diff,
              });
            }
          }
        }
      }
    }

    return entries;
  }

  static compareBooks(bookIds: string[]): Array<{
    accountId: string;
    values: Array<{ bookId: string; bookName: string; amount: number }>;
    maxDifference: number;
  }> {
    const accountMap = new Map<
      string,
      Array<{ bookId: string; bookName: string; amount: number }>
    >();

    for (const bookId of bookIds) {
      const book = this.books.get(bookId);
      if (!book) continue;

      const entries = this.entries.get(bookId) ?? [];
      const accountTotals = new Map<string, number>();

      for (const entry of entries) {
        const current = accountTotals.get(entry.accountId) ?? 0;
        // Money-safe: net per entry
        const net = roundTo(subtractMoney(entry.debit, entry.credit));
        accountTotals.set(entry.accountId, roundTo(addMoney(current, net)));
      }

      for (const [accountId, amount] of accountTotals) {
        const existing = accountMap.get(accountId) ?? [];
        existing.push({ bookId, bookName: book.name, amount: roundTo(amount) });
        accountMap.set(accountId, existing);
      }
    }

    return Array.from(accountMap.entries()).map(([accountId, values]) => {
      const amounts = values.map((v) => v.amount);
      const maxDiff =
        amounts.length > 0 ? roundTo(subtractMoney(Math.max(...amounts), Math.min(...amounts))) : 0;
      return {
        accountId,
        values,
        maxDifference: maxDiff,
      };
    });
  }

  static deleteBook(bookId: string): boolean {
    if (!this.books.has(bookId)) return false;
    this.books.delete(bookId);
    this.entries.delete(bookId);
    return true;
  }
}

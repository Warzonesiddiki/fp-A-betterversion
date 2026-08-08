import { describe, it, expect } from 'vitest';
import {
  mockCellAuditEntries,
  getAuditEntriesByCell,
  getAuditEntriesByAccount,
  getAuditEntriesByUser,
} from './cellAuditEntries';

describe('mockData cellAuditEntries', () => {
  it('provides a non-empty dataset with unique audit ids', () => {
    expect(mockCellAuditEntries.length).toBeGreaterThan(5);
    const ids = mockCellAuditEntries.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('spans the first ten months of the fiscal year', () => {
    const months = new Set(mockCellAuditEntries.map((e) => e.month));
    for (let m = 1; m <= 10; m++) {
      expect(months.has(m)).toBe(true);
    }
    expect(months.size).toBe(10);
  });

  it('every entry carries complete metadata', () => {
    for (const e of mockCellAuditEntries) {
      expect(e.cellId).toBeTruthy();
      expect(e.accountId).toBeTruthy();
      expect(e.accountName).toBeTruthy();
      expect(e.userId).toBeTruthy();
      expect(e.userName).toBeTruthy();
      expect(e.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(e.reason).toBeTruthy();
    }
  });

  it('contains both value-increase and value-decrease edits', () => {
    const increases = mockCellAuditEntries.filter((e) => e.newValue > e.oldValue);
    const decreases = mockCellAuditEntries.filter((e) => e.newValue < e.oldValue);
    expect(increases.length).toBeGreaterThan(0);
    expect(decreases.length).toBeGreaterThan(0);
  });

  it('references a plausible set of revenue and expense accounts', () => {
    const accountNames = mockCellAuditEntries.map((e) => e.accountName);
    expect(accountNames.some((n) => /revenue/i.test(n))).toBe(true);
    expect(accountNames.some((n) => /salaries|wages|travel|rent|cloud/i.test(n))).toBe(true);
  });

  it('filters entries by cell, account and user', () => {
    const first = mockCellAuditEntries[0]!;
    const byCell = getAuditEntriesByCell(first.cellId);
    expect(byCell).toContainEqual(first);
    expect(byCell.length).toBeGreaterThan(0);

    const byAccount = getAuditEntriesByAccount(first.accountId);
    expect(byAccount).toContainEqual(first);

    const byUser = getAuditEntriesByUser(first.userId);
    expect(byUser).toContainEqual(first);

    expect(getAuditEntriesByCell('nope')).toEqual([]);
    expect(getAuditEntriesByAccount('nope')).toEqual([]);
    expect(getAuditEntriesByUser('nope')).toEqual([]);
  });
});

/**
 * GAP-1 (F-0006) known-answer tests for BoardPackPage money patterns.
 *
 * Verifies sumByAccountPrefix and computeBoardPackReport use exact
 * money primitives and respect debit/credit account conventions.
 */

import { describe, expect, it } from 'vitest';
import {
  sumByAccountPrefix,
  computeBoardPackReport,
} from '@/pages/reports/BoardPackPage';
import type { GLEntry } from '@/types';

function makeEntry(code: string, debit: number, credit: number): GLEntry {
  return {
    id: `entry-${code}-${debit}-${credit}`,
    accountCode: code,
    accountName: `Account ${code}`,
    debit,
    credit,
    netChange: debit - credit,
  } as GLEntry;
}

describe('BoardPackPage money patterns — known answers (GAP-1)', () => {
  it('returns null when entries is empty', () => {
    const result = computeBoardPackReport([], []);
    expect(result).toBeNull();
  });

  it('sumByAccountPrefix sums credit-dominant accounts (e.g. revenue prefix 4) correctly', () => {
    const entries = [
      makeEntry('4000', 0, 1000),
      makeEntry('4100', 0, 500),
      makeEntry('1000', 200, 0), // ignored
    ];
    const total = sumByAccountPrefix(entries, ['4'], 'credit');
    expect(total).toBe(1500);
  });

  it('sumByAccountPrefix sums debit-dominant accounts (e.g. assets prefix 1) correctly', () => {
    const entries = [
      makeEntry('1000', 5000, 0),
      makeEntry('1200', 1200, 200), // net 1000
      makeEntry('4000', 0, 1000), // ignored
    ];
    const total = sumByAccountPrefix(entries, ['1'], 'debit');
    expect(total).toBe(6000);
  });

  it('sumByAccountPrefix sums debit-normal expense accounts (prefixes 5, 6)', () => {
    const entries = [
      makeEntry('5000', 800, 0),
      makeEntry('6000', 300, 0),
      makeEntry('4000', 0, 2000), // ignored
    ];
    const total = sumByAccountPrefix(entries, ['5', '6'], 'debit');
    expect(total).toBe(1100);
  });

  it('computeBoardPackReport calculates revenue as credit-debit (positive for credit balance)', () => {
    const entries = [
      makeEntry('4000', 0, 2500),
      makeEntry('4100', 100, 600), // net credit 500
    ];
    const report = computeBoardPackReport(entries, []);
    expect(report?.revenue).toBe(3000);
  });

  it('computeBoardPackReport calculates expenses and netIncome (revenue - expenses)', () => {
    const entries = [
      makeEntry('4000', 0, 10000),
      makeEntry('5000', 4000, 0),
      makeEntry('6000', 1500, 0),
    ];
    const report = computeBoardPackReport(entries, []);
    expect(report?.revenue).toBe(10000);
    expect(report?.expenses).toBe(5500);
    expect(report?.netIncome).toBe(4500);
  });

  it('computeBoardPackReport closing equity includes current-period earnings', () => {
    const entries = [
      makeEntry('1000', 10000, 0), // assets
      makeEntry('2000', 0, 4000), // liabilities
      makeEntry('3000', 0, 5000), // posted equity
      makeEntry('4000', 0, 1000), // revenue → NI 1000
    ];
    const report = computeBoardPackReport(entries, []);
    expect(report?.assets).toBe(10000);
    expect(report?.liabilities).toBe(4000);
    expect(report?.equity).toBe(6000);
    expect(report?.netIncome).toBe(1000);
  });

  it('computeBoardPackReport computes grossMargin percentage accurately using divideMoney', () => {
    const entries = [
      makeEntry('4000', 0, 2000),
      makeEntry('5000', 500, 0),
    ];
    const report = computeBoardPackReport(entries, []);
    // Gross margin is (revenue − COGS) / revenue, not (revenue − all expenses).
    expect(report?.grossMargin).toBe(75);
  });

  it('computeBoardPackReport sums totalBudget from budget items', () => {
    const entries = [makeEntry('4000', 0, 1000)];
    const budgets = [
      { totalAmount: 5000 },
      { totalAmount: 2500 },
      {},
    ];
    const report = computeBoardPackReport(entries, budgets);
    expect(report?.totalBudget).toBe(7500);
    expect(report?.budgetCount).toBe(3);
  });

  it('handles floating-point decimal precision without IEEE-754 drift', () => {
    const entries = [
      makeEntry('4000', 0, 0.1),
      makeEntry('4100', 0, 0.2),
      makeEntry('5000', 0.05, 0),
    ];
    const report = computeBoardPackReport(entries, []);
    expect(report?.revenue).toBe(0.3);
    expect(report?.expenses).toBe(0.05);
    expect(report?.netIncome).toBe(0.25);
    // (0.3 - 0.05) / 0.3 * 100 = 83.33
    expect(report?.grossMargin).toBe(83.33);
  });
});

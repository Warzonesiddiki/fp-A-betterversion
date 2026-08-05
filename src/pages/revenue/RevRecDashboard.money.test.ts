/**
 * GAP-1 (F-0006) known-answer tests for RevRecDashboard money patterns.
 *
 * Verifies computeRevRecRevenue, computeRevRecDeferred, and
 * computeRevRecRecognized calculate ASC 606 revenue recognition exactly.
 */

import { describe, expect, it } from 'vitest';
import {
  computeRevRecRevenue,
  computeRevRecDeferred,
  computeRevRecRecognized,
} from '@/pages/revenue/RevRecDashboard';
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

describe('RevRecDashboard money patterns — known answers (GAP-1)', () => {
  it('computeRevRecRevenue returns 0 for empty entries', () => {
    expect(computeRevRecRevenue([])).toBe(0);
  });

  it('computeRevRecRevenue calculates revenue from credit-dominant accounts starting with 4', () => {
    const entries = [makeEntry('4000', 0, 100000), makeEntry('4100', 0, 50000)];
    expect(computeRevRecRevenue(entries)).toBe(150000);
  });

  it('computeRevRecDeferred calculates deferred revenue from accounts starting with 23', () => {
    const entries = [makeEntry('2300', 0, 30000), makeEntry('2310', 0, 15000)];
    expect(computeRevRecDeferred(entries)).toBe(45000);
  });

  it('computeRevRecRecognized calculates recognized as revenue minus deferred', () => {
    const revenue = 150000;
    const deferred = 45000;
    expect(computeRevRecRecognized(revenue, deferred)).toBe(105000);
  });

  it('computeRevRecRevenue ignores non-revenue accounts', () => {
    const entries = [
      makeEntry('1000', 10000, 0),
      makeEntry('2000', 0, 5000),
      makeEntry('4000', 0, 12000),
      makeEntry('5000', 4000, 0),
    ];
    expect(computeRevRecRevenue(entries)).toBe(12000);
  });

  it('computeRevRecDeferred ignores non-deferred liability accounts', () => {
    const entries = [
      makeEntry('2000', 0, 5000),
      makeEntry('2100', 0, 3000),
      makeEntry('2300', 0, 8000),
    ];
    expect(computeRevRecDeferred(entries)).toBe(8000);
  });

  it('computeRevRecRecognized returns 0 when revenue equals deferred', () => {
    expect(computeRevRecRecognized(50000, 50000)).toBe(0);
  });

  it('handles floating-point amounts accurately without IEEE-754 drift on revenue and deferred', () => {
    const entries = [
      makeEntry('4000', 0, 0.1),
      makeEntry('4100', 0, 0.2),
      makeEntry('2300', 0, 0.05),
    ];
    expect(computeRevRecRevenue(entries)).toBe(0.3);
    expect(computeRevRecDeferred(entries)).toBe(0.05);
  });

  it('handles floating-point amounts accurately on recognized calculation', () => {
    expect(computeRevRecRecognized(0.3, 0.05)).toBe(0.25);
  });

  it('computes recognized revenue accurately for realistic contract portfolio', () => {
    const revenue = 1200000;
    const deferred = 450000;
    expect(computeRevRecRecognized(revenue, deferred)).toBe(750000);
  });
});

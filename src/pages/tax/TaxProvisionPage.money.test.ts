/**
 * GAP-1 (F-0006) known-answer tests for TaxProvisionPage money patterns.
 *
 * Verifies computeTaxRevenue and computeTaxExpenses use exact money
 * primitives without IEEE-754 floating-point drift.
 */

import { describe, expect, it } from 'vitest';
import { computeTaxRevenue, computeTaxExpenses } from '@/pages/tax/TaxProvisionPage';
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

describe('TaxProvisionPage money patterns — known answers (GAP-1)', () => {
  it('computeTaxRevenue returns 0 for empty entries', () => {
    expect(computeTaxRevenue([])).toBe(0);
    expect(computeTaxExpenses([])).toBe(0);
  });

  it('computeTaxRevenue calculates credit-dominant revenue from accounts starting with 4', () => {
    const entries = [makeEntry('4000', 0, 10000), makeEntry('4100', 0, 5000)];
    expect(computeTaxRevenue(entries)).toBe(15000);
  });

  it('computeTaxExpenses calculates absolute expenses from accounts starting with 6', () => {
    const entries = [makeEntry('6000', 3000, 0), makeEntry('6100', 1500, 0)];
    expect(computeTaxExpenses(entries)).toBe(4500);
  });

  it('computeTaxRevenue and computeTaxExpenses ignore unrelated accounts', () => {
    const entries = [
      makeEntry('1000', 10000, 0),
      makeEntry('2000', 0, 5000),
      makeEntry('4000', 0, 2000),
      makeEntry('6000', 500, 0),
    ];
    expect(computeTaxRevenue(entries)).toBe(2000);
    expect(computeTaxExpenses(entries)).toBe(500);
  });

  it('handles decimal amounts accurately using exact money primitives', () => {
    const entries = [
      makeEntry('4000', 0, 0.1),
      makeEntry('4100', 0, 0.2),
      makeEntry('6000', 0.05, 0),
      makeEntry('6100', 0.02, 0),
    ];
    expect(computeTaxRevenue(entries)).toBe(0.3);
    expect(computeTaxExpenses(entries)).toBe(0.07);
  });

  it('handles credit-dominant revenue correctly without sign inversion', () => {
    const entries = [
      makeEntry('4000', 100, 500), // net credit 400
    ];
    expect(computeTaxRevenue(entries)).toBe(400);
  });

  it('computeTaxRevenue sums multiple revenue accounts correctly', () => {
    const entries = [
      makeEntry('4010', 0, 1000),
      makeEntry('4020', 0, 2000),
      makeEntry('4030', 0, 3000),
    ];
    expect(computeTaxRevenue(entries)).toBe(6000);
  });

  it('computeTaxExpenses sums multiple expense accounts correctly', () => {
    const entries = [
      makeEntry('6010', 100, 0),
      makeEntry('6020', 200, 0),
      makeEntry('6030', 300, 0),
    ];
    expect(computeTaxExpenses(entries)).toBe(600);
  });
});

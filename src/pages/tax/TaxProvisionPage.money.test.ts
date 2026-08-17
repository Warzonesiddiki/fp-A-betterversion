/**
 * GAP-1 (F-0006) known-answer tests for tax-provision money patterns.
 *
 * The previous helpers (computeTaxRevenue / computeTaxExpenses) lived in the
 * page and used Math.abs on prefix-6 only. Derivation now lives in
 * taxProvisionData.ts; these pin the same known answers against it.
 */

import { describe, expect, it } from 'vitest';
import { deriveTaxProvision, type TaxProvisionGLEntry } from './taxProvisionData';

function makeEntry(code: string, debit: number, credit: number): TaxProvisionGLEntry {
  return {
    accountCode: code,
    debit,
    credit,
  };
}

describe('TaxProvisionPage money patterns — known answers (GAP-1)', () => {
  it('returns 0 for empty entries', () => {
    const d = deriveTaxProvision([]);
    expect(d.revenue.toNumber()).toBe(0);
    expect(d.opex.toNumber()).toBe(0);
    expect(d.pretaxIncome.toNumber()).toBe(0);
  });

  it('calculates credit-dominant revenue from accounts starting with 4', () => {
    const d = deriveTaxProvision([makeEntry('4000', 0, 10000), makeEntry('4100', 0, 5000)]);
    expect(d.revenue.toNumber()).toBe(15000);
  });

  it('calculates operating expenses from accounts starting with 6 without Math.abs', () => {
    const d = deriveTaxProvision([makeEntry('6000', 3000, 0), makeEntry('6100', 1500, 0)]);
    expect(d.opex.toNumber()).toBe(4500);
  });

  it('ignores unrelated (balance-sheet) accounts when computing pretax', () => {
    const d = deriveTaxProvision([
      makeEntry('1000', 10000, 0),
      makeEntry('2000', 0, 5000),
      makeEntry('4000', 0, 2000),
      makeEntry('6000', 500, 0),
    ]);
    expect(d.revenue.toNumber()).toBe(2000);
    expect(d.opex.toNumber()).toBe(500);
    expect(d.pretaxIncome.toNumber()).toBe(1500);
  });

  it('handles decimal amounts accurately using exact money primitives', () => {
    const d = deriveTaxProvision([
      makeEntry('4000', 0, 0.1),
      makeEntry('4100', 0, 0.2),
      makeEntry('6000', 0.05, 0),
      makeEntry('6100', 0.02, 0),
    ]);
    expect(d.revenue.toNumber()).toBe(0.3);
    expect(d.opex.toNumber()).toBe(0.07);
    expect(d.pretaxIncome.toNumber()).toBe(0.23);
  });

  it('handles credit-dominant revenue correctly without sign inversion', () => {
    const d = deriveTaxProvision([makeEntry('4000', 100, 500)]);
    expect(d.revenue.toNumber()).toBe(400);
  });

  it('includes COGS (prefix 5) in pretax — the previous helper ignored it', () => {
    const d = deriveTaxProvision([
      makeEntry('4000', 0, 1000),
      makeEntry('5000', 400, 0),
      makeEntry('6000', 250, 0),
    ]);
    expect(d.cogs.toNumber()).toBe(400);
    expect(d.pretaxIncome.toNumber()).toBe(350);
  });
});

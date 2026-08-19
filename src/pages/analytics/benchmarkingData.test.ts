import { describe, it, expect } from 'vitest';
import { deriveBenchmarkRatios, type BenchmarkGLEntry } from './benchmarkingData';

/**
 * Hand-computed known-answer ledger (every figure below was worked out by
 * hand BEFORE the derivation existed — K14 evidence over assertion):
 *
 *   revenue   4010   credit 1,000,000 − debit 40,000 (returns)   = 960,000
 *   cogs      5010   debit    400,000 − credit 20,000            = 380,000
 *   opex      6010   debit    300,000                            = 300,000
 *   interest  7010   debit     10,000                            =  10,000
 *   income tx 8010   debit     50,000                            =  50,000
 *   net income = 960,000 − 380,000 − 300,000 − 10,000 − 50,000  = 220,000
 *
 *   assets    1010 cash            debit 500,000
 *             1100 current assets  debit 250,000
 *             1500 fixed assets    debit 750,000
 *             1590 accum. depr.   CREDIT 100,000  (contra asset)
 *           total assets = 500,000 + 250,000 + 750,000 − 100,000 = 1,400,000
 *   liabilities 2100 current  credit 100,000 · 2500 LT credit 200,000 = 300,000
 *   equity      3010          credit 400,000
 */
const LEDGER: BenchmarkGLEntry[] = [
  { accountCode: '4010', debit: 0, credit: 1000000 },
  { accountCode: '4010', debit: 40000, credit: 0 },
  { accountCode: '5010', debit: 400000, credit: 0 },
  { accountCode: '5010', debit: 0, credit: 20000 },
  { accountCode: '6010', debit: 300000, credit: 0 },
  { accountCode: '7010', debit: 10000, credit: 0 },
  { accountCode: '8010', debit: 50000, credit: 0 },
  { accountCode: '1010', debit: 500000, credit: 0 },
  { accountCode: '1100', debit: 250000, credit: 0 },
  { accountCode: '1500', debit: 750000, credit: 0 },
  { accountCode: '1590', debit: 0, credit: 100000 },
  { accountCode: '2100', debit: 0, credit: 100000 },
  { accountCode: '2500', debit: 0, credit: 200000 },
  { accountCode: '3010', debit: 0, credit: 400000 },
];

describe('deriveBenchmarkRatios — known answers', () => {
  it('returns null for an empty ledger (page must empty-state)', () => {
    expect(deriveBenchmarkRatios([])).toBeNull();
  });

  it('nets revenue as credit − debit including reversals', () => {
    const d = deriveBenchmarkRatios(LEDGER)!;
    expect(d.basis.revenue).toBe(960000);
  });

  it('computes net income across prefixes 5, 6, 7 and 8', () => {
    const d = deriveBenchmarkRatios(LEDGER)!;
    expect(d.basis.cogs).toBe(380000);
    expect(d.basis.opex).toBe(300000);
    expect(d.basis.interest).toBe(10000);
    expect(d.basis.incomeTax).toBe(50000);
    // 960,000 − 380,000 − 300,000 − 10,000 − 50,000 = 220,000.
    // The pre-session-024 page stopped at prefix 6 and reported 280,000.
    expect(d.basis.netIncome).toBe(220000);
  });

  it('nets the contra-asset instead of Math.abs-ing it into a bigger balance', () => {
    const d = deriveBenchmarkRatios(LEDGER)!;
    // 500,000 + 250,000 + 750,000 − 100,000. A Math.abs implementation
    // reports 1,600,000 here — accumulated depreciation would INCREASE
    // total assets.
    expect(d.basis.totalAssets).toBe(1400000);
    expect(d.basis.currentAssets).toBe(250000);
  });

  it('computes the liquidity and leverage ratios', () => {
    const d = deriveBenchmarkRatios(LEDGER)!;
    expect(d.ratios.current).toBe(2.5); // 250,000 / 100,000
    expect(d.ratios.debtToEquity).toBe(0.75); // 300,000 / 400,000
  });

  it('computes profitability and efficiency ratios', () => {
    const d = deriveBenchmarkRatios(LEDGER)!;
    expect(d.ratios.grossMargin).toBe(60.42); // 580,000 / 960,000
    expect(d.ratios.netMargin).toBe(22.92); // 220,000 / 960,000
    expect(d.ratios.roa).toBe(15.71); // 220,000 / 1,400,000
    expect(d.ratios.roe).toBe(55); // 220,000 / 400,000
    expect(d.ratios.assetTurnover).toBe(0.6857); // 960,000 / 1,400,000
  });

  it('never computes the quick ratio — inventory has no account prefix', () => {
    const d = deriveBenchmarkRatios(LEDGER)!;
    expect(d.ratios.quick).toBeNull();
  });
});

describe('deriveBenchmarkRatios — denominator discipline', () => {
  it('emits null, not a ratio against a fabricated $1 denominator', () => {
    // A ledger with revenue only: no assets, liabilities, equity, current
    // accounts. The pre-session-024 page substituted `|| 1` for every empty
    // denominator and divided by an invented dollar.
    const revenueOnly: BenchmarkGLEntry[] = [{ accountCode: '4010', debit: 0, credit: 100000 }];
    const d = deriveBenchmarkRatios(revenueOnly)!;
    expect(d.ratios.current).toBeNull();
    expect(d.ratios.debtToEquity).toBeNull();
    expect(d.ratios.roa).toBeNull();
    expect(d.ratios.roe).toBeNull();
    expect(d.ratios.assetTurnover).toBeNull();
    // gross / net margin ARE supported by revenue alone.
    expect(d.ratios.grossMargin).toBe(100);
    expect(d.ratios.netMargin).toBe(100);
  });

  it('emits null margins when no revenue is posted', () => {
    const costsOnly: BenchmarkGLEntry[] = [
      { accountCode: '6010', debit: 50000, credit: 0 },
      { accountCode: '1010', debit: 50000, credit: 0 },
    ];
    const d = deriveBenchmarkRatios(costsOnly)!;
    expect(d.ratios.grossMargin).toBeNull();
    expect(d.ratios.netMargin).toBeNull();
  });
});

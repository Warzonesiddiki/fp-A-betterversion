/**
 * Known-answer tests for the insurance dashboard derivation (W0.1.7).
 *
 * The real `InsuranceEngine` runs here — nothing is `vi.mock`ed. Mocking the
 * engine and asserting against a local fixture is exactly how `$12.4M` reached
 * a CONFIDENTIAL board pack while its tests stayed green.
 *
 * Falsification: reverting `InsuranceDashboardPage.tsx` to the literal
 * dashboard fails the DOM probes in `InsuranceDashboardPage.test.tsx`; removing
 * the `hasData` gate makes the empty-state case render a page of dashes.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import type { GLEntry } from '@/types';
import { buildInsuranceDashboardModel } from './insuranceDashboardData';

function entry(
  accountCode: string,
  debit: number,
  credit: number,
  period: string,
  accountName = 'Account'
): GLEntry {
  return {
    id: `${accountCode}-${period}-${String(debit)}-${String(credit)}`,
    accountId: accountCode,
    accountCode,
    accountName,
    period,
    periodName: period,
    debit,
    credit,
    netChange: debit - credit,
    date: `${period}-15`,
    amount: debit - credit,
    description: accountName,
    reference: 'TEST',
  };
}

/**
 * Two posting periods.
 *   written  41xx: Auto 600,000 + Commercial 400,000 each period → 2,000,000
 *   earned   42xx: Auto 500,000 + Commercial 300,000 each period → 1,600,000
 *   ceded    43xx: 150,000 each period                           →   300,000
 *   loss     51xx: 300,000 in Jan, 500,000 in Feb                →   800,000
 *   comm     52xx: 100,000 each period                           →   200,000
 *   uw exp   53xx:  50,000 each period                           →   100,000
 */
function ledger(): GLEntry[] {
  const out: GLEntry[] = [];
  for (const [period, loss] of [
    ['2026-01', 300000],
    ['2026-02', 500000],
  ] as const) {
    out.push(entry('4101', 0, 600000, period, 'Auto written premium'));
    out.push(entry('4104', 0, 400000, period, 'Commercial written premium'));
    out.push(entry('4201', 0, 500000, period, 'Auto earned premium'));
    out.push(entry('4204', 0, 300000, period, 'Commercial earned premium'));
    out.push(entry('4301', 150000, 0, period, 'Reinsurance ceded'));
    out.push(entry('5100', loss, 0, period, 'Loss and LAE'));
    out.push(entry('5200', 100000, 0, period, 'Commission expense'));
    out.push(entry('5300', 50000, 0, period, 'Underwriting expense'));
  }
  return out;
}

describe('buildInsuranceDashboardModel — known answers', () => {
  it('an empty ledger has no data and no invented figures', () => {
    const m = buildInsuranceDashboardModel([]);
    expect(m.hasData).toBe(false);
    expect(m.stats.grossWrittenPremium).toBe(0);
    expect(m.stats.lossRatio).toBeNull();
    expect(m.stats.expenseRatio).toBeNull();
    expect(m.stats.combinedRatio).toBeNull();
    expect(m.trend).toHaveLength(0);
    expect(m.lineRows).toHaveLength(0);
    expect(m.periodsCovered).toBeNull();
    expect(m.priorPeriod).toBeNull();
  });

  it('a ledger with no insurance prefixes is still "no data"', () => {
    const m = buildInsuranceDashboardModel([entry('6000', 1000, 0, '2026-01', 'Rent')]);
    expect(m.hasData).toBe(false);
  });

  it('premium, loss and expense totals come from natural balance', () => {
    const { stats } = buildInsuranceDashboardModel(ledger());
    expect(stats.grossWrittenPremium).toBe(2000000);
    expect(stats.earnedPremium).toBe(1600000);
    expect(stats.cededPremium).toBe(300000);
    expect(stats.netWrittenPremium).toBe(1700000);
    expect(stats.lossExpense).toBe(800000);
    expect(stats.expenseTotal).toBe(300000);
  });

  it('ratios divide the right two numbers', () => {
    const { stats } = buildInsuranceDashboardModel(ledger());
    // loss / earned = 800,000 / 1,600,000
    expect(stats.lossRatio).toBe(50);
    // (commission + underwriting) / gross written = 300,000 / 2,000,000
    expect(stats.expenseRatio).toBe(15);
    expect(stats.combinedRatio).toBe(65);
    // earned − loss − expense
    expect(stats.underwritingIncome).toBe(500000);
  });

  it('policy count is null, never a premium-derived guess', () => {
    const { stats } = buildInsuranceDashboardModel(ledger());
    expect(stats.policyCount).toBeNull();
  });

  it('net written premium is null when no cession is posted', () => {
    const noCession = ledger().filter((e) => !e.accountCode.startsWith('43'));
    const { stats } = buildInsuranceDashboardModel(noCession);
    expect(stats.cededPremium).toBeNull();
    expect(stats.netWrittenPremium).toBeNull();
    expect(stats.grossWrittenPremium).toBe(2000000);
  });

  it('a premium refund reduces written premium (no Math.abs)', () => {
    const refunded = [...ledger(), entry('4101', 100000, 0, '2026-02', 'Auto premium refund')];
    const { stats } = buildInsuranceDashboardModel(refunded);
    expect(stats.grossWrittenPremium).toBe(1900000);
  });

  it('lines are split by premium account suffix, zero lines dropped', () => {
    const { lineRows } = buildInsuranceDashboardModel(ledger());
    expect(lineRows.map((r) => r.line)).toEqual(['Auto', 'Commercial']);
    expect(lineRows[0]).toMatchObject({
      line: 'Auto',
      written: 1200000,
      earned: 1000000,
      writtenLessEarned: 200000,
    });
    expect(lineRows[1]).toMatchObject({
      line: 'Commercial',
      written: 800000,
      earned: 600000,
      writtenLessEarned: 200000,
    });
  });

  it('written − earned is exact on cent-sized amounts', () => {
    const m = buildInsuranceDashboardModel([
      entry('4101', 0, 0.3, '2026-01', 'Auto written premium'),
      entry('4201', 0, 0.1, '2026-01', 'Auto earned premium'),
    ]);
    // 0.3 - 0.1 is 0.19999999999999998 in IEEE-754.
    expect(m.lineRows[0]?.writtenLessEarned).toBe(0.2);
  });

  it('the trend is per posting period, in order, from the ledger', () => {
    const { trend } = buildInsuranceDashboardModel(ledger());
    expect(trend.map((p) => p.month)).toEqual(['2026-01', '2026-02']);
    // Jan: loss 300,000 / earned 800,000 = 37.5 · expense 150,000 / written 1,000,000 = 15
    expect(trend[0]).toMatchObject({ lossRatio: 37.5, expenseRatio: 15, combined: 52.5 });
    // Feb: loss 500,000 / earned 800,000 = 62.5
    expect(trend[1]).toMatchObject({ lossRatio: 62.5, expenseRatio: 15, combined: 77.5 });
  });

  it('sparklines carry the real series, not a shape', () => {
    const m = buildInsuranceDashboardModel(ledger());
    expect(m.combinedSparkline).toEqual([52.5, 77.5]);
    expect(m.lossRatioSparkline).toEqual([37.5, 62.5]);
  });

  it('the prior period is the one before the latest, and null with a single period', () => {
    const m = buildInsuranceDashboardModel(ledger());
    expect(m.priorPeriod?.month).toBe('2026-01');
    expect(m.periodsCovered).toEqual({ first: '2026-01', last: '2026-02' });

    const single = buildInsuranceDashboardModel(ledger().filter((e) => e.period === '2026-01'));
    expect(single.priorPeriod).toBeNull();
    expect(single.periodsCovered).toEqual({ first: '2026-01', last: '2026-01' });
  });

  it('a period with premium but no earned premium is dropped, not filled', () => {
    const m = buildInsuranceDashboardModel([
      entry('4101', 0, 100000, '2026-03', 'Auto written premium'),
      entry('5100', 20000, 0, '2026-03', 'Loss and LAE'),
    ]);
    expect(m.hasData).toBe(true);
    expect(m.trend).toHaveLength(0);
    expect(m.stats.lossRatio).toBeNull();
  });
});

describe('insuranceDashboardData / InsuranceDashboardPage — source guards', () => {
  const codeOnly = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const model = codeOnly(readFileSync('src/pages/insurance/insuranceDashboardData.ts', 'utf-8'));
  const page = codeOnly(readFileSync('src/pages/insurance/InsuranceDashboardPage.tsx', 'utf-8'));

  it('the page holds no fabricated figure arrays', () => {
    for (const symbol of [
      'combinedRatioTrend',
      'premiumByLine =',
      'underwritingResults',
      'mockPeriods',
    ]) {
      expect(page).not.toContain(symbol);
    }
  });

  it('the page displays none of the literals it used to ship', () => {
    // Assert on the code, not the rendered text: the disclosure block names
    // what is missing and must not trip its own guard.
    for (const literal of ['84.7', '51.7', '58.9', '142,800', '12.4M', '90.9', '88.2']) {
      expect(page).not.toContain(literal);
    }
  });

  it('the page reads the GL store and derives through the model', () => {
    expect(page).toMatch(/useGLStore/);
    expect(page).toMatch(/buildInsuranceDashboardModel\(entries\)/);
    // A store read that is destructured into an underscore is a discarded read.
    expect(page).not.toMatch(/:\s*_entries/);
  });

  it('the page hard-codes no KPI delta', () => {
    expect(page).not.toMatch(/change=\{-?\d/);
    expect(page).not.toMatch(/trend="(up|down)"/);
  });

  it('the model runs the real engine and money helpers', () => {
    expect(model).toMatch(/from '@\/engines\/InsuranceEngine'/);
    expect(model).toMatch(/from '@\/utils\/money'/);
    expect(model).not.toMatch(/decimalUtils/);
    expect(model).not.toMatch(/vi\.mock/);
  });

  it('the model invents no policy count and no per-line loss ratio', () => {
    expect(model).not.toMatch(/policyCount:\s*[^n]/);
    // A per-line row carries premium only; a ratio would need an allocation of
    // 51xx-53xx across lines that nobody has posted.
    const rowShape = model.slice(
      model.indexOf('interface UnderwritingLineRow'),
      model.indexOf('interface TrendPoint')
    );
    expect(rowShape).not.toMatch(/lossRatio|combined|trend/);
    // No division happens in this module at all, so no ratio can be minted here.
    expect(model).not.toMatch(/divideMoney|\/\s*\(?(written|earned|premium)/);
  });
});

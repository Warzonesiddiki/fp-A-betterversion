/**
 * GAP-1 (F-0006) known-answer tests for ReportLayoutEngine's money migration.
 *
 * P&L revenue, COGS, operating expenses, profit, balance-sheet assets,
 * liabilities, and equity are currency-bearing values. Layout geometry and
 * HTML formatting are deliberately out of scope. Each fixed input has an
 * exact `toBe` answer; the pre-migration IEEE-754 result is recorded inline.
 */

import { describe, expect, it } from 'vitest';
import {
  generateBalanceSheetLayout,
  generateProfitAndLossLayout,
  type ReportSection,
} from './ReportLayoutEngine';

const PERIOD = '2026-01';

function valueFor(layout: ReportSection[], id: string): number | null | undefined {
  return layout.find((section) => section.id === id)?.values[PERIOD];
}

describe('ReportLayoutEngine — money known answers (GAP-1 / F-0006)', () => {
  it('sums P&L revenue exactly (old float: 0.30000000000000004)', () => {
    const layout = generateProfitAndLossLayout({
      productRevenue: { [PERIOD]: 0.1 },
      serviceRevenue: { [PERIOD]: 0.2 },
    });

    expect(valueFor(layout, 'total-revenue')).toBe(0.3);
  });

  it('subtracts COGS from revenue exactly for gross profit (old float: 0.10000000000000003)', () => {
    const layout = generateProfitAndLossLayout({
      productRevenue: { [PERIOD]: 0.1 },
      serviceRevenue: { [PERIOD]: 0.2 },
      materials: { [PERIOD]: 0.1 },
      directLabor: { [PERIOD]: 0.1 },
    });

    expect(valueFor(layout, 'gross-profit')).toBe(0.1);
  });

  it('sums operating-expense currency exactly (old float: 0.30000000000000004)', () => {
    const layout = generateProfitAndLossLayout({
      salaries: { [PERIOD]: 0.1 },
      rent: { [PERIOD]: 0.1 },
      marketing: { [PERIOD]: 0.1 },
    });

    expect(valueFor(layout, 'total-opex')).toBe(0.3);
  });

  it('sums balance-sheet assets exactly (old float: 0.30000000000000004)', () => {
    const layout = generateBalanceSheetLayout({
      currentAssets: { [PERIOD]: 0.1 },
      fixedAssets: { [PERIOD]: 0.2 },
    });

    expect(valueFor(layout, 'total-assets')).toBe(0.3);
  });

  it('sums liabilities and equity exactly (old float: 0.30000000000000004)', () => {
    const layout = generateBalanceSheetLayout({
      currentLiabilities: { [PERIOD]: 0.1 },
      retainedEarnings: { [PERIOD]: 0.2 },
    });

    expect(valueFor(layout, 'total-liabilities-equity')).toBe(0.3);
  });

  it('rounds reported currency totals to cents (old float: 0.202)', () => {
    const layout = generateProfitAndLossLayout({
      productRevenue: { [PERIOD]: 0.101 },
      serviceRevenue: { [PERIOD]: 0.101 },
    });

    expect(valueFor(layout, 'total-revenue')).toBe(0.2);
  });

  it('continues to treat null currency inputs as zero', () => {
    const layout = generateProfitAndLossLayout({
      productRevenue: { [PERIOD]: null },
      serviceRevenue: { [PERIOD]: 0.1 },
      otherRevenue: { [PERIOD]: 0.2 },
    });

    expect(valueFor(layout, 'total-revenue')).toBe(0.3);
  });
});

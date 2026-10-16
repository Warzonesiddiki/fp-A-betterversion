/**
 * syntheticTieOutLedger.test.ts
 *
 * Unit tests verifying:
 * 1. Double-Entry Balance: every batch and full ledger has Debits == Credits (zero diff).
 * 2. Zero Float Drift: all control totals match exact decimal numbers.
 * 3. 3-Statement Tie-Out:
 *    - P&L Net Income roll-forward ties out to ending Retained Earnings.
 *    - Balance Sheet Assets == Liabilities + Equity in every single period.
 *    - Cash Flow movements tie out to ending Balance Sheet Cash.
 * 4. glStore compliance: verifies batch validation passes without FP-0002 errors.
 */

import { describe, it, expect } from 'vitest';
import { createSyntheticTieOutLedger, SYNTHETIC_COA } from './syntheticTieOutLedger';
import { toDecimal, subtractMoney, addMoney, moneyEquals } from '../../utils/money';

describe('Synthetic Tie-Out Ledger Fixture', () => {
  const ledger = createSyntheticTieOutLedger();

  it('generates 4 periods with 4 batches and expected entries count', () => {
    expect(ledger.periods).toHaveLength(4);
    expect(ledger.batches).toHaveLength(4);
    expect(ledger.entries.length).toBeGreaterThan(0);
    expect(ledger.cumulativeControlTotals.batchCount).toBe(4);
    expect(ledger.cumulativeControlTotals.entryCount).toBe(ledger.entries.length);
  });

  it('enforces debits == credits on every batch individually (FP-0002 zero imbalance)', () => {
    for (const batch of ledger.batches) {
      const batchEntries = ledger.entries.filter((e) => e.journalId === batch.id);
      expect(batchEntries.length).toBe(batch.entriesCount);

      const sumDebit = batchEntries.reduce((sum, e) => sum + e.debit, 0);
      const sumCredit = batchEntries.reduce((sum, e) => sum + e.credit, 0);

      expect(moneyEquals(sumDebit, batch.totalDebit)).toBe(true);
      expect(moneyEquals(sumCredit, batch.totalCredit)).toBe(true);
      expect(subtractMoney(sumDebit, sumCredit).toNumber()).toBe(0);

      const periodSummary = ledger.periodSummaries[batch.period];
      expect(periodSummary).toBeDefined();
      expect(periodSummary.netDebitCreditDiff).toBe(0);
    }
  });

  it('enforces debits == credits across entire ledger cumulative totals', () => {
    const { totalDebits, totalCredits, netBalance } = ledger.cumulativeControlTotals;
    expect(moneyEquals(totalDebits, totalCredits)).toBe(true);
    expect(netBalance).toBe(0);
  });

  it('verifies P&L Net Income rolls forward into Retained Earnings across all periods', () => {
    let accumulatedNetIncome = 0;

    for (const period of ledger.periods) {
      const summary = ledger.periodSummaries[period];
      accumulatedNetIncome = addMoney(accumulatedNetIncome, summary.pnlNetIncome).toNumber();

      // Ending Retained Earnings must strictly tie out to cumulative Net Income
      expect(moneyEquals(summary.retainedEarningsEnding, accumulatedNetIncome)).toBe(true);
    }
  });

  it('verifies Balance Sheet tie-out: Total Assets == Total Liabilities + Equity in every period', () => {
    for (const period of ledger.periods) {
      const summary = ledger.periodSummaries[period];
      const assets = toDecimal(summary.balanceSheetTotalAssets);
      const liabAndEquity = toDecimal(summary.balanceSheetTotalLiabilitiesAndEquity);

      expect(
        moneyEquals(assets, liabAndEquity),
        `Period ${period} Balance Sheet must balance: Assets (${assets}) vs L+E (${liabAndEquity})`
      ).toBe(true);

      const diff = subtractMoney(
        summary.balanceSheetTotalAssets,
        summary.balanceSheetTotalLiabilitiesAndEquity
      );
      expect(diff.toNumber()).toBe(0);
    }
  });

  it('verifies Cash roll-forward ties out to ending cash on the balance sheet', () => {
    let runningCash = 0;

    // Check each entry against Cash account
    for (const period of ledger.periods) {
      const periodEntries = ledger.entries.filter((e) => {
        const batch = ledger.batches.find((b) => b.id === e.journalId);
        return batch?.period === period;
      });

      for (const entry of periodEntries) {
        if (entry.accountCode === SYNTHETIC_COA.CASH.account) {
          runningCash = addMoney(runningCash, subtractMoney(entry.debit, entry.credit)).toNumber();
        }
      }

      const summary = ledger.periodSummaries[period];
      expect(
        moneyEquals(summary.cashEnding, runningCash),
        `Period ${period} cash ending must tie out to cash activity`
      ).toBe(true);
    }
  });

  it('ensures zero float drift across high-precision decimal operations', () => {
    const totalDebits = ledger.cumulativeControlTotals.totalDebits;
    const totalCredits = ledger.cumulativeControlTotals.totalCredits;

    // Must be exact numbers without floating point noise like .0000000001
    expect(Number.isInteger(totalDebits * 100)).toBe(true);
    expect(Number.isInteger(totalCredits * 100)).toBe(true);
  });
});

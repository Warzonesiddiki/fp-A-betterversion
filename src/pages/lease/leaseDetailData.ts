/**
 * Lease-detail schedules. The engine already emits cent-rounded figures;
 * this module only reshapes them for the page (first 12 liability periods,
 * annual ROU depreciation). No IEEE-754 money arithmetic.
 */
import { LeaseEngine, type LeaseContract } from '@/engines/LeaseEngine';
import { divideMoney, roundTo, subtractMoney, sumMoney } from '@/utils/money';

export interface AmortRow {
  month: string;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface DepRow {
  year: string;
  bookValue: number;
  depreciation: number;
  accumulated: number;
}

/** First 12 liability periods, still at the engine's two-decimal cents. */
export function liabilityAmortization(contract: LeaseContract): AmortRow[] {
  return LeaseEngine.calculateLeaseLiability(contract)
    .slice(0, 12)
    .map((e) => ({
      month: e.period,
      payment: e.payment,
      principal: e.reduction,
      interest: e.interest,
      balance: e.closingBalance,
    }));
}

/**
 * Annual ROU roll-forward. Accumulated depreciation is ROU opening −
 * remaining book, not a second independent sum of monthly charges.
 */
export function rouDepreciation(contract: LeaseContract, rouAsset: number): DepRow[] {
  const sched = LeaseEngine.calculateROUAsset(contract);
  const yearCount = Math.min(8, Math.ceil(sched.length / 12));
  return Array.from({ length: yearCount }, (_, i) => {
    const monthsPerYear = 12;
    const endMonth = (i + 1) * monthsPerYear;
    const entry = sched[Math.min(endMonth, sched.length) - 1];
    const bookValue = entry ? entry.closingBalance : 0;
    const depreciation = roundTo(
      sumMoney(sched.slice(i * monthsPerYear, endMonth).map((e) => e.depreciation)),
      2
    );
    return {
      year: `Year ${i + 1}`,
      bookValue,
      depreciation,
      accumulated: roundTo(subtractMoney(rouAsset, bookValue), 2),
    };
  });
}

/** Mean of posted rates (already in percent points). Not money. */
export function meanRate(rates: readonly number[]): number | null {
  if (rates.length === 0) return null;
  return roundTo(divideMoney(sumMoney(rates), rates.length), 2);
}

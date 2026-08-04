/**
 * @fileoverview Loan Amortization Engine — Full amortization schedules, balloon payments, prepayment modeling
 * @purity-tier 1 PURE
 * @iron-rule C1✓ No I/O | C2✓ No DOM | C3✓ Deterministic | C4✓ No global mutation
 * @category Treasury
 * @sector 16 (all)
 * @since 1.0.0
 * @author Metis (purity audit 2026-06-18, T-3.26.6 JSDoc bulk — 6th engine REMEDIATED after D-007 8th SHL CATCH)
 * @see docs/CAVEMAN_PERSIST/CYCLE_25_TURN_381_PLUS_METIS_T3_26_180_PLUS_ENGINES_PURE_FUNCTION_AUDIT_2ND_WITNESS_v0_2.md
 */

// Loan Amortization Engine — Full schedules, balloon payments, prepayment

import Decimal from 'decimal.js';
import {
  addMoney,
  divideMoney,
  roundMoney,
  roundTo,
  subtractMoney,
  sumMoney,
  toDecimal,
} from '@/utils/money';

export interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface AmortizationResult {
  schedule: AmortizationRow[];
  totalInterest: number;
  totalPayment: number;
  monthlyPayment: number;
}

export class LoanAmortizationEngine {
  /** Decimal monthly payment — kept in Decimal so the schedule never round-trips
   * the payment through a JS number (which would reintroduce IEEE-754 drift). */
  private static pmtDecimal(principal: number, annualRate: number, months: number): Decimal {
    if (annualRate === 0) return toDecimal(principal).div(months);
    const r = toDecimal(annualRate).div(12);
    const pow = new Decimal(1).plus(r).pow(months); // (1 + r)^months
    return toDecimal(principal).times(r).times(pow).div(pow.minus(1));
  }

  static monthlyPayment(principal: number, annualRate: number, months: number): number {
    // P = principal * r * (1+r)^n / ((1+r)^n - 1)  — Decimal, paid in cents
    return roundTo(LoanAmortizationEngine.pmtDecimal(principal, annualRate, months));
  }

  static schedule(
    principal: number,
    annualRate: number,
    months: number,
    _startDate?: string
  ): AmortizationResult {
    const pmt = roundMoney(LoanAmortizationEngine.pmtDecimal(principal, annualRate, months));
    const r = annualRate === 0 ? new Decimal(0) : toDecimal(annualRate).div(12);
    const rows: AmortizationRow[] = [];
    let balance = toDecimal(principal);
    let totalInterest = new Decimal(0);

    for (let m = 1; m <= months; m++) {
      // Interest is rounded to the cent each period (ROUND_HALF_UP) — real loans
      // accrue in cents, and this is where IEEE-754 drift otherwise accumulates.
      const interest = roundMoney(balance.times(r));
      let principalPaid: Decimal;
      let payment: Decimal;
      if (m === months) {
        // Final period: pay off the exact remaining balance so it lands on 0.00,
        // rather than letting 360 periods of float drift strand a few cents.
        principalPaid = balance;
        payment = interest.plus(principalPaid);
      } else {
        payment = pmt;
        principalPaid = payment.minus(interest);
      }
      balance = Decimal.max(new Decimal(0), balance.minus(principalPaid));
      totalInterest = totalInterest.plus(interest);
      rows.push({
        month: m,
        payment: roundTo(payment),
        principal: roundTo(principalPaid),
        interest: roundTo(interest),
        balance: roundTo(balance),
      });
    }

    const totalPayment = rows.reduce((sum, row) => sum + row.payment, 0);
    return {
      schedule: rows,
      totalInterest: roundTo(totalInterest),
      totalPayment: roundTo(totalPayment),
      monthlyPayment: roundTo(pmt),
    };
  }

  static totalInterest(schedule: AmortizationRow[]): number {
    // Interest rows are currency: exact decimal sum (F-0006).
    return roundTo(sumMoney(schedule.map((row) => row.interest)));
  }

  static withPrepayment(
    schedule: AmortizationRow[],
    prepaymentAmount: number,
    month: number
  ): AmortizationRow[] {
    const result: AmortizationRow[] = [];
    let balance = addMoney(schedule[0]!.balance, schedule[0]!.principal);
    for (const row of schedule) {
      if (row.month === month) {
        balance = Decimal.max(toDecimal(0), subtractMoney(row.balance, prepaymentAmount));
      }
      if (row.month < month) {
        result.push({ ...row });
      } else {
        // Interest accrues on the (possibly prepaid) balance at the row's
        // implicit rate — exact decimal product, cent-rounded like the main
        // schedule path. A zero-balance source row (final amortized row)
        // implies no accrual (mirrors the old `|| 0` guard, without silently
        // hiding a real divide-by-zero elsewhere).
        const ratio = row.balance !== 0 ? divideMoney(row.interest, row.balance) : toDecimal(0);
        const interest = roundMoney(balance.times(ratio));
        const principalPaid = subtractMoney(row.payment, interest);
        balance = Decimal.max(toDecimal(0), subtractMoney(balance, principalPaid));
        result.push({
          month: row.month,
          payment: row.payment,
          principal: roundTo(principalPaid),
          interest: roundTo(interest),
          balance: roundTo(balance),
        });
      }
    }
    return result;
  }

  static balloonPayment(
    principal: number,
    annualRate: number,
    months: number,
    balloonMonth: number
  ): AmortizationResult {
    // Monthly rate = annual/12 — a unitless ratio; the balance × rate
    // product is currency (exact decimal, cent-rounded).
    const r = toDecimal(annualRate).div(12);
    const pmt = this.monthlyPayment(principal, annualRate, months);
    const rows: AmortizationRow[] = [];
    let balance = toDecimal(principal);
    let totalInterest = toDecimal(0);

    for (let m = 1; m <= balloonMonth; m++) {
      const interest = roundMoney(balance.times(r));
      const principalPaid = subtractMoney(pmt, interest);
      balance = Decimal.max(toDecimal(0), subtractMoney(balance, principalPaid));
      totalInterest = totalInterest.plus(interest);
      rows.push({
        month: m,
        payment: m === balloonMonth ? roundTo(addMoney(balance, interest)) : pmt,
        principal: m === balloonMonth ? roundTo(balance) : roundTo(principalPaid),
        interest: roundTo(interest),
        balance: m === balloonMonth ? 0 : roundTo(balance),
      });
    }

    return {
      schedule: rows,
      totalInterest: roundTo(totalInterest),
      totalPayment: roundTo(sumMoney(rows.map((r) => r.payment))),
      monthlyPayment: pmt,
    };
  }
}

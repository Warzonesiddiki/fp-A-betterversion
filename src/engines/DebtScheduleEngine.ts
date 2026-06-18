/**
 * @fileoverview Debt Schedule Engine — Debt amortization with circular interest
 * Supports multiple debt instruments, prepayment, refinancing
 * Pure TypeScript, deterministic, testable
 * @purity-tier 1 PURE
 * @iron-rule C1✓ No I/O | C2✓ No DOM | C3✓ Deterministic | C4✓ No global mutation
 * @category Treasury
 * @sector 16 (all)
 * @since 1.0.0
 * @author Metis (purity audit 2026-06-18, T-3.26.6 JSDoc bulk — 11th engine)
 * @see docs/CAVEMAN_PERSIST/CYCLE_25_TURN_381_PLUS_METIS_T3_26_180_PLUS_ENGINES_PURE_FUNCTION_AUDIT_2ND_WITNESS_v0_2.md
 */
/* eslint-disable @typescript-eslint/no-unused-vars */
// =============================================================================
// DEBT SCHEDULE ENGINE — Debt amortization with circular interest
// Supports multiple debt instruments, prepayment, refinancing
// Pure TypeScript, deterministic, testable
// =============================================================================

export interface DebtInstrument {
  id: string;
  name: string;
  principal: number;
  rate: number; // Annual interest rate (decimal)
  termMonths: number;
  startDate: string;
  type: 'term_loan' | 'revolver' | 'bond' | 'mortgage';
  paymentFrequency: 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
  amortizationType: 'fully_amortizing' | 'interest_only' | 'balloon' | 'bullet';
  balloonAmount?: number;
}

export interface AmortizationEntry {
  period: number;
  date: string;
  beginningBalance: number;
  payment: number;
  principal: number;
  interest: number;
  endingBalance: number;
  cumulativePrincipal: number;
  cumulativeInterest: number;
}

export interface DebtScheduleResult {
  instrument: DebtInstrument;
  schedule: AmortizationEntry[];
  totalPayments: number;
  totalPrincipal: number;
  totalInterest: number;
  effectiveRate: number;
}

export interface ConsolidatedDebtSchedule {
  instruments: DebtScheduleResult[];
  totalDebt: number;
  totalMonthlyPayment: number;
  totalInterestPaid: number;
  weightedAverageRate: number;
  debtServiceCoverageRatio?: number;
}

export class DebtScheduleEngine {
  /**
   * Generate an amortization schedule for a single debt instrument.
   */
  static amortize(instrument: DebtInstrument): DebtScheduleResult {
    const schedule: AmortizationEntry[] = [];
    const periodsPerYear = this.getPeriodsPerYear(instrument.paymentFrequency);
    const periodicRate = instrument.rate / periodsPerYear;
    const totalPayments = instrument.termMonths;

    let balance = instrument.principal;
    let cumulativePrincipal = 0;
    let cumulativeInterest = 0;

    const monthlyPayment = this.calculatePayment(
      instrument.principal,
      periodicRate,
      totalPayments,
      instrument.amortizationType,
      instrument.balloonAmount
    );

    for (let period = 1; period <= totalPayments; period++) {
      const interest = balance * periodicRate;
      let principal: number;
      let payment: number;

      if (instrument.amortizationType === 'interest_only') {
        payment = interest;
        principal = 0;
      } else if (instrument.amortizationType === 'balloon' && period === totalPayments) {
        payment = balance + interest;
        principal = balance;
      } else if (instrument.amortizationType === 'bullet' && period === totalPayments) {
        payment = instrument.principal + interest;
        principal = instrument.principal;
      } else {
        payment = monthlyPayment;
        principal = payment - interest;
      }

      balance = Math.max(0, balance - principal);
      cumulativePrincipal += principal;
      cumulativeInterest += interest;

      const date = this.addMonths(instrument.startDate, period);
      schedule.push({
        period,
        date,
        beginningBalance: balance + principal,
        payment,
        principal,
        interest,
        endingBalance: balance,
        cumulativePrincipal,
        cumulativeInterest,
      });
    }

    const totalPaid = schedule.reduce((s, e) => s + e.payment, 0);
    const totalPrinc = schedule.reduce((s, e) => s + e.principal, 0);
    const totalInt = schedule.reduce((s, e) => s + e.interest, 0);

    return {
      instrument,
      schedule,
      totalPayments: totalPaid,
      totalPrincipal: totalPrinc,
      totalInterest: totalInt,
      effectiveRate:
        instrument.principal > 0
          ? (totalInt / instrument.principal) * (12 / instrument.termMonths)
          : 0,
    };
  }

  /**
   * Generate a consolidated debt schedule for multiple instruments.
   */
  static consolidate(instruments: DebtInstrument[], ebitda?: number): ConsolidatedDebtSchedule {
    const results = instruments.map((i) => this.amortize(i));
    const totalDebt = instruments.reduce((s, i) => s + i.principal, 0);
    const totalMonthlyPayment = results.reduce((s, r) => {
      const firstPayment = r.schedule[0]?.payment ?? 0;
      return s + firstPayment;
    }, 0);
    const totalInterest = results.reduce((s, r) => s + r.totalInterest, 0);
    const weightedAverageRate =
      totalDebt > 0 ? instruments.reduce((s, i) => s + i.rate * i.principal, 0) / totalDebt : 0;

    const annualDebtService = totalMonthlyPayment * 12;
    const dscr = ebitda != null && annualDebtService > 0 ? ebitda / annualDebtService : undefined;

    return {
      instruments: results,
      totalDebt,
      totalMonthlyPayment,
      totalInterestPaid: totalInterest,
      weightedAverageRate,
      debtServiceCoverageRatio: dscr,
    };
  }

  /**
   * Refinance analysis: compare current vs refinanced terms.
   */
  static refinance(
    current: DebtInstrument,
    newRate: number,
    newTermMonths: number,
    refinancingCosts: number
  ): {
    monthlySavings: number;
    totalSavings: number;
    breakEvenMonths: number;
    netPresentValue: number;
  } {
    const currentResult = this.amortize(current);
    const refinanced: DebtInstrument = { ...current, rate: newRate, termMonths: newTermMonths };
    const refiResult = this.amortize(refinanced);

    const currentPayment = currentResult.schedule[0]?.payment ?? 0;
    const refiPayment = refiResult.schedule[0]?.payment ?? 0;
    const monthlySavings = currentPayment - refiPayment;
    const totalSavings = currentResult.totalPayments - refiResult.totalPayments - refinancingCosts;
    const breakEvenMonths =
      monthlySavings > 0 ? Math.ceil(refinancingCosts / monthlySavings) : Infinity;
    const npv = totalSavings; // Simplified NPV

    return { monthlySavings, totalSavings, breakEvenMonths, netPresentValue: npv };
  }

  private static calculatePayment(
    principal: number,
    rate: number,
    periods: number,
    type: DebtInstrument['amortizationType'],
    balloon?: number
  ): number {
    if (type === 'interest_only' || type === 'bullet') return principal * rate;
    if (rate === 0) return principal / periods;
    return (principal * (rate * Math.pow(1 + rate, periods))) / (Math.pow(1 + rate, periods) - 1);
  }

  private static getPeriodsPerYear(freq: DebtInstrument['paymentFrequency']): number {
    switch (freq) {
      case 'monthly':
        return 12;
      case 'quarterly':
        return 4;
      case 'semi_annual':
        return 2;
      case 'annual':
        return 1;
    }
  }

  private static addMonths(dateStr: string, months: number): string {
    const d = new Date(dateStr);
    d.setMonth(d.getMonth() + months);
    return d.toISOString().slice(0, 10);
  }
}

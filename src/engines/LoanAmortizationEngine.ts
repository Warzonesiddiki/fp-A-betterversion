/* eslint-disable @typescript-eslint/no-unused-vars */
// Loan Amortization Engine — Full schedules, balloon payments, prepayment

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
  static monthlyPayment(principal: number, annualRate: number, months: number): number {
    if (annualRate === 0) return principal / months;
    const r = annualRate / 12;
    return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  }

  static schedule(
    principal: number,
    annualRate: number,
    months: number,
    startDate?: string
  ): AmortizationResult {
    const pmt = this.monthlyPayment(principal, annualRate, months);
    const r = annualRate / 12;
    const rows: AmortizationRow[] = [];
    let balance = principal;
    let totalInterest = 0;

    for (let m = 1; m <= months; m++) {
      const interest = balance * r;
      const principalPaid = pmt - interest;
      balance = Math.max(0, balance - principalPaid);
      totalInterest += interest;
      rows.push({ month: m, payment: pmt, principal: principalPaid, interest, balance });
    }

    return { schedule: rows, totalInterest, totalPayment: pmt * months, monthlyPayment: pmt };
  }

  static totalInterest(schedule: AmortizationRow[]): number {
    return schedule.reduce((sum, row) => sum + row.interest, 0);
  }

  static withPrepayment(
    schedule: AmortizationRow[],
    prepaymentAmount: number,
    month: number
  ): AmortizationRow[] {
    const result: AmortizationRow[] = [];
    let balance = schedule[0]!.balance + schedule[0]!.principal;
    for (const row of schedule) {
      if (row.month === month) {
        balance = Math.max(0, row.balance - prepaymentAmount);
      }
      if (row.month < month) {
        result.push({ ...row });
      } else {
        const interest = balance * (row.interest / row.balance || 0);
        const principalPaid = row.payment - interest;
        balance = Math.max(0, balance - principalPaid);
        result.push({
          month: row.month,
          payment: row.payment,
          principal: principalPaid,
          interest,
          balance,
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
    const r = annualRate / 12;
    const pmt = this.monthlyPayment(principal, annualRate, months);
    const rows: AmortizationRow[] = [];
    let balance = principal;
    let totalInterest = 0;

    for (let m = 1; m <= balloonMonth; m++) {
      const interest = balance * r;
      const principalPaid = pmt - interest;
      balance = Math.max(0, balance - principalPaid);
      totalInterest += interest;
      rows.push({
        month: m,
        payment: m === balloonMonth ? balance + interest : pmt,
        principal: m === balloonMonth ? balance : principalPaid,
        interest,
        balance: m === balloonMonth ? 0 : balance,
      });
    }

    return {
      schedule: rows,
      totalInterest,
      totalPayment: rows.reduce((s, r) => s + r.payment, 0),
      monthlyPayment: pmt,
    };
  }
}

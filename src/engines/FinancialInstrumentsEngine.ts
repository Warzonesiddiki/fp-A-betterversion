/**
 * @fileoverview Financial Instruments Engine — Bond pricing, loan amortization, option pricing, DCF valuation
 * @purity-tier 1 PURE
 * @iron-rule C1✓ No I/O | C2✓ No DOM | C3✓ Deterministic | C4✓ No global mutation
 * @category Financial Instruments
 * @sector 7 (Capital Markets / Treasury)
 * @since 1.0.0
 * @author Metis (purity audit 2026-06-18, T-3.26.6 JSDoc bulk — 29th engine)
 * @see docs/CAVEMAN_PERSIST/CYCLE_25_TURN_381_PLUS_METIS_T3_26_180_PLUS_ENGINES_PURE_FUNCTION_AUDIT_2ND_WITNESS_v0_2.md
 */

export interface BondPricingResult {
  price: number;
  yield: number;
  duration: number;
  convexity: number;
  accruedInterest: number;
}

export interface AmortizationEntry {
  period: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface OptionGreeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

export interface OptionPricingResult {
  callPrice: number;
  putPrice: number;
  greeks: OptionGreeks;
}

export interface DCFResult {
  freeCashFlows: number[];
  terminalValue: number;
  enterpriseValue: number;
  equityValue: number;
  wacc: number;
}

export class FinancialInstrumentsEngine {
  // ---------------------------------------------------------------------------
  // Bond Pricing
  // ---------------------------------------------------------------------------

  static bondPrice(
    faceValue: number,
    couponRate: number,
    yieldToMaturity: number,
    periodsToMaturity: number,
    periodsPerYear: number = 2
  ): number {
    const coupon = (faceValue * couponRate) / periodsPerYear;
    const ytm = yieldToMaturity / periodsPerYear;
    const n = periodsToMaturity * periodsPerYear;

    let price = 0;
    for (let t = 1; t <= n; t++) {
      price += coupon / Math.pow(1 + ytm, t);
    }
    price += faceValue / Math.pow(1 + ytm, n);
    return price;
  }

  static bondYTM(
    faceValue: number,
    couponRate: number,
    price: number,
    periodsToMaturity: number,
    periodsPerYear: number = 2,
    tolerance: number = 1e-8,
    maxIterations: number = 100
  ): number {
    let ytm = couponRate;
    for (let i = 0; i < maxIterations; i++) {
      const calcPrice = this.bondPrice(
        faceValue,
        couponRate,
        ytm,
        periodsToMaturity,
        periodsPerYear
      );
      const diff = calcPrice - price;
      if (Math.abs(diff) < tolerance) break;

      const derivative = this.bondPriceDerivative(
        faceValue,
        couponRate,
        ytm,
        periodsToMaturity,
        periodsPerYear
      );
      ytm -= diff / derivative;
    }
    return ytm;
  }

  private static bondPriceDerivative(
    faceValue: number,
    couponRate: number,
    ytm: number,
    periodsToMaturity: number,
    periodsPerYear: number
  ): number {
    const h = 1e-6;
    const p1 = this.bondPrice(faceValue, couponRate, ytm + h, periodsToMaturity, periodsPerYear);
    const p2 = this.bondPrice(faceValue, couponRate, ytm - h, periodsToMaturity, periodsPerYear);
    return (p1 - p2) / (2 * h);
  }

  static bondDuration(
    faceValue: number,
    couponRate: number,
    ytm: number,
    periodsToMaturity: number,
    periodsPerYear: number = 2
  ): number {
    const coupon = (faceValue * couponRate) / periodsPerYear;
    const rate = ytm / periodsPerYear;
    const n = periodsToMaturity * periodsPerYear;
    const price = this.bondPrice(faceValue, couponRate, ytm, periodsToMaturity, periodsPerYear);

    let weightedCF = 0;
    for (let t = 1; t <= n; t++) {
      weightedCF += (t * coupon) / Math.pow(1 + rate, t);
    }
    weightedCF += (n * faceValue) / Math.pow(1 + rate, n);

    return weightedCF / price / periodsPerYear;
  }

  static bondConvexity(
    faceValue: number,
    couponRate: number,
    ytm: number,
    periodsToMaturity: number,
    periodsPerYear: number = 2
  ): number {
    const coupon = (faceValue * couponRate) / periodsPerYear;
    const rate = ytm / periodsPerYear;
    const n = periodsToMaturity * periodsPerYear;
    const price = this.bondPrice(faceValue, couponRate, ytm, periodsToMaturity, periodsPerYear);

    let convexity = 0;
    for (let t = 1; t <= n; t++) {
      convexity += (coupon * t * (t + 1)) / Math.pow(1 + rate, t + 2);
    }
    convexity += (faceValue * n * (n + 1)) / Math.pow(1 + rate, n + 2);

    return convexity / (price * periodsPerYear * periodsPerYear);
  }

  static accruedInterest(
    faceValue: number,
    couponRate: number,
    daysSinceLastCoupon: number,
    daysInCouponPeriod: number,
    periodsPerYear: number = 2
  ): number {
    return ((faceValue * couponRate) / periodsPerYear) * (daysSinceLastCoupon / daysInCouponPeriod);
  }

  // ---------------------------------------------------------------------------
  // Loan Amortization
  // ---------------------------------------------------------------------------

  static loanAmortization(
    principal: number,
    annualRate: number,
    termMonths: number,
    _startDate?: Date
  ): AmortizationEntry[] {
    const monthlyRate = annualRate / 12;
    const payment =
      (principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths))) /
      (Math.pow(1 + monthlyRate, termMonths) - 1);

    const schedule: AmortizationEntry[] = [];
    let balance = principal;

    for (let period = 1; period <= termMonths; period++) {
      const interest = balance * monthlyRate;
      const principalPaid = payment - interest;
      balance -= principalPaid;

      schedule.push({
        period,
        payment,
        principal: principalPaid,
        interest,
        balance: Math.max(0, balance),
      });
    }

    return schedule;
  }

  static loanPayment(principal: number, annualRate: number, termMonths: number): number {
    const monthlyRate = annualRate / 12;
    return (
      (principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths))) /
      (Math.pow(1 + monthlyRate, termMonths) - 1)
    );
  }

  // ---------------------------------------------------------------------------
  // Option Pricing (Black-Scholes)
  // ---------------------------------------------------------------------------

  static blackScholes(
    spot: number,
    strike: number,
    timeToExpiry: number,
    riskFreeRate: number,
    volatility: number
  ): OptionPricingResult {
    const d1 =
      (Math.log(spot / strike) + (riskFreeRate + (volatility * volatility) / 2) * timeToExpiry) /
      (volatility * Math.sqrt(timeToExpiry));
    const d2 = d1 - volatility * Math.sqrt(timeToExpiry);

    const callPrice =
      spot * this.normCDF(d1) - strike * Math.exp(-riskFreeRate * timeToExpiry) * this.normCDF(d2);
    const putPrice =
      strike * Math.exp(-riskFreeRate * timeToExpiry) * this.normCDF(-d2) -
      spot * this.normCDF(-d1);

    const delta = this.normCDF(d1);
    const gamma = this.normPDF(d1) / (spot * volatility * Math.sqrt(timeToExpiry));
    const theta =
      -(spot * this.normPDF(d1) * volatility) / (2 * Math.sqrt(timeToExpiry)) -
      riskFreeRate * strike * Math.exp(-riskFreeRate * timeToExpiry) * this.normCDF(d2);
    const vega = spot * this.normPDF(d1) * Math.sqrt(timeToExpiry);
    const rho = strike * timeToExpiry * Math.exp(-riskFreeRate * timeToExpiry) * this.normCDF(d2);

    return {
      callPrice,
      putPrice,
      greeks: { delta, gamma, theta, vega, rho },
    };
  }

  private static normCDF(x: number): number {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return 0.5 * (1.0 + sign * y);
  }

  private static normPDF(x: number): number {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
  }

  // ---------------------------------------------------------------------------
  // DCF Valuation
  // ---------------------------------------------------------------------------

  static dcfValuation(
    freeCashFlows: number[],
    terminalGrowthRate: number,
    wacc: number,
    netDebt: number,
    sharesOutstanding: number
  ): DCFResult {
    const lastFCF = freeCashFlows[freeCashFlows.length - 1];
    const terminalValue = (lastFCF! * (1 + terminalGrowthRate)) / (wacc - terminalGrowthRate);

    let pvFCFs = 0;
    for (let i = 0; i < freeCashFlows.length; i++) {
      pvFCFs += freeCashFlows![i]! / Math.pow(1 + wacc, i + 1);
    }

    const pvTerminal = terminalValue / Math.pow(1 + wacc, freeCashFlows.length);
    const enterpriseValue = pvFCFs + pvTerminal;
    const equityValue = (enterpriseValue - netDebt) / sharesOutstanding;

    return {
      freeCashFlows,
      terminalValue,
      enterpriseValue,
      equityValue,
      wacc,
    };
  }

  static wacc(
    equityValue: number,
    debtValue: number,
    costOfEquity: number,
    costOfDebt: number,
    taxRate: number
  ): number {
    const total = equityValue + debtValue;
    const equityWeight = equityValue / total;
    const debtWeight = debtValue / total;
    return equityWeight * costOfEquity + debtWeight * costOfDebt * (1 - taxRate);
  }

  // ---------------------------------------------------------------------------
  // Comparable Analysis
  // ---------------------------------------------------------------------------

  static comparableMultiples(
    enterpriseValue: number,
    revenue: number,
    ebitda: number,
    netIncome: number,
    sharesOutstanding: number,
    stockPrice: number
  ): Record<string, number> {
    return {
      evRevenue: enterpriseValue / revenue,
      evEbitda: enterpriseValue / ebitda,
      peRatio: (stockPrice * sharesOutstanding) / netIncome,
      priceToSales: (stockPrice * sharesOutstanding) / revenue,
    };
  }

  // ---------------------------------------------------------------------------
  // Yield Curve
  // ---------------------------------------------------------------------------

  static linearInterpolation(x: number[], y: number[], targetX: number): number {
    for (let i = 0; i < x.length - 1; i++) {
      if (targetX >= x![i]! && targetX <= x![i + 1]!) {
        const t = (targetX - x![i]!) / (x![i + 1]! - x![i]!);
        return y![i]! + t * (y![i + 1]! - y![i]!);
      }
    }
    return targetX <= x![0]! ? y[0]! : y[y.length - 1]!;
  }

  // ---------------------------------------------------------------------------
  // Credit Risk
  // ---------------------------------------------------------------------------

  static expectedLoss(
    probabilityOfDefault: number,
    lossGivenDefault: number,
    exposureAtDefault: number
  ): number {
    return probabilityOfDefault * lossGivenDefault * exposureAtDefault;
  }
}

// Bond Pricing Engine — Yield to maturity, duration, convexity, accrued interest

export interface BondResult {
  price: number;
  dirtyPrice: number;
  cleanPrice: number;
  accruedInterest: number;
}

export interface BondDuration {
  macaulay: number;
  modified: number;
  convexity: number;
}

export class BondPricingEngine {
  static price(faceValue: number, couponRate: number, ytm: number, periods: number): number {
    if (ytm === 0) return faceValue + faceValue * couponRate * periods;
    const c = faceValue * couponRate;
    const pvCoupons = (c * (1 - Math.pow(1 + ytm, -periods))) / ytm;
    const pvFace = faceValue / Math.pow(1 + ytm, periods);
    return pvCoupons + pvFace;
  }

  static yieldToMaturity(
    price: number,
    faceValue: number,
    couponRate: number,
    periods: number
  ): number {
    const c = faceValue * couponRate;
    let ytm = couponRate + (faceValue - price) / (periods * faceValue);
    for (let i = 0; i < 100; i++) {
      const p = this.price(faceValue, couponRate, ytm, periods);
      const dp = this.priceDerivative(faceValue, couponRate, ytm, periods);
      if (Math.abs(dp) < 1e-12) break;
      const next = ytm - (p - price) / dp;
      if (Math.abs(next - ytm) < 1e-10) return next;
      ytm = next;
    }
    return ytm;
  }

  static duration(
    faceValue: number,
    couponRate: number,
    ytm: number,
    periods: number
  ): BondDuration {
    const c = faceValue * couponRate;
    const p = this.price(faceValue, couponRate, ytm, periods);
    let macaulayNum = 0;
    let convexityNum = 0;
    for (let t = 1; t <= periods; t++) {
      const cf = t === periods ? c + faceValue : c;
      const pv = cf / Math.pow(1 + ytm, t);
      macaulayNum += t * pv;
      convexityNum += t * (t + 1) * pv;
    }
    const macaulay = macaulayNum / p;
    const modified = macaulay / (1 + ytm);
    const convexity = convexityNum / (p * Math.pow(1 + ytm, 2));
    return { macaulay, modified, convexity };
  }

  static accruedInterest(
    faceValue: number,
    couponRate: number,
    daysSinceLastCoupon: number,
    daysInPeriod: number
  ): number {
    return faceValue * couponRate * (daysSinceLastCoupon / daysInPeriod);
  }

  static dirtyPrice(
    cleanPrice: number,
    faceValue: number,
    couponRate: number,
    daysSinceLastCoupon: number,
    daysInPeriod: number
  ): number {
    return (
      cleanPrice + this.accruedInterest(faceValue, couponRate, daysSinceLastCoupon, daysInPeriod)
    );
  }

  private static priceDerivative(
    faceValue: number,
    couponRate: number,
    ytm: number,
    periods: number
  ): number {
    const dy = 0.0001;
    const p1 = this.price(faceValue, couponRate, ytm + dy, periods);
    const p2 = this.price(faceValue, couponRate, ytm - dy, periods);
    return (p1 - p2) / (2 * dy);
  }
}

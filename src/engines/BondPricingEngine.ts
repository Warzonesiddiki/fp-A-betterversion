// @money-ast-allow Reason: Day-count fraction: daysSinceLastCoupon / daysInPeriod is a dimensionless accrual ratio, not money
/**
 * @fileoverview Bond Pricing Engine — Yield to maturity, Macaulay/modified duration, convexity, accrued interest
 * @purity-tier 1 PURE
 * @iron-rule C1✓ No I/O | C2✓ No DOM | C3✓ Deterministic | C4✓ No global mutation
 * @category Treasury
 * @sector 16 (all)
 * @since 1.0.0
 * @author Metis (purity audit 2026-06-18, T-3.26.6 JSDoc bulk — 2nd engine REMEDIATED after D-007 8th SHL CATCH)
 * @see docs/CAVEMAN_PERSIST/CYCLE_25_TURN_381_PLUS_METIS_T3_26_180_PLUS_ENGINES_PURE_FUNCTION_AUDIT_2ND_WITNESS_v0_2.md
 *
 * MONEY MIGRATION (2026-08-03): Bond prices, accrued interest and dirty
 * prices are money and flow through the canonical money primitive
 * (src/utils/money.ts, decimal.js, ROUND_HALF_UP), cent-rounded on output.
 * YTM, duration and convexity are RATES/metrics, not money; they are computed
 * from Decimal-precision money intermediates but returned as float metrics.
 * No raw + - * / on currency values remains.
 */
import Decimal from 'decimal.js';
import {
  addMoney,
  divideMoney,
  multiplyMoney,
  roundTo,
  subtractMoney,
  toDecimal,
} from '../utils/money';

const CURRENCY_PLACES = 2;

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
    return roundTo(this.priceDec(faceValue, couponRate, ytm, periods), CURRENCY_PLACES);
  }

  /** Full-precision price (Decimal) — internal consumers (YTM root-find, duration) use this. */
  private static priceDec(
    faceValue: number,
    couponRate: number,
    ytm: number,
    periods: number
  ): Decimal {
    if (ytm === 0) {
      // faceValue + faceValue * couponRate * periods
      return addMoney(faceValue, multiplyMoney(multiplyMoney(faceValue, couponRate), periods));
    }
    const c = multiplyMoney(faceValue, couponRate);
    // Discount factors are ratios, not money — float ratio math is preserved.
    const pvCoupons = c.times((1 - Math.pow(1 + ytm, -periods)) / ytm);
    const pvFace = toDecimal(faceValue).times(Math.pow(1 + ytm, -periods));
    return pvCoupons.plus(pvFace);
  }

  static yieldToMaturity(
    price: number,
    faceValue: number,
    couponRate: number,
    periods: number
  ): number {
    const priceDec = toDecimal(price);
    const faceDec = toDecimal(faceValue);
    // Initial guess: couponRate + (faceValue - price) / (periods * faceValue)
    const denom = toDecimal(periods).times(faceDec);
    let ytm = toDecimal(couponRate)
      .plus(divideMoney(subtractMoney(faceDec, priceDec), denom))
      .toNumber();
    for (let i = 0; i < 100; i++) {
      const p = this.priceDec(faceValue, couponRate, ytm, periods);
      const dp = this.priceDerivative(faceValue, couponRate, ytm, periods);
      if (Math.abs(dp) < 1e-12) break;
      const next = ytm - divideMoney(subtractMoney(p, priceDec), dp).toNumber();
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
    const c = multiplyMoney(faceValue, couponRate);
    const p = this.priceDec(faceValue, couponRate, ytm, periods);
    let macaulayNum = toDecimal(0);
    let convexityNum = toDecimal(0);
    for (let t = 1; t <= periods; t++) {
      const cf = t === periods ? addMoney(c, faceValue) : c;
      const pv = divideMoney(cf, Math.pow(1 + ytm, t));
      macaulayNum = addMoney(macaulayNum, multiplyMoney(toDecimal(t), pv));
      convexityNum = addMoney(convexityNum, multiplyMoney(toDecimal(t * (t + 1)), pv));
    }
    const macaulay = macaulayNum.div(p).toNumber();
    const modified = macaulay / (1 + ytm);
    const convexity = convexityNum.div(p.times(Math.pow(1 + ytm, 2))).toNumber();
    return { macaulay, modified, convexity };
  }

  static accruedInterest(
    faceValue: number,
    couponRate: number,
    daysSinceLastCoupon: number,
    daysInPeriod: number
  ): number {
    return roundTo(
      multiplyMoney(faceValue, couponRate).times(daysSinceLastCoupon / daysInPeriod),
      CURRENCY_PLACES
    );
  }

  static dirtyPrice(
    cleanPrice: number,
    faceValue: number,
    couponRate: number,
    daysSinceLastCoupon: number,
    daysInPeriod: number
  ): number {
    return roundTo(
      addMoney(
        cleanPrice,
        this.accruedInterest(faceValue, couponRate, daysSinceLastCoupon, daysInPeriod)
      ),
      CURRENCY_PLACES
    );
  }

  private static priceDerivative(
    faceValue: number,
    couponRate: number,
    ytm: number,
    periods: number
  ): number {
    const dy = 0.0001;
    const p1 = this.priceDec(faceValue, couponRate, ytm + dy, periods);
    const p2 = this.priceDec(faceValue, couponRate, ytm - dy, periods);
    return subtractMoney(p1, p2)
      .div(2 * dy)
      .toNumber();
  }
}

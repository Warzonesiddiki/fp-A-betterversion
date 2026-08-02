/**
 * @fileoverview Lease Engine — ASC 842 / IFRS 16 lease accounting (ROU asset, lease liability, amortization schedule, lease classification)
 * @purity-tier 1 PURE
 * @iron-rule C1✓ No I/O | C2✓ No DOM | C3✓ Deterministic | C4✓ No global mutation
 * @category Treasury
 * @sector 16 (all)
 * @since 1.0.0
 * @author Metis (purity audit 2026-06-18, T-3.26.6 JSDoc bulk — 13th engine)
 * @see docs/CAVEMAN_PERSIST/CYCLE_25_TURN_381_PLUS_METIS_T3_26_180_PLUS_ENGINES_PURE_FUNCTION_AUDIT_2ND_WITNESS_v0_2.md
 */
import Decimal from 'decimal.js';
import { toDecimal, roundTo, sumMoney, subtractMoney, divideMoney } from '../utils/money';

/**
 * ASC 842 / IFRS 16 figures are balance-sheet and P&L amounts, so every value
 * here runs through the canonical money primitive (decimal.js, ROUND_HALF_UP)
 * and is rounded to cents.
 *
 * The monthly rate is derived as (1 + annualRate)^(1/12) - 1. A twelfth root is
 * IRRATIONAL, so it is computed with decimal.js at 40-digit precision rather
 * than Math.pow's 53-bit double — the discounting chain then compounds an exact
 * decimal instead of a rounded binary approximation.
 */
const CURRENCY_PLACES = 2;

/** Effective monthly rate from an annual rate, at decimal precision. */
function monthlyRateOf(annualRate: number): Decimal {
  return toDecimal(1)
    .plus(toDecimal(annualRate, 'discountRate'))
    .pow(toDecimal(1).div(12))
    .minus(1);
}

export interface LeaseContract {
  id: string;
  assetDescription: string;
  commencementDate: string;
  leaseTerm: number;
  leasePayments: number[];
  discountRate: number;
  residualValueGuarantee?: number;
  renewalOptions?: { term: number; certain: boolean }[];
  isShortTerm?: boolean;
  isLowValue?: boolean;
  transferOfOwnership?: boolean;
  purchaseOption?: { exercisePrice: number; reasonablyCertain: boolean };
  classification?: 'finance' | 'operating';
}

export interface ROUAssetSchedule {
  period: string;
  openingBalance: number;
  depreciation: number;
  closingBalance: number;
}

export interface LeaseLiabilitySchedule {
  period: string;
  openingBalance: number;
  payment: number;
  interest: number;
  reduction: number;
  closingBalance: number;
}

export class LeaseEngine {
  static calculateROUAsset(lease: LeaseContract): ROUAssetSchedule[] {
    if (!Array.isArray(lease.leasePayments) || lease.leasePayments.length === 0) {
      return [];
    }
    if (
      typeof lease.discountRate !== 'number' ||
      !Number.isFinite(lease.discountRate) ||
      lease.discountRate < 0
    ) {
      throw new Error('discountRate must be a non-negative finite number');
    }
    if (
      typeof lease.leaseTerm !== 'number' ||
      lease.leaseTerm <= 0 ||
      !Number.isFinite(lease.leaseTerm)
    ) {
      return [];
    }
    const pvPayments = this.presentValueDecimal(
      lease.leasePayments,
      monthlyRateOf(lease.discountRate)
    );
    const schedules: ROUAssetSchedule[] = [];
    const term = Math.max(1, lease.leaseTerm);
    const monthlyDepreciation = pvPayments.div(term);

    let balance = pvPayments;
    for (let i = 0; i < lease.leaseTerm; i++) {
      const opening = balance;
      balance = balance.minus(monthlyDepreciation);
      // The final period must land exactly on zero. Straight-line depreciation
      // of a value that does not divide evenly otherwise leaves a residue
      // (float left -7.4e-11 on a 36-month schedule), which then shows up as a
      // non-zero closing ROU asset on a fully amortized lease.
      const isFinal = i === lease.leaseTerm - 1;
      const closing = isFinal || balance.isNegative() ? new Decimal(0) : balance;
      schedules.push({
        period: `Month ${i + 1}`,
        openingBalance: roundTo(opening, CURRENCY_PLACES),
        depreciation: roundTo(monthlyDepreciation, CURRENCY_PLACES),
        closingBalance: roundTo(closing, CURRENCY_PLACES),
      });
    }

    return schedules;
  }

  static calculateLeaseLiability(lease: LeaseContract): LeaseLiabilitySchedule[] {
    if (!Array.isArray(lease.leasePayments) || lease.leasePayments.length === 0) {
      return [];
    }
    if (
      typeof lease.discountRate !== 'number' ||
      !Number.isFinite(lease.discountRate) ||
      lease.discountRate < 0
    ) {
      throw new Error('discountRate must be a non-negative finite number');
    }
    if (
      typeof lease.leaseTerm !== 'number' ||
      lease.leaseTerm <= 0 ||
      !Number.isFinite(lease.leaseTerm)
    ) {
      return [];
    }
    const monthlyRate = monthlyRateOf(lease.discountRate);
    let balance = this.presentValueDecimal(lease.leasePayments, monthlyRate);
    const schedules: LeaseLiabilitySchedule[] = [];

    for (let i = 0; i < lease.leaseTerm; i++) {
      const opening = balance;
      const payment = toDecimal(lease.leasePayments[i] || 0);
      const interest = opening.times(monthlyRate);
      const reduction = payment.minus(interest);
      // Carry FULL precision in the running balance; only the reported figures
      // are rounded. Rounding the balance each period would compound.
      balance = balance.minus(reduction);
      const closing = balance.isNegative() ? new Decimal(0) : balance;

      // The accounting identity payment = interest + reduction must hold on the
      // REPORTED (cent-rounded) figures, not just the exact ones. Rounding both
      // components independently can break it: interest 238.095 -> 238.10 and
      // reduction 4761.905 -> 4761.91 sum to 5000.01 against a 5000.00 payment.
      // Interest is rounded first (it is the contractual accrual) and reduction
      // is derived as the balancing figure, so the identity is exact by
      // construction.
      const paymentR = roundTo(payment, CURRENCY_PLACES);
      const interestR = roundTo(interest, CURRENCY_PLACES);
      const reductionR = roundTo(subtractMoney(paymentR, interestR), CURRENCY_PLACES);

      schedules.push({
        period: `Month ${i + 1}`,
        openingBalance: roundTo(opening, CURRENCY_PLACES),
        payment: paymentR,
        interest: interestR,
        reduction: reductionR,
        closingBalance: roundTo(closing, CURRENCY_PLACES),
      });
    }

    return schedules;
  }

  static testImpairment(
    asset: ROUAssetSchedule,
    fairValue: number,
    undiscountedCF: number
  ): { impaired: boolean; impairmentLoss: number } {
    if (undiscountedCF >= asset.closingBalance) {
      return { impaired: false, impairmentLoss: 0 };
    }
    const loss = subtractMoney(asset.closingBalance, fairValue);
    const impairmentLoss = loss.isNegative() ? 0 : roundTo(loss, CURRENCY_PLACES);
    return { impaired: impairmentLoss > 0, impairmentLoss };
  }

  /** Exact PV of a payment stream discounted at `monthlyRate` (decimal). */
  private static presentValueDecimal(payments: number[], monthlyRate: Decimal): Decimal {
    const onePlus = toDecimal(1).plus(monthlyRate);
    return payments.reduce(
      (acc: Decimal, p, i) => acc.plus(divideMoney(p, onePlus.pow(i + 1))),
      new Decimal(0)
    );
  }

  /**
   * ASC 842: Classify lease as finance or operating.
   * Finance if ANY of: transfer of ownership, purchase option reasonably certain,
   * lease term >= 75% of economic life, PV of payments >= 90% of fair value.
   * Otherwise operating.
   */
  static classifyLease(
    lease: LeaseContract,
    fairValue?: number,
    economicLife?: number
  ): 'finance' | 'operating' {
    if (lease.transferOfOwnership) return 'finance';
    if (lease.purchaseOption?.reasonablyCertain) return 'finance';
    if (economicLife && lease.leaseTerm >= economicLife * 0.75) return 'finance';
    if (fairValue) {
      const pv = this.presentValueDecimal(lease.leasePayments, monthlyRateOf(lease.discountRate));
      // ASC 842 90%-of-fair-value test, evaluated on exact decimals so a lease
      // sitting exactly on the threshold classifies deterministically.
      if (pv.gte(toDecimal(fairValue).times('0.9'))) return 'finance';
    }
    return 'operating';
  }

  /** ASC 842: Short-term lease exemption — leases ≤ 12 months with no purchase option. */
  static isShortTermLease(lease: LeaseContract): boolean {
    return lease.leaseTerm <= 12 && !lease.purchaseOption;
  }

  /** ASC 842: Low-value asset exemption — asset value ≤ $5,000 at commencement. */
  static isLowValueAsset(_lease: LeaseContract, assetValue: number): boolean {
    return assetValue <= 5000;
  }

  /**
   * Modify a lease: extend term, change payments, or change discount rate.
   * Returns a new lease with modification treated as a new lease (ASC 842-10-25-1).
   */
  static modifyLease(
    lease: LeaseContract,
    modifications: {
      newPayments?: number[];
      newDiscountRate?: number;
      additionalTerm?: number;
    }
  ): LeaseContract {
    const newPayments = modifications.newPayments ?? lease.leasePayments;
    const newRate = modifications.newDiscountRate ?? lease.discountRate;
    const newTerm = modifications.additionalTerm
      ? lease.leaseTerm + modifications.additionalTerm
      : lease.leaseTerm;

    // If additional term provided, extend payments with last known payment amount
    let extendedPayments = newPayments;
    if (modifications.additionalTerm && modifications.additionalTerm > 0) {
      const lastPayment = newPayments[newPayments.length - 1] ?? 0;
      extendedPayments = [...newPayments, ...Array(modifications.additionalTerm).fill(lastPayment)];
    }

    return {
      ...lease,
      leaseTerm: newTerm,
      leasePayments: extendedPayments,
      discountRate: newRate,
    };
  }

  /** Extend lease by additional months using current payment amount. */
  static extendLease(lease: LeaseContract, additionalMonths: number): LeaseContract {
    const lastPayment = lease.leasePayments[lease.leasePayments.length - 1] ?? 0;
    return {
      ...lease,
      leaseTerm: lease.leaseTerm + additionalMonths,
      leasePayments: [...lease.leasePayments, ...Array(additionalMonths).fill(lastPayment)],
    };
  }

  /** Terminate lease early at specified period. Returns remaining liability to derecognize. */
  static terminateLease(
    lease: LeaseContract,
    terminationPeriod: number,
    terminationFee: number = 0
  ): { remainingLiability: number; rouAssetRemoval: number; gainOrLoss: number } {
    const liabilitySchedule = this.calculateLeaseLiability(lease);
    const rouSchedule = this.calculateROUAsset(lease);

    const periodIndex = Math.min(terminationPeriod - 1, liabilitySchedule.length - 1);
    const remainingLiability = liabilitySchedule[periodIndex]?.closingBalance ?? 0;
    const rouAssetRemoval = rouSchedule[periodIndex]?.closingBalance ?? 0;
    // Gain (negative) or loss (positive) on termination
    const gainOrLoss = roundTo(
      sumMoney([remainingLiability, terminationFee]).minus(rouAssetRemoval),
      CURRENCY_PLACES
    );

    return { remainingLiability, rouAssetRemoval, gainOrLoss };
  }

  /** Generate ASC 842 disclosure summary for a lease. */
  static generateDisclosure(lease: LeaseContract): {
    leaseType: 'finance' | 'operating';
    rightOfUseAsset: number;
    leaseLiability: number;
    totalLeasePayments: number;
    weightedAverageDiscountRate: number;
    remainingTerm: number;
    isShortTerm: boolean;
    isLowValue: boolean;
  } {
    const pvPayments = roundTo(
      this.presentValueDecimal(lease.leasePayments, monthlyRateOf(lease.discountRate)),
      CURRENCY_PLACES
    );
    const leaseType = lease.classification ?? this.classifyLease(lease);

    return {
      leaseType,
      rightOfUseAsset: pvPayments,
      leaseLiability: pvPayments,
      totalLeasePayments: roundTo(sumMoney(lease.leasePayments), CURRENCY_PLACES),
      weightedAverageDiscountRate: lease.discountRate,
      remainingTerm: lease.leaseTerm,
      isShortTerm: lease.isShortTerm ?? this.isShortTermLease(lease),
      isLowValue: lease.isLowValue ?? false,
    };
  }
}

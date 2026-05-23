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
    const pvPayments = this.calculatePresentValue(
      lease.leasePayments,
      Math.pow(1 + lease.discountRate, 1 / 12) - 1
    );
    const schedules: ROUAssetSchedule[] = [];
    const monthlyDepreciation = pvPayments / Math.max(1, lease.leaseTerm);

    let balance = pvPayments;
    for (let i = 0; i < lease.leaseTerm; i++) {
      const opening = balance;
      balance -= monthlyDepreciation;
      schedules.push({
        period: `Month ${i + 1}`,
        openingBalance: opening,
        depreciation: monthlyDepreciation,
        closingBalance: Math.max(0, balance),
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
    const monthlyRate = Math.pow(1 + lease.discountRate, 1 / 12) - 1;
    let balance = this.calculatePresentValue(lease.leasePayments, monthlyRate);
    const schedules: LeaseLiabilitySchedule[] = [];

    for (let i = 0; i < lease.leaseTerm; i++) {
      const opening = balance;
      const payment = lease.leasePayments[i] || 0;
      const interest = opening * monthlyRate;
      const reduction = payment - interest;
      balance -= reduction;

      schedules.push({
        period: `Month ${i + 1}`,
        openingBalance: opening,
        payment,
        interest,
        reduction,
        closingBalance: Math.max(0, balance),
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
    const loss = Math.max(0, asset.closingBalance - fairValue);
    return { impaired: loss > 0, impairmentLoss: loss };
  }

  private static calculatePresentValue(payments: number[], monthlyRate: number): number {
    return payments.reduce((acc, p, i) => acc + p / Math.pow(1 + monthlyRate, i + 1), 0);
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
      const monthlyRate = Math.pow(1 + lease.discountRate, 1 / 12) - 1;
      const pv = this.calculatePresentValue(lease.leasePayments, monthlyRate);
      if (pv >= fairValue * 0.9) return 'finance';
    }
    return 'operating';
  }

  /** ASC 842: Short-term lease exemption — leases ≤ 12 months with no purchase option. */
  static isShortTermLease(lease: LeaseContract): boolean {
    return lease.leaseTerm <= 12 && !lease.purchaseOption;
  }

  /** ASC 842: Low-value asset exemption — asset value ≤ $5,000 at commencement. */
  static isLowValueAsset(lease: LeaseContract, assetValue: number): boolean {
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
    const gainOrLoss = remainingLiability + terminationFee - rouAssetRemoval;

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
    const pvPayments = this.calculatePresentValue(
      lease.leasePayments,
      Math.pow(1 + lease.discountRate, 1 / 12) - 1
    );
    const leaseType = lease.classification ?? this.classifyLease(lease);

    return {
      leaseType,
      rightOfUseAsset: pvPayments,
      leaseLiability: pvPayments,
      totalLeasePayments: lease.leasePayments.reduce((a, b) => a + b, 0),
      weightedAverageDiscountRate: lease.discountRate,
      remainingTerm: lease.leaseTerm,
      isShortTerm: lease.isShortTerm ?? this.isShortTermLease(lease),
      isLowValue: lease.isLowValue ?? false,
    };
  }
}

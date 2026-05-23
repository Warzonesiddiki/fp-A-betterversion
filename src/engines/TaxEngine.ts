export interface TaxProvisionInput {
  pretaxIncome: number;
  permanentDifferences: { description: string; amount: number }[];
  temporaryDifferences: { description: string; amount: number; reversalPeriod: string }[];
  taxRate: number;
  taxCredits: { description: string; amount: number }[];
  /** Loss carryforwards from prior periods */
  lossCarryforward?: number;
  /** Valuation allowance percentage (0-1) for DTA realizability */
  valuationAllowanceRate?: number;
  /** Jurisdiction identifier for multi-entity scenarios */
  jurisdiction?: string;
}

export interface TaxProvisionResult {
  currentTaxExpense: number;
  deferredTaxExpense: number;
  totalTaxExpense: number;
  effectiveTaxRate: number;
  taxableIncome: number;
  deferredTaxAsset: number;
  deferredTaxLiability: number;
  /** Net DTA after valuation allowance */
  netDeferredTaxAsset: number;
  /** Valuation allowance amount */
  valuationAllowance: number;
  /** Loss carryforward remaining after current year */
  lossCarryforwardRemaining: number;
  jurisdiction: string;
}

export class TaxEngine {
  static calculateCurrentTax(input: TaxProvisionInput): {
    currentTaxExpense: number;
    taxableIncome: number;
    lossCarryforwardRemaining: number;
  } {
    if (typeof input.pretaxIncome !== 'number' || !Number.isFinite(input.pretaxIncome)) {
      throw new Error('pretaxIncome must be a finite number');
    }
    if (typeof input.taxRate !== 'number' || !Number.isFinite(input.taxRate)) {
      throw new Error('taxRate must be a finite number');
    }
    const permDiff = input.permanentDifferences.reduce(
      (acc, d) => acc + (Number.isFinite(d.amount) ? d.amount : 0),
      0
    );
    const tempDiff = input.temporaryDifferences.reduce(
      (acc, d) => acc + (Number.isFinite(d.amount) ? d.amount : 0),
      0
    );
    let taxableIncome = input.pretaxIncome + permDiff + tempDiff;
    const credits = input.taxCredits.reduce((acc, c) => acc + c.amount, 0);

    // Apply loss carryforward
    let lossCarryforwardRemaining = input.lossCarryforward ?? 0;
    if (lossCarryforwardRemaining > 0 && taxableIncome > 0) {
      const offset = Math.min(lossCarryforwardRemaining, taxableIncome);
      taxableIncome -= offset;
      lossCarryforwardRemaining -= offset;
    }

    const currentTaxExpense = Math.max(
      0,
      Math.round((taxableIncome * input.taxRate - credits) * 100) / 100
    );

    return { currentTaxExpense, taxableIncome, lossCarryforwardRemaining };
  }

  static calculateDeferredTax(input: TaxProvisionInput): {
    deferredTaxExpense: number;
    deferredTaxAsset: number;
    deferredTaxLiability: number;
    netDeferredTaxAsset: number;
    valuationAllowance: number;
  } {
    let deferredTaxAsset = 0;
    let deferredTaxLiability = 0;

    input.temporaryDifferences.forEach((d) => {
      const amount = Math.round(d.amount * input.taxRate * 100) / 100;
      if (amount > 0) deferredTaxAsset += amount;
      else deferredTaxLiability += Math.abs(amount);
    });

    const valuationRate = input.valuationAllowanceRate ?? 0;
    const valuationAllowance = Math.round(deferredTaxAsset * valuationRate * 100) / 100;
    const netDeferredTaxAsset = Math.round((deferredTaxAsset - valuationAllowance) * 100) / 100;

    return {
      deferredTaxExpense: Math.round((deferredTaxLiability - netDeferredTaxAsset) * 100) / 100,
      deferredTaxAsset: Math.round(deferredTaxAsset * 100) / 100,
      deferredTaxLiability: Math.round(deferredTaxLiability * 100) / 100,
      netDeferredTaxAsset,
      valuationAllowance,
    };
  }

  static calculateEffectiveRate(pretaxIncome: number, totalTaxExpense: number): number {
    if (pretaxIncome === 0) return 0;
    // For negative income (loss), compute benefit rate
    return Math.round((totalTaxExpense / pretaxIncome) * 10000) / 10000;
  }

  static computeProvision(input: TaxProvisionInput): TaxProvisionResult {
    const { currentTaxExpense, taxableIncome, lossCarryforwardRemaining } =
      this.calculateCurrentTax(input);
    const {
      deferredTaxExpense,
      deferredTaxAsset,
      deferredTaxLiability,
      netDeferredTaxAsset,
      valuationAllowance,
    } = this.calculateDeferredTax(input);
    const totalTaxExpense = Math.round((currentTaxExpense + deferredTaxExpense) * 100) / 100;

    return {
      currentTaxExpense,
      deferredTaxExpense,
      totalTaxExpense,
      effectiveTaxRate: this.calculateEffectiveRate(input.pretaxIncome, totalTaxExpense),
      taxableIncome,
      deferredTaxAsset,
      deferredTaxLiability,
      netDeferredTaxAsset,
      valuationAllowance,
      lossCarryforwardRemaining,
      jurisdiction: input.jurisdiction ?? 'default',
    };
  }
}

/**
 * TaxEngine — Tax provisioning (ASC 740 / IAS 12)
 *
 * MONEY MIGRATION (2026-08-03): pretax income, permanent/temporary
 * differences, credits, loss carryforwards, tax expense, DTA/DTL and the
 * valuation allowance are money and flow through the canonical money
 * primitive (src/utils/money.ts, decimal.js, ROUND_HALF_UP), cent-rounded.
 * taxRate and valuationAllowanceRate are rates; effectiveTaxRate is a rate
 * rounded to 4 decimal places (unchanged contract). No raw + - * / on
 * currency values remains.
 */

import {
  addMoney,
  divideMoney,
  multiplyMoney,
  roundTo,
  subtractMoney,
  sumMoney,
  toDecimal,
} from '../utils/money';

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
    const permDiff = sumMoney(
      input.permanentDifferences.map((d) => (Number.isFinite(d.amount) ? d.amount : 0))
    );
    const tempDiff = sumMoney(
      input.temporaryDifferences.map((d) => (Number.isFinite(d.amount) ? d.amount : 0))
    );
    let taxableIncome = addMoney(addMoney(input.pretaxIncome, permDiff), tempDiff);
    const credits = sumMoney(input.taxCredits.map((c) => c.amount));

    // Apply loss carryforward
    let lossCarryforwardRemaining = toDecimal(input.lossCarryforward ?? 0);
    if (lossCarryforwardRemaining.greaterThan(0) && taxableIncome.greaterThan(0)) {
      const offset = lossCarryforwardRemaining.lte(taxableIncome)
        ? lossCarryforwardRemaining
        : taxableIncome;
      taxableIncome = subtractMoney(taxableIncome, offset);
      lossCarryforwardRemaining = subtractMoney(lossCarryforwardRemaining, offset);
    }

    const grossTax = subtractMoney(multiplyMoney(taxableIncome, input.taxRate), credits);
    const currentTaxExpense = grossTax.greaterThan(0) ? roundTo(grossTax) : 0;

    return {
      currentTaxExpense,
      taxableIncome: roundTo(taxableIncome),
      lossCarryforwardRemaining: roundTo(lossCarryforwardRemaining),
    };
  }

  static calculateDeferredTax(input: TaxProvisionInput): {
    deferredTaxExpense: number;
    deferredTaxAsset: number;
    deferredTaxLiability: number;
    netDeferredTaxAsset: number;
    valuationAllowance: number;
  } {
    let deferredTaxAsset = toDecimal(0);
    let deferredTaxLiability = toDecimal(0);

    input.temporaryDifferences.forEach((d) => {
      const amount = roundTo(multiplyMoney(d.amount, input.taxRate));
      if (amount > 0) deferredTaxAsset = addMoney(deferredTaxAsset, amount);
      else deferredTaxLiability = addMoney(deferredTaxLiability, Math.abs(amount));
    });

    const valuationRate = input.valuationAllowanceRate ?? 0;
    const valuationAllowance = roundTo(multiplyMoney(deferredTaxAsset, valuationRate));
    const netDeferredTaxAsset = roundTo(subtractMoney(deferredTaxAsset, valuationAllowance));
    const deferredTaxExpense = roundTo(subtractMoney(deferredTaxLiability, netDeferredTaxAsset));

    return {
      deferredTaxExpense,
      deferredTaxAsset: roundTo(deferredTaxAsset),
      deferredTaxLiability: roundTo(deferredTaxLiability),
      netDeferredTaxAsset,
      valuationAllowance,
    };
  }

  static calculateEffectiveRate(pretaxIncome: number, totalTaxExpense: number): number {
    if (pretaxIncome === 0) return 0;
    // For negative income (loss), compute benefit rate — a RATE rounded to 4
    // decimal places, not a currency amount.
    return divideMoney(totalTaxExpense, pretaxIncome).toDecimalPlaces(4).toNumber();
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
    const totalTaxExpense = roundTo(addMoney(currentTaxExpense, deferredTaxExpense));

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

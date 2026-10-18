/**
 * @fileoverview Acquisition accounting — ASC 805 purchase-price allocation
 * and ASC 350 goodwill impairment (Phase 8, checklist row 10 remainder).
 * @purity-tier 1 PURE
 *
 * Goodwill = (consideration transferred + fair value of any
 * non-controlling interest + fair value of any previously held interest)
 * − fair value of net identifiable assets acquired. When the acquirer
 * does not supply an NCI fair value, NCI is measured at its
 * proportionate share of net identifiable assets and the result is
 * PARTIAL goodwill — the method used is always stated on the result,
 * never implied. A shortfall is a bargain-purchase gain, reported as
 * such; goodwill is never negative and is never amortised (ASC 350:
 * impairment-only). All figures route through `@/utils/money`.
 */

import {
  addMoney,
  subtractMoney,
  multiplyMoney,
  sumMoney,
  roundTo,
  toDecimal,
} from '@/utils/money';

export interface FairValueItem {
  name: string;
  fairValue: number;
}

export interface PurchasePriceAllocationInput {
  considerationTransferred: number;
  /** Null → NCI at proportionate share (partial goodwill), disclosed as such. */
  nonControllingInterestFairValue: number | null;
  /** Acquired ownership percent; required when NCI is at proportionate share. */
  ownershipPct?: number;
  previouslyHeldInterestFairValue: number;
  identifiableAssets: FairValueItem[];
  liabilitiesAssumed: FairValueItem[];
}

export interface PurchasePriceAllocation {
  netIdentifiableAssets: number;
  nonControllingInterest: number;
  goodwill: number;
  bargainPurchaseGain: number;
  /** 'full' when NCI is at fair value; 'partial' at proportionate share. */
  method: 'full' | 'partial';
  /** consideration + NCI + previously held interest (the footing total). */
  attributedTotal: number;
}

export interface GoodwillImpairmentInput {
  reportingUnitCarryingAmount: number;
  reportingUnitFairValue: number;
  goodwillCarryingAmount: number;
}

export interface GoodwillImpairment {
  impairmentLoss: number;
  goodwillAfterImpairment: number;
}

function sumItems(items: FairValueItem[], field: string) {
  for (const item of items) {
    if (!Number.isFinite(item.fairValue) || item.fairValue < 0) {
      throw new Error(`${field} "${item.name}" must carry a non-negative finite fair value`);
    }
  }
  return sumMoney(items.map((i) => i.fairValue));
}

export function allocatePurchasePrice(
  input: PurchasePriceAllocationInput
): PurchasePriceAllocation {
  if (!Number.isFinite(input.considerationTransferred) || input.considerationTransferred < 0) {
    throw new Error('considerationTransferred must be a non-negative finite number');
  }
  if (!Array.isArray(input.identifiableAssets) || input.identifiableAssets.length === 0) {
    throw new Error('At least one identifiable asset is required for a purchase-price allocation');
  }

  const assets = sumItems(input.identifiableAssets, 'identifiable asset');
  const liabilities = sumItems(input.liabilitiesAssumed ?? [], 'liability assumed');
  const netIdentifiableAssets = subtractMoney(assets, liabilities);

  let nonControllingInterest;
  let method: 'full' | 'partial';
  if (input.nonControllingInterestFairValue !== null) {
    if (
      !Number.isFinite(input.nonControllingInterestFairValue) ||
      input.nonControllingInterestFairValue < 0
    ) {
      throw new Error('nonControllingInterestFairValue must be a non-negative finite number');
    }
    nonControllingInterest = toDecimal(input.nonControllingInterestFairValue);
    method = 'full';
  } else {
    if (
      input.ownershipPct === undefined ||
      !Number.isFinite(input.ownershipPct) ||
      input.ownershipPct <= 0 ||
      input.ownershipPct > 100
    ) {
      throw new Error(
        'ownershipPct (0-100) is required when the NCI fair value is not supplied, so NCI can be measured at its proportionate share'
      );
    }
    nonControllingInterest = multiplyMoney(
      netIdentifiableAssets,
      toDecimal(100 - input.ownershipPct).div(100)
    );
    method = 'partial';
  }

  const attributedTotal = addMoney(
    addMoney(input.considerationTransferred, nonControllingInterest),
    input.previouslyHeldInterestFairValue
  );
  const excess = subtractMoney(attributedTotal, netIdentifiableAssets);

  return {
    netIdentifiableAssets: roundTo(netIdentifiableAssets),
    nonControllingInterest: roundTo(nonControllingInterest),
    goodwill: excess.greaterThan(0) ? roundTo(excess) : 0,
    bargainPurchaseGain: excess.lessThan(0) ? roundTo(excess.abs()) : 0,
    method,
    attributedTotal: roundTo(attributedTotal),
  };
}

/**
 * ASC 350 impairment (ASU 2017-04 simplified test): the loss is the
 * amount by which the reporting unit's carrying amount exceeds its
 * fair value, capped at the goodwill carrying amount. Goodwill is
 * never written up and never amortised.
 */
export function testGoodwillImpairment(input: GoodwillImpairmentInput): GoodwillImpairment {
  for (const [field, value] of Object.entries(input)) {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`${field} must be a non-negative finite number`);
    }
  }
  const excess = subtractMoney(input.reportingUnitCarryingAmount, input.reportingUnitFairValue);
  const loss = excess.greaterThan(0) ? Math.min(roundTo(excess), input.goodwillCarryingAmount) : 0;
  return {
    impairmentLoss: loss,
    goodwillAfterImpairment: roundTo(subtractMoney(input.goodwillCarryingAmount, loss)),
  };
}

/**
 * ImpairmentEngine — Asset impairment testing (IAS 36)
 * Tests assets for impairment and calculates impairment loss
 *
 * MONEY MIGRATION (2026-08-03): carrying amounts, recoverable amounts,
 * impairment losses, reversals and DCF values are money and flow through the
 * canonical money primitive (src/utils/money.ts, decimal.js, ROUND_HALF_UP),
 * cent-rounded. No raw + - * / on currency values remains.
 */

import {
  addMoney,
  compareMoney,
  divideMoney,
  roundTo,
  subtractMoney,
  sumMoney,
  toDecimal,
} from '../utils/money';

interface Asset {
  id: string;
  name: string;
  carryingAmount: number;
  recoverableAmount: number;
  usefulLife: number;
  accumulatedDepreciation: number;
}

interface ImpairmentResult {
  assetId: string;
  assetName: string;
  carryingAmount: number;
  recoverableAmount: number;
  impairmentLoss: number;
  isImpaired: boolean;
  newCarryingAmount: number;
}

interface ReversalResult {
  assetId: string;
  previousImpairment: number;
  reversalAmount: number;
  newCarryingAmount: number;
  maxReversal: number;
}

export class ImpairmentEngine {
  private static impairmentHistory: Map<string, ImpairmentResult[]> = new Map();

  static testImpairment(asset: Asset): ImpairmentResult {
    const isImpaired = compareMoney(asset.carryingAmount, asset.recoverableAmount) > 0;
    const impairmentLoss = isImpaired
      ? roundTo(subtractMoney(asset.carryingAmount, asset.recoverableAmount))
      : 0;

    const result: ImpairmentResult = {
      assetId: asset.id,
      assetName: asset.name,
      carryingAmount: asset.carryingAmount,
      recoverableAmount: asset.recoverableAmount,
      impairmentLoss,
      isImpaired,
      newCarryingAmount: isImpaired ? roundTo(asset.recoverableAmount) : asset.carryingAmount,
    };

    // Store history
    const history = this.impairmentHistory.get(asset.id) ?? [];
    history.push(result);
    this.impairmentHistory.set(asset.id, history);

    return result;
  }

  static testBatchImpairment(assets: Asset[]): ImpairmentResult[] {
    return assets.map((a) => this.testImpairment(a));
  }

  static calculateRecoverableAmount(valueInUse: number, fairValueLessCostsToSell: number): number {
    return compareMoney(valueInUse, fairValueLessCostsToSell) >= 0
      ? roundTo(valueInUse)
      : roundTo(fairValueLessCostsToSell);
  }

  static calculateValueInUse(futureCashFlows: number[], discountRate: number): number {
    let pv = toDecimal(0);
    for (let i = 0; i < futureCashFlows.length; i++) {
      // Cash flows are money; discount factors are ratios (float is preserved).
      pv = addMoney(pv, divideMoney(futureCashFlows[i]!, Math.pow(1 + discountRate, i + 1)));
    }
    return roundTo(pv);
  }

  static reverseImpairment(
    assetId: string,
    currentCarryingAmount: number,
    newRecoverableAmount: number,
    originalCost: number
  ): ReversalResult {
    const history = this.impairmentHistory.get(assetId) ?? [];
    const previousImpairment = roundTo(
      sumMoney(history.filter((r) => r.isImpaired).map((r) => r.impairmentLoss))
    );

    const maxReversalDec = subtractMoney(originalCost, currentCarryingAmount);
    const desiredReversalDec = subtractMoney(newRecoverableAmount, currentCarryingAmount);
    const reversalAmountDec = desiredReversalDec.lte(maxReversalDec)
      ? desiredReversalDec
      : maxReversalDec;
    const reversalAmount = roundTo(reversalAmountDec);

    return {
      assetId,
      previousImpairment,
      reversalAmount,
      newCarryingAmount: roundTo(addMoney(currentCarryingAmount, reversalAmount)),
      maxReversal: roundTo(maxReversalDec),
    };
  }

  static getImpairmentHistory(assetId: string): ImpairmentResult[] {
    return this.impairmentHistory.get(assetId) ?? [];
  }

  static getImpairedAssets(): ImpairmentResult[] {
    const impaired: ImpairmentResult[] = [];
    for (const history of this.impairmentHistory.values()) {
      const latest = history[history.length - 1];
      if (latest?.isImpaired) impaired.push(latest);
    }
    return impaired;
  }

  static reset(): void {
    this.impairmentHistory.clear();
  }
}

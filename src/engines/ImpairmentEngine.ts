/**
 * ImpairmentEngine — Asset impairment testing (IAS 36)
 * Tests assets for impairment and calculates impairment loss
 */

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
    const isImpaired = asset.carryingAmount > asset.recoverableAmount;
    const impairmentLoss = isImpaired ? asset.carryingAmount - asset.recoverableAmount : 0;

    const result: ImpairmentResult = {
      assetId: asset.id,
      assetName: asset.name,
      carryingAmount: asset.carryingAmount,
      recoverableAmount: asset.recoverableAmount,
      impairmentLoss,
      isImpaired,
      newCarryingAmount: isImpaired ? asset.recoverableAmount : asset.carryingAmount,
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
    return Math.max(valueInUse, fairValueLessCostsToSell);
  }

  static calculateValueInUse(futureCashFlows: number[], discountRate: number): number {
    return futureCashFlows.reduce((pv, cf, i) => {
      return pv + cf / Math.pow(1 + discountRate, i + 1);
    }, 0);
  }

  static reverseImpairment(
    assetId: string,
    currentCarryingAmount: number,
    newRecoverableAmount: number,
    originalCost: number
  ): ReversalResult {
    const history = this.impairmentHistory.get(assetId) ?? [];
    const previousImpairment = history
      .filter((r) => r.isImpaired)
      .reduce((sum, r) => sum + r.impairmentLoss, 0);

    const maxReversal = originalCost - currentCarryingAmount;
    const desiredReversal = newRecoverableAmount - currentCarryingAmount;
    const reversalAmount = Math.min(desiredReversal, maxReversal);

    return {
      assetId,
      previousImpairment,
      reversalAmount,
      newCarryingAmount: currentCarryingAmount + reversalAmount,
      maxReversal,
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

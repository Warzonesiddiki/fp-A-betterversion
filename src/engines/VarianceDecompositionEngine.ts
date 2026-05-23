export interface RVMParams {
  budgetAmount: number;
  actualAmount: number;
  budgetVolume: number;
  actualVolume: number;
  budgetRate: number;
  actualRate: number;
}

export interface FiveWayParams {
  budgetPrice: number;
  actualPrice: number;
  budgetVolume: number;
  actualVolume: number;
  budgetMix: number;
  actualMix: number;
  budgetExchangeRate: number;
  actualExchangeRate: number;
}

export class VarianceDecompositionEngine {
  static computeRateVolumeMix(params: RVMParams): {
    rateVariance: number;
    volumeVariance: number;
    mixVariance: number;
    totalVariance: number;
  } {
    const rateVariance = (params.actualRate - params.budgetRate) * params.actualVolume;
    const volumeVariance = (params.actualVolume - params.budgetVolume) * params.budgetRate;
    const mixVariance =
      (params.actualVolume - params.budgetVolume) * (params.actualRate - params.budgetRate);
    const totalVariance = params.actualAmount - params.budgetAmount;

    return {
      rateVariance,
      volumeVariance,
      mixVariance,
      totalVariance,
    };
  }

  static computeFiveWayRevenue(params: FiveWayParams): {
    priceVariance: number;
    volumeVariance: number;
    mixVariance: number;
    fxVariance: number;
    totalVariance: number;
  } {
    const priceVariance = (params.actualPrice - params.budgetPrice) * params.budgetVolume;
    const volumeVariance = (params.actualVolume - params.budgetVolume) * params.budgetPrice;
    const mixVariance =
      (params.actualMix - params.budgetMix) * params.actualVolume * params.budgetPrice;
    const fxVariance =
      params.actualVolume *
      params.actualPrice *
      (params.actualExchangeRate - params.budgetExchangeRate);
    const totalVariance =
      params.actualPrice * params.actualVolume * params.actualExchangeRate -
      params.budgetPrice * params.budgetVolume * params.budgetExchangeRate;

    return {
      priceVariance,
      volumeVariance,
      mixVariance,
      fxVariance,
      totalVariance,
    };
  }

  static computePriceVolumeMix(params: {
    budgetPrice: number;
    actualPrice: number;
    budgetVolume: number;
    actualVolume: number;
  }): { priceVariance: number; volumeVariance: number; totalVariance: number } {
    const priceVariance = (params.actualPrice - params.budgetPrice) * params.actualVolume;
    const volumeVariance = (params.actualVolume - params.budgetVolume) * params.budgetPrice;
    const totalVariance =
      params.actualPrice * params.actualVolume - params.budgetPrice * params.budgetVolume;

    return {
      priceVariance,
      volumeVariance,
      totalVariance,
    };
  }
}

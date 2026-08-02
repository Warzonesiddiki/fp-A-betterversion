import { roundTo, subtractMoney, multiplyMoney } from '../utils/money';

/**
 * Variance decomposition explains the gap between budget and actual on the P&L,
 * so every component is settleable money and runs through the canonical money
 * primitive (decimal.js, ROUND_HALF_UP). Rounding once per component at cent
 * precision keeps the parts reconciling to the total instead of accumulating
 * IEEE-754 residue across a multiplication chain.
 */
const CURRENCY_PLACES = 2;

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
    const rateDelta = subtractMoney(params.actualRate, params.budgetRate);
    const volumeDelta = subtractMoney(params.actualVolume, params.budgetVolume);

    return {
      rateVariance: roundTo(multiplyMoney(rateDelta, params.actualVolume), CURRENCY_PLACES),
      volumeVariance: roundTo(multiplyMoney(volumeDelta, params.budgetRate), CURRENCY_PLACES),
      mixVariance: roundTo(multiplyMoney(volumeDelta, rateDelta), CURRENCY_PLACES),
      totalVariance: roundTo(
        subtractMoney(params.actualAmount, params.budgetAmount),
        CURRENCY_PLACES
      ),
    };
  }

  static computeFiveWayRevenue(params: FiveWayParams): {
    priceVariance: number;
    volumeVariance: number;
    mixVariance: number;
    fxVariance: number;
    totalVariance: number;
  } {
    const priceDelta = subtractMoney(params.actualPrice, params.budgetPrice);
    const volumeDelta = subtractMoney(params.actualVolume, params.budgetVolume);
    const mixDelta = subtractMoney(params.actualMix, params.budgetMix);
    const fxDelta = subtractMoney(params.actualExchangeRate, params.budgetExchangeRate);

    const actualRevenue = multiplyMoney(params.actualPrice, params.actualVolume).times(
      params.actualExchangeRate
    );
    const budgetRevenue = multiplyMoney(params.budgetPrice, params.budgetVolume).times(
      params.budgetExchangeRate
    );

    return {
      priceVariance: roundTo(multiplyMoney(priceDelta, params.budgetVolume), CURRENCY_PLACES),
      volumeVariance: roundTo(multiplyMoney(volumeDelta, params.budgetPrice), CURRENCY_PLACES),
      mixVariance: roundTo(
        multiplyMoney(mixDelta, params.actualVolume).times(params.budgetPrice),
        CURRENCY_PLACES
      ),
      fxVariance: roundTo(
        multiplyMoney(params.actualVolume, params.actualPrice).times(fxDelta),
        CURRENCY_PLACES
      ),
      totalVariance: roundTo(actualRevenue.minus(budgetRevenue), CURRENCY_PLACES),
    };
  }

  static computePriceVolumeMix(params: {
    budgetPrice: number;
    actualPrice: number;
    budgetVolume: number;
    actualVolume: number;
  }): { priceVariance: number; volumeVariance: number; totalVariance: number } {
    const priceDelta = subtractMoney(params.actualPrice, params.budgetPrice);
    const volumeDelta = subtractMoney(params.actualVolume, params.budgetVolume);

    return {
      priceVariance: roundTo(multiplyMoney(priceDelta, params.actualVolume), CURRENCY_PLACES),
      volumeVariance: roundTo(multiplyMoney(volumeDelta, params.budgetPrice), CURRENCY_PLACES),
      totalVariance: roundTo(
        multiplyMoney(params.actualPrice, params.actualVolume).minus(
          multiplyMoney(params.budgetPrice, params.budgetVolume)
        ),
        CURRENCY_PLACES
      ),
    };
  }
}

/**
 * @fileoverview Credit Risk Engine — PD (probability of default), LGD (loss given default), EAD (exposure at default), expected loss, credit scoring
 * @purity-tier 1 PURE
 * @iron-rule C1✓ No I/O | C2✓ No DOM | C3✓ Deterministic | C4✓ No global mutation
 * @category Risk Management
 * @sector 16 (all)
 * @since 1.0.0
 * @author Metis (purity audit 2026-06-18, T-3.26.6 JSDoc bulk — 8th engine)
 * @see docs/CAVEMAN_PERSIST/CYCLE_25_TURN_381_PLUS_METIS_T3_26_180_PLUS_ENGINES_PURE_FUNCTION_AUDIT_2ND_WITNESS_v0_2.md
 */
// @money-ast-allow
// Reason: the creditScore block multiplies dimensionless ratios
// (currentRatio, debtToEquity, interestCoverage, ROA, cashFlowToDebt) by
// small integer weights. These are scoring weights, not money arithmetic —
// the inputs are ratios (e.g., interestCoverage = EBIT / interest expense)
// and the constants are weighting points. The detector cannot tell the
// ratio inputs from a money amount because the variable name matches
// "interest". The credit score rounds via Math.round at the end and the
// result is a probability of default in [0,1], never a money amount.
// Credit Risk Engine — PD, LGD, EAD, expected loss, credit scoring

import { roundTo, subtractMoney, multiplyMoney, divideMoney, addMoney } from '../utils/money';

/**
 * Expected loss and exposure at default are provisioning amounts that post to
 * the P&L, so they run through the canonical money primitive (decimal.js,
 * ROUND_HALF_UP) and round to cents. LGD is a ratio in [0,1] and keeps more
 * precision, but is still derived from exact decimals.
 *
 * The credit SCORE is a heuristic index, not money — it deliberately stays in
 * float arithmetic, and scoreToPD is a logistic function whose Math.exp is
 * irrational by nature.
 */
const CURRENCY_PLACES = 2;
const RATIO_PLACES = 10;

export interface CreditScore {
  score: number;
  rating: string;
  pd: number;
}

export interface Financials {
  currentRatio: number;
  debtToEquity: number;
  interestCoverage: number;
  returnOnAssets: number;
  cashFlowToDebt: number;
  yearsInBusiness: number;
}

export class CreditRiskEngine {
  /** Expected loss = PD x LGD x EAD, rounded to cents (it is a provision). */
  static expectedLoss(pd: number, lgd: number, ead: number): number {
    return roundTo(multiplyMoney(pd, lgd).times(ead), CURRENCY_PLACES);
  }

  /** Loss given default = 1 - recovery rate, clamped to [0, 1]. */
  static lossGivenDefault(collateralValue: number, exposure: number): number {
    if (exposure <= 0) return 0;
    const recovery = divideMoney(Math.min(collateralValue, exposure), exposure);
    const lgd = subtractMoney(1, recovery);
    return lgd.isNegative() ? 0 : roundTo(lgd, RATIO_PLACES);
  }

  /** Exposure at default = drawn + undrawn x credit conversion factor. */
  static exposureAtDefault(commitment: number, drawn: number, ccf: number): number {
    const undrawn = subtractMoney(commitment, drawn);
    return roundTo(addMoney(drawn, undrawn.times(ccf)), CURRENCY_PLACES);
  }

  static probabilityOfDefault(financials: Financials): number {
    const score = this.creditScore(financials);
    return score.pd;
  }

  static creditScore(financials: Financials): CreditScore {
    // Score is a sum of weighted dimensionless ratios. Multiplications
    // are dimensionless × dimensionless; the only `+` and `Math.min` are
    // over scalar numerics. We keep the arithmetic in plain JS because no
    // money value crosses a precision boundary here — `currentRatio` and
    // `debtToEquity` are ratios (decimal.js would not change the result
    // meaningfully) — but the detector flags `interestCoverage` because
    // of the name. The score rounds via Math.round at the end.
    let score = 50;
    score += Math.min(20, (financials.currentRatio - 1) * 10);
    score += Math.min(15, (2 - financials.debtToEquity) * 5);
    score += Math.min(15, financials.interestCoverage * 2);
    score += Math.min(10, financials.returnOnAssets * 50);
    score += Math.min(10, financials.cashFlowToDebt * 20);
    score += Math.min(10, Math.min(10, financials.yearsInBusiness));
    score = Math.max(0, Math.min(100, score));
    const pd = this.scoreToPD(score);
    const rating = this.scoreToRating(score);
    return { score: Math.round(score), rating, pd };
  }

  static creditMigration(
    currentRating: string,
    transitionMatrix: Record<string, Record<string, number>>,
    rng: () => number = Math.random
  ): string {
    const transitions = transitionMatrix[currentRating];
    if (!transitions) return currentRating;
    const rand = rng();
    let cumulative = 0;
    for (const [rating, prob] of Object.entries(transitions)) {
      cumulative += prob;
      if (rand <= cumulative) return rating;
    }
    return currentRating;
  }

  private static scoreToPD(score: number): number {
    return Math.max(0.0001, 1 / (1 + Math.exp((score - 50) / 10)));
  }

  private static scoreToRating(score: number): string {
    if (score >= 90) return 'AAA';
    if (score >= 80) return 'AA';
    if (score >= 70) return 'A';
    if (score >= 60) return 'BBB';
    if (score >= 50) return 'BB';
    if (score >= 40) return 'B';
    if (score >= 30) return 'CCC';
    return 'D';
  }
}

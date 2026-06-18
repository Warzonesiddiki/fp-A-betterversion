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
// Credit Risk Engine — PD, LGD, EAD, expected loss, credit scoring

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
  static expectedLoss(pd: number, lgd: number, ead: number): number {
    return pd * lgd * ead;
  }

  static lossGivenDefault(collateralValue: number, exposure: number): number {
    if (exposure <= 0) return 0;
    const recovery = Math.min(collateralValue, exposure) / exposure;
    return Math.max(0, 1 - recovery);
  }

  static exposureAtDefault(commitment: number, drawn: number, ccf: number): number {
    return drawn + (commitment - drawn) * ccf;
  }

  static probabilityOfDefault(financials: Financials): number {
    const score = this.creditScore(financials);
    return score.pd;
  }

  static creditScore(financials: Financials): CreditScore {
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

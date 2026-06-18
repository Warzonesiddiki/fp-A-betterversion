/**
 * @fileoverview Option Pricing Engine — Black-Scholes model with Greeks (delta, gamma, theta, vega, rho)
 * @purity-tier 1 PURE
 * @iron-rule C1✓ No I/O | C2✓ No DOM | C3✓ Deterministic | C4✓ No global mutation
 * @category Financial Instruments
 * @sector 16 (all)
 * @since 1.0.0
 * @author Metis (purity audit 2026-06-18, T-3.26.6 JSDoc bulk — 7th engine REMEDIATED after D-007 8th SHL CATCH)
 * @see docs/CAVEMAN_PERSIST/CYCLE_25_TURN_381_PLUS_METIS_T3_26_180_PLUS_ENGINES_PURE_FUNCTION_AUDIT_2ND_WITNESS_v0_2.md
 */
// Option Pricing Engine — Black-Scholes model with Greeks

export interface OptionResult {
  price: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

export class OptionPricingEngine {
  static blackScholes(
    S: number,
    K: number,
    T: number,
    r: number,
    sigma: number,
    type: 'call' | 'put'
  ): OptionResult {
    if (T <= 0 || sigma <= 0) {
      const intrinsic = type === 'call' ? Math.max(S - K, 0) : Math.max(K - S, 0);
      return {
        price: intrinsic,
        delta: type === 'call' ? (S > K ? 1 : 0) : S < K ? -1 : 0,
        gamma: 0,
        theta: 0,
        vega: 0,
        rho: 0,
      };
    }

    const sqrtT = Math.sqrt(T);
    const d1 = (Math.log(S / K) + (r + (sigma * sigma) / 2) * T) / (sigma * sqrtT);
    const d2 = d1 - sigma * sqrtT;

    const Nd1 = this.normCDF(d1);
    const Nd2 = this.normCDF(d2);
    const nd1 = this.normPDF(d1);

    let price: number, delta: number, theta: number, rho: number;

    if (type === 'call') {
      price = S * Nd1 - K * Math.exp(-r * T) * Nd2;
      delta = Nd1;
      theta = ((-S * nd1 * sigma) / (2 * sqrtT) - r * K * Math.exp(-r * T) * Nd2) / 365;
      rho = (K * T * Math.exp(-r * T) * Nd2) / 100;
    } else {
      const Nmd1 = this.normCDF(-d1);
      const Nmd2 = this.normCDF(-d2);
      price = K * Math.exp(-r * T) * Nmd2 - S * Nmd1;
      delta = Nd1 - 1;
      theta = ((-S * nd1 * sigma) / (2 * sqrtT) + r * K * Math.exp(-r * T) * Nmd2) / 365;
      rho = (-K * T * Math.exp(-r * T) * Nmd2) / 100;
    }

    const gamma = nd1 / (S * sigma * sqrtT);
    const vega = (S * nd1 * sqrtT) / 100;

    return { price, delta, gamma, theta, vega, rho };
  }

  private static normCDF(x: number): number {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    const sign = x < 0 ? -1 : 1;
    const absX = Math.abs(x);
    const t = 1 / (1 + p * absX);
    const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp((-absX * absX) / 2);
    return 0.5 * (1 + sign * y);
  }

  private static normPDF(x: number): number {
    return Math.exp((-x * x) / 2) / Math.sqrt(2 * Math.PI);
  }
}

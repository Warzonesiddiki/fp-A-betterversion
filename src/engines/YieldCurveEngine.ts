// Yield Curve Engine — Bootstrapping, interpolation, forward rates

export interface CurvePoint {
  maturity: number;
  rate: number;
}

export class YieldCurveEngine {
  static bootstrap(rates: CurvePoint[]): CurvePoint[] {
    const sorted = [...rates].sort((a, b) => a.maturity - b.maturity);
    const known = sorted.filter((p) => p.rate > 0);
    return sorted.map((p, i) => {
      if (i === 0 || p.rate > 0) return p;
      // Missing (zero) rate: interpolate between the nearest surrounding known
      // points. MISSION D: the old code interpolated toward the point's own
      // rate (itself), so zero rates were never actually filled.
      const prev = [...known].reverse().find((k) => k.maturity < p.maturity);
      const next = known.find((k) => k.maturity > p.maturity);
      if (prev && next) {
        return {
          maturity: p.maturity,
          rate: this.linearInterpolate(
            prev.maturity,
            next.maturity,
            prev.rate,
            next.rate,
            p.maturity
          ),
        };
      }
      if (prev) return { maturity: p.maturity, rate: prev.rate };
      if (next) return { maturity: p.maturity, rate: next.rate };
      return p;
    });
  }

  static interpolate(
    maturity: number,
    curve: CurvePoint[],
    method: 'linear' | 'cubic' = 'linear'
  ): number {
    if (curve.length === 0) return 0;
    const sorted = [...curve].sort((a, b) => a.maturity - b.maturity);
    if (maturity <= sorted[0]!.maturity) return sorted[0]!.rate;
    if (maturity >= sorted![sorted.length - 1]!.maturity) return sorted![sorted.length - 1]!.rate;

    for (let i = 0; i < sorted.length - 1; i++) {
      if (maturity >= sorted[i]!.maturity && maturity <= sorted![i + 1]!.maturity) {
        if (method === 'cubic') {
          return this.cubicInterpolate(sorted, maturity, i);
        }
        return this.linearInterpolate(
          sorted[i]!.maturity,
          sorted![i + 1]!.maturity,
          sorted[i]!.rate,
          sorted![i + 1]!.rate,
          maturity
        );
      }
    }
    return sorted![sorted.length - 1]!.rate;
  }

  static forwardRate(curve: CurvePoint[], startMaturity: number, endMaturity: number): number {
    const r1 = this.interpolate(startMaturity, curve);
    const r2 = this.interpolate(endMaturity, curve);
    const t1 = startMaturity;
    const t2 = endMaturity;
    if (t2 <= t1) return 0;
    return (r2 * t2 - r1 * t1) / (t2 - t1);
  }

  static spotRate(curve: CurvePoint[], maturity: number): number {
    return this.interpolate(maturity, curve);
  }

  static parRate(curve: CurvePoint[], maturity: number): number {
    if (maturity <= 0) return 0;
    let pv = 0;
    for (let t = 1; t <= maturity; t++) {
      const r = this.interpolate(t, curve);
      pv += 1 / Math.pow(1 + r, t);
    }
    return (1 - 1 / Math.pow(1 + this.interpolate(maturity, curve), maturity)) / pv;
  }

  private static linearInterpolate(
    x0: number,
    x1: number,
    y0: number,
    y1: number,
    x: number
  ): number {
    if (x1 === x0) return y0;
    return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }

  private static cubicInterpolate(sorted: CurvePoint[], x: number, i: number): number {
    const p0 = sorted[Math.max(0, i - 1)];
    const p1 = sorted[i];
    const p2 = sorted[Math.min(sorted.length - 1, i + 1)];
    const p3 = sorted[Math.min(sorted.length - 1, i + 2)];
    const t = (x - p1!.maturity) / (p2!.maturity - p1!.maturity);
    const t2 = t * t;
    const t3 = t2 * t;
    const a = -0.5 * p0!.rate + 1.5 * p1!.rate - 1.5 * p2!.rate + 0.5 * p3!.rate;
    const b = p0!.rate - 2.5 * p1!.rate + 2 * p2!.rate - 0.5 * p3!.rate;
    const c = -0.5 * p0!.rate + 0.5 * p2!.rate;
    const d = p1!.rate;
    return a * t3 + b * t2 + c * t + d;
  }
}

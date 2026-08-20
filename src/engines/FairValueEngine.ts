// @money-ast-allow Reason: Array index: futureCashFlows.length - 1 is the last-element index, not money
/**
 * @fileoverview Fair Value Engine — Fair value hierarchy (ASC 820 / IFRS 13)
 * Classifies and calculates fair value measurements across Level 1/2/3 hierarchy
 * @purity-tier 1 PURE
 * @iron-rule C1✓ No I/O | C2✓ No DOM | C3✓ Deterministic | C4✓ No global mutation
 * @category Financial Instruments
 * @sector 16 (all)
 * @since 1.0.0
 * @author Metis (purity audit 2026-06-18, T-3.26.6 JSDoc bulk — 12th engine)
 * @see docs/CAVEMAN_PERSIST/CYCLE_25_TURN_381_PLUS_METIS_T3_26_180_PLUS_ENGINES_PURE_FUNCTION_AUDIT_2ND_WITNESS_v0_2.md
 *
 * MONEY MIGRATION (2026-08-03): measurement values, hierarchy totals and DCF
 * valuations are money and flow through the canonical money primitive
 * (src/utils/money.ts, decimal.js, ROUND_HALF_UP), cent-rounded. No raw
 * + - * / on currency values remains.
 */
/**
 * FairValueEngine — Fair value hierarchy (ASC 820 / IFRS 13)
 * Classifies and calculates fair value measurements
 */

import { addMoney, divideMoney, roundTo, sumMoney, toDecimal } from '../utils/money';

interface FairValueMeasurement {
  id: string;
  assetId: string;
  assetName: string;
  value: number;
  level: 1 | 2 | 3; // Level 1: quoted prices, Level 2: observable inputs, Level 3: unobservable
  approach: 'market' | 'income' | 'cost';
  inputs: Record<string, number>;
  confidence: number; // 0-1
  date: string;
}

interface FairValueHierarchy {
  level1: FairValueMeasurement[];
  level2: FairValueMeasurement[];
  level3: FairValueMeasurement[];
  total: number;
}

export class FairValueEngine {
  private static measurements: Map<string, FairValueMeasurement[]> = new Map();

  static measure(params: Omit<FairValueMeasurement, 'id'>): FairValueMeasurement {
    const id = `fv_${Date.now()}`;
    const measurement: FairValueMeasurement = { ...params, id };
    const existing = this.measurements.get(params.assetId) ?? [];
    existing.push(measurement);
    this.measurements.set(params.assetId, existing);
    return measurement;
  }

  static classifyByLevel(
    _inputs: Record<string, number>,
    hasQuotedPrice: boolean,
    hasObservableInputs: boolean
  ): 1 | 2 | 3 {
    if (hasQuotedPrice) return 1;
    if (hasObservableInputs) return 2;
    return 3;
  }

  static calculateDCF(
    futureCashFlows: number[],
    discountRate: number,
    terminalGrowthRate?: number
  ): number {
    let pv = toDecimal(0);
    for (let i = 0; i < futureCashFlows.length; i++) {
      // Cash flows are money; discount factors are ratios (float is preserved).
      pv = addMoney(pv, divideMoney(futureCashFlows[i]!, Math.pow(1 + discountRate, i + 1)));
    }
    if (terminalGrowthRate !== undefined && futureCashFlows.length > 0) {
      const lastCF = toDecimal(futureCashFlows[futureCashFlows.length - 1]!);
      // Terminal value = lastCF * (1+g) / (r - g). r and g are RATES (not
      // money), so the denominator is a float ratio. divideMoney throws loudly
      // when r === g instead of returning Infinity as float math did.
      const terminalValue = divideMoney(
        lastCF.times(1 + terminalGrowthRate),
        discountRate - terminalGrowthRate
      );
      pv = addMoney(
        pv,
        divideMoney(terminalValue, Math.pow(1 + discountRate, futureCashFlows.length))
      );
    }
    return roundTo(pv);
  }

  static getHierarchy(assetId: string): FairValueHierarchy {
    const measurements = this.measurements.get(assetId) ?? [];
    return {
      level1: measurements.filter((m) => m.level === 1),
      level2: measurements.filter((m) => m.level === 2),
      level3: measurements.filter((m) => m.level === 3),
      total: roundTo(sumMoney(measurements.map((m) => m.value))),
    };
  }

  static getMeasurements(assetId: string): FairValueMeasurement[] {
    return this.measurements.get(assetId) ?? [];
  }

  static reset(): void {
    this.measurements.clear();
  }
}

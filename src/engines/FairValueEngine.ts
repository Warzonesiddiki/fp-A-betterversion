/**
 * FairValueEngine — Fair value hierarchy (ASC 820 / IFRS 13)
 * Classifies and calculates fair value measurements
 */

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
    inputs: Record<string, number>,
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
    const pv = futureCashFlows.reduce(
      (sum, cf, i) => sum + cf / Math.pow(1 + discountRate, i + 1),
      0
    );
    if (terminalGrowthRate !== undefined && futureCashFlows.length > 0) {
      const lastCF = futureCashFlows[futureCashFlows.length - 1];
      const terminalValue =
        (lastCF * (1 + terminalGrowthRate)) / (discountRate - terminalGrowthRate);
      return pv + terminalValue / Math.pow(1 + discountRate, futureCashFlows.length);
    }
    return pv;
  }

  static getHierarchy(assetId: string): FairValueHierarchy {
    const measurements = this.measurements.get(assetId) ?? [];
    return {
      level1: measurements.filter((m) => m.level === 1),
      level2: measurements.filter((m) => m.level === 2),
      level3: measurements.filter((m) => m.level === 3),
      total: measurements.reduce((sum, m) => sum + m.value, 0),
    };
  }

  static getMeasurements(assetId: string): FairValueMeasurement[] {
    return this.measurements.get(assetId) ?? [];
  }

  static reset(): void {
    this.measurements.clear();
  }
}

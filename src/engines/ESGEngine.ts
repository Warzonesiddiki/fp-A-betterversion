import type { WorkforceData } from '@/types/sector-types';

export interface CarbonActivity {
  type: string;
  amount: number;
  unit: 'kWh' | 'therms' | 'gallons' | 'miles' | 'tonnes';
  emissionFactor: number;
}

export interface CarbonResult {
  totalCO2: number;
  scope1: number;
  scope2: number;
  scope3: number;
  breakdown: { category: string; tons: number }[];
}

export interface EnergyData {
  source: 'electricity' | 'natural_gas' | 'fuel' | 'renewable';
  amount: number;
  unit: 'kWh' | 'therms' | 'MMBtu';
}

export interface DiversityMetrics {
  genderRatio: number;
  ethnicDiversity: number;
  managementDiversity: number;
}

export class ESGEngine {
  static calculateCarbonFootprint(activities: CarbonActivity[]): CarbonResult {
    let totalCO2 = 0;
    let scope1 = 0;
    let scope2 = 0;
    let scope3 = 0;
    const breakdown: { category: string; tons: number }[] = [];

    activities.forEach((a) => {
      const tons = a.amount * a.emissionFactor;
      totalCO2 += tons;

      if (a.type === 'gas' || a.type === 'fuel') scope1 += tons;
      else if (a.type === 'electricity') scope2 += tons;
      else scope3 += tons;

      breakdown.push({ category: a.type, tons });
    });

    return { totalCO2, scope1, scope2, scope3, breakdown };
  }

  static calculateScopeEmissions(energy: EnergyData[], scope: 1 | 2 | 3): number {
    const factors: Record<string, number> = {
      electricity: 0.0004,
      natural_gas: 0.053,
      fuel: 0.01,
      renewable: 0,
    };

    return energy.reduce((acc, e) => {
      const tons = e.amount * (factors[e.source] || 0);
      if (scope === 1 && (e.source === 'natural_gas' || e.source === 'fuel')) return acc + tons;
      if (scope === 2 && e.source === 'electricity') return acc + tons;
      if (scope === 3 && e.source === 'renewable') return acc + tons;
      return acc;
    }, 0);
  }

  static calculateDiversityScore(workforce: WorkforceData[]): DiversityMetrics {
    if (workforce.length === 0)
      return { genderRatio: 0, ethnicDiversity: 0, managementDiversity: 0 };

    const female = workforce.filter((w) => w.gender === 'female').length;
    const management = workforce.filter((w) => w.isManagement);
    const managementFemale = management.filter((w) => w.gender === 'female').length;

    const ethnicities = new Set(workforce.map((w) => w.ethnicity));

    return {
      genderRatio: female / workforce.length,
      ethnicDiversity: ethnicities.size / workforce.length,
      managementDiversity: management.length === 0 ? 0 : managementFemale / management.length,
    };
  }
}

import { describe, it, expect } from 'vitest';
import { ESGEngine, type CarbonActivity, type EnergyData } from './ESGEngine';
import type { WorkforceData } from '@/types/sector-types';

describe('ESGEngine', () => {
  describe('calculateCarbonFootprint', () => {
    it('should calculate total CO2 from activities', () => {
      const activities: CarbonActivity[] = [
        { type: 'electricity', amount: 10000, unit: 'kWh', emissionFactor: 0.0004 },
        { type: 'gas', amount: 500, unit: 'therms', emissionFactor: 0.053 },
      ];
      const result = ESGEngine.calculateCarbonFootprint(activities);
      expect(result.totalCO2).toBeCloseTo(30.5, 1);
      expect(result.scope1).toBeCloseTo(26.5, 1);
      expect(result.scope2).toBeCloseTo(4, 1);
    });

    it('should handle empty activities', () => {
      const result = ESGEngine.calculateCarbonFootprint([]);
      expect(result.totalCO2).toBe(0);
      expect(result.breakdown).toEqual([]);
    });
  });

  describe('calculateScopeEmissions', () => {
    it('should calculate scope 1 emissions', () => {
      const energy: EnergyData[] = [
        { source: 'natural_gas', amount: 1000, unit: 'therms' },
        { source: 'electricity', amount: 5000, unit: 'kWh' },
      ];
      const result = ESGEngine.calculateScopeEmissions(energy, 1);
      expect(result).toBeCloseTo(53, 1);
    });

    it('should calculate scope 2 emissions', () => {
      const energy: EnergyData[] = [
        { source: 'natural_gas', amount: 1000, unit: 'therms' },
        { source: 'electricity', amount: 5000, unit: 'kWh' },
      ];
      const result = ESGEngine.calculateScopeEmissions(energy, 2);
      expect(result).toBeCloseTo(2, 1);
    });

    it('should return 0 for empty energy data', () => {
      expect(ESGEngine.calculateScopeEmissions([], 1)).toBe(0);
    });
  });

  describe('calculateDiversityScore', () => {
    it('should calculate diversity metrics', () => {
      const workforce: WorkforceData[] = [
        { id: '1', gender: 'female', ethnicity: 'Asian', isManagement: true, department: 'Eng' },
        { id: '2', gender: 'male', ethnicity: 'White', isManagement: true, department: 'Eng' },
        { id: '3', gender: 'female', ethnicity: 'Asian', isManagement: false, department: 'Sales' },
        {
          id: '4',
          gender: 'male',
          ethnicity: 'Hispanic',
          isManagement: false,
          department: 'Sales',
        },
      ];
      const result = ESGEngine.calculateDiversityScore(workforce);
      expect(result.genderRatio).toBe(0.5);
      expect(result.managementDiversity).toBe(0.5);
      expect(result.ethnicDiversity).toBe(0.75);
    });

    it('should handle empty workforce', () => {
      const result = ESGEngine.calculateDiversityScore([]);
      expect(result.genderRatio).toBe(0);
      expect(result.managementDiversity).toBe(0);
    });

    it('should handle no management', () => {
      const workforce: WorkforceData[] = [
        { id: '1', gender: 'female', ethnicity: 'Asian', isManagement: false, department: 'Eng' },
      ];
      const result = ESGEngine.calculateDiversityScore(workforce);
      expect(result.managementDiversity).toBe(0);
    });
  });
});

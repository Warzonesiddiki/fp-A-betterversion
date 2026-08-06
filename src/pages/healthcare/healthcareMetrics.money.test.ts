/**
 * GAP-1 / F-0006 known-answer tests for the Healthcare exact-money model
 * (Wave 9 Phase 3 — Sector Depth).
 */
import { describe, expect, it } from 'vitest';
import {
  computeHealthcareMetrics,
  computeHealthcareRatioPct,
  computePerPatient,
  scaleHealthcareDriver,
  sumHealthcareAmounts,
} from './healthcareMetrics';

describe('healthcareMetrics — known answers (GAP-1)', () => {
  it('sums fractional healthcare amounts exactly (0.1 + 0.2 = 0.3)', () => {
    expect(sumHealthcareAmounts([0.1, 0.2])).toBe(0.3);
    expect(sumHealthcareAmounts([0.1, 0.2, 0.05])).toBe(0.35);
  });

  it('0.335 × 3 rounds half-up to 1.01 (driver scale)', () => {
    expect(scaleHealthcareDriver(0.335, 3)).toBe(1.01);
  });

  it('returns 0 ratio for zero denominator', () => {
    expect(computeHealthcareRatioPct(10, 0)).toBe(0);
    expect(computePerPatient(1000, 0)).toBe(0);
  });

  it('full healthcare metric model produces deterministic known answer', () => {
    const m = computeHealthcareMetrics({
      patientRevenue: 8_000_000,
      grantRevenue: 2_000_000,
      clinicalLaborCost: 4_000_000,
      medicalSuppliesCost: 1_500_000,
      researchCost: 500_000,
      facilityCost: 1_000_000,
      adminCost: 1_000_000,
      patientCount: 4_000,
      availableBeds: 500,
      occupiedBeds: 400,
      totalAdmissions: 5_000,
      readmissions: 250,
    });
    expect(m.totalRevenue).toBe(10_000_000);
    expect(m.totalDirectCost).toBe(6_000_000);
    expect(m.grossProfit).toBe(4_000_000);
    expect(m.ebitda).toBe(2_000_000);
    expect(m.revenuePerPatient).toBe(2500);
    expect(m.costPerPatient).toBe(2000);
    expect(m.bedOccupancyRatePct).toBe(80);
    expect(m.readmissionRatePct).toBe(5);
    expect(m.clinicalCostRatioPct).toBe(50);
    expect(m.operatingMarginPct).toBe(20);
  });

  it('handles expense-over-revenue (negative EBITDA and margin) exactly', () => {
    const m = computeHealthcareMetrics({
      patientRevenue: 1_000_000,
      grantRevenue: 0,
      clinicalLaborCost: 700_000,
      medicalSuppliesCost: 300_000,
      researchCost: 100_000,
      facilityCost: 200_000,
      adminCost: 100_000,
      patientCount: 500,
      availableBeds: 100,
      occupiedBeds: 80,
      totalAdmissions: 600,
      readmissions: 30,
    });
    expect(m.totalDirectCost).toBe(1_100_000);
    expect(m.ebitda).toBe(-400_000);
    expect(m.operatingMarginPct).toBe(-40);
  });
});

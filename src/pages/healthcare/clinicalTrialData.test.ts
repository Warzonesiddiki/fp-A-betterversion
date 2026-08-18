import { describe, it, expect } from 'vitest';
import { deriveClinicalTrialAnalysis, type ClinicalTrialInput } from './clinicalTrialData';

/**
 * Known-answer tests for clinical trial cost analysis.
 *
 *   A: Ph III, budget 5,000,000, spend 4,000,000, target 200, enrolled 100
 *      variance -1,000,000 (-20%), enrolment 50%, cost/patient 40,000
 *   B: Ph II,  budget 2,000,000, spend 2,500,000, target 100, enrolled 0
 *      variance +500,000 (+25%), enrolment 0%, cost/patient null
 *   totals: budget 7,000,000 spend 6,500,000 variance -500,000
 *           enrolled 100 of 300 -> 33.33%, cost/patient 65,000
 */
const A: ClinicalTrialInput = {
  id: 'T-1',
  name: 'Alpha',
  site: 'Site One',
  phase: 'Phase III',
  budget: 5000000,
  actualSpend: 4000000,
  targetEnrollment: 200,
  enrolled: 100,
  status: 'active',
};

const B: ClinicalTrialInput = {
  id: 'T-2',
  name: 'Beta',
  site: 'Site Two',
  phase: 'Phase II',
  budget: 2000000,
  actualSpend: 2500000,
  targetEnrollment: 100,
  enrolled: 0,
  status: 'enrolling',
};

describe('deriveClinicalTrialAnalysis — no fixtures', () => {
  it('returns null when no trial has been recorded', () => {
    expect(deriveClinicalTrialAnalysis([])).toBeNull();
  });

  it('never emits the fixture studies or their sites', () => {
    const json = JSON.stringify(deriveClinicalTrialAnalysis([A, B]));
    for (const invented of [
      'Onco-Shield',
      'Neuro-Restore',
      'Cardio-Flow',
      'Immuno-Boost',
      'RareDisease-7',
      'Mayo Clinic',
      'Johns Hopkins',
      'Cedars-Sinai',
    ]) {
      expect(json).not.toContain(invented);
    }
  });
});

describe('deriveClinicalTrialAnalysis — per trial', () => {
  it('derives variance against the recorded budget', () => {
    const rows = deriveClinicalTrialAnalysis([A, B])!.trials;
    expect(rows[0]).toMatchObject({ variance: -1000000, variancePercent: -20, overBudget: false });
    expect(rows[1]).toMatchObject({ variance: 500000, variancePercent: 25, overBudget: true });
  });

  it('derives cost per patient only once someone is enrolled', () => {
    const rows = deriveClinicalTrialAnalysis([A, B])!.trials;
    expect(rows[0]!.costPerPatient).toBe(40000);
    expect(rows[1]!.costPerPatient).toBeNull();
  });

  it('emits a null enrolment rate rather than 0% without a target', () => {
    const noTarget: ClinicalTrialInput = { ...A, targetEnrollment: 0 };
    expect(deriveClinicalTrialAnalysis([noTarget])!.trials[0]!.enrollmentPercent).toBeNull();
  });
});

describe('deriveClinicalTrialAnalysis — portfolio', () => {
  it('totals budget, spend and enrolment', () => {
    const a = deriveClinicalTrialAnalysis([A, B])!;
    expect(a.totalBudget).toBe(7000000);
    expect(a.totalSpend).toBe(6500000);
    expect(a.totalVariance).toBe(-500000);
    expect(a.totalEnrolled).toBe(100);
    expect(a.totalTarget).toBe(300);
    expect(a.enrollmentPercent).toBe(33.33);
    expect(a.costPerPatient).toBe(65000);
    expect(a.overBudgetCount).toBe(1);
  });

  it('groups phases by recorded budget share', () => {
    const a = deriveClinicalTrialAnalysis([A, B])!;
    expect(a.phases).toEqual([
      { phase: 'Phase III', count: 1, budget: 5000000, spend: 4000000, sharePercent: 71.43 },
      { phase: 'Phase II', count: 1, budget: 2000000, spend: 2500000, sharePercent: 28.57 },
    ]);
  });

  it('reports cost per patient as unavailable when nobody is enrolled', () => {
    const a = deriveClinicalTrialAnalysis([B])!;
    expect(a.costPerPatient).toBeNull();
    expect(a.unavailable.map((u) => u.label)).toContain('Cost per patient');
  });

  it('always discloses R&D tax credits as not derivable', () => {
    expect(deriveClinicalTrialAnalysis([A])!.unavailable.map((u) => u.label)).toContain(
      'R&D tax credits'
    );
  });

  it('uses decimal arithmetic — no IEEE-754 drift', () => {
    const pennies: ClinicalTrialInput = { ...A, budget: 0.1, actualSpend: 0.2, enrolled: 0 };
    const other: ClinicalTrialInput = { ...B, budget: 0.2, actualSpend: 0.1, enrolled: 0 };
    const a = deriveClinicalTrialAnalysis([pennies, other])!;
    expect(a.totalBudget).toBe(0.3);
    expect(a.totalSpend).toBe(0.3);
    expect(a.totalVariance).toBe(0);
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { useHealthcareStore } from './healthcareStore';
import { actAs } from '@/test/rbacFixtures';

describe('healthcareStore', () => {
  beforeEach(() => {
    actAs('Admin');
    useHealthcareStore.setState({
      qualityMetrics: [],
      savingsData: [],
      programs: [],
    });
  });

  it('should have initial empty state after reset', () => {
    const state = useHealthcareStore.getState();
    expect(state.qualityMetrics).toEqual([]);
    expect(state.savingsData).toEqual([]);
    expect(state.programs).toEqual([]);
  });

  it('should set quality metrics', () => {
    const metrics = [{ subject: 'Readmission', A: 120, B: 110, fullMark: 150 }];
    useHealthcareStore.getState().setQualityMetrics(metrics);
    expect(useHealthcareStore.getState().qualityMetrics).toEqual(metrics);
  });

  it('should set savings data', () => {
    const data = [{ category: 'Pharmacy', target: 500000, actual: 450000, savings: 50000 }];
    useHealthcareStore.getState().setSavingsData(data);
    expect(useHealthcareStore.getState().savingsData).toEqual(data);
  });

  it('should add a program', () => {
    useHealthcareStore.getState().addProgram({
      id: 'p-1',
      program: 'Diabetes Management',
      population: '5,000',
      qualityScore: '85%',
      sharedSavings: '$2.1M',
      status: 'High',
    });
    expect(useHealthcareStore.getState().programs).toHaveLength(1);
    expect(useHealthcareStore!.getState().programs[0]!.program).toBe('Diabetes Management');
  });

  it('should update a program', () => {
    useHealthcareStore.getState().addProgram({
      id: 'p-2',
      program: 'Cardiac Care',
      population: '3,000',
      qualityScore: '78%',
      sharedSavings: '$1.5M',
      status: 'Watch',
    });
    useHealthcareStore.getState().updateProgram('p-2', { status: 'High', qualityScore: '92%' });
    const updated = useHealthcareStore.getState().programs[0];
    expect(updated!.status).toBe('High');
    expect(updated!.qualityScore).toBe('92%');
  });

  it('should not update non-existent program', () => {
    useHealthcareStore.getState().addProgram({
      id: 'p-3',
      program: 'Ortho',
      population: '2,000',
      qualityScore: '80%',
      sharedSavings: '$800k',
      status: 'Medium',
    });
    useHealthcareStore.getState().updateProgram('p-999', { status: 'High' });
    expect(useHealthcareStore!.getState().programs[0]!.status).toBe('Medium');
  });
});

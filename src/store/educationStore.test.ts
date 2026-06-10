import { describe, it, expect, beforeEach } from 'vitest';
import { useEducationStore } from './educationStore';

describe('educationStore', () => {
  beforeEach(() => {
    useEducationStore.setState({
      programs: [],
      enrollmentTrends: [],
      scholarships: [],
      isLoading: false,
      error: null,
    });
  });

  it('should have initial empty state after reset', () => {
    const state = useEducationStore.getState();
    expect(state.programs).toEqual([]);
    expect(state.enrollmentTrends).toEqual([]);
    expect(state.scholarships).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should set programs', () => {
    const programs = [
      {
        id: 'p1',
        name: 'Computer Science',
        department: 'Engineering',
        enrollment: 500,
        budget: 1000000,
        revenue: 1200000,
        status: 'Active' as const,
      },
    ];
    useEducationStore.getState().setPrograms(programs);
    expect(useEducationStore.getState().programs).toEqual(programs);
  });

  it('should add a program', () => {
    useEducationStore.getState().addProgram({
      id: 'p2',
      name: 'Business Admin',
      department: 'Business',
      enrollment: 300,
      budget: 800000,
      revenue: 900000,
      status: 'Active',
    });
    expect(useEducationStore.getState().programs).toHaveLength(1);
    expect(useEducationStore!.getState().programs[0]!.name).toBe('Business Admin');
  });

  it('should update a program', () => {
    useEducationStore.getState().addProgram({
      id: 'p3',
      name: 'Physics',
      department: 'Science',
      enrollment: 200,
      budget: 600000,
      revenue: 700000,
      status: 'Active',
    });
    useEducationStore.getState().updateProgram('p3', { status: 'Suspended', enrollment: 150 });
    const updated = useEducationStore.getState().programs[0];
    expect(updated!.status).toBe('Suspended');
    expect(updated!.enrollment).toBe(150);
  });

  it('should not update non-existent program', () => {
    useEducationStore.getState().addProgram({
      id: 'p4',
      name: 'Chemistry',
      department: 'Science',
      enrollment: 100,
      budget: 400000,
      revenue: 450000,
      status: 'Active',
    });
    useEducationStore.getState().updateProgram('nonexistent', { status: 'Suspended' });
    expect(useEducationStore!.getState().programs[0]!.status).toBe('Active');
  });

  it('should remove a program', () => {
    useEducationStore.getState().addProgram({
      id: 'p5',
      name: 'ToRemove',
      department: 'Test',
      enrollment: 50,
      budget: 100000,
      revenue: 120000,
      status: 'Planned',
    });
    useEducationStore.getState().removeProgram('p5');
    expect(useEducationStore.getState().programs).toHaveLength(0);
  });

  it('should set enrollment trends', () => {
    const trends = [{ semester: 'Fall 2025', undergraduate: 5000, graduate: 1200, total: 6200 }];
    useEducationStore.getState().setEnrollmentTrends(trends);
    expect(useEducationStore.getState().enrollmentTrends).toEqual(trends);
  });

  it('should set scholarships', () => {
    const scholarships = [
      { id: 's1', name: 'Merit Award', awarded: 50, amount: 10000, recipients: 50 },
    ];
    useEducationStore.getState().setScholarships(scholarships);
    expect(useEducationStore.getState().scholarships).toEqual(scholarships);
  });

  it('should set loading state', () => {
    useEducationStore.getState().setLoading(true);
    expect(useEducationStore.getState().isLoading).toBe(true);
  });

  it('should set error state', () => {
    useEducationStore.getState().setError('Load failed');
    expect(useEducationStore.getState().error).toBe('Load failed');
  });

  it('should clear all data', () => {
    useEducationStore.getState().addProgram({
      id: 'p1',
      name: 'Test',
      department: 'Test',
      enrollment: 100,
      budget: 100,
      revenue: 100,
      status: 'Active',
    });
    useEducationStore.getState().setLoading(true);
    useEducationStore.getState().setError('err');
    useEducationStore.getState().clearAll();
    const state = useEducationStore.getState();
    expect(state.programs).toEqual([]);
    expect(state.enrollmentTrends).toEqual([]);
    expect(state.scholarships).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should calculate total enrollment', () => {
    useEducationStore.getState().setPrograms([
      {
        id: 'p1',
        name: 'A',
        department: 'D1',
        enrollment: 500,
        budget: 100,
        revenue: 100,
        status: 'Active',
      },
      {
        id: 'p2',
        name: 'B',
        department: 'D2',
        enrollment: 300,
        budget: 100,
        revenue: 100,
        status: 'Active',
      },
    ]);
    expect(useEducationStore.getState().getTotalEnrollment()).toBe(800);
  });

  it('should return 0 total enrollment for empty programs', () => {
    expect(useEducationStore.getState().getTotalEnrollment()).toBe(0);
  });

  it('should count active programs', () => {
    useEducationStore.getState().setPrograms([
      {
        id: 'p1',
        name: 'A',
        department: 'D1',
        enrollment: 500,
        budget: 100,
        revenue: 100,
        status: 'Active',
      },
      {
        id: 'p2',
        name: 'B',
        department: 'D2',
        enrollment: 300,
        budget: 100,
        revenue: 100,
        status: 'Suspended',
      },
      {
        id: 'p3',
        name: 'C',
        department: 'D3',
        enrollment: 200,
        budget: 100,
        revenue: 100,
        status: 'Active',
      },
    ]);
    expect(useEducationStore.getState().getActiveProgramCount()).toBe(2);
  });

  it('should return 0 active programs for empty list', () => {
    expect(useEducationStore.getState().getActiveProgramCount()).toBe(0);
  });
});

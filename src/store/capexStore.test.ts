import { describe, it, expect, beforeEach } from 'vitest';
import { useCapExStore } from './capexStore';

describe('capexStore', () => {
  beforeEach(() => {
    useCapExStore.setState({
      projects: [],
      assets: [],
      depreciationSchedule: [],
      isLoading: false,
      error: null,
    });
  });

  it('should have initial empty state after reset', () => {
    const state = useCapExStore.getState();
    expect(state.projects).toEqual([]);
    expect(state.assets).toEqual([]);
    expect(state.depreciationSchedule).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should set projects', () => {
    const projects = [
      {
        id: 'p1',
        name: 'Data Center',
        category: 'IT',
        budget: 1000000,
        actual: 950000,
        status: 'in-progress' as const,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        paybackPeriod: 3,
        irr: 15,
      },
    ];
    useCapExStore.getState().setProjects(projects);
    expect(useCapExStore.getState().projects).toEqual(projects);
  });

  it('should add a project', () => {
    useCapExStore.getState().addProject({
      id: 'p2',
      name: 'Office Renovation',
      category: 'Facilities',
      budget: 500000,
      actual: 480000,
      status: 'planned',
      startDate: '2026-03-01',
      endDate: '2026-09-30',
      paybackPeriod: 5,
      irr: 10,
    });
    expect(useCapExStore.getState().projects).toHaveLength(1);
    expect(useCapExStore.getState().projects[0].name).toBe('Office Renovation');
  });

  it('should update a project', () => {
    useCapExStore.getState().addProject({
      id: 'p3',
      name: 'Server Upgrade',
      category: 'IT',
      budget: 200000,
      actual: 180000,
      status: 'planned',
      startDate: '2026-04-01',
      endDate: '2026-06-30',
      paybackPeriod: 2,
      irr: 20,
    });
    useCapExStore.getState().updateProject('p3', { status: 'completed', actual: 195000 });
    const updated = useCapExStore.getState().projects[0];
    expect(updated.status).toBe('completed');
    expect(updated.actual).toBe(195000);
  });

  it('should not update non-existent project', () => {
    useCapExStore.getState().addProject({
      id: 'p4',
      name: 'Test',
      category: 'IT',
      budget: 100,
      actual: 50,
      status: 'planned',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      paybackPeriod: 1,
      irr: 5,
    });
    useCapExStore.getState().updateProject('nonexistent', { status: 'completed' });
    expect(useCapExStore.getState().projects[0].status).toBe('planned');
  });

  it('should remove a project', () => {
    useCapExStore.getState().addProject({
      id: 'p5',
      name: 'ToRemove',
      category: 'IT',
      budget: 100,
      actual: 50,
      status: 'planned',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      paybackPeriod: 1,
      irr: 5,
    });
    useCapExStore.getState().removeProject('p5');
    expect(useCapExStore.getState().projects).toHaveLength(0);
  });

  it('should set assets', () => {
    const assets = [
      {
        id: 'a1',
        name: 'Server Rack',
        category: 'IT',
        cost: 50000,
        usefulLife: 5,
        nbv: 40000,
        annualDep: 10000,
        acquisitionDate: '2026-01-01',
      },
    ];
    useCapExStore.getState().setAssets(assets);
    expect(useCapExStore.getState().assets).toEqual(assets);
  });

  it('should set depreciation schedule', () => {
    const entries = [
      {
        year: 2026,
        assetId: 'a1',
        assetName: 'Server Rack',
        beginningValue: 50000,
        depreciation: 10000,
        endingValue: 40000,
      },
    ];
    useCapExStore.getState().setDepreciationSchedule(entries);
    expect(useCapExStore.getState().depreciationSchedule).toEqual(entries);
  });

  it('should set loading state', () => {
    useCapExStore.getState().setLoading(true);
    expect(useCapExStore.getState().isLoading).toBe(true);
  });

  it('should set error state', () => {
    useCapExStore.getState().setError('Failed to load');
    expect(useCapExStore.getState().error).toBe('Failed to load');
  });

  it('should clear all data', () => {
    useCapExStore.getState().setProjects([
      {
        id: 'p1',
        name: 'Test',
        category: 'IT',
        budget: 100,
        actual: 50,
        status: 'planned',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        paybackPeriod: 1,
        irr: 5,
      },
    ]);
    useCapExStore.getState().setLoading(true);
    useCapExStore.getState().setError('err');
    useCapExStore.getState().clearAll();
    const state = useCapExStore.getState();
    expect(state.projects).toEqual([]);
    expect(state.assets).toEqual([]);
    expect(state.depreciationSchedule).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should filter projects by status', () => {
    useCapExStore.getState().setProjects([
      {
        id: 'p1',
        name: 'A',
        category: 'IT',
        budget: 100,
        actual: 50,
        status: 'planned',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        paybackPeriod: 1,
        irr: 5,
      },
      {
        id: 'p2',
        name: 'B',
        category: 'IT',
        budget: 200,
        actual: 150,
        status: 'completed',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        paybackPeriod: 2,
        irr: 10,
      },
    ]);
    expect(useCapExStore.getState().getProjectsByStatus('planned')).toHaveLength(1);
    expect(useCapExStore.getState().getProjectsByStatus('completed')).toHaveLength(1);
    expect(useCapExStore.getState().getProjectsByStatus('cancelled')).toHaveLength(0);
  });

  it('should calculate total budget', () => {
    useCapExStore.getState().setProjects([
      {
        id: 'p1',
        name: 'A',
        category: 'IT',
        budget: 100,
        actual: 50,
        status: 'planned',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        paybackPeriod: 1,
        irr: 5,
      },
      {
        id: 'p2',
        name: 'B',
        category: 'IT',
        budget: 200,
        actual: 150,
        status: 'completed',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        paybackPeriod: 2,
        irr: 10,
      },
    ]);
    expect(useCapExStore.getState().getTotalBudget()).toBe(300);
  });

  it('should return 0 total budget for empty projects', () => {
    expect(useCapExStore.getState().getTotalBudget()).toBe(0);
  });

  it('should calculate total actual', () => {
    useCapExStore.getState().setProjects([
      {
        id: 'p1',
        name: 'A',
        category: 'IT',
        budget: 100,
        actual: 50,
        status: 'planned',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        paybackPeriod: 1,
        irr: 5,
      },
      {
        id: 'p2',
        name: 'B',
        category: 'IT',
        budget: 200,
        actual: 150,
        status: 'completed',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        paybackPeriod: 2,
        irr: 10,
      },
    ]);
    expect(useCapExStore.getState().getTotalActual()).toBe(200);
  });

  it('should filter assets by category', () => {
    useCapExStore.getState().setAssets([
      {
        id: 'a1',
        name: 'Server',
        category: 'IT',
        cost: 50000,
        usefulLife: 5,
        nbv: 40000,
        annualDep: 10000,
        acquisitionDate: '2026-01-01',
      },
      {
        id: 'a2',
        name: 'Desk',
        category: 'Furniture',
        cost: 500,
        usefulLife: 10,
        nbv: 450,
        annualDep: 50,
        acquisitionDate: '2026-01-01',
      },
    ]);
    expect(useCapExStore.getState().getAssetsByCategory('IT')).toHaveLength(1);
    expect(useCapExStore.getState().getAssetsByCategory('Furniture')).toHaveLength(1);
    expect(useCapExStore.getState().getAssetsByCategory('Vehicle')).toHaveLength(0);
  });
});

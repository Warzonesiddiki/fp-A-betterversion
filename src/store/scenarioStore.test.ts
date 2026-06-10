import { describe, it, expect, beforeEach } from 'vitest';
import { useScenarioStore } from './scenarioStore';

describe('scenarioStore', () => {
  beforeEach(() => {
    useScenarioStore.setState({
      scenarios: [],
      selectedScenarioId: null,
      comparedScenarioIds: [],
      isLoading: false,
    });
  });

  it('should have correct initial state', () => {
    const state = useScenarioStore.getState();
    expect(state.scenarios).toEqual([]);
    expect(state.selectedScenarioId).toBeNull();
    expect(state.comparedScenarioIds).toEqual([]);
    expect(state.isLoading).toBe(false);
  });

  it('should create a scenario', () => {
    const id = useScenarioStore.getState().createScenario({
      name: 'Base Case',
      description: 'Base scenario',
      status: 'draft',
    } as any);
    expect(id).toMatch(/^scn-/);
    expect(useScenarioStore.getState().scenarios).toHaveLength(1);
    expect(useScenarioStore!.getState().scenarios[0]!.name).toBe('Base Case');
  });

  it('should update a scenario', () => {
    const id = useScenarioStore.getState().createScenario({
      name: 'Scenario 1',
      status: 'draft',
    } as any);
    useScenarioStore.getState().updateScenario(id, { name: 'Updated' });
    expect(useScenarioStore!.getState().scenarios[0]!.name).toBe('Updated');
  });

  it('should delete a scenario', () => {
    const id = useScenarioStore.getState().createScenario({
      name: 'Scenario 1',
      status: 'draft',
    } as any);
    useScenarioStore.getState().deleteScenario(id);
    expect(useScenarioStore.getState().scenarios).toHaveLength(0);
  });

  it('should clear selected scenario when deleted', () => {
    const id = useScenarioStore.getState().createScenario({
      name: 'Scenario 1',
      status: 'draft',
    } as any);
    useScenarioStore.getState().setSelectedScenario(id);
    useScenarioStore.getState().deleteScenario(id);
    expect(useScenarioStore.getState().selectedScenarioId).toBeNull();
  });

  it('should set selected scenario', () => {
    useScenarioStore.getState().setSelectedScenario('scn-1');
    expect(useScenarioStore.getState().selectedScenarioId).toBe('scn-1');
  });

  it('should toggle scenario comparison', () => {
    useScenarioStore.getState().toggleScenarioComparison('scn-1');
    expect(useScenarioStore.getState().comparedScenarioIds).toContain('scn-1');
    useScenarioStore.getState().toggleScenarioComparison('scn-1');
    expect(useScenarioStore.getState().comparedScenarioIds).not.toContain('scn-1');
  });

  it('should set scenarios', () => {
    const scenarios = [{ id: 'scn-1', name: 'S1' }] as any;
    useScenarioStore.getState().setScenarios(scenarios);
    expect(useScenarioStore.getState().scenarios).toEqual(scenarios);
  });
});

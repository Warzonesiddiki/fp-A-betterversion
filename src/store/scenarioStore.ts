import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import type { Scenario, ScenarioState } from '../types';
import { masterStorage } from '../utils/masterStorage';

export const useScenarioStore = create<ScenarioState>()(
  subscribeWithSelector(
    persist(
      (set) => ({
        scenarios: [],
        selectedScenarioId: null,
        comparedScenarioIds: [],
        isLoading: false,
        error: null,

        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),
        setLoading: (loading) => set({ isLoading: loading }),

        setScenarios: (scenarios) => set({ scenarios }),

        setSelectedScenario: (id) => set({ selectedScenarioId: id }),

        createScenario: (scenario) => {
          const newScenario: Scenario = {
            ...scenario,
            id: `scn-${Date.now()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          set((state) => ({ scenarios: [...state.scenarios, newScenario] }));
          return newScenario.id;
        },

        updateScenario: (id, updates) => {
          set((state) => ({
            scenarios: state.scenarios.map((s) =>
              s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
            ),
          }));
        },

        deleteScenario: (id) => {
          set((state) => ({
            scenarios: state.scenarios.filter((s) => s.id !== id),
            selectedScenarioId: state.selectedScenarioId === id ? null : state.selectedScenarioId,
          }));
        },

        toggleScenarioComparison: (id) => {
          set((state) => {
            const isCompared = state.comparedScenarioIds.includes(id);
            return {
              comparedScenarioIds: isCompared
                ? state.comparedScenarioIds.filter((cid) => cid !== id)
                : [...state.comparedScenarioIds, id],
            };
          });
        },
      }),
      {
        name: 'scenario-store',
        storage: masterStorage,
      }
    )
  )
);

// Memoized selectors to prevent unnecessary re-renders
export const scenarioSelectors = {
  scenarios: (state: ScenarioState) => state.scenarios,
  selectedScenarioId: (state: ScenarioState) => state.selectedScenarioId,
  comparedScenarioIds: (state: ScenarioState) => state.comparedScenarioIds,
  isLoading: (state: ScenarioState) => state.isLoading,
  // Derived selectors
  scenarioCount: (state: ScenarioState) => state.scenarios.length,
  selectedScenario: (state: ScenarioState) =>
    state.scenarios.find((s) => s.id === state.selectedScenarioId) ?? null,
  comparedScenarios: (state: ScenarioState) =>
    state.scenarios.filter((s) => state.comparedScenarioIds.includes(s.id)),
  hasScenarios: (state: ScenarioState) => state.scenarios.length > 0,
  isComparing: (state: ScenarioState) => state.comparedScenarioIds.length > 0,
};

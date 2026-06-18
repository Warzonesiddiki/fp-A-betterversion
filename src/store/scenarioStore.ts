import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Scenario, ScenarioState } from '../types';
import { masterStorage } from '../utils/masterStorage';
import { enforce, Permissions } from '../utils/rbacEnforcer';

export const useScenarioStore = create<ScenarioState>()(
  subscribeWithSelector(
    persist(
      immer((set) => ({
        scenarios: [],
        selectedScenarioId: null,
        comparedScenarioIds: [],
        isLoading: false,
        error: null,

        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),
        setLoading: (loading) => set({ isLoading: loading }),

        setScenarios: enforce(Permissions.SCENARIO_UPDATE, 'setScenarios', (scenarios) =>
          set({ scenarios })
        ),

        setSelectedScenario: enforce(Permissions.UI_UPDATE, 'setSelectedScenario', (id) =>
          set({ selectedScenarioId: id })
        ),

        createScenario: enforce(Permissions.SCENARIO_CREATE, 'createScenario', (scenario) => {
          const newScenario: Scenario = {
            ...scenario,
            id: `scn-${Date.now()}`,
            isLocked: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          set((state) => ({ scenarios: [...state.scenarios, newScenario] }));
          return newScenario.id;
        }),

        updateScenario: enforce(Permissions.SCENARIO_UPDATE, 'updateScenario', (id, updates) => {
          set((state) => ({
            scenarios: state.scenarios.map((s) => {
              if (s.id !== id) return s;
              if (s.isLocked) return s;
              return { ...s, ...updates, updatedAt: new Date().toISOString() };
            }),
          }));
        }),

        deleteScenario: enforce(Permissions.SCENARIO_DELETE, 'deleteScenario', (id) => {
          set((state) => ({
            scenarios: state.scenarios.filter((s) => s.id !== id || s.isLocked),
            selectedScenarioId: state.selectedScenarioId === id ? null : state.selectedScenarioId,
          }));
        }),

        toggleScenarioComparison: enforce(
          Permissions.SCENARIO_UPDATE,
          'toggleScenarioComparison',
          (id) => {
            set((state) => {
              const isCompared = state.comparedScenarioIds.includes(id);
              return {
                comparedScenarioIds: isCompared
                  ? state.comparedScenarioIds.filter((cid) => cid !== id)
                  : [...state.comparedScenarioIds, id],
              };
            });
          }
        ),

        lockScenario: enforce(Permissions.SCENARIO_LOCK, 'lockScenario', (id) => {
          set((state) => ({
            scenarios: state.scenarios.map((s) =>
              s.id === id ? { ...s, isLocked: true, updatedAt: new Date().toISOString() } : s
            ),
          }));
        }),

        unlockScenario: enforce(Permissions.SCENARIO_LOCK, 'unlockScenario', (id) => {
          set((state) => ({
            scenarios: state.scenarios.map((s) =>
              s.id === id ? { ...s, isLocked: false, updatedAt: new Date().toISOString() } : s
            ),
          }));
        }),

        // G12 #1 — Scenario Merge: combine two scenarios into a new one
        mergeScenarios: enforce(
          Permissions.SCENARIO_CREATE,
          'mergeScenarios',
          (sourceId, targetId, mergedName) => {
            set((state) => {
              const source = state.scenarios.find((s) => s.id === sourceId);
              const target = state.scenarios.find((s) => s.id === targetId);
              if (!source || !target) return state;
              if (source.isLocked || target.isLocked) return state;
              const merged: Scenario = {
                ...target,
                id: `scn-merge-${Date.now()}`,
                name: mergedName || `Merge of ${source.name} + ${target.name}`,
                isLocked: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                assumptions: [...target.assumptions],
              };
              return { scenarios: [...state.scenarios, merged] };
            });
          }
        ),
      })),
      {
        name: 'scenario-store',
        storage: masterStorage,
        version: 1,
        migrate: (state: unknown) => state,
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

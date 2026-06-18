// =============================================================================
// DRIVER STORE — Zustand store for driver-based planning
// Manages drivers, cascade rules, and recalculation state
// =============================================================================

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { masterStorage } from '@/utils/masterStorage';
import {
  DriverCascadeEngine,
  type Driver,
  type CascadeRule,
  type CascadeResult,
  type ImpactAnalysis,
  type DriverSnapshot,
} from '@/engines/DriverCascadeEngine';
import { enforce, Permissions } from '@/utils/rbacEnforcer';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DriverState {
  // Engine instance
  engine: DriverCascadeEngine;

  // UI state
  isRecalculating: boolean;
  affectedCellCount: number;
  lastCascadeResult: CascadeResult | null;
  selectedDriverId: string | null;

  // Actions
  addDriver: (driver: Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>) => Driver;
  updateDriver: (
    id: string,
    updates: Partial<
      Pick<
        Driver,
        | 'name'
        | 'description'
        | 'currentValue'
        | 'baseValue'
        | 'minValue'
        | 'maxValue'
        | 'step'
        | 'category'
        | 'tags'
      >
    >
  ) => Driver | undefined;
  removeDriver: (id: string) => boolean;
  selectDriver: (id: string | null) => void;

  addRule: (rule: Omit<CascadeRule, 'id'>) => CascadeRule;
  removeRule: (ruleId: string) => boolean;
  getRulesForDriver: (driverId: string) => CascadeRule[];

  calculateCascade: (
    driverId: string,
    newValue: number,
    readCell: (cube: string, coords: Record<string, string>, measure: string) => number | undefined
  ) => CascadeResult;

  applyCascade: (
    result: CascadeResult,
    writeCell: (
      cube: string,
      coords: Record<string, string>,
      measure: string,
      value: number
    ) => void
  ) => void;

  analyzeImpact: (
    driverId: string,
    newValue: number,
    readCell: (cube: string, coords: Record<string, string>, measure: string) => number | undefined
  ) => ImpactAnalysis;

  batchUpdate: (
    updates: Array<{ driverId: string; newValue: number }>,
    readCell: (cube: string, coords: Record<string, string>, measure: string) => number | undefined,
    writeCell: (
      cube: string,
      coords: Record<string, string>,
      measure: string,
      value: number
    ) => void
  ) => CascadeResult[];

  createSnapshot: () => DriverSnapshot;
  restoreSnapshot: (snapshot: DriverSnapshot) => void;

  reset: () => void;
}

// ---------------------------------------------------------------------------
// Singleton engine
// ---------------------------------------------------------------------------

let engineInstance: DriverCascadeEngine | null = null;

function getEngine(): DriverCascadeEngine {
  if (!engineInstance) {
    engineInstance = new DriverCascadeEngine();
  }
  return engineInstance;
}

export function resetEngine(): void {
  engineInstance = null;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useDriverStore = create<DriverState>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        engine: getEngine(),
        isRecalculating: false,
        affectedCellCount: 0,
        lastCascadeResult: null,
        selectedDriverId: null,

        addDriver: enforce(Permissions.DRIVER_CREATE, 'addDriver', (driver) => {
          const engine = get().engine;
          const result = engine.addDriver(driver);
          set({ engine });
          return result;
        }),

        updateDriver: enforce(Permissions.DRIVER_UPDATE, 'updateDriver', (id, updates) => {
          const engine = get().engine;
          const result = engine.updateDriver(id, updates);
          if (result) set({ engine });
          return result;
        }),

        removeDriver: enforce(Permissions.DRIVER_DELETE, 'removeDriver', (id) => {
          const engine = get().engine;
          const result = engine.removeDriver(id);
          if (result) {
            set({
              engine,
              selectedDriverId: get().selectedDriverId === id ? null : get().selectedDriverId,
            });
          }
          return result;
        }),

        selectDriver: (id) => {
          set({ selectedDriverId: id });
        },

        addRule: enforce(Permissions.DRIVER_CREATE, 'addRule', (rule) => {
          const engine = get().engine;
          const result = engine.addRule(rule);
          set({ engine });
          return result;
        }),

        removeRule: enforce(Permissions.DRIVER_DELETE, 'removeRule', (ruleId) => {
          const engine = get().engine;
          const result = engine.removeRule(ruleId);
          if (result) set({ engine });
          return result;
        }),

        getRulesForDriver: (driverId) => {
          const engine = get().engine;
          return engine.getRulesForDriver(driverId);
        },

        calculateCascade: (driverId, newValue, readCell) => {
          set({ isRecalculating: true });
          const engine = get().engine;
          const result = engine.calculateCascade(driverId, newValue, readCell);
          set({
            isRecalculating: false,
            affectedCellCount: result.affectedCells.length,
            lastCascadeResult: result,
          });
          return result;
        },

        applyCascade: enforce(Permissions.DRIVER_UPDATE, 'applyCascade', (result, writeCell) => {
          const engine = get().engine;
          engine.applyCascade(result, writeCell);
          set({ engine, lastCascadeResult: null });
        }),

        analyzeImpact: (driverId, newValue, readCell) => {
          const engine = get().engine;
          return engine.analyzeImpact(driverId, newValue, readCell);
        },

        batchUpdate: enforce(
          Permissions.DRIVER_UPDATE,
          'batchUpdate',
          (updates, readCell, writeCell) => {
            set({ isRecalculating: true });
            const engine = get().engine;
            const results = engine.batchUpdateDrivers(updates, readCell, writeCell);
            set({ isRecalculating: false });
            return results;
          }
        ),

        createSnapshot: () => {
          const engine = get().engine;
          return engine.createSnapshot();
        },

        restoreSnapshot: enforce(Permissions.DRIVER_UPDATE, 'restoreSnapshot', (snapshot) => {
          const engine = get().engine;
          engine.restoreSnapshot(snapshot);
          set({ engine });
        }),

        reset: enforce(Permissions.DRIVER_DELETE, 'reset', () => {
          const engine = get().engine;
          engine.reset();
          set({
            engine,
            isRecalculating: false,
            affectedCellCount: 0,
            lastCascadeResult: null,
            selectedDriverId: null,
          });
        }),
      })),
      {
        name: 'driver-store',
        storage: masterStorage,
        version: 1,
        migrate: (state: unknown) => state,
        partialize: (state) => ({
          engine: state.engine,
        }),
      }
    )
  )
);

// ---------------------------------------------------------------------------
// Driver Templates (stub — extend as needed)
// ---------------------------------------------------------------------------

export interface DriverTemplate {
  id: string;
  name: string;
  description: string;
  category: 'revenue' | 'cost' | 'headcount' | 'capex' | 'custom';
  drivers: Driver[];
}

export const DRIVER_TEMPLATES: DriverTemplate[] = [
  {
    id: 'revenue-growth',
    name: 'Revenue Growth',
    description: 'Standard revenue growth driver with volume × price',
    category: 'revenue',
    drivers: [
      {
        id: 'volume',
        name: 'Volume',
        category: 'revenue',
        unit: 'absolute',
        baseValue: 1000,
        currentValue: 1000,
        minValue: 0,
        maxValue: 10000,
        step: 100,
        tags: ['revenue'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'price',
        name: 'Price',
        category: 'revenue',
        unit: 'absolute',
        baseValue: 50,
        currentValue: 50,
        minValue: 0,
        maxValue: 1000,
        step: 1,
        tags: ['revenue'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'headcount-plan',
    name: 'Headcount Planning',
    description: 'Workforce planning with salary and benefits',
    category: 'headcount',
    drivers: [
      {
        id: 'headcount',
        name: 'Headcount',
        category: 'headcount',
        unit: 'absolute',
        baseValue: 100,
        currentValue: 100,
        minValue: 0,
        maxValue: 1000,
        step: 1,
        tags: ['headcount'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'avg-salary',
        name: 'Average Salary',
        category: 'headcount',
        unit: 'absolute',
        baseValue: 85000,
        currentValue: 85000,
        minValue: 0,
        maxValue: 500000,
        step: 1000,
        tags: ['headcount'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  },
];

export function loadDriverTemplate(template: DriverTemplate): void {
  const store = useDriverStore.getState();
  template.drivers.forEach((driver) => {
    store.addDriver(driver);
  });
}

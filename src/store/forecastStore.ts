import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Forecast, ForecastDriver, ForecastState } from '../types';
import { masterStorage } from '../utils/masterStorage';
import { UndoRedoEngine } from '@/engines/UndoRedoEngine';

interface ForecastSnapshot {
  forecasts: Forecast[];
  drivers: ForecastDriver[];
  selectedForecastId: string | null;
}

const undoEngine = new UndoRedoEngine<ForecastSnapshot>(100);

function captureForecastSnapshot(get: () => ReturnType<typeof useForecastStore.getState>) {
  const state = get();
  undoEngine.push({
    forecasts: state.forecasts,
    drivers: state.drivers,
    selectedForecastId: state.selectedForecastId,
  });
}

export const useForecastStore = create<ForecastState>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        forecasts: [],
        drivers: [],
        selectedForecastId: null,
        isLoading: false,
        error: null as string | null,

        undo: () => {
          const snapshot = undoEngine.undo();
          if (snapshot !== null) {
            set({
              forecasts: snapshot.forecasts,
              drivers: snapshot.drivers,
              selectedForecastId: snapshot.selectedForecastId,
            });
          }
        },

        redo: () => {
          const snapshot = undoEngine.redo();
          if (snapshot !== null) {
            set({
              forecasts: snapshot.forecasts,
              drivers: snapshot.drivers,
              selectedForecastId: snapshot.selectedForecastId,
            });
          }
        },

        canUndo: () => undoEngine.canUndo(),
        canRedo: () => undoEngine.canRedo(),
        getHistoryLength: () => undoEngine.getHistoryLength(),

        setForecasts: (forecasts) => {
          captureForecastSnapshot(get);
          set({ forecasts });
        },

        setSelectedForecast: (id) => {
          const forecast = get().forecasts.find((f) => f.id === id);
          if (!forecast) return;
          set({ selectedForecastId: id });
        },

        createForecast: (forecast) => {
          // Input validation
          if (!forecast || typeof forecast !== 'object') {
            throw new Error('forecast must be an object');
          }
          if (
            !forecast.name ||
            typeof forecast.name !== 'string' ||
            forecast.name.trim().length === 0
          ) {
            throw new Error('forecast name must be a non-empty string');
          }
          if (forecast.name.length > 200) {
            throw new Error('forecast name must be 200 characters or less');
          }
          captureForecastSnapshot(get);
          const newForecast: Forecast = {
            ...forecast,
            id: `fcst-${Date.now()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          set((state) => {
            state.forecasts.push(newForecast);
          });
          return newForecast.id;
        },

        updateForecast: (id, updates) => {
          captureForecastSnapshot(get);
          set((state) => {
            const forecast = state.forecasts.find((f) => f.id === id);
            if (forecast) {
              Object.assign(forecast, updates);
              forecast.updatedAt = new Date().toISOString();
            }
          });
        },

        deleteForecast: (id) => {
          captureForecastSnapshot(get);
          set((state) => {
            const idx = state.forecasts.findIndex((f) => f.id === id);
            if (idx !== -1) state.forecasts.splice(idx, 1);
            if (state.selectedForecastId === id) state.selectedForecastId = null;
          });
        },

        setDrivers: (drivers) => {
          captureForecastSnapshot(get);
          set({ drivers });
        },

        updateDriver: (id, updates) => {
          captureForecastSnapshot(get);
          set((state) => {
            const driver = state.drivers.find((d) => d.id === id);
            if (driver) Object.assign(driver, updates);
          });
        },

        setError: (error) => {
          set({ error });
        },

        clearError: () => {
          set({ error: null });
        },

        setLoading: (loading) => {
          set({ isLoading: loading });
        },
      })),
      {
        name: 'forecast-store',
        storage: masterStorage,
      }
    )
  )
);

// Memoized selectors to prevent unnecessary re-renders
export const forecastSelectors = {
  forecasts: (state: ForecastState) => state.forecasts,
  drivers: (state: ForecastState) => state.drivers,
  selectedForecastId: (state: ForecastState) => state.selectedForecastId,
  isLoading: (state: ForecastState) => state.isLoading,
  // Derived selectors
  forecastCount: (state: ForecastState) => state.forecasts.length,
  driverCount: (state: ForecastState) => state.drivers.length,
  selectedForecast: (state: ForecastState) =>
    state.forecasts.find((f) => f.id === state.selectedForecastId) ?? null,
  hasForecasts: (state: ForecastState) => state.forecasts.length > 0,
  hasDrivers: (state: ForecastState) => state.drivers.length > 0,
};

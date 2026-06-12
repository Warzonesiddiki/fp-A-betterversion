/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach } from 'vitest';
import { useForecastStore } from './forecastStore';

describe('forecastStore', () => {
  beforeEach(() => {
    useForecastStore.setState({
      forecasts: [],
      drivers: [],
      selectedForecastId: null,
      isLoading: false,
    });
  });

  it('should have correct initial state', () => {
    const state = useForecastStore.getState();
    expect(state.forecasts).toEqual([]);
    expect(state.drivers).toEqual([]);
    expect(state.selectedForecastId).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it('should create a forecast', () => {
    const id = useForecastStore.getState().createForecast({
      name: 'Q1 Forecast',
      description: 'Test',
      status: 'draft',
    } as any);
    expect(id).toMatch(/^fcst-/);
    expect(useForecastStore.getState().forecasts).toHaveLength(1);
    expect(useForecastStore!.getState().forecasts[0]!.name).toBe('Q1 Forecast');
  });

  it('should update a forecast', () => {
    const id = useForecastStore.getState().createForecast({
      name: 'Forecast 1',
      status: 'draft',
    } as any);
    useForecastStore.getState().updateForecast(id, { name: 'Updated' });
    expect(useForecastStore!.getState().forecasts[0]!.name).toBe('Updated');
    expect(useForecastStore!.getState().forecasts[0]!.lastUpdated).toBeDefined();
  });

  it('should delete a forecast', () => {
    const id = useForecastStore.getState().createForecast({
      name: 'Forecast 1',
      status: 'draft',
    } as any);
    useForecastStore.getState().deleteForecast(id);
    expect(useForecastStore.getState().forecasts).toHaveLength(0);
  });

  it('should clear selected forecast when deleted', () => {
    const id = useForecastStore.getState().createForecast({
      name: 'Forecast 1',
      status: 'draft',
    } as any);
    useForecastStore.getState().setSelectedForecast(id);
    useForecastStore.getState().deleteForecast(id);
    expect(useForecastStore.getState().selectedForecastId).toBeNull();
  });

  it('should set selected forecast', () => {
    const id = useForecastStore.getState().createForecast({
      name: 'Forecast 1',
      status: 'draft',
    } as any);
    useForecastStore.getState().setSelectedForecast(id);
    expect(useForecastStore.getState().selectedForecastId).toBe(id);
  });

  it('should not set selected forecast for non-existent id', () => {
    useForecastStore.getState().setSelectedForecast('non-existent');
    expect(useForecastStore.getState().selectedForecastId).toBeNull();
  });

  it('should set forecasts', () => {
    const forecasts = [{ id: 'fcst-1', name: 'F1' }] as any;
    useForecastStore.getState().setForecasts(forecasts);
    expect(useForecastStore.getState().forecasts).toEqual(forecasts);
  });

  it('should set drivers', () => {
    const drivers = [{ id: 'drv-1', name: 'Growth' }] as any;
    useForecastStore.getState().setDrivers(drivers);
    expect(useForecastStore.getState().drivers).toEqual(drivers);
  });

  it('should update a driver', () => {
    useForecastStore
      .getState()
      .setDrivers([{ id: 'drv-1', name: 'Growth', currentValue: 10 }] as any);
    useForecastStore.getState().updateDriver('drv-1', { currentValue: 15 });
    expect(useForecastStore!.getState().drivers[0]!.currentValue).toBe(15);
  });
});

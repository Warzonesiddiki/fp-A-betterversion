import { describe, it, expect, beforeEach } from 'vitest';
import { useEnergyStore } from './energyStore';

describe('energyStore', () => {
  beforeEach(() => {
    useEnergyStore.setState({
      assets: [],
      generationTrend: [],
      capacityMix: [],
    });
  });

  it('should have initial empty state after reset', () => {
    const state = useEnergyStore.getState();
    expect(state.assets).toEqual([]);
    expect(state.generationTrend).toEqual([]);
    expect(state.capacityMix).toEqual([]);
  });

  it('should set assets', () => {
    const assets = [
      {
        id: 'S-01',
        name: 'Solar Farm',
        type: 'Solar' as const,
        capacity: '100 MW',
        outputYTD: '10 GWh',
        availability: '99%',
        roi: '12%',
      },
    ];
    useEnergyStore.getState().setAssets(assets);
    expect(useEnergyStore.getState().assets).toEqual(assets);
  });

  it('should add an asset', () => {
    useEnergyStore.getState().addAsset({
      id: 'W-01',
      name: 'Wind Farm',
      type: 'Wind',
      capacity: '50 MW',
      outputYTD: '5 GWh',
      availability: '95%',
      roi: '8%',
    });
    expect(useEnergyStore.getState().assets).toHaveLength(1);
    expect(useEnergyStore!.getState().assets[0]!.name).toBe('Wind Farm');
  });

  it('should remove an asset', () => {
    useEnergyStore.getState().addAsset({
      id: 'S-01',
      name: 'Solar',
      type: 'Solar',
      capacity: '100',
      outputYTD: '10',
      availability: '99',
      roi: '12',
    });
    useEnergyStore.getState().addAsset({
      id: 'W-01',
      name: 'Wind',
      type: 'Wind',
      capacity: '50',
      outputYTD: '5',
      availability: '95',
      roi: '8',
    });
    useEnergyStore.getState().removeAsset('S-01');
    expect(useEnergyStore.getState().assets).toHaveLength(1);
    expect(useEnergyStore!.getState().assets[0]!.id).toBe('W-01');
  });

  it('should set generation trend', () => {
    const trend = [{ date: '2026-01', solar: 100, wind: 50, hydro: 30, total: 180 }];
    useEnergyStore.getState().setGenerationTrend(trend);
    expect(useEnergyStore.getState().generationTrend).toEqual(trend);
  });

  it('should set capacity mix', () => {
    const mix = [{ name: 'Solar', value: 60, color: '#FFD700' }];
    useEnergyStore.getState().setCapacityMix(mix);
    expect(useEnergyStore.getState().capacityMix).toEqual(mix);
  });
});

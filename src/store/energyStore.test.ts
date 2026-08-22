import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useEnergyStore } from './energyStore';
import { actAs } from '@/test/rbacFixtures';

describe('energyStore', () => {
  beforeEach(() => {
    actAs('Admin');
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

  // =============================================================================
  // K17 CONTRACT (regression lock for 1bea2f3a)
  // -----------------------------------------------------------------------------
  // Pre-1bea2f3a the factory shipped demo records as persisted defaults:
  // five named facilities ("Mojave Solar I", "North Sea Wind", "Blue River
  // Hydro", "Arizona Array", "Tesla Megapack Hub"), a seven-point Jan-2026
  // generation trend and a five-slice capacity mix. Every tenant got them
  // rendered as if they were recorded data. The factory defaults must stay
  // EMPTY ARRAYS; users record their own. This spec re-imports the module so
  // it observes the true factory state, not the beforeEach-reset state.
  // =============================================================================
  describe('K17: factory defaults ship no invented business records', () => {
    async function freshFactoryState() {
      vi.resetModules();
      const fresh = await import('./energyStore');
      return fresh.useEnergyStore.getState();
    }

    it('all three record slices default to empty arrays', async () => {
      const s = await freshFactoryState();
      expect(Array.isArray(s.assets)).toBe(true);
      expect(Array.isArray(s.generationTrend)).toBe(true);
      expect(Array.isArray(s.capacityMix)).toBe(true);
      expect(s.assets).toEqual([]);
      expect(s.generationTrend).toEqual([]);
      expect(s.capacityMix).toEqual([]);
    });

    it('retired seed names and fixture totals never return as defaults', async () => {
      const s = await freshFactoryState();
      const raw = JSON.stringify({ ...s, setAssets: undefined });
      for (const retired of [
        'Mojave Solar I',
        'North Sea Wind',
        'Blue River Hydro',
        'Arizona Array',
        'Tesla Megapack Hub',
        '"total":950',
        '"total":1120',
        'Onshore Wind',
        'Battery Storage',
      ]) {
        expect(raw).not.toContain(retired);
      }
      expect(raw).not.toMatch(/"capacity":"\d+ MW"/);
      expect(raw).not.toMatch(/"roi":"\d+(\.\d+)?%"/);
    });
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

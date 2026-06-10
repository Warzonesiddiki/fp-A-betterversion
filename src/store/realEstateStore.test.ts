import { describe, it, expect, beforeEach } from 'vitest';
import { useRealEstateStore } from './realEstateStore';

describe('realEstateStore', () => {
  beforeEach(() => {
    useRealEstateStore.setState({
      maintenanceTrend: [],
      facilities: [],
    });
  });

  it('should have initial empty state after reset', () => {
    const state = useRealEstateStore.getState();
    expect(state.maintenanceTrend).toEqual([]);
    expect(state.facilities).toEqual([]);
  });

  it('should set maintenance trend', () => {
    const trend = [{ month: 'Jan', planned: 120000, reactive: 45000 }];
    useRealEstateStore.getState().setMaintenanceTrend(trend);
    expect(useRealEstateStore.getState().maintenanceTrend).toEqual(trend);
  });

  it('should set facilities', () => {
    const facilities = [
      {
        id: 'F-1',
        name: 'Tower A',
        opex_sqft: '$8.00',
        utilities: '$40k',
        cleaning: '$15k',
        maintenance: '$20k',
        efficiency: '92%',
      },
    ];
    useRealEstateStore.getState().setFacilities(facilities);
    expect(useRealEstateStore.getState().facilities).toEqual(facilities);
  });

  it('should add a facility', () => {
    useRealEstateStore.getState().addFacility({
      id: 'F-2',
      name: 'Tower B',
      opex_sqft: '$9.50',
      utilities: '$55k',
      cleaning: '$22k',
      maintenance: '$30k',
      efficiency: '88%',
    });
    expect(useRealEstateStore.getState().facilities).toHaveLength(1);
    expect(useRealEstateStore!.getState().facilities[0]!.name).toBe('Tower B');
  });

  it('should update a facility', () => {
    useRealEstateStore.getState().addFacility({
      id: 'F-3',
      name: 'Tower C',
      opex_sqft: '$7.00',
      utilities: '$35k',
      cleaning: '$12k',
      maintenance: '$18k',
      efficiency: '95%',
    });
    useRealEstateStore
      .getState()
      .updateFacility('F-3', { efficiency: '97%', name: 'Tower C Premium' });
    const updated = useRealEstateStore.getState().facilities[0];
    expect(updated!.efficiency).toBe('97%');
    expect(updated!.name).toBe('Tower C Premium');
  });

  it('should remove a facility', () => {
    useRealEstateStore.getState().addFacility({
      id: 'F-4',
      name: 'D',
      opex_sqft: '$5',
      utilities: '$10k',
      cleaning: '$5k',
      maintenance: '$8k',
      efficiency: '90%',
    });
    useRealEstateStore.getState().addFacility({
      id: 'F-5',
      name: 'E',
      opex_sqft: '$6',
      utilities: '$12k',
      cleaning: '$6k',
      maintenance: '$9k',
      efficiency: '88%',
    });
    useRealEstateStore.getState().removeFacility('F-4');
    expect(useRealEstateStore.getState().facilities).toHaveLength(1);
    expect(useRealEstateStore!.getState().facilities[0]!.id).toBe('F-5');
  });

  it('should not update non-existent facility', () => {
    useRealEstateStore.getState().addFacility({
      id: 'F-6',
      name: 'F',
      opex_sqft: '$5',
      utilities: '$10k',
      cleaning: '$5k',
      maintenance: '$8k',
      efficiency: '90%',
    });
    useRealEstateStore.getState().updateFacility('F-999', { efficiency: '99%' });
    expect(useRealEstateStore!.getState().facilities[0]!.efficiency).toBe('90%');
  });
});

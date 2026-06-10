/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSector } from './useSector';
import { useSettingsStore } from '@/store/settingsStore';
import * as sectorConfig from '@/config/sectors';
import type { SectorConfig } from '@/config/sectors';

vi.mock('@/store/settingsStore');
vi.mock('@/config/sectors');

const mockUseSettingsStore = vi.mocked(useSettingsStore);
const mockGetSectorConfig = vi.mocked(sectorConfig.getSectorConfig);
const mockGetAllSectors = vi.mocked(sectorConfig.getAllSectors);

const techConfig: SectorConfig = {
  id: 'technology',
  name: 'Technology',
  description: 'Technology sector',
  defaultKPIs: [
    { id: 'revenue', label: 'Revenue', format: 'currency', target: 1000000 },
    { id: 'gross_margin', label: 'Gross Margin', format: 'percent', target: 0.7 },
    { id: 'ebitda', label: 'EBITDA', format: 'currency', target: 300000 },
    { id: 'arr', label: 'ARR', format: 'currency', target: 5000000 },
    { id: 'nrr', label: 'Net Revenue Retention', format: 'percent', target: 1.1 },
  ],
  enabledModules: ['revenue', 'headcount', 'expenses'],
  sidebarOrder: [
    'overview',
    'revenue',
    'headcount',
    'expenses',
    'metrics',
    'scenarios',
    'reports',
    'settings',
    'import',
    'admin',
  ],
  defaultCurrency: 'USD',
};

const healthConfig: SectorConfig = {
  id: 'health',
  name: 'Healthcare',
  description: 'Healthcare sector',
  defaultKPIs: [
    { id: 'revenue', label: 'Revenue', format: 'currency', target: 2000000 },
    { id: 'admissions', label: 'Admissions', format: 'number', target: 5000 },
    { id: 'occupancy', label: 'Bed Occupancy', format: 'percent', target: 0.85 },
    { id: 'rvus', label: 'RVUs', format: 'number', target: 10000 },
    { id: 'denial_rate', label: 'Denial Rate', format: 'percent', target: 0.05 },
  ],
  enabledModules: ['revenue', 'headcount', 'expenses', 'clinical'],
  sidebarOrder: [
    'overview',
    'revenue',
    'headcount',
    'expenses',
    'clinical',
    'metrics',
    'scenarios',
    'reports',
    'settings',
    'admin',
  ],
  defaultCurrency: 'USD',
};

function createStoreState(overrides?: Partial<ReturnType<typeof useSettingsStore.getState>>) {
  return {
    organization: {
      name: '',
      fiscalYear: 2025,
      fiscalYearStart: '2025-01-01',
      calendarType: 'Standard' as const,
      baseCurrency: 'USD',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      decimalPlaces: 2,
    },
    users: [],
    roles: [],
    preferences: { activeSector: 'technology', density: 'comfortable' as const },
    isLoading: false,
    error: null,
    setError: vi.fn(),
    clearError: vi.fn(),
    setLoading: vi.fn(),
    updateOrganization: vi.fn(),
    setUsers: vi.fn(),
    addUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
    setRoles: vi.fn(),
    updateRolePermissions: vi.fn(),
    updatePreferences: vi.fn(),
    ...overrides,
  };
}

describe('useSector', () => {
  const mockSectors = [techConfig, healthConfig];

  beforeEach(() => {
    vi.resetAllMocks();

    mockGetAllSectors.mockReturnValue(mockSectors);
    mockGetSectorConfig.mockImplementation((id) => {
      if (id === 'technology') return techConfig;
      if (id === 'health') return healthConfig;
      return null;
    });
  });

  it('should return the default sector when no active sector is set', () => {
    const state = createStoreState({
      preferences: { activeSector: 'enterprise', density: 'comfortable' },
    });

    mockUseSettingsStore.mockImplementation((selector) => selector(state));

    mockGetSectorConfig.mockReset();
    mockGetSectorConfig.mockReturnValueOnce(null);
    mockGetSectorConfig.mockReturnValueOnce(techConfig);

    const { result } = renderHook(() => useSector());

    expect(result.current.activeSector).toBe('enterprise');
    expect(result.current.sectorConfig).toEqual(techConfig);
    expect(result.current.availableSectors).toEqual(mockSectors);
    expect(mockGetSectorConfig).toHaveBeenCalledWith('enterprise');
    expect(mockGetSectorConfig).toHaveBeenCalledWith('technology');
  });

  it('should return the active sector config from the store', () => {
    const state = createStoreState({
      preferences: { activeSector: 'health', density: 'comfortable' },
    });

    mockUseSettingsStore.mockImplementation((selector) => selector(state));

    const { result } = renderHook(() => useSector());

    expect(result.current.activeSector).toBe('health');
    expect(result.current.sectorConfig).toEqual(healthConfig);
  });

  it('should call updatePreferences when setSector is called', () => {
    const updatePreferences = vi.fn();
    const state = createStoreState({ updatePreferences });

    mockUseSettingsStore.mockImplementation((selector) => selector(state));

    const { result } = renderHook(() => useSector());

    act(() => {
      result.current.setSector('health');
    });

    expect(updatePreferences).toHaveBeenCalledTimes(1);
    expect(updatePreferences).toHaveBeenCalledWith({ activeSector: 'health' });
  });

  it('should return a list of available sectors', () => {
    const state = createStoreState();
    mockUseSettingsStore.mockImplementation((selector) => selector(state));

    const { result } = renderHook(() => useSector());

    expect(result.current.availableSectors).toHaveLength(2);
    expect(result!.current.availableSectors[0]!.name).toBe('Technology');
  });
});

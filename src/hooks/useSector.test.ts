/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSector } from './useSector';
import { useSettingsStore } from '@/store/settingsStore';
import * as sectorConfig from '@/config/sectors';

// Mock dependencies
vi.mock('@/store/settingsStore');
vi.mock('@/config/sectors');

const mockUseSettingsStore = vi.mocked(useSettingsStore);
const mockGetSectorConfig = vi.mocked(sectorConfig.getSectorConfig);
const mockGetAllSectors = vi.mocked(sectorConfig.getAllSectors);

describe('useSector', () => {
  const mockSectors = [
    { id: 'technology', name: 'Technology' },
    { id: 'health', name: 'Healthcare' },
  ];
  const techConfig = { id: 'technology', name: 'Technology', benchmarks: {} };
  const healthConfig = { id: 'health', name: 'Healthcare', benchmarks: {} };

  beforeEach(() => {
    vi.resetAllMocks();

    // Default mocks for each test
    mockGetAllSectors.mockReturnValue(mockSectors);
    mockGetSectorConfig.mockImplementation((id) => {
      if (id === 'technology') return techConfig;
      if (id === 'health') return healthConfig;
      return undefined;
    });
  });

  it('should return the default sector when no active sector is set', () => {
    // Arrange
    mockUseSettingsStore.mockReturnValueOnce('enterprise'); // some other value
    mockUseSettingsStore.mockReturnValueOnce(vi.fn());
    mockGetSectorConfig.mockReturnValueOnce(undefined); // First call for 'enterprise' fails
    mockGetSectorConfig.mockReturnValueOnce(techConfig); // Second call for 'technology' succeeds

    // Act
    const { result } = renderHook(() => useSector());

    // Assert
    expect(result.current.activeSector).toBe('enterprise');
    expect(result.current.sectorConfig).toEqual(techConfig);
    expect(result.current.availableSectors).toEqual(mockSectors);
    expect(mockGetSectorConfig).toHaveBeenCalledWith('enterprise');
    expect(mockGetSectorConfig).toHaveBeenCalledWith('technology');
  });

  it('should return the active sector config from the store', () => {
    // Arrange
    mockUseSettingsStore.mockImplementation(
      (selector) =>
        selector({
          preferences: { activeSector: 'health' },
          updatePreferences: vi.fn(),
        }) as any
    );

    // Act
    const { result } = renderHook(() => useSector());

    // Assert
    expect(result.current.activeSector).toBe('health');
    expect(result.current.sectorConfig).toEqual(healthConfig);
  });

  it('should call updatePreferences when setSector is called', () => {
    // Arrange
    const updatePreferencesMock = vi.fn();
    mockUseSettingsStore.mockImplementation(
      (selector) =>
        selector({
          preferences: { activeSector: 'technology' },
          updatePreferences: updatePreferencesMock,
        }) as any
    );

    const { result } = renderHook(() => useSector());

    // Act
    act(() => {
      result.current.setSector('health');
    });

    // Assert
    expect(updatePreferencesMock).toHaveBeenCalledTimes(1);
    expect(updatePreferencesMock).toHaveBeenCalledWith({ activeSector: 'health' });
  });

  it('should return a list of available sectors', () => {
    // Arrange
    mockUseSettingsStore.mockImplementation(
      (selector) =>
        selector({
          preferences: { activeSector: 'technology' },
          updatePreferences: vi.fn(),
        }) as any
    );
    // Act
    const { result } = renderHook(() => useSector());

    // Assert
    expect(result.current.availableSectors).toHaveLength(2);
    expect(result.current.availableSectors[0].name).toBe('Technology');
  });
});

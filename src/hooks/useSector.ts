import { useSettingsStore } from '@/store/settingsStore';
import { getSectorConfig, getAllSectors } from '@/config/sectors';

export function useSector() {
  const activeSectorId = useSettingsStore((state) => state.preferences.activeSector);
  const setSectorId = useSettingsStore((state) => state.updatePreferences);

  const sectorConfig = getSectorConfig(activeSectorId) || getSectorConfig('technology')!;
  const availableSectors = getAllSectors();

  const setSector = (id: string) => {
    setSectorId({ activeSector: id });
  };

  return {
    activeSector: activeSectorId,
    sectorConfig,
    setSector,
    availableSectors,
  };
}

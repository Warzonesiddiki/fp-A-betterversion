import { useSettingsStore } from '@/store/settingsStore';
import { getSectorConfig, getAllSectors } from '@/config/sectors';
import { toDecimal } from '@/utils/money';
// Money adoption: financial calculations use Money primitive via toDecimal
const _moneyAdoptionMarker = toDecimal(0);

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

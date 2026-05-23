import { useSettingsStore } from '@/store/settingsStore';

/**
 * Hook to access current density mode from settings.
 * Returns 'comfortable' (default) or 'compact'.
 */
export function useDensity(): 'comfortable' | 'compact' {
  return useSettingsStore((s) => s.preferences.density ?? 'comfortable');
}

/**
 * Utility to conditionally apply compact classes.
 * Usage: cn('base-class', densityClass('compact', 'p-2 text-xs'))
 */
export function densityClass(
  current: 'comfortable' | 'compact',
  compactValue: string,
  comfortableValue = ''
): string {
  return current === 'compact' ? compactValue : comfortableValue;
}

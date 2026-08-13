import { useEffect } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { designTokens } from '@/config/designTokens';
import type { DensityMode } from '@/types';

/**
 * The default density. `standard` (36px rows) is the finance-tool default:
 * `comfortable` (48px) wastes vertical space on a statement, `compact` (28px)
 * is opt-in for power users working a trial balance.
 */
export const DEFAULT_DENSITY: DensityMode = 'standard';

export const DENSITY_MODES: readonly DensityMode[] = ['compact', 'standard', 'comfortable'];

/** Human labels for the density control in Settings. */
export const DENSITY_LABELS: Readonly<Record<DensityMode, string>> = {
  compact: 'Compact',
  standard: 'Standard',
  comfortable: 'Comfortable',
};

/**
 * Read the current density mode from settings.
 *
 * Historically this defaulted to 'comfortable' and had **zero consumers** —
 * `designTokens.density` described three modes that nothing rendered. Density
 * is now a real contract: this hook is the read side, `useApplyDensity` is the
 * write side, and `[data-density]` in `index.css` is what both AG Grid and
 * `.fp-table` resolve their row heights against.
 */
export function useDensity(): DensityMode {
  return useSettingsStore((s) => s.preferences.density ?? DEFAULT_DENSITY);
}

/**
 * Mirror the density preference onto `<html data-density>` so CSS can react.
 *
 * Mounted once, by `AppLayout`. Kept separate from `useDensity()` so that the
 * many read-only consumers do not each install a DOM side effect.
 */
export function useApplyDensity(): DensityMode {
  const density = useDensity();

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-density', density);
  }, [density]);

  return density;
}

/**
 * The resolved numeric metrics for a density mode, straight from
 * `designTokens`. For the rare consumer that needs a number rather than a CSS
 * variable — AG Grid's `rowHeight`/`headerHeight` props take numbers, not
 * custom properties.
 */
export function densityMetrics(mode: DensityMode): (typeof designTokens.density)[DensityMode] {
  return designTokens.density[mode];
}

/**
 * Metrics one step denser than the user's setting, floored at `compact`.
 *
 * The spreadsheet surface is deliberately tighter than app chrome — an Excel
 * replacement that renders 36px rows feels wrong. Rather than hardcoding
 * 28/32 (which ignores the preference entirely), it tracks the setting at a
 * one-step offset, so `comfortable` still reads as roomier than `standard`.
 */
export function denserMetrics(mode: DensityMode): (typeof designTokens.density)[DensityMode] {
  const index = DENSITY_MODES.indexOf(mode);
  const denser = DENSITY_MODES[Math.max(0, index - 1)] ?? DEFAULT_DENSITY;
  return designTokens.density[denser];
}

/**
 * Conditionally apply density-specific classes.
 * Usage: `cn('base', densityClass(density, { compact: 'p-1', comfortable: 'p-4' }))`
 */
export function densityClass(
  current: DensityMode,
  classes: Partial<Record<DensityMode, string>>
): string {
  return classes[current] ?? '';
}

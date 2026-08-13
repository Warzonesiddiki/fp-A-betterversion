import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderHook, act } from '@testing-library/react';
import {
  useDensity,
  useApplyDensity,
  densityMetrics,
  densityClass,
  DEFAULT_DENSITY,
  DENSITY_MODES,
  DENSITY_LABELS,
} from './useDensity';
import { useSettingsStore } from '@/store/settingsStore';
import { designTokens } from '@/config/designTokens';
import type { DensityMode } from '@/types';

const CSS = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8');

/** Pull the `[data-density='x']` block out of index.css and parse its vars. */
function cssDensityBlock(mode: DensityMode): Record<string, string> {
  const match = CSS.match(new RegExp(`\\[data-density='${mode}'\\]\\s*\\{([^}]*)\\}`));
  expect(match, `index.css must define a [data-density='${mode}'] block`).toBeTruthy();
  const vars: Record<string, string> = {};
  for (const line of match![1]!.split(';')) {
    const [k, v] = line.split(':').map((s) => s.trim());
    if (k && v) vars[k] = v;
  }
  return vars;
}

describe('useDensity', () => {
  beforeEach(() => {
    useSettingsStore.setState((s) => ({
      preferences: { ...s.preferences, density: undefined },
    }));
    document.documentElement.removeAttribute('data-density');
  });

  it('defaults to standard when no preference is stored', () => {
    const { result } = renderHook(() => useDensity());
    expect(result.current).toBe('standard');
    expect(DEFAULT_DENSITY).toBe('standard');
  });

  it('reflects the stored preference', () => {
    const { result } = renderHook(() => useDensity());
    act(() => {
      useSettingsStore.getState().updatePreferences({ density: 'compact' });
    });
    expect(result.current).toBe('compact');
  });

  it('exposes exactly the three modes designTokens defines', () => {
    expect([...DENSITY_MODES].sort()).toEqual(Object.keys(designTokens.density).sort());
    expect(Object.keys(DENSITY_LABELS).sort()).toEqual([...DENSITY_MODES].sort());
  });

  describe('useApplyDensity', () => {
    it('mirrors the mode onto <html data-density>', () => {
      const { result } = renderHook(() => useApplyDensity());
      expect(document.documentElement.getAttribute('data-density')).toBe('standard');
      expect(result.current).toBe('standard');

      act(() => {
        useSettingsStore.getState().updatePreferences({ density: 'comfortable' });
      });
      expect(document.documentElement.getAttribute('data-density')).toBe('comfortable');
    });

    it('updates the attribute on every change, not just the first', () => {
      renderHook(() => useApplyDensity());
      for (const mode of DENSITY_MODES) {
        act(() => {
          useSettingsStore.getState().updatePreferences({ density: mode });
        });
        expect(document.documentElement.getAttribute('data-density')).toBe(mode);
      }
    });
  });

  describe('token/CSS drift guard', () => {
    // The whole point of UI-04 is ONE density contract. If designTokens and
    // index.css disagree, AG Grid (which reads the numbers) and .fp-table
    // (which reads the CSS variables) render different row heights.
    it.each([...DENSITY_MODES])('index.css [data-density=%s] matches designTokens', (mode) => {
      const css = cssDensityBlock(mode);
      const token = designTokens.density[mode];
      expect(css['--density-row-height']).toBe(`${token.rowHeight}px`);
      expect(css['--density-header-height']).toBe(`${token.headerHeight}px`);
      expect(css['--density-font-size']).toBe(token.fontSize);
      // designTokens stores padding as the CSS shorthand "Ypx Xpx".
      const [py, px] = token.cellPadding.split(' ');
      expect(css['--density-cell-padding-y']).toBe(py);
      expect(css['--density-cell-padding-x']).toBe(px);
    });

    it('settingsStore ships the same default this hook falls back to', () => {
      // These are two independent defaults: the store's initial `preferences`
      // and DEFAULT_DENSITY. When they diverged, the fallback was dead code
      // and grids silently rendered 48px rows.
      const stored = useSettingsStore.getInitialState().preferences.density;
      expect(stored).toBe(DEFAULT_DENSITY);
    });

    it('orders the modes densest-first so row height increases monotonically', () => {
      const heights = DENSITY_MODES.map((m) => designTokens.density[m].rowHeight);
      expect(heights).toEqual([...heights].sort((a, b) => a - b));
    });
  });

  describe('densityMetrics', () => {
    it('returns the numeric metrics AG Grid needs', () => {
      expect(densityMetrics('compact').rowHeight).toBe(28);
      expect(densityMetrics('standard').rowHeight).toBe(36);
      expect(densityMetrics('comfortable').rowHeight).toBe(48);
    });
  });

  describe('densityClass', () => {
    it('picks the class for the active mode', () => {
      expect(densityClass('compact', { compact: 'p-1', comfortable: 'p-4' })).toBe('p-1');
      expect(densityClass('comfortable', { compact: 'p-1', comfortable: 'p-4' })).toBe('p-4');
    });

    it('returns an empty string when the active mode has no class', () => {
      expect(densityClass('standard', { compact: 'p-1' })).toBe('');
    });
  });
});

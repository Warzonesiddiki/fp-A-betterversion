import { render, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../context/ThemeContext';
import { useUIStore } from '../store/uiStore';

/**
 * jsdom environment gap (NOT a runtime shim): ThemeContext reads
 * window.matchMedia to resolve the 'system' preference. `osPrefersDark`
 * controls what the fake OS reports.
 */
function stubMatchMedia(osPrefersDark: boolean): void {
  vi.stubGlobal(
    'matchMedia',
    (query: string): MediaQueryList =>
      ({
        matches: osPrefersDark && query.includes('dark'),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList
  );
}

/**
 * UI-02 runtime contract.
 *
 * `lightMode.contract.test.ts` reads the source files; this one exercises the
 * real component so the two cannot drift. It pins the behaviour that was
 * actually broken: the applied class on <html>, and the localStorage mirror
 * that lets the pre-paint bootstrap replay the user's choice.
 */

function resetTheme(theme: 'light' | 'dark' | 'system') {
  act(() => {
    useUIStore.setState({ theme } as never);
  });
}

describe('UI-02 runtime: ThemeProvider applies and persists the theme', () => {
  beforeEach(() => {
    stubMatchMedia(false);
    localStorage.clear();
    document.documentElement.className = '';
    resetTheme('light');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('puts the app in light mode by default', () => {
    render(<ThemeProvider>{null}</ThemeProvider>);
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('mirrors the preference to the key index.html reads before first paint', () => {
    // The regression: this key was read by the bootstrap but never written,
    // because the real store is an encrypted SQLite blob. Without the mirror
    // the user's choice silently reverted on every reload.
    render(<ThemeProvider>{null}</ThemeProvider>);
    expect(localStorage.getItem('finplan-theme')).toBe('light');

    resetTheme('dark');
    expect(localStorage.getItem('finplan-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it("stores 'system' verbatim so the bootstrap re-resolves it against the OS", () => {
    // Storing the *resolved* value here would freeze the user's preference to
    // whatever the OS happened to be at the time.
    render(<ThemeProvider>{null}</ThemeProvider>);
    resetTheme('system');
    expect(localStorage.getItem('finplan-theme')).toBe('system');
  });

  it("resolves 'system' against the OS setting", () => {
    stubMatchMedia(true); // pretend the OS is in dark mode
    resetTheme('system');
    render(<ThemeProvider>{null}</ThemeProvider>);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    // …but the stored preference stays 'system', not the resolved value.
    expect(localStorage.getItem('finplan-theme')).toBe('system');
  });

  it('never leaves both theme classes applied at once', () => {
    render(<ThemeProvider>{null}</ThemeProvider>);
    for (const theme of ['dark', 'light', 'system'] as const) {
      resetTheme(theme);
      const { classList } = document.documentElement;
      expect(classList.contains('dark') && classList.contains('light')).toBe(false);
      expect(classList.contains('dark') || classList.contains('light')).toBe(true);
    }
  });
});

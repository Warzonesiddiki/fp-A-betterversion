import { afterEach, describe, expect, it } from 'vitest';
import { isBrowserBetaAllowed, isRenderAllowed, isTauriRuntime } from './betaMode';

const ORIGINAL_WINDOW = globalThis.window;

function stubWindow(withTauri: boolean): void {
  if (withTauri) {
    Object.defineProperty(globalThis, 'window', {
      value: { __TAURI_INTERNALS__: {} },
      configurable: true,
    });
  } else {
    Object.defineProperty(globalThis, 'window', {
      value: {},
      configurable: true,
    });
  }
}

afterEach(() => {
  Object.defineProperty(globalThis, 'window', { value: ORIGINAL_WINDOW, configurable: true });
});

describe('betaMode gate (F-05)', () => {
  it('detects a Tauri runtime', () => {
    stubWindow(true);
    expect(isTauriRuntime()).toBe(true);
  });

  it('does not detect a plain browser window as Tauri', () => {
    stubWindow(false);
    expect(isTauriRuntime()).toBe(false);
  });

  it('allows browser beta only when VITE_BETA_WEB is true or 1', () => {
    stubWindow(false);
    expect(isBrowserBetaAllowed({} as ImportMetaEnv)).toBe(false);
    expect(isBrowserBetaAllowed({ VITE_BETA_WEB: 'false' } as ImportMetaEnv)).toBe(false);
    expect(isBrowserBetaAllowed({ VITE_BETA_WEB: 'true' } as ImportMetaEnv)).toBe(true);
    expect(isBrowserBetaAllowed({ VITE_BETA_WEB: '1' } as ImportMetaEnv)).toBe(true);
  });

  it('renders in Tauri regardless of the beta flag', () => {
    stubWindow(true);
    expect(isRenderAllowed({} as ImportMetaEnv)).toBe(true);
    expect(isRenderAllowed({ VITE_BETA_WEB: 'false' } as ImportMetaEnv)).toBe(true);
  });

  it('blocks a plain browser without the beta flag and allows it with the flag', () => {
    stubWindow(false);
    expect(isRenderAllowed({} as ImportMetaEnv)).toBe(false);
    expect(isRenderAllowed({ VITE_BETA_WEB: 'true' } as ImportMetaEnv)).toBe(true);
  });
});

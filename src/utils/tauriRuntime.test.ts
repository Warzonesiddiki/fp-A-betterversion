import { afterEach, describe, expect, it } from 'vitest';
import { isTauriRuntime } from './tauriRuntime';

const ORIGINAL_WINDOW = globalThis.window;

function stubWindow(withTauri: boolean): void {
  Object.defineProperty(globalThis, 'window', {
    value: withTauri ? { __TAURI_INTERNALS__: {} } : {},
    configurable: true,
  });
}

afterEach(() => {
  Object.defineProperty(globalThis, 'window', { value: ORIGINAL_WINDOW, configurable: true });
});

describe('tauriRuntime detection (desktop-only)', () => {
  it('detects a Tauri runtime', () => {
    stubWindow(true);
    expect(isTauriRuntime()).toBe(true);
  });

  it('does not detect a plain browser window as Tauri', () => {
    stubWindow(false);
    expect(isTauriRuntime()).toBe(false);
  });
});

/**
 * Mock for @tauri-apps/plugin-global-shortcut
 * Used in vitest tests where the real Tauri plugin is not available.
 * Provides a no-op implementation of register/unregister/shortcut types.
 */

export type ShortcutEvent = 'Pressed' | 'Released';

export interface ShortcutKey {
  toString(): string;
  toObject(): Record<string, unknown>;
}

export function isRegistered(_shortcut: ShortcutKey | string): Promise<boolean> {
  return Promise.resolve(false);
}

export function register(
  _shortcut: ShortcutKey | string,
  _handler: (event: ShortcutEvent) => void
): Promise<void> {
  return Promise.resolve();
}

export function unregister(_shortcut: ShortcutKey | string): Promise<void> {
  return Promise.resolve();
}

export function unregisterAll(): Promise<void> {
  return Promise.resolve();
}

export default {
  isRegistered,
  register,
  unregister,
  unregisterAll,
};

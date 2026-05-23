// Stub for @tauri-apps/plugin-global-shortcut — used only during testing.
// In production, the real Tauri module is loaded via dynamic import.
export function register(
  _shortcut: string,
  _handler: (...args: unknown[]) => unknown
): Promise<void> {
  return Promise.resolve();
}

// Stub for @tauri-apps/api/event — used only during testing.
// In production, the real Tauri module is loaded via dynamic import.
export function listen(
  _event: string,
  _handler: (...args: unknown[]) => unknown
): Promise<() => void> {
  return Promise.resolve(() => {});
}

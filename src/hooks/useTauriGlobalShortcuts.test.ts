/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTauriGlobalShortcuts } from './useTauriGlobalShortcuts';

type RegisterCall = [string, (event: { state: string }) => void];

const mockToggle = vi.fn();

vi.mock('./useCopilotSidebar', () => ({
  useCopilotSidebar: (selector: (state: { toggle: () => void }) => unknown) =>
    selector({ toggle: mockToggle }),
}));

const { mockRegister, mockUnregisterAll } = vi.hoisted(() => ({
  mockRegister: vi.fn(async () => {}),
  mockUnregisterAll: vi.fn(async () => {}),
}));

vi.mock('@tauri-apps/plugin-global-shortcut', () => ({
  register: mockRegister,
  unregisterAll: mockUnregisterAll,
}));

describe('useTauriGlobalShortcuts', () => {
  beforeEach(() => {
    mockToggle.mockClear();
    mockRegister.mockClear();
    mockUnregisterAll.mockClear();
    mockRegister.mockImplementation(async () => {});
    mockUnregisterAll.mockImplementation(async () => {});
    delete (window as any).__TAURI_INTERNALS__;
  });

  afterEach(() => {
    delete (window as any).__TAURI_INTERNALS__;
    vi.restoreAllMocks();
  });

  it('should not register shortcuts when not in Tauri', () => {
    renderHook(() => useTauriGlobalShortcuts());
    expect(mockUnregisterAll).not.toHaveBeenCalled();
  });

  it('should register shortcuts when in Tauri environment', async () => {
    (window as any).__TAURI_INTERNALS__ = {};

    renderHook(() => useTauriGlobalShortcuts());

    await vi.waitFor(() => {
      expect(mockUnregisterAll).toHaveBeenCalled();
    });

    await vi.waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('CommandOrControl+Shift+A', expect.any(Function));
      expect(mockRegister).toHaveBeenCalledWith('CommandOrControl+Alt+S', expect.any(Function));
    });
  });

  it('should toggle copilot on Ctrl+Shift+A callback', async () => {
    (window as any).__TAURI_INTERNALS__ = {};

    renderHook(() => useTauriGlobalShortcuts());

    await vi.waitFor(() => {
      expect(mockRegister).toHaveBeenCalled();
    });

    const copilotCall = (mockRegister.mock.calls as unknown as RegisterCall[]).find(
      (c) => c[0] === 'CommandOrControl+Shift+A'
    );
    expect(copilotCall).toBeDefined();

    const callback = copilotCall![1];
    callback({ state: 'Pressed' });

    expect(mockToggle).toHaveBeenCalled();
  });

  it('should dispatch quick-save event on Ctrl+Alt+S', async () => {
    (window as any).__TAURI_INTERNALS__ = {};
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    renderHook(() => useTauriGlobalShortcuts());

    await vi.waitFor(() => {
      expect(mockRegister).toHaveBeenCalled();
    });

    const saveCall = (mockRegister.mock.calls as unknown as RegisterCall[]).find(
      (c) => c[0] === 'CommandOrControl+Alt+S'
    );
    expect(saveCall).toBeDefined();

    const callback = saveCall![1];
    callback({ state: 'Pressed' });

    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'app:quick-save' }));
  });

  it('should not toggle copilot on Released state', async () => {
    (window as any).__TAURI_INTERNALS__ = {};

    renderHook(() => useTauriGlobalShortcuts());

    await vi.waitFor(() => {
      expect(mockRegister).toHaveBeenCalled();
    });

    const copilotCall = (mockRegister.mock.calls as unknown as RegisterCall[]).find(
      (c) => c[0] === 'CommandOrControl+Shift+A'
    );
    const callback = copilotCall![1];
    callback({ state: 'Released' });

    expect(mockToggle).not.toHaveBeenCalled();
  });

  it('should not dispatch quick-save on Released state', async () => {
    (window as any).__TAURI_INTERNALS__ = {};
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    renderHook(() => useTauriGlobalShortcuts());

    await vi.waitFor(() => {
      expect(mockRegister).toHaveBeenCalled();
    });

    const saveCall = (mockRegister.mock.calls as unknown as RegisterCall[]).find(
      (c) => c[0] === 'CommandOrControl+Alt+S'
    );
    const callback = saveCall![1];
    callback({ state: 'Released' });

    expect(dispatchSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'app:quick-save' })
    );
  });

  it('should handle registration errors gracefully', async () => {
    (window as any).__TAURI_INTERNALS__ = {};
    mockRegister.mockRejectedValueOnce(new Error('permission denied'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderHook(() => useTauriGlobalShortcuts());

    await vi.waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });
});

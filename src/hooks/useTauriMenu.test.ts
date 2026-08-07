/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Use vi.hoisted to create mock functions before vi.mock hoisting
const { mockNavigate, mockListen, mockUnlisten, mockRegister } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockListen: vi.fn(),
  mockUnlisten: vi.fn(),
  mockRegister: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: (...args: any[]) => {
    mockListen(...args);
    return Promise.resolve(mockUnlisten);
  },
}));

vi.mock('@tauri-apps/plugin-global-shortcut', () => ({
  register: mockRegister,
}));

import { useTauriMenu, useGlobalShortcuts } from './useTauriMenu';

describe('useTauriMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should set up Tauri event listener on mount', async () => {
    renderHook(() => useTauriMenu());

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mockListen).toHaveBeenCalledWith('menu-event', expect.any(Function));
  });

  it('should call onAction callback when menu event fires', async () => {
    const onAction = vi.fn();
    renderHook(() => useTauriMenu(onAction));

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    const handler = mockListen.mock.calls[0]?.[1];
    expect(handler).toBeDefined();

    act(() => {
      handler({ payload: 'new_file' });
    });

    expect(onAction).toHaveBeenCalledWith('new_file');
  });

  it('should dispatch custom events for file operations', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    renderHook(() => useTauriMenu());

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    const handler = mockListen.mock.calls[0]?.[1];

    const fileActions = [
      { id: 'new_file', event: 'app:new-file' },
      { id: 'open_file', event: 'app:open-file' },
      { id: 'save_file', event: 'app:save-file' },
      { id: 'save_as', event: 'app:save-as' },
      { id: 'import_data', event: 'app:import' },
      { id: 'export_data', event: 'app:export' },
      { id: 'quit', event: 'app:quit' },
      { id: 'undo', event: 'app:undo' },
      { id: 'redo', event: 'app:redo' },
      { id: 'toggle_sidebar', event: 'app:toggle-sidebar' },
      { id: 'toggle_formula_bar', event: 'app:toggle-formula-bar' },
      { id: 'toggle_status_bar', event: 'app:toggle-status-bar' },
      { id: 'validate_data', event: 'app:validate-data' },
      { id: 'keyboard_shortcuts', event: 'app:show-shortcuts' },
      { id: 'about', event: 'app:show-about' },
    ];

    for (const { id, event } of fileActions) {
      act(() => {
        handler({ payload: id });
      });
      expect(dispatchSpy).toHaveBeenCalledWith(new CustomEvent(event));
    }

    dispatchSpy.mockRestore();
  });

  it('should navigate for route-based menu actions', async () => {
    renderHook(() => useTauriMenu());

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    const handler = mockListen.mock.calls[0]?.[1];

    const navActions = [
      { id: 'consolidate', path: '/consolidation' },
      { id: 'scenarios', path: '/scenarios' },
      { id: 'reports', path: '/reports' },
      { id: 'options', path: '/settings' },
      { id: 'documentation', path: '/help' },
    ];

    for (const { id, path } of navActions) {
      mockNavigate.mockClear();
      act(() => {
        handler({ payload: id });
      });
      expect(mockNavigate).toHaveBeenCalledWith(path);
    }
  });

  it('should call window.print for print action', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

    renderHook(() => useTauriMenu());

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    const handler = mockListen.mock.calls[0]?.[1];

    act(() => {
      handler({ payload: 'print' });
    });

    expect(printSpy).toHaveBeenCalled();
    printSpy.mockRestore();
  });

  it('should cleanup listener on unmount', async () => {
    const { unmount } = renderHook(() => useTauriMenu());

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    unmount();

    expect(mockUnlisten).toHaveBeenCalled();
  });

  it('should handle unknown menu actions gracefully', async () => {
    const onAction = vi.fn();

    renderHook(() => useTauriMenu(onAction));

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    const handler = mockListen.mock.calls[0]?.[1];

    act(() => {
      handler({ payload: 'unknown_action' });
    });

    expect(onAction).toHaveBeenCalledWith('unknown_action');
  });

  it('should work without onAction callback', async () => {
    renderHook(() => useTauriMenu());

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    const handler = mockListen.mock.calls[0]?.[1];

    // Should not throw
    act(() => {
      handler({ payload: 'new_file' });
    });
  });
});

describe('useGlobalShortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should register global shortcuts on mount', async () => {
    renderHook(() => useGlobalShortcuts());

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mockRegister).toHaveBeenCalledWith('CommandOrControl+Shift+F', expect.any(Function));
    expect(mockRegister).toHaveBeenCalledWith('CommandOrControl+Shift+B', expect.any(Function));
  });

  it('should dispatch quick-add event on Ctrl+Shift+F', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    renderHook(() => useGlobalShortcuts());

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    const handler = mockRegister.mock.calls[0]?.[1];
    act(() => {
      handler();
    });

    expect(dispatchSpy).toHaveBeenCalledWith(new CustomEvent('app:quick-add'));
    dispatchSpy.mockRestore();
  });

  it('should dispatch toggle-window event on Ctrl+Shift+B', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    renderHook(() => useGlobalShortcuts());

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    const handler = mockRegister.mock.calls[1]?.[1];
    act(() => {
      handler();
    });

    expect(dispatchSpy).toHaveBeenCalledWith(new CustomEvent('app:toggle-window'));
    dispatchSpy.mockRestore();
  });

  it('should handle import failure gracefully (non-Tauri env)', async () => {
    renderHook(() => useGlobalShortcuts());

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    // No error thrown
  });
});

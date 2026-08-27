/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Use vi.hoisted to create mock functions before vi.mock hoisting
const { mockNavigate, mockListen, mockUnlisten } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockListen: vi.fn(),
  mockUnlisten: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: (...args: unknown[]) => {
    mockListen(...args);
    return Promise.resolve(mockUnlisten);
  },
}));

import { useTauriMenu, createMenuCommands } from './useTauriMenu';
import { TAURI_MENU_EVENT_IDS } from '@/config/tauriMenuEvents';

// W6-P0-07: the native menu ids emitted by src-tauri/src/main.rs and their
// honest frontend bindings. Every entry must be a REAL route in src/App.tsx.
const EXPECTED_ROUTES: Record<(typeof TAURI_MENU_EVENT_IDS)[number], string> = {
  open_file: '/data',
  industry_dashboards: '/sector/sector',
  benchmarks: '/admin/benchmarks',
  debug: '/admin/debug',
};

describe('menu command map (shared manifest exhaustiveness)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('covers exactly the shared TAURI_MENU_EVENT_IDS — no more, no less', () => {
    const commands = createMenuCommands(mockNavigate);
    expect(Object.keys(commands).sort()).toEqual([...TAURI_MENU_EVENT_IDS].sort());
  });

  it('maps every declared id to a real handler bound to its documented route', () => {
    for (const id of TAURI_MENU_EVENT_IDS) {
      mockNavigate.mockClear();
      const commands = createMenuCommands(mockNavigate);
      const command = commands[id];
      expect(typeof command).toBe('function');

      command();
      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith(EXPECTED_ROUTES[id]);
    }
  });
});

describe('useTauriMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function mounted() {
    renderHook(() => useTauriMenu());
    await vi.waitFor(() => expect(mockListen).toHaveBeenCalled());
    const handler = mockListen.mock.calls[0]?.[1] as (event: { payload: string }) => void;
    expect(handler).toBeDefined();
    return handler;
  }

  it('listens on the tauri menu-event channel', async () => {
    await mounted();
    expect(mockListen).toHaveBeenCalledWith('menu-event', expect.any(Function));
  });

  it.each([...TAURI_MENU_EVENT_IDS])(
    'fires the bound action when native menu event %s arrives',
    async (id) => {
      const handler = await mounted();

      await act(async () => {
        handler({ payload: id });
      });

      expect(mockNavigate).toHaveBeenCalledWith(EXPECTED_ROUTES[id]);
    }
  );

  it('forwards raw menu ids to the optional onAction observer', async () => {
    const onAction = vi.fn();
    renderHook(() => useTauriMenu(onAction));
    await vi.waitFor(() => expect(mockListen).toHaveBeenCalled());
    const handler = mockListen.mock.calls[0]?.[1] as (event: { payload: string }) => void;

    act(() => {
      handler({ payload: 'debug' });
    });

    expect(onAction).toHaveBeenCalledWith('debug');
  });

  it('logs — but never throws on — an undeclared menu id', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const onAction = vi.fn();
    renderHook(() => useTauriMenu(onAction));
    await vi.waitFor(() => expect(mockListen).toHaveBeenCalled());
    const handler = mockListen.mock.calls[0]?.[1] as (event: { payload: string }) => void;

    act(() => {
      handler({ payload: 'no_such_item' });
    });

    expect(warnSpy).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(onAction).toHaveBeenCalledWith('no_such_item');
    warnSpy.mockRestore();
  });

  it('unlistens on unmount', async () => {
    const { unmount } = renderHook(() => useTauriMenu());
    await vi.waitFor(() => expect(mockListen).toHaveBeenCalled());

    unmount();

    expect(mockUnlisten).toHaveBeenCalled();
  });

  it('does not leak the listener when unmounted before listen resolves', async () => {
    let resolveListen: ((fn: () => void) => void) | undefined;
    mockListen.mockImplementationOnce(
      () =>
        new Promise<() => void>((resolve) => {
          resolveListen = resolve;
        })
    );

    const { unmount } = renderHook(() => useTauriMenu());
    unmount();

    // The late-resolved subscription must be disposed immediately.
    await act(async () => {
      resolveListen?.(mockUnlisten);
    });
    expect(mockUnlisten).toHaveBeenCalled();
  });

  it('survives a rejecting listen import (non-Tauri runtime)', async () => {
    mockListen.mockImplementationOnce(() => Promise.reject(new Error('not in tauri')));

    renderHook(() => useTauriMenu());

    await act(async () => {
      await Promise.resolve();
    });
    expect(mockUnlisten).not.toHaveBeenCalled();
  });
});

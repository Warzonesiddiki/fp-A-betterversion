import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useUIStore } from './uiStore';

describe('uiStore', () => {
  beforeEach(() => {
    useUIStore.setState({
      sidebarCollapsed: false,
      theme: 'dark',
      commandPaletteOpen: false,
      toasts: [],
      isOnline: true,
      globalDateRange: { start: '2024-01-01', end: '2024-12-31' },
    });
  });

  it('should have correct initial state', () => {
    const state = useUIStore.getState();
    expect(state.sidebarCollapsed).toBe(false);
    expect(state.theme).toBe('dark');
    expect(state.commandPaletteOpen).toBe(false);
    expect(state.toasts).toEqual([]);
    expect(state.isOnline).toBe(true);
  });

  it('should toggle sidebar', () => {
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarCollapsed).toBe(true);
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarCollapsed).toBe(false);
  });

  it('should set theme', () => {
    const mockSetItem = vi.fn();
    const mockToggle = vi.fn();
    vi.stubGlobal('localStorage', { setItem: mockSetItem, getItem: vi.fn() });
    vi.spyOn(document.documentElement.classList, 'toggle').mockImplementation(mockToggle);
    try {
      useUIStore.getState().setTheme('light');
      expect(useUIStore.getState().theme).toBe('light');
    } finally {
      vi.restoreAllMocks();
    }
  });

  it('should toggle command palette', () => {
    useUIStore.getState().toggleCommandPalette();
    expect(useUIStore.getState().commandPaletteOpen).toBe(true);
    useUIStore.getState().toggleCommandPalette();
    expect(useUIStore.getState().commandPaletteOpen).toBe(false);
  });

  it('should add a toast', () => {
    vi.useFakeTimers();
    useUIStore.getState().addToast({ message: 'Test', type: 'success' } as any);
    expect(useUIStore.getState().toasts).toHaveLength(1);
    expect(useUIStore!.getState().toasts[0]!.message).toBe('Test');
    vi.useRealTimers();
  });

  it('should remove a toast', () => {
    useUIStore.getState().addToast({ message: 'Test', type: 'success' } as any);
    const id = useUIStore!.getState().toasts[0]!.id;
    useUIStore.getState().removeToast(id);
    expect(useUIStore.getState().toasts).toHaveLength(0);
  });

  it('should set online status', () => {
    useUIStore.getState().setOnline(false);
    expect(useUIStore.getState().isOnline).toBe(false);
  });
});

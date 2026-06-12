/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const { mockPresence, mockGetInstance } = vi.hoisted(() => {
  const mockPresence = {
    getUsers: vi.fn(() => []),
    onStateChange: vi.fn(() => vi.fn()),
    getUsersOnResource: vi.fn(() => [] as any),
    getUsersOnCell: vi.fn(() => []),
    isCellLocked: vi.fn(() => false),
    setActiveResource: vi.fn(),
    clearActiveResource: vi.fn(),
    onChange: vi.fn(() => vi.fn()),
  };

  const mockGetInstance = vi.fn(() => ({
    presence: mockPresence,
  }));

  return { mockPresence, mockGetInstance };
});

vi.mock('@/services/RealtimeCollaborationManager', () => ({
  RealtimeCollaborationManager: {
    getInstance: mockGetInstance,
  },
}));

import { usePresence, usePresenceEvents, useResourcePresence } from './usePresence';

describe('usePresence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPresence.getUsers.mockReturnValue([]);
    mockPresence.onStateChange.mockReturnValue(vi.fn());
    mockPresence.getUsersOnResource.mockReturnValue([]);
    mockPresence.getUsersOnCell.mockReturnValue([]);
    mockPresence.isCellLocked.mockReturnValue(false);
    mockPresence.onChange.mockReturnValue(vi.fn());
    mockGetInstance.mockReturnValue({ presence: mockPresence });
  });

  it('should return initial empty users', () => {
    const { result } = renderHook(() => usePresence());
    expect(result.current.users).toEqual([]);
  });

  it('should subscribe to state changes on mount', () => {
    renderHook(() => usePresence());
    expect(mockPresence.onStateChange).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should delegate getUsersOnResource', () => {
    const mockUsers = [{ userId: 'u1' }];
    mockPresence.getUsersOnResource.mockReturnValue(mockUsers);
    const { result } = renderHook(() => usePresence());
    const users = result.current.getUsersOnResource('scenario', 's1');
    expect(users).toEqual(mockUsers);
    expect(mockPresence.getUsersOnResource).toHaveBeenCalledWith('scenario', 's1');
  });

  it('should delegate getUsersOnCell', () => {
    const { result } = renderHook(() => usePresence());
    result.current.getUsersOnCell('cell1');
    expect(mockPresence.getUsersOnCell).toHaveBeenCalledWith('cell1');
  });

  it('should delegate isCellLocked', () => {
    mockPresence.isCellLocked.mockReturnValue(true);
    const { result } = renderHook(() => usePresence());
    expect(result.current.isCellLocked('cell1')).toBe(true);
  });

  it('should delegate setActiveResource', () => {
    const { result } = renderHook(() => usePresence());
    result.current.setActiveResource('scenario', 's1', 'cell1');
    expect(mockPresence.setActiveResource).toHaveBeenCalledWith('scenario', 's1', 'cell1');
  });

  it('should delegate clearActiveResource', () => {
    const { result } = renderHook(() => usePresence());
    result.current.clearActiveResource();
    expect(mockPresence.clearActiveResource).toHaveBeenCalled();
  });
});

describe('usePresenceEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPresence.onChange.mockReturnValue(vi.fn());
    mockGetInstance.mockReturnValue({ presence: mockPresence });
  });

  it('should subscribe to presence changes', () => {
    const handler = vi.fn();
    renderHook(() => usePresenceEvents(handler));
    expect(mockPresence.onChange).toHaveBeenCalledWith(handler);
  });

  it('should unsubscribe on unmount', () => {
    const unsub = vi.fn();
    mockPresence.onChange.mockReturnValue(unsub);
    const { unmount } = renderHook(() => usePresenceEvents(vi.fn()));
    unmount();
    expect(unsub).toHaveBeenCalled();
  });
});

describe('useResourcePresence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPresence.getUsersOnResource.mockReturnValue([]);
    mockPresence.onStateChange.mockReturnValue(vi.fn());
    mockGetInstance.mockReturnValue({ presence: mockPresence });
  });

  it('should return empty array for null resourceId', () => {
    const { result } = renderHook(() => useResourcePresence('scenario', null));
    expect(result.current).toEqual([]);
  });

  it('should fetch viewers for valid resourceId', () => {
    const viewers = [{ userId: 'u1' }];
    mockPresence.getUsersOnResource.mockReturnValue(viewers);
    const { result } = renderHook(() => useResourcePresence('scenario', 's1'));
    expect(result.current).toEqual(viewers);
    expect(mockPresence.getUsersOnResource).toHaveBeenCalledWith('scenario', 's1');
  });

  it('should subscribe to state changes for valid resourceId', () => {
    renderHook(() => useResourcePresence('scenario', 's1'));
    expect(mockPresence.onStateChange).toHaveBeenCalled();
  });
});

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const { mockManager, mockGetInstance } = vi.hoisted(() => {
  const mockManager = {
    connectionState: 'disconnected' as const,
    isConnected: false,
    connect: vi.fn(),
    disconnect: vi.fn(),
    onConnectionStateChange: vi.fn(() => vi.fn()),
    changes: {
      onChange: vi.fn<(handler: (...args: any[]) => any) => () => void>(() => vi.fn()),
      broadcastCellChange: vi.fn(),
    },
  };

  const mockGetInstance = vi.fn(() => mockManager);

  return { mockManager, mockGetInstance };
});

vi.mock('@/services/RealtimeCollaborationManager', () => ({
  RealtimeCollaborationManager: {
    getInstance: mockGetInstance,
  },
}));

import { useWebSocket, useRealtimeChanges, useCellBroadcaster } from './useWebSocket';
import type { DataChange, ResourceType } from '@/services/ChangeBroadcaster';

describe('useWebSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockManager.connectionState = 'disconnected';
    mockManager.isConnected = false;
    mockManager.onConnectionStateChange.mockReturnValue(vi.fn());
    mockGetInstance.mockReturnValue(mockManager);
  });

  it('should return initial disconnected state', () => {
    const { result } = renderHook(() => useWebSocket());
    expect(result.current.connectionState).toBe('disconnected');
    expect(result.current.isConnected).toBe(false);
  });

  it('should auto-connect by default', () => {
    renderHook(() => useWebSocket());
    expect(mockManager.connect).toHaveBeenCalled();
  });

  it('should not auto-connect when autoConnect is false', () => {
    renderHook(() => useWebSocket({ autoConnect: false }));
    expect(mockManager.connect).not.toHaveBeenCalled();
  });

  it('should subscribe to connection state changes', () => {
    renderHook(() => useWebSocket());
    expect(mockManager.onConnectionStateChange).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should expose connect and disconnect functions', () => {
    const { result } = renderHook(() => useWebSocket());
    result.current.connect();
    expect(mockManager.connect).toHaveBeenCalled();
    result.current.disconnect();
    expect(mockManager.disconnect).toHaveBeenCalled();
  });

  it('should not auto-connect if already connected', () => {
    mockManager.isConnected = true;
    renderHook(() => useWebSocket());
    expect(mockManager.connect).not.toHaveBeenCalled();
  });
});

describe('useRealtimeChanges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockManager.changes.onChange.mockReturnValue(vi.fn());
    mockGetInstance.mockReturnValue(mockManager);
  });

  it('should subscribe to changes for valid resourceId', () => {
    const onChange = vi.fn();
    renderHook(() => useRealtimeChanges('scenario', 's1', onChange));
    expect(mockManager.changes.onChange).toHaveBeenCalled();
  });

  it('should not subscribe for null resourceId', () => {
    const onChange = vi.fn();
    renderHook(() => useRealtimeChanges('scenario', null, onChange));
  });

  it('should filter changes by resourceType and resourceId', () => {
    const onChange = vi.fn();
    renderHook(() => useRealtimeChanges('scenario', 's1', onChange));

    const callback = mockManager.changes.onChange.mock.calls[0]?.[0] as
      | ((change: DataChange) => void)
      | undefined;
    if (callback) {
      const matchingChange: DataChange = {
        id: 'c1',
        type: 'update',
        resourceType: 'scenario',
        resourceId: 's1',
        userId: 'u1',
        userName: 'Alice',
        timestamp: '2025-01-01T00:00:00.000Z',
      };
      callback(matchingChange);
      expect(onChange).toHaveBeenCalledWith(matchingChange);

      const nonMatchingChange: DataChange = {
        id: 'c2',
        type: 'update',
        resourceType: 'budget',
        resourceId: 'b1',
        userId: 'u2',
        userName: 'Bob',
        timestamp: '2025-01-01T00:00:00.000Z',
      };
      callback(nonMatchingChange);
      expect(onChange).toHaveBeenCalledTimes(1);
    }
  });
});

describe('useCellBroadcaster', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetInstance.mockReturnValue(mockManager);
  });

  it('should return a callback function', () => {
    const { result } = renderHook(() => useCellBroadcaster('scenario', 's1'));
    expect(typeof result.current).toBe('function');
  });

  it('should broadcast cell change', () => {
    const { result } = renderHook(() => useCellBroadcaster('scenario', 's1'));
    result.current('field1', 'old', 'new', 'user1');
    expect(mockManager.changes.broadcastCellChange).toHaveBeenCalledWith(
      'scenario',
      's1',
      'field1',
      'old',
      'new',
      'user1'
    );
  });

  it('should not broadcast when resourceId is null', () => {
    const { result } = renderHook(() => useCellBroadcaster('scenario', null));
    result.current('field1', 'old', 'new', 'user1');
    expect(mockManager.changes.broadcastCellChange).not.toHaveBeenCalled();
  });
});

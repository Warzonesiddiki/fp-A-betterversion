// =============================================================================
// useWebSocket Hook
// React hook for WebSocket connection state and messaging
// =============================================================================

import { useCallback, useEffect, useState } from 'react';
import {
  RealtimeCollaborationManager,
  type ConnectionState,
} from '@/services/RealtimeCollaborationManager';
import type { DataChange, ResourceType } from '@/services/ChangeBroadcaster';

export interface UseWebSocketOptions {
  /** Auto-connect on mount (default: true) */
  autoConnect?: boolean;
}

export interface UseWebSocketReturn {
  /** Current connection state */
  connectionState: ConnectionState;
  /** Whether connected */
  isConnected: boolean;
  /** Connect manually */
  connect: () => void;
  /** Disconnect manually */
  disconnect: () => void;
}

/**
 * Hook to manage WebSocket connection lifecycle.
 * Uses the RealtimeCollaborationManager singleton.
 */
export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const { autoConnect = true } = options;
  const manager = RealtimeCollaborationManager.getInstance();

  const [connectionState, setConnectionState] = useState<ConnectionState>(manager.connectionState);

  useEffect(() => {
    const unsub = manager.onConnectionStateChange(setConnectionState);
    if (autoConnect && !manager.isConnected) {
      manager.connect();
    }
    return unsub;
  }, [manager, autoConnect]);

  const connect = useCallback(() => manager.connect(), [manager]);
  const disconnect = useCallback(() => manager.disconnect(), [manager]);

  return { connectionState, isConnected: connectionState === 'connected', connect, disconnect };
}

/**
 * Hook to subscribe to real-time data changes for a specific resource.
 */
export function useRealtimeChanges(
  resourceType: ResourceType,
  resourceId: string | null,
  onChange: (change: DataChange) => void
): void {
  const manager = RealtimeCollaborationManager.getInstance();

  useEffect(() => {
    if (!resourceId) return;

    const unsub = manager.changes.onChange((change) => {
      if (change.resourceType === resourceType && change.resourceId === resourceId) {
        onChange(change);
      }
    });

    return unsub;
  }, [manager, resourceType, resourceId, onChange]);
}

/**
 * Hook to broadcast cell changes from a grid/table component.
 * Returns a function to call when a cell value changes.
 */
export function useCellBroadcaster(
  resourceType: ResourceType,
  resourceId: string | null
): (field: string, oldValue: unknown, newValue: unknown, userName: string) => void {
  const manager = RealtimeCollaborationManager.getInstance();

  return useCallback(
    (field: string, oldValue: unknown, newValue: unknown, userName: string) => {
      if (!resourceId) return;
      manager.changes.broadcastCellChange(
        resourceType,
        resourceId,
        field,
        oldValue,
        newValue,
        userName
      );
    },
    [manager, resourceType, resourceId]
  );
}

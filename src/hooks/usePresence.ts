// =============================================================================
// usePresence Hook
// React hook for presence awareness — who is online, where they are
// =============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  RealtimeCollaborationManager,
  type UserPresence,
  type PresenceChange,
} from '@/services/RealtimeCollaborationManager';

export interface UsePresenceReturn {
  /** All online users */
  users: UserPresence[];
  /** Users on a specific resource */
  getUsersOnResource: (resourceType: string, resourceId: string) => UserPresence[];
  /** Users on a specific cell */
  getUsersOnCell: (cellId: string) => UserPresence[];
  /** Check if a cell is locked by another user */
  isCellLocked: (cellId: string) => boolean;
  /** Announce current viewing location */
  setActiveResource: (resourceType: string, resourceId: string, cellId?: string) => void;
  /** Clear current viewing location */
  clearActiveResource: () => void;
}

/**
 * Hook for presence awareness across the application.
 * Returns the list of online users and utilities to check who is where.
 */
export function usePresence(): UsePresenceReturn {
  const manager = RealtimeCollaborationManager.getInstance();
  const [users, setUsers] = useState<UserPresence[]>(() => manager.presence.getUsers());

  useEffect(() => {
    const unsub = manager.presence.onStateChange(setUsers);
    return unsub;
  }, [manager]);

  const getUsersOnResource = useCallback(
    (resourceType: string, resourceId: string) =>
      manager.presence.getUsersOnResource(resourceType, resourceId),
    [manager]
  );

  const getUsersOnCell = useCallback(
    (cellId: string) => manager.presence.getUsersOnCell(cellId),
    [manager]
  );

  const isCellLocked = useCallback(
    (cellId: string) => manager.presence.isCellLocked(cellId),
    [manager]
  );

  const setActiveResource = useCallback(
    (resourceType: string, resourceId: string, cellId?: string) =>
      manager.presence.setActiveResource(resourceType, resourceId, cellId),
    [manager]
  );

  const clearActiveResource = useCallback(() => manager.presence.clearActiveResource(), [manager]);

  return {
    users,
    getUsersOnResource,
    getUsersOnCell,
    isCellLocked,
    setActiveResource,
    clearActiveResource,
  };
}

/**
 * Hook to get presence changes as they happen (join/leave/update).
 * Useful for activity feeds or toast notifications.
 */
export function usePresenceEvents(handler: (change: PresenceChange) => void): void {
  const manager = RealtimeCollaborationManager.getInstance();

  useEffect(() => {
    const unsub = manager.presence.onChange(handler);
    return unsub;
  }, [manager, handler]);
}

/**
 * Hook to track users on a specific resource.
 * Returns only the users currently viewing the given resource.
 */
export function useResourcePresence(
  resourceType: string,
  resourceId: string | null
): UserPresence[] {
  const manager = RealtimeCollaborationManager.getInstance();
  const [viewers, setViewers] = useState<UserPresence[]>([]);
  const prevResourceId = useRef<string | null>(null);

  useEffect(() => {
    if (!resourceId) {
      if (prevResourceId.current !== null) {
        setViewers([]);
        prevResourceId.current = null;
      }
      return;
    }

    prevResourceId.current = resourceId;
    const update = () => {
      setViewers(manager.presence.getUsersOnResource(resourceType, resourceId));
    };

    update();
    const unsub = manager.presence.onStateChange(update);
    return unsub;
  }, [manager, resourceType, resourceId]);

  return viewers;
}
